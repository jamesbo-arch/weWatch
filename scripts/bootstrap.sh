#!/usr/bin/env bash
# weWatch · one-shot dev environment bootstrap
# Idempotent — safe to run multiple times.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Checking Node version..."
if ! command -v node >/dev/null; then
  echo "Node not installed. Please install Node 20.10+ (or run: fnm use)."
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node $NODE_MAJOR detected; weWatch requires >= 20.10."
  exit 1
fi

echo "→ Checking pnpm..."
if ! command -v pnpm >/dev/null; then
  echo "pnpm not found. Enabling via corepack..."
  corepack enable
  corepack prepare pnpm@9.7.0 --activate
fi

echo "→ Installing dependencies..."
pnpm install --frozen-lockfile || pnpm install

echo "→ Setting up .env.local..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  Created .env.local from .env.example. PLEASE FILL IN YOUR API KEYS."
fi

echo "→ Starting infra (Postgres + Redis + Meilisearch)..."
if command -v docker >/dev/null; then
  docker compose up -d postgres redis meilisearch
  echo "  Waiting for Postgres to be healthy..."
  until docker compose exec -T postgres pg_isready -U wewatch >/dev/null 2>&1; do
    sleep 1
  done
  echo "  Postgres ready."
else
  echo "  Docker not found. Install Docker Desktop or run Postgres/Redis/Meili manually."
fi

echo "→ Building shared packages..."
pnpm --filter '@wewatch/*' build

echo "→ Verifying agent knowledge..."
node scripts/check-agent-knowledge.js

echo ""
echo "✓ Bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. Edit .env.local and fill in your API keys"
echo "  2. Run: pnpm dev"
echo "  3. Set up your AI Subagent team — start with agents/garmin-sdk-agent/HOW_TO_BOOTSTRAP.md"
