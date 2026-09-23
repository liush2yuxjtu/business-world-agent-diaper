# 键盘操作与用户错误提示复核

日期：2026-09-21。基线 main：52782a971ce6fe9fc13c0c3f6b5daa847d818ccb。

## 线上复现

目标：https://business-world-agent-diaper.vercel.app/ ，生产 deployment dpl_Gr4LZzGt2r6GkvwamHeHHEc4CLcp。

- 来源弹窗按 Esc 未关闭；打开后焦点仍在外部入口。
- Cmd+K 未聚焦搜索。
- 实验变化百分比设为 201 后运行，结果区直接渲染包含 origin、code、maximum、path/changePercent 的原始校验 JSON。
- 各页来源横幅和来源编辑器显示应用预置的 PR9/PR #9 实施信息。

## 修复与本地真实浏览器结果

| 检查 | 结果 |
| --- | --- |
| Cmd/Ctrl+K 聚焦搜索 | PASS |
| 弹窗打开时聚焦关闭按钮 | PASS |
| Shift+Tab 到末项、Tab 回到首项 | PASS |
| Esc 关闭并恢复入口焦点 | PASS |
| 实验 201% 显示中文范围提示，无原始 JSON | PASS |
| 应用预置来源名称与说明转为产品语言，保留合成标识 | PASS |
| 7 项错误边界和来源展示测试 | PASS |
| 真实 HTTP：无效实验、无效快照、畸形 JSON 返回 400，畸形 Origin 返回 403 | PASS |
| 类型检查、Next.js 生产构建、diff check | PASS |

仅拒绝性 HTTP 请求被提交；没有保存或改写经营快照。UI 展示映射只适用于应用预置的数据版本及精确原始文案，用户自写名称和备注不被清理。服务端拒绝没有基线的实验，异常响应不包含原始存储异常；客户端仅接受列举的错误码，不直接呈现响应中的任意错误字符串。

## 复现及范围

Node 24：`node --test tests/business-world-*.test.mjs`；`pnpm typecheck`。

本地浏览器使用 localhost:3027 的 Next.js 前端。普通 eve 开发启动仍有原生绑定及本机 sandbox 迁移兼容问题，因此使用 `VERCEL=1` 启动前端做这些交互检查，不宣称 Agent 运行通过。

完整的 HTML/MD、九页深层交互、报告/草稿、共享 UI/Agent 与线上发布验收尚未完成。本报告不是完整 intent-audit 或 developer-audit 的通过结论。PR #14 的完整配对工作区与 PR #26 的 World Model/场景历史已有实现，需按最新免登录合成演示范围协调，不能把旧独立工作区测试当作当前主分支证明。PR #9 原始 HTML/MD 保留不变。
