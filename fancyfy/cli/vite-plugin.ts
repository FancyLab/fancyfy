/**
 * fcy-theme-plugin — ADR-004 §3.
 *
 * Responsibilities:
 *   1. Discover sections under `fancyfy/sections/<id>/`.
 *   2. Register TS and SCSS entries with Rollup.
 *   3. On build output, record hashed filenames per section.
 *   4. For each section, compile the schema.ts (via esbuild), inject
 *      it into the liquid source, rewrite asset references, and emit
 *      to `sections/fcy-<id>.liquid`.
 *   5. Same treatment for block liquid files.
 *
 * Known F0 rough edges (documented on purpose — iterate in F1+):
 *   - Watch mode re-emits on every change; we don't diff inputs.
 *   - If two sections need shared snippets, copy manually for now.
 */

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { build as esbuild } from 'esbuild';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SECTIONS_SRC = join(ROOT, 'fancyfy/sections');
const DS_ENTRY = join(ROOT, 'fancyfy/ds/main.scss');
const LIQUID_SECTIONS_OUT = join(ROOT, 'sections');
const LIQUID_BLOCKS_OUT = join(ROOT, 'blocks');
const ASSETS_DIR = join(ROOT, 'assets');

interface Manifest {
  id: string;
  version: string;
  displayName?: string;
  files?: {
    sections?: string[];
    blocks?: string[];
    snippets?: string[];
    assets?: string[];
  };
  [key: string]: unknown;
}

interface DiscoveredSection {
  id: string;
  dir: string;
  manifest: Manifest;
  tsEntry: string | null;
  scssEntry: string | null;
  liquidSource: string | null;
  schemaSource: string | null;
  blocks: string[];
}

interface SectionOutputs {
  js?: string;
  css?: string;
}

async function discoverSections(): Promise<DiscoveredSection[]> {
  if (!existsSync(SECTIONS_SRC)) return [];
  const entries = await readdir(SECTIONS_SRC, { withFileTypes: true });
  const sections: DiscoveredSection[] = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
    const dir = join(SECTIONS_SRC, ent.name);
    const manifestPath = join(dir, `fcy-${ent.name}.manifest.json`);
    if (!existsSync(manifestPath)) continue;
    const manifest: Manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const id = manifest.id;
    const tsEntry = join(dir, `fcy-${id}.ts`);
    const scssEntry = join(dir, `fcy-${id}.scss`);
    const liquidSource = join(dir, `fcy-${id}.liquid`);
    const schemaSource = join(dir, `fcy-${id}.schema.ts`);

    const blocksDir = join(dir, 'blocks');
    const blocks: string[] = [];
    if (existsSync(blocksDir)) {
      const files = await readdir(blocksDir);
      for (const f of files) {
        if (f.endsWith('.block.liquid')) blocks.push(join(blocksDir, f));
      }
    }

    sections.push({
      id,
      dir,
      manifest,
      tsEntry: existsSync(tsEntry) ? tsEntry : null,
      scssEntry: existsSync(scssEntry) ? scssEntry : null,
      liquidSource: existsSync(liquidSource) ? liquidSource : null,
      schemaSource: existsSync(schemaSource) ? schemaSource : null,
      blocks,
    });
  }
  return sections;
}

/**
 * Load a section's TS schema by bundling it with esbuild and evaluating
 * the resulting ESM via a data: URL. No on-disk temp files.
 * Passes the repo tsconfig so path aliases and strict flags work.
 */
