#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --test tests/ui-state.test.mjs tests/ui-client.test.mjs
npm run typecheck
npm run test:workspace
npm run build
npm run build:eve
"${PYTHON:-python3}" tests/ui_browser.py
"${PYTHON:-python3}" tests/concept_flows_browser.py
"${PYTHON:-python3}" tests/shared_workspace_browser.py
node scripts/check-shared-audit.mjs
node scripts/check-concept-audit.mjs
git diff --check
