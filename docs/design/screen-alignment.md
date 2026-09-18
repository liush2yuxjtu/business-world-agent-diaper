# 九屏概念图对齐记录

## 结果与边界

已完成第一轮参考图对齐，不是像素级一致，也不是生产部署验收。

- 旧蓝白外观改为深森林色侧栏、暖白画布、珊瑚色主操作、薄荷/淡紫辅助区。
- 总览三栏、Persona 选择/详情、World 节点分区、内容三栏分镜、直播工作区、投放与商品表格、实验三栏、报告摘要/来源页签。
- 保留来源读取、搜索、只读数据编辑器和原 scenario 请求；增加报告文本导出和结果比较图。
- 不照搬参考图中的虚构数字、客户引语、预测区间或实时聊天。已有值来自业务快照，缺失值保留未知。

## 页面与配对

所有页面属于 `/`，通过 `screen` 查询参数选择。未将 auth 错误页算作设计参考覆盖对象。

| 参考图 | 页面参数 | 对比文件 |
|---|---|---|
| 01-overview.png | overview | AB-01-overview.png |
| 02-persona-studio.png | persona | AB-02-persona.png |
| 03-world-builder.png | world | AB-03-world.png |
| 04-content-strategy.png | content | AB-04-content.png |
| 05-live-war-room.png | live | AB-05-live.png |
| 06-ad-optimization.png | growth | AB-06-growth.png |
| 07-commerce-analytics.png | product | AB-07-product.png |
| 08-simulation-experiment.png | experiment | AB-08-experiment.png |
| 09-reports.png | report | AB-09-report.png |

参考位于 `docs/design/screen-concepts/2026-09-18/`。

截图位于 `artifacts/screen-alignment/`：
- `before/`：改动前 18 张桌面/手机截图。
- `after/`：首轮实现截图；发现并修复 growth/product 手机页的 grid min-width 溢出。
- `final/`：最终 18 张截图与 manifest。
- `comparisons/`：9 张 A=实现 / B=参考的成对 PNG，manifest 含尺寸及 SHA-256。
- `mobile-contact.png`：9 屏移动端首屏联系表。

9 张最终 A/B 与移动联系表均经 Pi read 视觉检查。剩余差异见下节，没有以测试通过替代设计一致性结论。

## 验证

在 SSH `macmini` 的 `~/projects/bw-screen-alignment` 隔离副本运行，无生产写入。

- 桌面：1586×992，DPR 1。
- 手机：390×844，DPR 1；没有对应手机参考图，只验证响应式。
- Chrome headless，zh-CN，UTC，light，reduced motion；networkidle 后截图。
- 数据源：拦截 state API，使用仓库 `supabase-mock-seed.sql` 中确定性模拟数据。未读取客户数据。
- 18/18 页面：无页面级横向溢出、无 `pageerror`。
- 两种宽度均通过：Persona 切换、搜索导航、只读来源面板、关闭面板、报告页签、下载、实验 pending 禁用/结果展示、缺数据禁用、错误重试恢复。
- scenario 请求仅由测试 fixture 响应，不证明真实数据库保存或模型调用。
- `tsgo --noEmit -p tsconfig.json` 通过。
- 隔离 Next 构建通过；`git diff --check` 通过；设计 detector 输出 `[]`。

复跑入口：`scripts/snapshot-screen-concepts.mjs`。环境变量：`VISUAL_BASE_URL`、`PLAYWRIGHT_PACKAGE`（已安装包中的 package.json 路径）、`CHROME_PATH`、`VERIFY_INTERACTIONS=1`。只在 Mac mini 运行。

### 运行配置限制

原 `withEve` dev 在隔离副本启动时出现 `eve server process exited before printing its server URL (code 1, signal null)`。仅在隔离副本将 `export default withEve(nextConfig)` 改为 `export default nextConfig`、Turbopack root 指向 projects 父目录以允许共享依赖、关闭 dev indicator。仓库 `next.config.ts` 未改变。

