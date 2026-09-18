# Business World Agent — paired intent/developer re-audit

Date: 2026-09-18. Author: liushiyu's Robin.

## Verdict

**PASS for the canonical paired UI and the authenticated self-hosted shared-workspace profile.** The expanded real-browser suite passed **40/40** checks with zero unexpected browser errors. The canonical frontend suite passed **61/61** browser checks. This is not a claim that a live cloud deployment or an actual language-model conversation was verified.

Current evidence is `runtime/results.json`, including current source hashes, the source digest, real database integrity, and the complete list of passing checks. Earlier logs and the original report describe the previous 34-check baseline; they do not supersede the current result.

## A real regression found and fixed in this re-audit

The existing 34-check shared suite passed. An additional real-browser probe then reproduced a failure: after the first workspace read failed because storage was unavailable, clicking a World Builder metric replaced the unknown-state inspector with **“暂无记录”**. The server had not established that the workspace was empty. The initial error banner alone was therefore insufficient.

The failing run is preserved at `regressions/unavailable-interactions/before-results.json` (FAIL after 29 passing checks). Only this metric path was independently reproduced red before the fix. Five related action paths were additionally guarded and tested; they are not falsely described as five separately reproduced original failures.

| Surface / flow | Visible artifact or risk | Intended audience | Rubric / intent | Before → after | Evidence and fix |
| --- | --- | --- | --- | --- | --- |
| Missing storage → World Builder → metric click | “暂无记录” despite an unsuccessful initial read | Business operator needs to distinguish unknown from empty | Developer items 7–9; intent §17.2 and §17.9 | Product-level FAIL → PASS | Real server with missing storage; inspector now retains the unavailable-state message. `runtime/unavailable-metric.png` and the named passing check. |
| Missing storage → source inspection | A detail renderer could bypass the shared read-status boundary | Business operator checking provenance | Developer items 7–9 | Guarded and verified PASS | Source detail now explains that records cannot yet be read. `runtime/unavailable-source.png` and captured error-state text. |
| Missing storage → source edit / report / scenario / draft | Blank replacement flows or a misleading missing-baseline instruction before a successful read | Business operator attempting an action | Intent §17.2, §17.6, §19 | Guarded and verified PASS | Shared readiness guard rejects these four actions with useful product copy; no successful write is claimed. |

The fix is in the canonical `src/ui-runtime.mjs` and its exact served copy. It introduces one shared readiness/message boundary and applies it to metric inspection, source details, source editing, report creation, scenario execution, and draft creation. The canonical `ui.md` now states this interaction invariant explicitly. No original §17 or §19 requirement was removed.

Six new real-browser checks are mandatory. `scripts/check-shared-audit.mjs` now requires at least 40 passing checks, checks every individual status, and requires all six new named contracts. Dropping the regressions or reusing old source evidence fails the gate.

## Developer-audit assessment

Basis: the user's canonical `developer-audit` rule in ChatGPT Work Hub / Shared Context / `recVAMDkF3q0WZYnT`. Assessment combines actual captured user-visible DOM, rendering-boundary source review, error-state browser interactions, and repeatable guards. This is an agent-conducted audit, not an independent third-party certification.

| Dimension | Final score / 2 | Evidence |
| --- | ---: | --- |
| Developer vocabulary | 2 | Page and dialog copy describes business tasks, provenance, estimates, and actionable errors. |
| Internal / rubric IDs | 2 | No developer-only IDs in reviewed product output; actual business SKU/source identifiers remain legitimate data. |
| Design / evaluation criteria | 2 | Audit criteria remain in developer documentation, not product copy. |
| Prompt / instruction leakage | 2 | Reviewed surfaces do not render internal instructions. |
| Reasoning / planning leakage | 2 | User-facing results and designed progress states, not internal reasoning. |
| Tool / protocol artifacts | 2 | Typed commands and product fields; no raw tool envelopes in reviewed UI. |
| Debug / runtime state | 2 | Authentication, conflict, offline, and unavailable-storage errors are productized. |
| Roadmap / fake state | 2 | Unknown is retained after interaction; examples, manual records, estimates, and unsent drafts remain distinct. |
| Audience boundary | 2 | Allowlisted audience/type/visibility adapter, escaping, narrow server commands, and readiness guards. |
| Runtime / browser evidence | 2 | Nine major routes, desktop/mobile, critical dialogs, exports, permissions, persistence, and six post-error actions. |
| **Total** | **20/20 — CLEAN** | **No reproduced developer-only or false-implementation-state finding remains open in this scope.** |

Per-surface result: Overview, Persona, World Builder, Content, Live, Growth, Product, Experiment, and Reports each PASS / CLEAN in the reviewed profiles. Shared authentication, source/report dialogs, portable sharing, and unavailable/conflict/offline flows also pass their exercised contracts. Generated business notes deliberately entered by the test operator are user data, not leaked internal instructions.

## Intent coverage and actual test results

All ten original §17 requirements and the §19 interaction group pass. Their evidence covers shared UI/Agent data, source truth, state classifications, immutable baselines, provenance, human-confirmed drafts, page depth, cross-page workflows, runtime behavior, and HTML/Markdown/source-copy parity.

| Gate executed during this audit | Result |
| --- | --- |
| Frontend unit / contract tests | 105/105 PASS; no skipped or cancelled tests |
| Existing design / product / eve browser regression | 45/45 PASS (27 + 6 + 12) |
| Canonical paired UI browser regression after the fix | 61/61 PASS |
| Backend persistent workspace tests | 19/19 PASS, including the parent test; no skips |
| Expanded real shared UI ↔ registered Agent tool suite after the fix | 40/40 PASS |
| Frontend build / application typecheck / Next production build / eve build | PASS; eve build uses Node 24.14.0 |
| Shared source-hash and copied-pair gate | PASS |

The shared suite uses a real production-built Next server, generated temporary test identity, actual registered tool executors, and an isolated on-disk SQLite database. It verifies process restart, separate authenticated browsers, ownership, revision conflicts, and forbidden cross-origin writes. It does not intercept business API responses. The unrelated legacy product suite includes an explicitly isolated worker-cancellation stub; that test is not offered as proof of real business persistence or live AI.

The paired UI is exercised at 1440, 768, 390, and 320 pixels; the authenticated shared workspace at 1440 and 390 pixels. Browser-generated screenshots and complete visible-copy captures are retained with the evidence. Semantic copy review is distinct from the automatic keyword regression scan.

## Unchanged release boundaries

No main-branch merge or production deployment is performed by this audit. The verified database profile is explicit self-hosted SQLite under Node 24 and the existing starter password-auth identity. Live Neon/Postgres behavior, production credentials, legacy-data ownership migration, multi-tenant OAuth, provider ingestion, live language-model turns, streamed approval UI, and calibrated forecasting remain outside this certification. External publishing, budget changes, and email delivery were not executed.

Reproduce from the runtime checkout with Node 24+ and a Python environment containing Playwright/Chromium:

```bash
PYTHON=/path/to/playwright-venv/bin/python bash scripts/verify-shared.sh
```

From the canonical design checkout, run the paired verifier with `BUSINESS_WORLD_AGENT_REPO` pointing to this exact runtime candidate. A staged run was used in this session when the shell rejected combined invocations; the final verdict relies on actual successful stage outputs and current hash-bound runtime evidence, not on treating a blocked invocation as a pass.
