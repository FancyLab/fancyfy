#!/usr/bin/env node
/**
 * Scaffolder: `npm run new:section <id>`.
 *
 * Creates `fancyfy/sections/<id>/` from the template under
 * `fancyfy/cli/templates/section/`, substituting __ID__ and __PASCAL__
 * placeholders.
 */

import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const TEMPLATE_DIR = join(ROOT, 'fancyfy/cli/templates/section');
const SECTIONS_DIR = join(ROOT, 'fancyfy/sections');

function kebabToPascal(s: string): string {
  return s
    .split('-')
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join('');
}

function isValidId(id: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id);
}

async function scaffold(id: string): Promise<void> {
  if (!isValidId(id)) {
    console.error(`[fcy] invalid section id "${id}". Use kebab-case (e.g., "sticky-atc").`);
    process.exit(1);
  }
  if (!existsSync(TEMPLATE_DIR)) {
    console.error(`[fcy] template dir not found at ${TEMPLATE_DIR}`);
    process.exit(1);
  }
  const target = join(SECTIONS_DIR, id);
  if (existsSync(target)) {
    console.error(`[fcy] section "${id}" already exists at ${target}`);
    process.exit(1);
  }

  const pascal = kebabToPascal(id);
  console.log(`[fcy] scaffolding section "${id}" (class Fcy${pascal}Element)`);
  await copyDirWithSubstitution(TEMPLATE_DIR, target, { id, pascal });

  console.log(`\n[fcy] ✓ done. Next steps:`);
  console.log(`  1. Edit fancyfy/sections/${id}/fcy-${id}.manifest.json`);
  console.log(`  2. Implement fcy-${id}.ts, fcy-${id}.scss, fcy-${id}.liquid, fcy-${id}.schema.ts`);
  console.log(`  3. npm run dev     # emits sections/fcy-${id}.liquid`);
  console.log(`  4. npm run dev:shopify  # serves the showcase store`);
}

async function copyDirWithSubstitution(
  src: string,
  dst: string,
  vars: { id: string; pascal: string },
): Promise<void> {
  await mkdir(dst, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const srcPath = join(src, ent.name);
    const substitutedName = ent.name
      .replace(/__ID__/g, vars.id)
      .replace(/__PASCAL__/g, vars.pascal);
    const dstPath = join(dst, substitutedName);
    if (ent.isDirectory()) {
      await copyDirWithSubstitution(srcPath, dstPath, vars);
    } else if (ent.isFile()) {
      if (isTextFile(ent.name)) {
        const content = await readFile(srcPath, 'utf8');
        const substituted = content
          .replace(/__ID__/g, vars.id)
          .replace(/__PASCAL__/g, vars.pascal);
        await mkdir(dirname(dstPath), { recursive: true });
        await writeFile(dstPath, substituted, 'utf8');
      } else {
        await copyFile(srcPath, dstPath);
      }
    }
  }
}

function isTextFile(name: string): boolean {
  return /\.(ts|tsx|scss|css|liquid|json|md|txt)$/.test(name);
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: npm run new:section <id>');
  console.error('       id must be kebab-case (e.g., "sticky-atc")');
  process.exit(1);
}
await scaffold(id);
