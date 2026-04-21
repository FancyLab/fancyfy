#!/usr/bin/env node
/**
 * Dev-only error log sink — ADR-007 §6.
 *
 * Binds to 127.0.0.1:8787 and writes warn/error entries streamed by
 * the dev-build logger to `.fancyfy-logs/errors-YYYY-MM-DD.jsonl`.
 *
 * F0 implements a minimal HTTP POST receiver (not WebSocket) — simpler,
 * good enough for the dev loop. Upgrade to WS later if bidirectional
 * control becomes useful.
 *
 * Run: `npm run dev:logs`
 */

import { createServer } from 'node:http';
import { appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const LOG_DIR = join(ROOT, '.fancyfy-logs');
const PORT = Number(process.env.FCY_LOG_PORT ?? 8787);
const HOST = '127.0.0.1';

function todayFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `errors-${yyyy}-${mm}-${dd}.jsonl`;
}

async function ensureDir(): Promise<void> {
  if (!existsSync(LOG_DIR)) await mkdir(LOG_DIR, { recursive: true });
}

const server = createServer(async (req, res) => {
  // CORS for the Shopify dev-store origin.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/log') {
    res.writeHead(404);
    res.end();
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks).toString('utf8');

  try {
    const entry = JSON.parse(body) as Record<string, unknown>;
    const enriched = { ts: new Date().toISOString(), ...entry };
    await ensureDir();
    await appendFile(join(LOG_DIR, todayFilename()), JSON.stringify(enriched) + '\n');
    res.writeHead(204);
    res.end();
  } catch (err) {
    console.error('[fcy-logs] bad payload:', err);
    res.writeHead(400);
    res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[fcy-logs] listening on http://${HOST}:${PORT}/log`);
  console.log(`[fcy-logs] writing to ${LOG_DIR}/errors-YYYY-MM-DD.jsonl`);
});
