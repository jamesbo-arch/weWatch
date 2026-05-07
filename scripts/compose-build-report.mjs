#!/usr/bin/env node
/**
 * Compose build_report.json from per-device .prg artifacts.
 *
 * Usage:
 *   node scripts/compose-build-report.mjs --task <id> --artifacts <dir>
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const taskId = args.task ?? '<unknown>';
const artifactsDir = args.artifacts ?? './_artifacts';

if (!existsSync(artifactsDir)) {
  console.error(JSON.stringify({ error: `artifacts dir not found: ${artifactsDir}` }, null, 2));
  process.exit(1);
}

const targets = [];
const dirs = readdirSync(artifactsDir);

for (const dir of dirs) {
  const m = dir.match(/^prg-([a-z0-9_]+)-/);
  if (!m) continue;
  const device = m[1];
  const prgPath = findPrg(join(artifactsDir, dir));
  if (prgPath != null) {
    targets.push({
      device,
      status: 'success',
      binary_size_kb: Math.round((statSync(prgPath).size / 1024) * 10) / 10,
      prg_path: prgPath,
    });
  } else {
    targets.push({ device, status: 'failed', reason: 'no .prg artifact found' });
  }
}

const report = {
  task_id: taskId,
  agent_version: '0.1.0',
  finished_at: new Date().toISOString(),
  targets,
  decisions: [],
  playbook_hits: [],
};

console.log(JSON.stringify(report, null, 2));

function findPrg(dir) {
  if (!existsSync(dir)) return null;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.prg')) return join(dir, f);
  }
  return null;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[key] = val;
    }
  }
  return out;
}
