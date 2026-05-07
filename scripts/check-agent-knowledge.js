#!/usr/bin/env node
/**
 * CI guard: every agent under agents/ must have at least the canonical files.
 * Add new required files here when an agent matures.
 *
 * Run:   node scripts/check-agent-knowledge.js
 * Exits non-zero if any required file is missing.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const AGENTS_DIR = join(process.cwd(), 'agents');

const REQUIRED_FOR_ALL = ['README.md', 'SYSTEM_PROMPT.md', 'HOW_TO_BOOTSTRAP.md'];

const REQUIRED_PER_AGENT = {
  'pm-agent': [
    'PRODUCT_PRINCIPLES.md',
    'PRD_TEMPLATE.md',
    'PRIORITIZATION_FRAMEWORK.md',
    'METRICS_FRAMEWORK.md',
    'AGENT_DISPATCH_RULES.md',
    'WEEKLY_RITUAL.md',
  ],
  'garmin-sdk-agent': [
    'IR_SCHEMA.md',
    'CODE_GEN_RULES.md',
    'DEVICE_MATRIX.md',
    'CODING_STYLE.md',
    'BUILD_PIPELINE.md',
    'PERFORMANCE_BUDGET.md',
    'ERROR_PLAYBOOK.md',
  ],
  'backend-agent': [
    'ARCHITECTURE.md',
    'API_CONVENTIONS.md',
    'DB_CONVENTIONS.md',
    'SECURITY_RULES.md',
    'ERROR_HANDLING.md',
    'TESTING_RULES.md',
  ],
  'ai-pipeline-agent': [
    'ARCHITECTURE.md',
    'PROMPT_TO_IR_PIPELINE.md',
    'IMAGE_GENERATION_RULES.md',
    'MODEL_CATALOG.md',
    'COST_BUDGET.md',
    'QUALITY_RUBRIC.md',
    'IP_AND_SAFETY.md',
    'ERROR_PLAYBOOK.md',
  ],
};

function main() {
  if (!existsSync(AGENTS_DIR)) {
    console.error(`No agents/ directory found at ${AGENTS_DIR}`);
    process.exit(1);
  }
  const agents = readdirSync(AGENTS_DIR).filter((entry) => {
    const p = join(AGENTS_DIR, entry);
    return statSync(p).isDirectory() && !entry.startsWith('.');
  });

  let failed = 0;

  for (const agent of agents) {
    const agentDir = join(AGENTS_DIR, agent);
    const required = [...REQUIRED_FOR_ALL, ...(REQUIRED_PER_AGENT[agent] ?? [])];

    const missing = required.filter((f) => !existsSync(join(agentDir, f)));
    if (missing.length > 0) {
      failed++;
      console.error(`✗ ${agent} missing: ${missing.join(', ')}`);
    } else {
      console.log(`✓ ${agent} (${required.length} required files present)`);
    }
  }

  console.log(`\n${agents.length} agents checked, ${failed} with missing files.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
