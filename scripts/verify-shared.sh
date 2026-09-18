#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'if(Number(process.versions.node.split(".")[0])<24){console.error("Node 24+ is required for the explicit durable SQLite verification profile.");process.exit(1)}'
npm run typecheck
npm run test:workspace
npm run build
npm run build:eve
"${PYTHON:-python3}" tests/shared_workspace_browser.py
node scripts/check-shared-audit.mjs
