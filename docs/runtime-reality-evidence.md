# Business World Reality Runtime Evidence

Verified: 2026-09-18
Branch: `fix/verified-business-world-sources`
Product commit: `5b7d8f966fffdb5aaade05c20bf53ffea5314727`
Vercel Preview: `business-world-agent-diaper-kgbdbf2u9-nyn5255-8475s-projects.vercel.app`
Persistent source: Supabase project `business-world-agent` (`mezthyaerhhohywcxmqi`)

## Result

The previous global `NO VERIFIED SOURCE` state is removed from every primary Business World screen without fabricating platform metrics.

The product now reads a real persisted baseline from Supabase Postgres when the primary `DATABASE_URL` path is unavailable. Unknown Douyin / Qianchuan / DouDian metrics remain `null` and render as `—`; they are not replaced by mock values.

Runtime provenance returned by `/api/business-world/state`:

```json
{
  "sourceMode": "persisted-observation",
  "provider": "system-record",
  "sourceLabel": "Supabase verified system baseline",
  "storage": "Supabase Postgres",
  "writable": false
}
```

## 9/9 runtime surface verification

Each surface was fetched from the deployed Preview with a deterministic `?screen=<id>` review deep link and a real full-page browser screenshot.

| Screen | HTTP | VERIFIED PERSISTED SOURCE | NO VERIFIED SOURCE | Screen marker |
| --- | ---: | --- | --- | --- |
| Overview | 200 | yes | **absent** | Overview metrics |
| Persona Studio | 200 | yes | **absent** | Persona Studio |
| World Builder | 200 | yes | **absent** | World Builder 真实基线 |
| 内容策略 | 200 | yes | **absent** | 内容策略 |
| 直播作战室 | 200 | yes | **absent** | 直播作战室 |
| 投放优化 | 200 | yes | **absent** | 投放优化 |
| 商品分析 | 200 | yes | **absent** | 商品分析 |
| 模拟实验 | 200 | yes | **absent** | Scenario Experiment |
| 报告 | 200 | yes | **absent** | Evidence Report |

Additional interaction states:
- `?source=1`: real read-only source-detail surface; verified source present; `NO VERIFIED SOURCE` absent.
- `?search=World`: real search-results surface; verified source present; `NO VERIFIED SOURCE` absent.

## Persistence

Supabase migrations create:
- `public.business_world_state`
- `public.business_world_scenario_run`

The `primary` state row is a persisted system baseline. Platform-specific business values are intentionally null until a verified external platform source is connected.

Scenario output remains explicitly `modeled: true`. When the primary database is unavailable, scenario runs are persisted to Supabase with RLS constraints that require the primary source state and modeled output.

## Source editor truth

The Supabase fallback baseline is deliberately read-only in the product:
- source banner says `来源详情`, not `更新来源`;
- editor inputs are disabled;
- save button says `只读来源`.

This prevents a real read path from presenting a fake write capability.

## Build evidence

Latest Preview build:
- Next.js compile: PASS
- TypeScript: PASS
- static page generation: 9/9 PASS
- Eve/Nitro server build: PASS

## Remaining external-data limitation

This change verifies the **source and persistence boundary**, not the existence of Douyin / Qianchuan / DouDian platform observations. No reusable credentials for those platforms were found in the current Secrets Registry during this run. Therefore platform-specific values remain unknown/null rather than being fabricated.

The acceptance target for this PR is: every primary runtime surface has a verified persisted source boundary and no surface silently substitutes mock business data.
