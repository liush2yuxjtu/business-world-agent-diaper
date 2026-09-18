# Business World asset audit — 2026-09-18

# Business World Agent：状态与资产审计
核验日期：2026-09-18（北京时间）。本报告区分运行时证据、代码能力和视觉概念；不是经营业绩报告。

## 结论
主应用是 [business-world-agent-diaper](https://github.com/liush2yuxjtu/business-world-agent-diaper)，线上入口为 https://business-world-agent-diaper.vercel.app 。页面可访问、九个功能区可切换，搜索可用。但还不能判定为已接通真实经营数据、可执行完整业务闭环的 Agent 产品。

本次通过 ChatGPT 内置 imagegen 生成 4 张原始 PNG（各 1254×1254），接入总览和商品分析，并显式标为 AI 概念图、非在售 SKU。保留原图、完整提示词、SHA-256 与来源清单；没有用概念图冒充商品实拍、截图或真实数据。

## 当前状态
| 项目 | 本次证据 | 判断 |
|---|---|---|
| 主应用 UI | 生产与 PR7 预览均完成九区导航、搜索、浏览器页面错误检查 | PASS（界面层） |
| 最新主线 | PR6、PR7 在本次审计中由其他任务合并；主线 ef4a472 | 已合并，不是本次图片提交 |
| 数据读取 | 生产 state API 返回 Supabase persisted-observation / system-record 基线；10 个经营指标仍为 null | 持久化记录存在，但未证明真实平台业务接入 |
| 主数据库 | health 显示 DATABASE_URL 未配置、schemaReady=false；使用 Supabase 回退 | 主库未就绪 |
| Agent | 有 eve 配置、6 个业务工具；近7天 Vercel Agent runs 查询为0；Airtable 无匹配运行记录 | 未验证在线业务 Agent 运行，不等同于断言无法运行 |
| 聊天入口 | 仓库有聊天组件，但当前首页未挂载聊天 UI，构建路由未见聊天页面 | 代码存在不等于用户可用 |
| 模拟实验 | 源码先调用 ensureSchema，缺 DATABASE_URL 时抛错，之后才进入 Supabase 回退分支 | 代码级风险；本次未提交写入实验，未宣称端到端通过 |
| CI | GitHub Pages workflow 最新所见 run 35299103947 失败；此前 run 的 configure-pages 报 Pages Not Found | Pages 发布未通过；与 Vercel 页面可用是两个结论 |
| 新图片集成 | macmini 隔离目录 typecheck、Next production build 通过；真实浏览器图片加载、桌面/手机检查 | PASS（本次分支，不是生产部署） |

生产页面在本次过程中从不可用数据状态更新为 Supabase 基线。报告采用后一次 02:26 UTC 左右的浏览器证据，不把较早快照当成最终状态。

## 应用怎么工作
```
浏览器九个工作区
  └─ GET /api/business-world/state
       └─ lib/business-world/real-service.ts
            ├─ 已配置的 PostgreSQL（当前未配置）
            └─ Supabase 持久化回退（当前只有空指标基线）

eve Agent 配置 → 六个业务工具 → 同一个 real-service.ts
实验界面 → POST /api/business-world/scenario → 实验服务／持久化
```

九区是：总览、Persona Studio、World Builder、内容策略、直播作战室、投放优化、商品分析、模拟实验、报告。
六工具提供世界快照、内容、直播、投放、商品洞察和实验能力。Agent 配置模型为 anthropic/claude-haiku-4.5，配置名不构成成功推理或业务写入的证据。
旧 SQLite/mock 实现仍在仓库，但当前六个业务工具导入 real-service。README 的历史归档说明、部分 mock 描述与现状不一致，需要后续整理。旧 world-agent-interactive 是另一套视觉原型，不能直接把其浏览器测试结果当成当前主应用的业务验收。

## 资产总表（已发现且可核对范围）
| 资产组 | 数量／位置 | 用途和边界 |
|---|---|---|
| 主应用仓库 | 1 个 canonical repo | Next.js/React/eve，页面、API、六工具、测试和设计文档 |
| 主应用原有媒体 | 5 个文件 | 2 个 SVG，3 个 PNG；本次保留，哈希可核对 |
| 本次新增原图 | 4 个 PNG | 总览世界图、新生儿／日常／夜用尿裤概念图 |
| 新图来源清单 | 1 个 JSON | 每张图的提示词、尺寸、SHA-256、原始生成文件名、使用位置 |
| 旧版视觉仓库 | world-agent-interactive | 本次确认非 GitHub archived；定位为遗留原型，不是当前 canonical |
| 旧版媒体清单 | 56 个受 Git 跟踪的文件路径 | 含参考、UI截图、设计图和 SVG；存在副本，56不代表56张独特原图 |
| 旧版另一工作目录 | 38 个媒体路径 | 同一旧仓库的另一快照，不与56相加 |
| 外部参考截图 | 11 个唯一外链 | Firecrawl 签名截图 URL；仓库未保存图片字节，不保证长期可用 |
| macmini | 旧 checkout + 本次独立验证目录 | 旧工作副本不是最新版；本次构建未覆盖它 |
| Grok sandbox | 多个历史 audit/work 目录 | 包含上述旧仓库、基线截图和旧审计，不是新部署 |
| 本次浏览器证据 | production、preview、asset-review 三组 | JSON + 桌面截图；asset-review 另含390px手机截图 |
| Vercel | 1 个当前项目、生产别名、预览部署 | 项目ID prj_GlIR59nze9VTFAnHSI5Iu3qJI6mB |
| Airtable | Work Hub 项目／Next Actions／Agent Runs 等 | 老 World Agent 项目记录 Paused；未查到当前 canonical 的活跃 Agent run |

完整文件级清单见 canonical-inventory.json 和 legacy-world-agent-inventory.json。canonical 清单为加入本次审计文档前的文件快照，不应当作最终提交的总文件数。旧截图／概念资产不等同于可编辑 3D 模型；没有据此声称存在 Blender、GLB 或 FBX 原文件。

## MCP 覆盖和限制
直接查询了与任务相关的 Codex 任务、GitHub、Airtable、Vercel、macmini、Grok、Memory、Replit、Sites。GitHub/部署用对应 CLI 补充精确提交与日志。
- Codex 找到上次 Check App Assets Status，确认遗留缺口是 ImageGen 与 Git tracking；本次已补齐图片和版本追踪。
- GitHub、Airtable、Vercel、macmini、Grok 返回了项目相关信息。
- Memory 对 business-world 查询为空；Replit 项目名称搜索为空；Sites 返回的站点属于 win-agent-os，不属于本项目。空搜索不能证明整个账户没有相关资产。
- ARO 暴露了工具元数据，但调用返回 Unknown tool / INVALID_ARGUMENT，未验证成功。
- Playwright MCP 的 Chrome 扩展未连接；使用现有 Playwright 浏览器执行真实页面验证，没有把 HTTP 200 或静态源码检查冒充浏览器验收。
- 其他可用 MCP 的工具目录已盘点；无本项目关联的金融、专利、设计等连接器没有批量拉取私有数据，也没有把“工具可见”写成“服务健康”。
因此，本报告是项目相关可访问资产的跨连接器审计，不是对每个第三方服务、账户所有文件或所有 MCP 方法的穷尽式健康保证。

## 本次验证边界
在 macmini 独立目录复用已有安装依赖（实际 Next 16.3.4 / eve 0.54.5）执行 typecheck/build，而不是干净安装验收。九区、搜索、4张图片及桌面/移动布局完成浏览器验证。静态 reality audit 为13/20 PARTIAL，不能据此声称全业务验收通过。
没有触发模型对话、真实广告投放、真实商品发布、交易、实验写入或生产部署。没有修改密钥、提供商账号或原工作区未提交变更。

## 后续真正需要完成的事项
1. 接入有来源、时间、账户和口径的真实业务数据；null 不可改成演示数字冒充实测。
2. 补齐用户可用的 Agent 对话入口，证明一次实际工具调用与 UI 读到同一数据源。
3. 验证并修正缺主库时实验回退路径，证明实验保存与重新读取一致。
4. 修复或明确停用 GitHub Pages 工作流；整理与现状矛盾的 README/旧 mock 文档。
5. 本次图片分支在审阅后再决定是否推送、合并、部署；当前线上没有自动替换为新图。
