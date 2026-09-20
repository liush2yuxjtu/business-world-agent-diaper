---
name: verify
description: Verify Business World Agent changes on the exact candidate by driving the real Next.js UI and Eve session, capturing runtime evidence, and probing one adjacent path. Maintain this file whenever the working verification path changes.
---

# Verify Business World Agent

Upstream behavior reference:
`https://raw.githubusercontent.com/asgeirtj/system_prompts_leaks/main/Anthropic/claude-code/skills/verify/SKILL.md`

## Candidate

Verify the exact commit/PR/deployment under review. Prefer the immutable Vercel Preview for UI/Eve changes. Do not reuse evidence from another preview or SHA.

## Launch / readiness

Local web:

```bash
pnpm dev
```

Eve when the change reaches the agent runtime:

```bash
pnpm dev:eve
```

Supporting health check:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

For preview verification, open the exact Preview URL returned for the PR. The `/chat` route intentionally renders the Eve chat directly when `VERCEL_ENV=preview`.

## Drive

Primary surface: browser UI.

Use Playwright/Chromium or the available real-browser harness.

1. Open `/` and confirm the expected Business World surface renders.
2. Open `/chat`.
3. Send a representative message through the Eve UI.
4. Wait for the session/tool activity to settle.
5. Capture the visible answer plus any tool/state activity relevant to the change.
6. If the change touches state or persistence, reload/reopen and read the state back.
7. If the change touches approval-gated writes, prove the approval boundary without performing an irreversible external action unless explicitly authorized.

For auth changes, exercise both the expected authenticated path and one unauthorized/blocked path.

## Evidence

Store screenshots/runtime captures under a temporary candidate-specific directory such as:

`/tmp/business-world-agent-verify/<sha-or-pr>/`

Report the exact candidate URL/SHA with each capture.

`pnpm typecheck`, `pnpm build:eve`, `pnpm eval:eve`, deployment READY, and `/api/health` are supporting diagnostics only. They do not replace browser/session runtime evidence.

## Probe

Pick one adjacent case suggested by the diff: malformed/empty input, auth boundary, repeated action, stale state, tool failure, or reload.

## Cleanup

Stop only the local web/Eve processes started for this verification. Preserve evidence.

## Maintain this verifier

Update this file only when a command, route, readiness signal, browser flow, or evidence rule above is proven stale or incomplete by a real run.
