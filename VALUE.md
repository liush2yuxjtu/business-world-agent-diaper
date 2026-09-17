# VALUE.md — Reality Audit

Every user-visible capability is scored 0–2 on **Data, Logic, Persistence, API/Tool, UI, Agent, Provenance, Browser Eval, DB/State Eval, Evidence**.

- **0** — simulated, missing, static, or no reproducible evidence.
- **1** — partial implementation/evidence; not fully verified end-to-end.
- **2** — real implementation with reproducible runtime evidence.

Totals: **SIMULATED 0–7 · PARTIAL 8–14 · MOSTLY REAL 15–18 · REAL 19–20**.

Product-level evaluation fails if any capability appears real while depending on fixtures, hardcoded values, fake APIs/tools, route aliases, local-only state, or silent mock fallback without explicit runtime evidence.

Run `npm run audit:reality` (or `node scripts/audit-business-world-reality.mjs`) before and after each improvement loop. Runtime-only categories must not be awarded from source inspection alone.

## Current verified score

**17/20 — MOSTLY REAL** on the Vercel Preview for commit `e30bd279d1529394cb72e8d17932c447a2af9f8b`.

The remaining gap is not a UI/build issue: the deployed project currently reports `DATABASE_URL` as unconfigured and no verified business source is connected. See `docs/runtime-reality-evidence.md` for the browser/API evidence and per-item score.
