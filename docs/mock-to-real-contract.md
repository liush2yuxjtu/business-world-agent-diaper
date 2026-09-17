# Business World Agent — Mock → Real Delivery Contract

Last updated: 2026-09-17

## Product direction

The current Business World UI is a **reference product contract**. Its mock/simulated surfaces are kept so implementation can converge on the intended experience instead of deleting the experience when the backing capability is incomplete.

The rule is simple:

> **Make the mock real behind the same product surface. Do not delete the mock surface to make the repository look complete. Do not relabel an unfinished capability as `planned` or `in progress` and treat that as delivery.**

A slice is real only when all of the following are true:

1. It reads from a documented real source or real persisted system of record.
2. Its server-side adapter/runtime is implemented; secrets stay server-side.
3. UI and Agent/tool output read the same reality boundary.
4. Results carry source/provenance and freshness metadata where applicable.
5. The real path is exercised in a running deployment, not only typechecked or mocked.
6. Mock data may remain for tests/reference, but production must not silently fall back to mock while claiming real data.

## Current reality map

The current deployed product exposes nine navigation entries, but only five independent views exist in `app/page.tsx`.

```text
Business World Agent /
├── 总览 / overview
│   └── REFERENCE MOCK: hard-coded cross-domain KPIs + operating loop
├── Persona Studio / persona
│   └── REFERENCE MOCK: four seeded personas + hard-coded population/market metrics
├── World Builder / world
│   └── REFERENCE MOCK: hard-coded simulation prompt, prediction and reliability scores
├── 内容策略 / content
│   └── REFERENCE MOCK: hard-coded topics, scripts and forecast metrics
├── 直播作战室 / live
│   └── ROUTE ALIAS: currently opens overview; no independent view
├── 投放优化 / growth
│   └── REFERENCE MOCK: hard-coded campaigns, CTR/CPA/ROI and optimization suggestions
├── 商品分析 / product
│   └── ROUTE ALIAS: currently opens overview; no independent view
├── 模拟实验 / experiment
│   └── ROUTE ALIAS: currently opens overview; no independent view
└── 报告 / report
    └── ROUTE ALIAS: currently opens overview; no independent view

Agent data layer
├── business_world_snapshot ........ SIMULATED / SQLite Mock
├── business_content_insights ...... SIMULATED / SQLite Mock
├── business_live_insights ......... SIMULATED / SQLite Mock
├── business_ad_insights ........... SIMULATED / SQLite Mock
├── business_commerce_insights ..... SIMULATED / SQLite Mock
└── business_scenario_experiment ... SIMULATED / SQLite Mock + fixed elasticity
```

The mock database/service are intentionally preserved:

```text
lib/business-world/
├── mock-db.ts
└── mock-service.ts
```

## Heavy implementation order

This is an implementation sequence, not a status board. A slice does not become "real" until it satisfies the delivery contract above.

1. **Content insights** — replace `business_content_insights` production reads with verified Douyin read APIs.
2. **Live insights** — replace `business_live_insights` production reads with verified Douyin live-data APIs.
3. **Commerce** — replace `business_commerce_insights` production reads with DouDian product/inventory/order/aftersale APIs.
4. **Ads / Qianchuan** — replace `business_ad_insights` production reads with verified OceanEngine/Qianchuan reporting APIs.
5. **Cross-domain snapshot** — aggregate the real adapters behind `business_world_snapshot` with explicit per-source freshness.
6. **Persona Studio** — derive segments/insights from the real observation layer instead of seeded persona constants.
7. **World Builder** — make its world state read the same real observation layer; separate observation from modeled assumptions.
8. **Scenario experiment** — calibrate against real historical outcomes and retain explicit model/assumption provenance.
9. **Report** — generate evidence-linked reports from the same real source records and experiment runs.

## PR shape for each slice

Each heavy PR should be narrow and independently verifiable:

```text
real source / persisted source of truth
        ↓
server-side adapter
        ↓
normalized domain shape + provenance
        ↓
Agent tool/service
        ↓
UI surface
        ↓
running deployment verification
```

If a required platform credential, authorization scope, or official endpoint cannot be verified, the PR stays incomplete. It should not substitute fabricated values, a silent mock fallback, or a status label for the missing implementation.
