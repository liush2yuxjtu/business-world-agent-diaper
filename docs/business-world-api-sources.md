# Business World Agent — 官方 API 与 Mock 数据层

最后核验：2026-09-17

本文件是 Business World Agent 的数据源与工具契约说明。目标是让 Agent 能先在可控的模拟世界里完成经营推演，随后再把同一组上层工具切换到抖音、巨量千川与抖店真实 API，而不改业务推理层。

## 1. 当前实现

当前代码已经实现 6 个 eve authored tools，全部读取确定性的 SQLite Mock DB：

| Tool | 业务域 | 当前数据源 | 未来真实数据源 |
| --- | --- | --- | --- |
| `business_world_snapshot` | 跨域经营总览 | SQLite Mock | 抖音 + 巨量千川 + 抖店聚合 |
| `business_content_insights` | 短视频、互动、评论 | SQLite Mock | 抖音开放平台 |
| `business_live_insights` | 直播曝光、看播、互动、转化 | SQLite Mock | 抖音开放平台直播数据 |
| `business_ad_insights` | 千川预算、消耗、CTR、CVR、CPA、ROI | SQLite Mock | 巨量引擎商业开放平台 / 巨量千川 |
| `business_commerce_insights` | 商品、库存、订单、售后 | SQLite Mock | 抖店开放平台 |
| `business_scenario_experiment` | A/B 方向推演 | SQLite Mock + 固定弹性 | 真实历史数据校准后的实验模型 |

所有当前工具结果都带：

- `sourceMode: "simulated"`
- `provider: "mock-sqlite"`
- `warning` 明确声明不是平台真实数据

Agent 不得把这些数据描述为真实市场结果。

## 2. Mock Service 与 Mock DB

### 存储

本地开发默认：

`<repo>/.eve/business-world-agent.sqlite`

`.eve` 已在项目 `.gitignore` 中，因此不会把模拟数据库提交到 Git。

Vercel 环境默认：

`/tmp/business-world-agent.sqlite`

Vercel 的 `/tmp` 是实例级临时存储。冷启动或新实例会从固定种子重新构建 Mock World。这是 Demo 设计，不是生产持久化方案。

如需自定义路径，可设置：

`BUSINESS_WORLD_MOCK_DB_PATH=/absolute/path/to/business-world.sqlite`

### 数据表

Mock DB 当前覆盖：

- `persona`
- `content_asset`
- `content_metric`
- `audience_comment`
- `live_room`
- `live_metric`
- `campaign`
- `campaign_metric`
- `product`
- `business_order`
- `aftersale`

模拟世界包含四个核心 Persona：小雨、阿琳、王阿姨、Mia。种子数据是固定的，用于可重复的 Agent 行为与 Scenario Experiment。

## 3. 抖音开放平台

### 3.1 能力总览

官方来源：

https://developer.open-douyin.com/docs/resource/zh-CN/dop/overview/capabilities

已核验能力包括：

- 视频信息数据：`video.list.bind`、`video.data.bind`
- 视频互动数据：`data.external.item`
- 评论管理：`item.comment`
- 用户互动数据：`data.external.user`
- 直播数据相关能力需要单独申请相应 Scope

对应本项目：

- `business_content_insights`
- `business_live_insights`

### 3.2 OAuth2 与授权

官方来源：

https://partner.open-douyin.com/docs/resource/zh-CN/dop/develop/sdk/mobile-app/permission/overall-permission

关键事实：

- 抖音授权基于 OAuth2.0 授权码模式。
- `access_token` 用于需要用户授权的接口。
- `client_token` 用于无需用户授权的接口。
- 官方文档说明 `access_token` 有效期 15 天，`refresh_token` 有效期 30 天。
- 数据经营能力可能需要 PC 端完成授权。

真实接入时，token 必须留在 server-side，不得进入模型上下文。

### 3.3 查询特定视频实时数据

官方来源：

https://partner.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/video-management/douyin/search-video/video-data

已核验：

- HTTP URL：`https://open.douyin.com/api/douyin/v1/video/video_data/`
- Method：`POST`
- Scope：`video.data.bind`
- 需要用户授权
- 可返回点赞、播放、分享、评论等统计数据

建议真实 adapter 映射到：

`business_content_insights`

### 3.4 视频近 7 / 15 / 30 天互动数据

官方来源：

点赞：
https://partner.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/data-open-service/video-data/get-like-data

评论统计：
https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/data-open-service/video-data/get-comment-data

分享：
https://partner.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/data-open-service/video-data/get-share-data

视频数据方案总览：
https://developer.open-douyin.com/docs/resource/zh-CN/dop/ability/open-data/video-data-solution

已核验：

- Scope：`data.external.item`
- 需要申请数据权限并由用户授权
- `date_type` 支持近 7 / 15 / 30 天
- 只对近期视频提供对应离线数据
- 首次授权后数据不是立即完整产生

