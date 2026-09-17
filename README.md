# Business World Agent — 纸尿裤电商 Demo

这是一个基于 Next.js + Vercel eve 的 Business World Agent 演示项目。当前产品把消费者 Persona、内容、直播、投放、商品交易和 Scenario Experiment 组织成一个可浏览的经营世界。

## 当前可用产品面

- `/`：Business World Dashboard。当前真正可切换的视图为总览、Persona Studio、World Builder、内容策略、投放优化。
- `/api/health`：部署健康检查。
- `/api/business-world/scenario`：POST Scenario Experiment。输入结构化经营杠杆、变化幅度和可选 Persona，运行服务器端模拟。
- `/auth/error`：认证错误页。
- eve channel 与 authored tools：位于 `agent/`，用于 Business World Agent 对话与工具调用。

侧栏中的直播作战室、商品分析、模拟实验和报告仍是规划模块。UI 会明确显示“规划中”，不会再点击后静默跳回总览。

## 数据真实性

当前 Business World 业务数据是 **simulated / mock**，不是抖音、巨量千川或抖店真实经营数据。

- `sourceMode: "simulated"`
- `provider: "mock-sqlite"`
- 本地数据库：`.eve/business-world-agent.sqlite`
- Vercel 数据库：`/tmp/business-world-agent.sqlite`，实例级临时存储

模拟数据是确定性种子，便于复现 Agent 行为和 Scenario Experiment。真实 API 的能力映射、认证方式与官方文档见 [`docs/business-world-api-sources.md`](docs/business-world-api-sources.md)。

## Business World authored tools

- `business_world_snapshot`
- `business_content_insights`
- `business_live_insights`
- `business_ad_insights`
- `business_commerce_insights`
- `business_scenario_experiment`

所有这些工具当前都从 Mock SQLite Service 读取数据，并返回数据源声明。

## 本地运行

```bash
pnpm install
pnpm dev
```

验证：

```bash
pnpm typecheck
pnpm build:eve
pnpm build
curl http://localhost:3000/api/health
```

Scenario API 示例：

```bash
curl -X POST http://localhost:3000/api/business-world/scenario \
  -H 'content-type: application/json' \
  -d '{"lever":"ad_efficiency","changePercent":20,"personaId":"xiaoyu"}'
```

## 部署

仓库已连接 Vercel 项目 `business-world-agent-diaper`。向 PR 分支推送会生成 Preview Deployment；合并到 `main` 后由 Git Integration 生成 production deployment。
