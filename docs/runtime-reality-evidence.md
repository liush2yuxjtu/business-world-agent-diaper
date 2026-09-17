# Business World Reality Runtime Evidence

Verified: 2026-09-17
Product commit: `e30bd279d1529394cb72e8d17932c447a2af9f8b`
Vercel Preview: `business-world-agent-diaper-ilqfet2rb-nyn5255-8475s-projects.vercel.app`
Browser session: `2026-09-17T09-12-44-295Z-mcp`

## Browser acceptance

PASS using the approved Mac mini + official Playwright MCP fallback after ChatGPT-side HTTP fetch could not retain the Vercel Deployment Protection session.

Verified in a real browser:

- initial UI explicitly shows `NO VERIFIED SOURCE` instead of mock business values;
- all 9 navigation surfaces switch to their own product states;
- `开始模拟` navigates to Scenario Experiment;
- functional search returns matching product surfaces;
- the data-source editor opens with real editable fields;
- `/api/health` returns HTTP 200;
- `/api/business-world/state` returns HTTP 200;
- no PostHog missing-token console error remains;
- full-page screenshot was captured.

## Runtime data/persistence truth

The deployed Preview currently reports:

```json
{
  "persistence": {
    "provider": "neon-postgres",
    "configured": false,
    "coreSchemaReady": false
  }
}
```

The Business World state endpoint therefore correctly returns:

```json
{
  "provenance": {
    "sourceMode": "unavailable",
    "provider": "none",
    "sourceLabel": "No verified business source connected",
    "storage": "not-configured"
  },
  "data": null
}
```

This is intentional fail-closed behavior: production code does not silently fall back to the retained reference mock.

## Verified score

| Item | Score | Runtime basis |
|---|---:|---|
| Data | 1/2 | Real boundary and fail-closed behavior exist, but no verified business source is connected. |
| Logic | 2/2 | Scenario logic is executable and explicitly labels modeled output. |
| Persistence | 1/2 | Real Neon persistence implementation exists, but the deployed project has no `DATABASE_URL`. |
| API/Tool | 2/2 | UI routes and Eve tools share `real-service`; no production tool imports `mock-service`. |
| UI | 2/2 | Browser-verified navigation, search, editor and simulation flow. |
| Agent | 2/2 | Business Agent tools read the same real boundary. |
| Provenance | 2/2 | Source mode/label/type, observed time and storage are represented explicitly. |
| Browser Eval | 2/2 | Product-level Playwright acceptance PASS. |
| DB/State Eval | 1/2 | Runtime endpoint correctly verifies DB is unconfigured; no DB write/read can be proven yet. |
| Evidence | 2/2 | Build, browser session, API responses and screenshot are reproducible evidence. |
| **Total** | **17/20** | **MOSTLY REAL** |

## Current hard blocker

To improve beyond 17/20 without faking evidence, configure a real persistent backend (`DATABASE_URL` / Neon or an equivalent supported store) and connect at least one verified business data source. Airtable Secrets Registry was checked during this audit and contained no reusable `DATABASE_URL` / Neon record for this project.
