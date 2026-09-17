# Business World Agent

Business World Agent 是一个基于 Next.js 与 Vercel eve 的纸尿裤电商经营智能体。

本仓库采用一个明确的产品真实性规则：**只发布已经端到端工作的能力。** 未接入真实数据、没有后端行为或尚未完成验证的业务模块，不以 Dashboard 卡片、占位按钮、模拟数字或“规划中”入口出现在产品界面。

## 当前已发布能力

- `/`：真实可交互的 Business World Agent 会话入口。
- `/chat/[id]`：可继续的会话页面。
- `/api/health`：部署健康检查。
- `/api/bootstrap`：会话启动所需的 setup / viewer 信息。
- `/api/chats` 与 `/api/chats/[id]`：会话历史读写接口。
- `/api/auth/[...all]`：生产认证路由。
- `/api/password-auth/*`：密码模式登录与退出。
- `/eve/v1/*`：由 eve 挂载的 Agent runtime HTTP / streaming 接口。

当前产品**不发布**未经真实数据源验证的 Persona 指标、内容表现、直播漏斗、投放 ROI、交易指标或 Scenario 预测。

## 开发原则

新增一个 Business World 模块时，必须同时完成：

1. 真实数据源或明确的用户数据输入边界。
2. 服务端读取、校验和错误处理。
3. 用户真正可操作的 UI / Agent flow。
4. 对真实行为的运行时验证。
5. 验证通过后再暴露导航入口。

不使用 mock 数据作为“先上线再说”的产品替身。

## 本地开发

```bash
pnpm install
pnpm dev
```

验证：

```bash
pnpm typecheck
pnpm build:eve
pnpm build
```

部署由已连接的 Vercel 项目 `business-world-agent-diaper` 完成。PR 分支用于 Preview，`main` 用于 production。