复用远端既有依赖实际为 Next 16.3.4，而仓库 package.json 指定 16.2.6；本轮编译/截图不是锁文件一致性验收。需要在原配置与锁文件环境复验，才可声称完整应用通过。临时服务器已停止，未部署。

## 尚未关闭的差异

1. 第二轮已关闭生活方式素材缺口：用户授权 imagegen，生成并接入六张母婴、人群、夜间护理和主播情景图。保留 AI 标注，未将参考整图当作 UI。
2. 参考图分别采用不同的侧栏宽度、顶部控件和留白；实现统一了导航/搜索/来源栏，所以纵向密度及若干细节仍不同。
3. 参考中的 sparkline、直播分钟趋势、cohort 热图、预测带没有对应数据；改为现有数据可支撑的场次、预算、分群柱图和未知状态。
4. 实验初始态不显示未运行的结果；图形为已有单变量线性模型支持的 ROI 比较，不是时序预测。
5. 完整 eve 启动、原锁文件构建与真实 scenario 持久化未验收。

## 第二轮验证与产物

- 新增六张 WebP，覆盖人群、分镜、主播、投放缩略图、商品洞察、实验与报告；来源见 `design-system/assets/lifestyle-assets.md`。
- 收窄侧栏、补 eve 字标、修复导航换行、将桌面工具栏移至标题右侧、收紧指标卡与商品表格密度。
- `round2/` 为中间截图；`round2-final/` 为最终 18 张截图及交互结果；`round2-final-comparisons/` 为九张最终 A/B。
- 九张最终 A/B 和手机联系表均经 Pi read 检查。视口沿用 1586×992 / 390×844。18/18 无 pageerror 或页面横向溢出，既有交互检查全部通过，远端 tsgo 与本地 diff 检查通过。
- 沿用上述隔离运行配置，不代表原 eve 环境或锁文件构建通过。本轮未修改 Supabase 数据，未部署。
- 仍未消除所有差异：World 节点连线、时序曲线、cohort 热图、预测图、内容密度及部分包装素材仍与参考不同。

## 第三轮：SVG 结构与布局收敛

- World 重建为中心生态圆、五类节点卡、青绿/淡紫/珊瑚连线、右侧活动详情、底部情景与证据区。广告节点可点击切换详情，提供 `aria-pressed`；选中状态不修改平台数据。
- 总览增加真实输入占比轨道与弧线连接；商品体验链增加方向箭头；分类图增加 SVG 网格，压缩高度时保持柱高数值比例。
- 收紧 Persona 图片、分镜卡、商品双栏及报告摘要；直播、投放建议区采用参考中的浅色面板。沿用六张既有 AI 情景资产，本轮未再生图或修改 Supabase。
- 中途截图发现 World 内容卡覆盖下一行、中心连线脱离圆，已调整节点尺寸、行高和 SVG 坐标范围，并加卡片包含性回归检查。
- `round3-final/`：18 张最终截图与 manifest。`round3-final-comparisons/`：9 张桌面对照。`round3-final-mobile.png`：9 屏手机首屏联系表。最终九张 A/B 与手机图均经 Pi read 检查。
- Mac mini 隔离运行，1586×992 / 390×844，18/18 无 pageerror、无页面级横向溢出；新增 World 选择/卡片包含性与既有人群、搜索、只读来源、报告导出、实验状态、错误恢复测试均通过。远端 `tsgo` 与本地 `git diff --check` 通过。
- 本轮没有重新执行生产构建。继续沿用 Next 16.3.4、禁用 withEve 的隔离预览限制；不等于原锁文件、完整 eve 或真实持久化已验收。
- **仍有差异**：参考的时序曲线、预测带、cohort、成对预算比较及模拟评论缺少对应数据模型；内容图仅三个已有脚本而参考为四分镜；统一来源栏、中文排版与卡片密度仍不同。没有声称全部像素差异消除。

已登记 Airtable `ChatGPT Work Hub / Next Actions`：`rec37FaKKeAGqMZ9I`，保留上述剩余工作。不因初步对齐完成而标为全部完成。