### 3.5 评论列表

官方来源：

https://partner.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/interaction-management/comment-management-user/comment-list

已核验：

- Path：`GET /item/comment/list/`
- Scope：`item.comment`
- 需要用户授权
- 单页数量 1 到 20
- 返回评论内容、评论者、时间、点赞数、回复数等

对应 Mock 表：

`audience_comment`

### 3.6 直播基础数据

官方来源：

https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/data-open-service/live-data/

已核验：

- HTTP URL：`https://open.douyin.com/room/data/base/get/`
- Method：`GET`
- Scope：`live.room.base`
- 指标包括开播、结束、直播时长、关注人数等
- 数据为 T+1，官方页面说明通常次日上午产出昨日完整数据

### 3.7 直播看播数据

官方来源：

https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/data-open-service/live-data/live-audience-data

已核验：

- HTTP URL：`https://open.douyin.com/room/data/audience/get/`
- Method：`GET`
- Scope：`live.room.audience`
- 指标包括观看次数、观看人数、观看总时长、最高同时在线等
- 数据为 T+1

### 3.8 直播互动数据

官方来源：

https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/data-open-service/live-data/live-interactive-data

已核验：

- HTTP URL：`https://open.douyin.com/room/data/interactive/get/`
- Method：`GET`
- Scope：`live.room.interactive`
- 指标包括评论人数、评论次数、分享次数、点赞次数
- 数据为 T+1

对应本项目：

`business_live_insights`

### 3.9 发布视频属于写操作

官方来源：

https://partner.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/video-management/douyin/create-video/video-create

已核验：

- HTTP URL：`https://open.douyin.com/api/douyin/v1/video/create_video/`
- Method：`POST`
- Scope：`video.create.bind`
- 需要申请权限和用户授权
- 创建后存在平台审核流程

当前没有把发布视频接入 Agent。未来如果加入，必须单独做 write tool，并默认要求 Human approval，不能复用读取工具。

## 4. 巨量引擎商业开放平台 / 巨量千川

### 4.1 官方能力地图

官方来源：

https://open.oceanengine.com/

开发文档入口：

https://open.oceanengine.com/labels

官方页面明确列出巨量千川能力：

- 账号管理
- 资金管理
- 竞价投放
- 数据报表
- 创意管理
- 工具接口
- 随心推订单管理

对应本项目：

`business_ad_insights`

### 4.2 获取投放账户数据

官方来源：

https://open.oceanengine.com/labels/12/docs/1697466393573376

此页面由巨量引擎官方文档站提供。Exa 可确认页面归属与标题，但当前抓取结果未暴露完整 endpoint 参数，因此代码不得自行猜测 endpoint。

### 4.3 获取投放计划数据

官方来源：

https://open.oceanengine.com/labels/12/docs/1697466415173644

此页面是官方“获取投放计划数据”文档。当前抓取环境不能可靠解析页面中的 endpoint，因此真实 adapter 接入前需要在登录后的官方 API 调试工具中再次核验 method、path 与版本。

### 4.4 获取千川账户下可投放抖音号

官方来源：

https://open.oceanengine.com/labels/12/docs/1697467726080011

用途：建立广告账户与可投放抖音号之间的映射。

### 4.5 千川 API 调试与数据报表能力

官方调试入口示例：

https://open.oceanengine.com/tools/visual_debug.html?docId=1696710526682112

Exa 抓取到该官方调试页中存在：

- 获取千川投放计划列表
- 获取千川数据报表可用维度和指标
- 获取千川数据报表数据
- 获取抖音号下的视频

真实接入时，优先从官方调试工具复制经验证的 endpoint 与请求参数，不从第三方 SDK 反推。

### 4.6 建议出价

官方调试页：

https://open.oceanengine.com/tools/visual_debug.html?docId=1761144594567183

已核验示例 endpoint：

`GET https://api.oceanengine.com/open_api/v1.0/qianchuan/suggest_bid/`

请求需要 `Access-Token`。

该能力适合未来增加只读工具：

`business_ad_bid_recommendation`

### 4.7 官方 MCP Server 状态

官方公告入口：

https://open.oceanengine.com/notice/index.html

官方首页与公告列表显示 2025-09-11 发布：

“巨量引擎千川 Marketing API MCP Server 新增支持部分千川业务工具能力”。

当前 Exa 检索到的官方公开页面没有给出可验证的 MCP runtime URL 或 eve 可直接使用的连接配置，因此本项目暂不硬编码 MCP endpoint。

接入原则：

1. 如果后续官方文档提供稳定 MCP URL，优先用 eve `defineMcpClientConnection`。
2. 如果仍只有 HTTP API，使用 authored tools 或经过固定 OpenAPI spec 的 `defineOpenAPIConnection`。
3. 不从社区仓库猜测官方 MCP endpoint。

## 5. 抖店开放平台

### 5.1 平台能力