async function loadSchema(schemaPath: string): Promise<unknown> {
  const tsconfigPath = join(ROOT, 'tsconfig.json');
  const result = await esbuild({
    entryPoints: [schemaPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    write: false,
    logLevel: 'silent',
    tsconfig: tsconfigPath,
  });
  const code = result.outputFiles[0]?.text ?? '';
  const dataUri = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  const mod: { default?: unknown } = await import(dataUri);
  return mod.default;
}

async function cleanStaleFcyAssets(): Promise<void> {
  if (!existsSync(ASSETS_DIR)) return;
  const files = await readdir(ASSETS_DIR);
  await Promise.all(
    files
      .filter((f) => f.startsWith('fcy-'))
      .map((f) => rm(join(ASSETS_DIR, f), { force: true })),
  );
}

function rewriteAssetRefs(source: string, outputs: SectionOutputs, sectionId: string): string {
  let out = source;
  if (outputs.js) {
    out = out.replace(
      /\{%-?\s*fcy_asset\s+js\s*-?%\}/g,
      `{{ '${outputs.js}' | asset_url | script_tag }}`,
    );
  }
  if (outputs.css) {
    out = out.replace(
      /\{%-?\s*fcy_asset\s+css\s*-?%\}/g,
      `{{ '${outputs.css}' | asset_url | stylesheet_tag }}`,
    );
  }
  // Leftover placeholders → warn but don't crash; the section may not use one.
  if (/\{%-?\s*fcy_asset\s+(js|css)\s*-?%\}/.test(out)) {
    console.warn(`[fcy] section "${sectionId}": asset placeholder present but no matching output.`);
  }
  return out;
}

export interface FcyThemePluginOptions {
  /** If true, merge fancyfy settings fragment into config/settings_schema.json at build end. */
  commitSchema?: boolean;
}

export function fcyThemePlugin(_options: FcyThemePluginOptions = {}): Plugin {
  let sections: DiscoveredSection[] = [];
  const outputs = new Map<string, SectionOutputs>();

  return {
    name: 'fcy-theme-plugin',

    async config() {
      sections = await discoverSections();
      const input: Record<string, string> = {
        ds: DS_ENTRY,
      };
      for (const s of sections) {
        if (s.tsEntry) input[s.id] = s.tsEntry;
        if (s.scssEntry) input[`${s.id}-style`] = s.scssEntry;
      }
      return {
        build: { rollupOptions: { input } },
      };
    },

    async buildStart() {
      await cleanStaleFcyAssets();
      outputs.clear();
    },

    generateBundle(_options, bundle) {
      for (const [fileName] of Object.entries(bundle)) {
        const base = basename(fileName);
        // Matches: fcy-<id>-<hash>.js|css or fcy-<id>-style-<hash>.css
        const match = /^fcy-([a-z0-9-]+?)(?:-style)?-[A-Za-z0-9_-]+\.(js|css)$/.exec(base);
        if (!match) continue;
        const [, id, ext] = match;
        if (!id || !ext) continue;
        const entry = outputs.get(id) ?? {};
        if (ext === 'js') entry.js = base;
        else entry.css = base;
        outputs.set(id, entry);
      }
    },

    async closeBundle() {
      await mkdir(LIQUID_SECTIONS_OUT, { recursive: true });
      await mkdir(LIQUID_BLOCKS_OUT, { recursive: true });

      for (const section of sections) {
        await emitSection(section, outputs.get(section.id) ?? {});
        for (const blockPath of section.blocks) {
          await emitBlock(blockPath, outputs.get(section.id) ?? {}, section.id);
        }
      }

      // TODO: commitSchema handling — merge fancyfy/ds/generated/settings-fragment.json
      // into config/settings_schema.json. Implemented in F1 alongside Megamenu.
    },
  };
}

async function emitSection(section: DiscoveredSection, out: SectionOutputs): Promise<void> {
  if (!section.liquidSource) {
    console.warn(`[fcy] section "${section.id}": no fcy-${section.id}.liquid — skipping emit.`);
    return;
  }
  let source = await readFile(section.liquidSource, 'utf8');
  source = rewriteAssetRefs(source, out, section.id);

  if (section.schemaSource) {
    try {
      const schema = await loadSchema(section.schemaSource);
      if (schema) {
        const serialized = JSON.stringify(schema, null, 2);
        source = source.replace(
          /\{%-?\s*fcy_schema\s*-?%\}/g,
          `{% schema %}\n${serialized}\n{% endschema %}`,
        );
      } else {
        console.warn(`[fcy] section "${section.id}": schema.ts has no default export.`);
      }
    } catch (err) {
      console.error(`[fcy] section "${section.id}": schema load failed:`, err);
      throw err;
    }
  }

  const destination = join(LIQUID_SECTIONS_OUT, `fcy-${section.id}.liquid`);
  await writeFile(destination, source, 'utf8');
  console.log(`[fcy] emitted sections/fcy-${section.id}.liquid`);
}

async function emitBlock(blockPath: string, out: SectionOutputs, sectionId: string): Promise<void> {
  let source = await readFile(blockPath, 'utf8');
  source = rewriteAssetRefs(source, out, sectionId);
  const destination = join(LIQUID_BLOCKS_OUT, basename(blockPath).replace('.block.liquid', '.liquid'));
  await writeFile(destination, source, 'utf8');
  console.log(`[fcy] emitted blocks/${basename(destination)}`);
}
