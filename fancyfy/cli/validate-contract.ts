#!/usr/bin/env node
/**
 * ADR-010 contract validator.
 *
 * Scans Horizon sources for CSS custom property declarations and asserts
 * that every token in `fancyfy/ds/tokens.ts` (HORIZON_GLOBAL_TOKENS +
 * HORIZON_SCHEME_TOKENS) is actually declared somewhere.
 *
 * Exits non-zero if any contract token is missing — blocks the PR / merge.
 *
 * Not a full Liquid render: we pattern-match `--foo:` declarations in
 * liquid and CSS files. Tokens declared dynamically (computed via
 * liquid) are matched by their left-hand-side name, which is what we
 * commit to in the contract.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTRACT_TOKENS_STATIC,
  CONTRACT_TOKENS_WHITELISTED,
  HORIZON_RUNTIME_EMITTED_TOKENS,
  HORIZON_BODY_RUNTIME_TOKENS,
} from '../ds/tokens.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const TARGETS = [
  { path: join(ROOT, 'snippets/theme-styles-variables.liquid'), kind: 'liquid' as const },
  { path: join(ROOT, 'snippets/color-schemes.liquid'), kind: 'liquid' as const },
  { path: join(ROOT, 'assets'), kind: 'dir' as const, ext: '.css' },
];

const DECL_RE = /(--[a-zA-Z0-9][a-zA-Z0-9_-]*)\s*:/g;

async function collectTokensFromFile(path: string): Promise<Set<string>> {
  const content = await readFile(path, 'utf8');
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = DECL_RE.exec(content)) !== null) {
    found.add(match[1]!);
  }
  return found;
}

async function collectTokensFromDir(dir: string, ext: string): Promise<Set<string>> {
  const found = new Set<string>();
  if (!existsSync(dir)) return found;
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isFile() && entry.endsWith(ext)) {
      const partial = await collectTokensFromFile(full);
      for (const t of partial) found.add(t);
    }
  }
  return found;
}

async function main(): Promise<void> {
  const declared = new Set<string>();
  for (const target of TARGETS) {
    if (target.kind === 'liquid' && existsSync(target.path)) {
      for (const t of await collectTokensFromFile(target.path)) declared.add(t);
    } else if (target.kind === 'dir') {
      for (const t of await collectTokensFromDir(target.path, target.ext)) declared.add(t);
    }
  }

  // Statically-verifiable tokens (provenances 1–3) must be findable.
  const missing = CONTRACT_TOKENS_STATIC.filter((t) => !declared.has(t));
  const whitelistedCount = CONTRACT_TOKENS_WHITELISTED.length;

  if (missing.length === 0) {
    console.log(
      `[fcy] ✓ contract OK — ${CONTRACT_TOKENS_STATIC.length} static tokens validated against Horizon; ` +
        `${whitelistedCount} whitelisted (${HORIZON_RUNTIME_EMITTED_TOKENS.length} runtime-emitted + ` +
        `${HORIZON_BODY_RUNTIME_TOKENS.length} body-runtime).`,
    );
    process.exit(0);
  }

  console.error(`[fcy] ✗ contract validation failed. ${missing.length} static token(s) missing:`);
  for (const t of missing) {
    console.error(`  - ${t}`);
  }
  console.error(`\nOptions (ADR-001 §4.4):`);
  console.error(`  1. Update fancyfy sections to use Horizon's replacement, then update fancyfy/ds/tokens.ts.`);
  console.error(`  2. Remove the token from the contract if no section consumes it.`);
  console.error(`  3. If Horizon moved the declaration to a Liquid loop or JS, move it to the`);
  console.error(`     HORIZON_RUNTIME_EMITTED_TOKENS or HORIZON_BODY_RUNTIME_TOKENS array in tokens.ts.`);
  console.error(`  4. Revert the Horizon merge (last resort).`);
  process.exit(1);
}

await main();