官方首页：

https://op.jinritemai.com/

官方明确提供：

- 商品管理
- 库存管理
- 订单管理
- 物流履约
- 售后与逆向处理

对应本项目：

`business_commerce_insights`

### 5.2 API 调用与签名规范

官方来源：

https://op.jinritemai.com/docs/guide-docs/10/23

已核验：

- 正式 API Host：`https://openapi-fxg.jinritemai.com`
- 官方推荐 `POST`
- `param_json` 放在 JSON body
- 公共参数包括 `method`、`app_key`、`access_token`、`timestamp`、`v`、`sign`、`sign_method`
- 推荐 `hmac-sha256`
- JSON 各层 Key 需要有序
- 时间与平台服务器偏差过大时会失败

真实 adapter 必须把签名逻辑放在 server-side，绝不能让 `app_secret` 出现在模型输入或 tool result。

### 5.3 商品详情

官方来源：

https://op.jinritemai.com/docs/api-docs/14/56

已核验：

- method：`product.detail`
- 支持商品 ID 或外部商品编码
- 返回商品状态、审核状态、主图、发货时效等信息

### 5.4 标准库存 API

官方入口：

https://op.jinritemai.com/docs/api-docs/34

官方列出：

- `/sku/syncStock`
- `/sku/stockNum`
- `/sku/syncStockBatch`

库存查询详情：

https://op.jinritemai.com/docs/api-docs/34/936

已核验 method：

`sku.stockNum`

可按 SKU 查询普通库存、区域库存等信息。

### 5.5 订单列表

官方来源：

https://op.jinritemai.com/docs/api-docs/15/1342?docLabel=&from=list

已核验：

- 支持按下单时间或更新时间检索订单
- 最大查询近 90 天
- 支持订单状态、售后状态等过滤
- 真实接入时需要店铺授权与 access token

### 5.6 售后

官方售后 API 入口：

https://op.jinritemai.com/docs/api-docs/17

售后详情：

https://op.jinritemai.com/docs/api-docs/17/1095

已核验 method：

`afterSale.Detail`

售后操作：

https://op.jinritemai.com/docs/api-docs/17/560

已核验 method：

`afterSale.operate`

`afterSale.operate` 会改变真实售后状态，未来如果接入必须作为 write tool，并要求 Human approval。

### 5.7 官方测试店铺，不是 Sandbox

官方来源：

https://op.jinritemai.com/docs/guide-docs/10/209

关键事实：

- 官方明确写明“仅支持线上环境，无沙箱环境”。
- 开发者可申请测试店铺。
- 测试店铺有调用次数、商品价格、下单白名单、有效期等限制。
- 测试店铺不能替代本地、CI 或 Agent 场景下的完整 Mock Service。

因此本项目保留自己的 SQLite Mock World 是必要的。

## 6. 为什么当前先做 Mock Adapter，而不是直接接真实 API

### 原因一：三个平台的认证方式不同

- 抖音：用户 OAuth2 + Scope
- 巨量千川：Marketing API 授权 + Access-Token
- 抖店：店铺授权 + access token + 请求签名

先固定业务 Tool contract，可以避免认证细节泄漏到 Agent 推理层。

### 原因二：很多官方数据不是实时

尤其抖音直播与部分视频数据存在 T+1。Mock 数据可以稳定复现产品 Flow，不需要等待平台出数。

### 原因三：写操作风险高

发布视频、修改投放、修改库存、处理售后都属于外部副作用。读取能力与写能力必须分开。

## 7. 下一批真实工具建议

按优先级建议增加：

### P0，只读

1. `douyin_video_metrics_live`
2. `douyin_comment_list_live`
3. `douyin_live_metrics_live`
4. `qianchuan_account_live`
5. `qianchuan_campaign_report_live`
6. `doudian_product_live`
7. `doudian_inventory_live`
8. `doudian_orders_live`
9. `doudian_aftersales_live`

这些工具应该输出与当前 Mock Service 相同的标准业务字段，再由 `business_*` 聚合工具消费。

### P1，有外部副作用，必须审批

1. `douyin_publish_video`
2. `qianchuan_update_budget`
3. `qianchuan_update_bid`
4. `doudian_sync_stock`
5. `doudian_aftersale_operate`

在 eve 中，这些工具必须使用 Human-in-the-Loop approval。并且应使用平台原生幂等键；平台无幂等支持时，应在应用侧记录稳定 operation id。

## 8. Adapter 边界

建议长期保持下面的依赖方向：

`Agent business_* tools`

→ `Business domain service`

→ `Mock adapter | Douyin adapter | Qianchuan adapter | Doudian adapter`

→ `SQLite | Official HTTP API | Official MCP`

上层 Agent 不直接拼供应商 URL，不直接持有 access token，不直接解释供应商原始错误码。供应商认证、签名、重试和错误归一化全部留在 adapter 边界。
