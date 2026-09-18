> Current revalidation: see `REVALIDATION.md` and the current `runtime/results.json`. The shared suite now passes 40/40 checks, including six mandatory post-error interactions. The original report below records the earlier baseline.

# Business World Agent — 共享 UI / Agent 审计

日期：2026-09-18。作者：liushiyu's Robin。

## 结果与范围

当前候选的共享状态验收通过：19 项 Node 测试、34 项真实浏览器与工具联动检查、TypeScript、Next.js 生产构建、eve Agent 构建。最终结果以 `runtime/results.json` 和 `scripts/check-shared-audit.mjs` 对当前源码的 SHA-256 校验为准；旧证据不能替代新版本验证。

验收对象是 `public/business-world/ui.html` / `ui.md` 配对文件及它们使用的真实后端。配对原件位于 `liush2yuxjtu/world-agent-interactive`；`paired-source.json` 记录逐文件哈希，共 10 个配对运行文件和许可证文件。原主线的业务图片未改动。

## 实际修复

| 问题 | 修复与证明 |
| --- | --- |
| UI 只保存在浏览器，Agent 读取另一数据源 | UI 与实际注册的业务工具共用 owner-scoped workspace；核对工作区 ID、revision、来源 ID、完整数据及磁盘记录 |
| 空主库静默转读其他数据库 | 数据库配置必须唯一且明确；缺失、冲突或损坏均失败，不回退浏览器、演示数据或其他远端 |
| 人工写入可冒充官方来源 | 写入只接受 manual-entry；来源状态始终未核验，观测时间不伪造，服务器生成记录 ID 和保存时间 |
| 情景同时改变无关指标 | 不同经营杠杆使用明确的灵敏度假设；未采集维度为 null，不把互动次数当互动率 |
| 客户端可以提供整份历史 | 只接受限定命令，报告和情景事实由服务器构造；报告基准完整内容必须一致 |
| 并发写入覆盖新版本 | 单条数据库 compare-and-swap；旧 revision 返回冲突，另一页面或 Agent 的新记录不被覆盖 |
| 原首页仍运行第二套旧 UI | 根路由进入已审计的完整工作台，并保留 screen / source / search 深链接；旧组件不再被首页渲染 |
| 身份与跨站边界缺失 | 现有密码会话与服务端身份校验；读接口也受保护；写接口检查同源与大小限制；错误不回显实现细节 |
| 只读分享副本仍要求工作区登录 | 明确同意后产生可携带报告副本；新浏览器可读副本，但原工作区 API 仍返回 401 |
| 冷启动浏览器出现 Vercel 统计脚本 404 | 仅 Vercel 部署加载其专用统计组件；没有在测试中忽略这些错误 |
| 无数据、读取失败、历史未选中混为一谈 | 状态分别显示；已有情景提示选择记录；策略模板不残留伪造购买频次 |

## 证据怎么得到

`tests/shared_workspace_browser.py` 启动生产构建的真实 Next.js HTTP 服务，用原生 Playwright 操作页面。测试不拦截业务 API、不注入预制成功响应。记录由测试操作员明确人工输入，写入隔离的磁盘 SQLite 文件。

`workspace-tool-probe.ts` 调用仓库实际注册的业务工具及原有身份验证适配器，而不是另写的替代服务。检查包含 UI 写入 → Agent 读取、Agent 情景/记录写入 → UI 刷新、磁盘内容核对、服务进程真正重启、另一个已认证浏览器读取、并发冲突、断网、缺失存储和跨站请求。预期的 401/403/409/503 与故障注入分开记录；没有把它们当作未预期页面错误忽略。

18 张实际页面截图覆盖九个页面在 1440px 与 390px 的布局。`visible-copy.json` 保留实际可见文案。无未捕获 JavaScript 错误、无未预期控制台错误。

## 可复现

要求：Node 24、pnpm 10.12.4、Python Playwright 与 Chromium。依赖以 `pnpm-lock.yaml` 为准；没有声称旧 npm 锁文件支持 `npm ci`。

```bash
pnpm install --frozen-lockfile
PYTHON=/path/to/playwright-python bash scripts/verify-shared.sh
```

测试随机生成临时密码与数据库路径，显式隔离可能存在的本机生产数据库环境。不会读取、清空或迁移线上经营记录。

## 不得外推的结论

本次通过的是**自托管、明确持久卷的 SQLite 运行配置**。Node SQLite 仍有实验性提示；不可据此声称所有生产托管方式均已验证。SQLite 在 Vercel 被主动拒绝。Neon/Postgres 适配器已通过编译，但没有进行真实云数据库验收。

工具测试直接调用已认证的实际工具执行器，**不是一次真实模型供应商对话**，也没有声称审批流 UI、OAuth 多租户部署或模型工具选择已经完成运行验收。修改原始记录的工具定义保留 approval gate；测试操作员对隔离数据的直接调用不等于审批流验收。

现有 starter 密码代表一个受信任工作区，不是生产多租户身份方案。旧数据库表未删除，也未自动分配给任何用户；上线切换前必须明确旧记录所有权并验收迁移。不会自动发布内容、调整真实预算或发送邮件。

本候选未合并到 main，未主动部署生产。配对意图和 developer-audit 的完整结论由设计仓库审计报告给出；生产放行与人工最终决策不能由本报告代替。
