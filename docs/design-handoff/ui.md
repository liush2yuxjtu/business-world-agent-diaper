# Business World Agent — Full UI / Interaction Handoff

> Canonical UI handoff for the full SaaS surface.  
> Updated from the latest ImageGen visual exploration on 2026-09-18.  
> HTML implementation: `ui.html`  
> Principle: **every major page must feel like a real product surface, not a placeholder card.**

---

## 0. Global product shell

```text
┌──────────────────────┬───────────────────────────────────────────────────────────────────────────────┐
│ Business World Agent │ ⌕ Search                                             ↻ Refresh  ▤ Sources  ZL │
│ REALITY FIRST        ├───────────────────────────────────────────────────────────────────────────────┤
│                      │ ✓ VERIFIED PERSISTED SOURCE · source · provider · last updated               │
│ ▦ 总览               ├───────────────────────────────────────────────────────────────────────────────┤
│ ♙ Persona Studio     │                                                                               │
│ ◇ World Builder      │                                 ACTIVE VIEW                                   │
│ ▤ 内容策略           │                                                                               │
│ ▣ 直播作战室         │                                                                               │
│ ◉ 投放优化           │                                                                               │
│ ▢ 商品分析           │                                                                               │
│ ⚗ 模拟实验           │                                                                               │
│ ▧ 报告               │                                                                               │
│                      │                                                                               │
│ ───────────────────  │                                                                               │
│ 构建更真实的商业世界 │                                                                               │
│ 从数据出发           │                                                                               │
│ ⚙ 设置   ? 帮助     │                                                                               │
└──────────────────────┴───────────────────────────────────────────────────────────────────────────────┘
```

### Global rules

- Sidebar/topbar persist across product views.
- Search navigates pages/entities/evidence/scenarios.
- Refresh updates shared Business World state, never mock fallbacks.
- Data Source opens the persistent state editor.
- Observed / Inferred / Simulated remain visually distinct everywhere.
- Page switches preserve the shared business state.
- Buttons that appear actionable must work in the prototype or show a clear prototype toast.

---

# 1. 总览 / Overview

## Layout

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ GMV            转化率            内容互动量           广告 ROI           复购率                    │
│ ¥2.48M         3.24%             1.20M                4.32               28.6%                    │
├──────────────────────┬─────────────────────────────────────────┬───────────────────────────────────┤
│ 经营总览              │ 近30天核心指标趋势                      │ 告警与机会                         │
│                      │                                         │                                   │
│ ↑ 今日最强信号        │ GMV ━━━━━━━━━━━                         │ 🔴 ROI 连续下降                    │
│ 直播 GMV +35%         │ ROI ───────────                         │ 🔴 转化率低于预期                  │
│                      │ CVR ───────────                         │ 🔴 库存预警                        │
│ ! 最大风险            │                                         │                                   │
│ CPC +21%             │                                         │ 🟢 短视频互动 +42%                 │
│                      │                                         │ 🟢 直播预约 +65%                   │
│ ✦ 建议行动            │                                         │                                   │
├──────────────────────┴─────────────────────────────────────────┴───────────────────────────────────┤
│ 渠道贡献：内容 25% | 直播 35.9% | 电商 29% | 投放 10%                                           │
├──────────────────────────────────────────────────────────────┬─────────────────────────────────────┤
│ 经营事件时间线                                               │ 数据新鲜度 + Agent 建议             │
│ 14:32 commerce GMV updated           success  +12.5%         │ commerce 09:31 normal               │
│ 13:41 live     618 session           success  +35%           │ content  09:28 normal               │
│ 11:22 ads      CPC 1.45              warning  ROI -18%       │ live     09:29 normal               │
│                                                              │ [一键生成执行方案]                  │
└──────────────────────────────────────────────────────────────┴─────────────────────────────────────┘
```

## Interactions

```text
KPI click
  → opens related domain page or metric inspector

Channel contribution click
  → navigate to Content / Live / Product / Growth

Alert click
  → open source evidence + related entity

Opportunity click
  → open corresponding work surface with context

“一键生成执行方案”
  → prototype action toast
  → production: generate plan draft, never auto-execute external writes
```

---

# 2. Persona Studio

## Layout

```text
Persona Studio                         [Observed] [Inferred] [Template]
策略模板 ≠ 观测事实

┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 👩 新手妈妈     │ │ 👨 囤货型家庭  │ │ 👩 敏感肌关注 │ │ 🧑 高复购老客 │
│ 1,204,331      │ │ 842,120        │ │ 682,415       │ │ 1,026,778      │
│ 24.8%          │ │ 17.3%          │ │ 14.1%         │ │ 21.2%          │
│ Observed       │ │ Observed       │ │ Inferred      │ │ Observed       │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

┌─────────────────────────┬───────────────────────────┬────────────────────────────┐
│ 人群分布                 │ 关键行为信号               │ 人群详情                    │
│       ◯                 │ 夜间下单      38.6  92%   │ 新手妈妈                    │
│  4,855,644 total        │ 复购≤30天     62.4  88%   │ definition                 │
│                         │ 直播停留       71.2  85%   │ sources                    │
│                         │ 内容收藏       68.7  90%   │ confidence 92%             │
│                         │ 搜索成分       54.1  86%   │ top categories             │
│                         │                           │ suggested actions          │
├─────────────────────────┴───────────────────────────┴────────────────────────────┤
│ 生命周期：认知 → 兴趣 → 考虑 → 购买 → 复购                                       │
│ 100%        68.2%      42.1%      18.6%      9.8%                               │
├──────────────────────────────────────────────┬───────────────────────────────────┤
│ 证据与来源                                   │ CRM / order / content / live     │
└──────────────────────────────────────────────┴───────────────────────────────────┘
```

## Interactions

- Selecting a persona applies selected border and updates inspector.
- Observed / Inferred / Template tabs filter persona state.
- Creating a task from a suggested action produces a prototype toast.
- Evidence row should deep-link to source detail.
- Template personas can never masquerade as measured audiences.
- Inferred personas always display confidence and signal provenance.

---

# 3. World Builder

World Builder remains the canonical world-model hero surface.

```text
KPI row

Commercial World Model                           Entity Inspector
┌──────────────────────────────────────────┐      ┌─────────────────────┐
│ content ─────► live                     │      │ GMV                 │
│   │              │                      │      │ ¥2,483,221          │
│   ├────► conversion ─────► GMV ───► rev │      │ Simulated           │
│   │              │          │           │      │ confidence 92%      │
│ persona ─────────┘          └────► repeat│      │ source              │
│ ads ───────────────────────► GMV         │      │ definition          │
└──────────────────────────────────────────┘      │ [factor] [scenario] │
                                                  └─────────────────────┘

Evidence table                              Scenario history
```

## Interactions

- Click node → select + inspector.
- Scenario segmented control switches baseline/growth/downside.
- Run simulation → pending → modeled result → scenario history.
- “在新场景中模拟” → Scenario Experiment with selected entity.
- Observed nodes never change when scenario changes.
- Simulated nodes require scenario/baseline metadata.

---

# 4. 内容策略

## Layout

```text
KPI: 内容互动量 | 完播率 | 收藏率 | 私信转化 | 内容 ROI

┌─────────────────────────────────────────────────────────────┬─────────────────────────────┐
│ 内容策略工作台                                               │ 内容机会队列                 │
│ [主题机会] [表现复盘] [发布计划]                             │ 1 夏季透气      高优 +38%    │
│                                                             │ 2 夜间防漏      高优 +42%    │
│   Market opportunity                                       │ 3 618囤货       中优 +28%    │
│ high    ●夜间防漏              ●夏季透气                   │ 4 敏感肌        中优 +31%    │
│ mid               ●性价比                                  │ 5 成长阶段      低优 +20%    │
│ low       ●囤货攻略                       ●敏感肌           │                             │
│          low competition ───────── high competition        │                             │
├─────────────────────────────────────────────────────────────┤                             │
│ 高表现内容 Top 10                                           │                             │
│ title / channel / exposure / engagement / save / SKU       │                             │
├─────────────────────────────────────────────────────────────┴─────────────────────────────┤
│ 本周内容日历：Mon Tue Wed Thu Fri Sat Sun                                                 │
├─────────────────────────────────────────────────────────────┬─────────────────────────────┤
│ 评论洞察                                                    │ Agent 建议                   │
│ 防漏 28.4% / 闷热 22.1% / 红屁屁 18.6%                    │ [生成 brief] [加入计划]      │
└─────────────────────────────────────────────────────────────┴─────────────────────────────┘
```

## Interactions

- Topic bubble click → topic detail / related audience.
- New Topic → draft composer.
- Queue item → briefing detail.
- Calendar item → publishing detail.
- Generate Brief → prototype toast; production creates editable brief, not auto-publish.
- Add to Plan → updates publishing plan only after user confirmation.

---

# 5. 直播作战室

## Layout

```text
KPI: 直播 GMV | 进房率 | 停留时长 | 加购率 | 成交转化

直播漏斗
曝光 ─12.8%→ 进房 ─62.3%→ 停留 ─28.6%→ 点击商品 ─41.7%→ 加购 ─34.5%→ 支付

┌───────────────────────────────────────────────────┬───────────────────────────┐
│ 场次表现                                          │ 直播指挥卡                │
│ bars + conversion line                            │ ● 直播中                   │
│                                                   │ host / online / next action│
│                                                   │ ! 进房率 -28%              │
│                                                   │ 1 福袋投放 [去执行]        │
│                                                   │ 2 强化讲解 [去执行]        │
├───────────────────────────────────────────────────┼───────────────────────────┤
│ 观众画像                                          │                           │
│ 18-24 / 25-34 / 35-44 / 45+                      │                           │
├───────────────────────────────────────────────────┴───────────────────────────┤
│ 场次明细 table                                                                │
├───────────────────────────────────────────────────┬───────────────────────────┤
│ Top 直播商品                                      │ 实时问题                   │
│ product / price / click / add-to-cart             │ size / shipping / price    │
└───────────────────────────────────────────────────┴───────────────────────────┘
```

## Interactions

- Funnel stage click → evidence and leakage analysis.
- Session row → session detail.
- Audience segment → Persona Studio.
- “去执行” never directly changes an external platform in the prototype.
- Production “去执行” must open an approval surface for external writes.
- Realtime questions can become response/task suggestions.

---

# 6. 投放优化

## Layout

```text
KPI: 广告花费 | ROI | CPA | CTR | 新客成本

┌──────────────────────────────────────────────────────────────┬─────────────────────────────┐
│ 投放优化中心                                                 │ 优化建议                    │
│ [预算分配] [效果趋势] [渠道对比]                             │ 🔴 提升千川优质计划预算     │
│                                                              │ 🔴 暂停低效计划             │
│      ◯ ¥428,320 today                                        │ 🟠 扩量相似人群             │
│ 千川 40.2% / 信息流 32.5% / 搜索 18.3% / 再营销 9%         │ 🟠 更新素材                 │
│                                                              │ 🔵 优化投放时段             │
│ Spend vs ROI trend                                           │                             │
├──────────────────────────────────────────────────────────────┤                             │
│ Campaign table                                               │                             │
│ campaign / channel / budget / spend / ROI / CPA / CTR       │                             │
├──────────────────────────────────────────────────────────────┴─────────────────────────────┤
│ 实验与假设                                        | 风险监控                                  │
│ A/B creative +42%                               | overspend / fatigue / attribution lag   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Interactions

- Budget slice click filters campaign table.
- Campaign row opens detailed campaign inspector.
- Optimization suggestion → review screen, not direct write.
- New Experiment → experiment draft.
- Risk item → impacted campaigns.

---

# 7. 商品分析

## Layout

```text
KPI: GMV | 单品转化率 | 新客占比 | 售罄率 | 退款率

┌─────────────────────────────────────────────────────┬───────────────────────────┐
│ 商品组合表现                                        │ 商品详情                  │
│ GMV / volume bars + conversion line                 │ 🧷 BWA Baby L码           │
│ 拉拉裤 | 纸尿裤 | 湿巾 | 夜用                      │ ¥89                      │
│                                                     │ core audience 68.2%       │
├─────────────────────────────────────────────────────┤ core channel 52.6%        │
│ SKU 销售排行                                        │ size mix                   │
│ SKU / sales / CVR / AOV / turn / refund / margin   │ M 12 L46 XL28 XXL14       │
│                                                     │ ! L码 3天内售罄           │
├─────────────────┬─────────────────┬─────────────────┼───────────────────────────┤
│ 库存与风险      │ 关联购买        │ 退货与反馈      │ Agent 建议                │
│ low stock       │ bundles         │ size 38.2%      │ 补货 / 定价 / 套装        │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────────┘
```

## Interactions

- Category chart click → filter SKU table.
- SKU row click → update product inspector.
- Stock warning → replenishment detail.
- Bundle row → bundle proposal.
- Agent action is a proposal until user approval.

---

# 8. 模拟实验

## Layout

```text
模拟实验
基于 persisted baseline 的透明情景模型

1 情景设置
┌─────────────────────────────────────────────────────────────────────────────┐
│ 描述: 618期间加大广告投放                                                   │
│ Lever: 广告投入    Change: +30%                                             │
│ assumptions: [需求稳定] [库存充足] [价格不变] [内容不变]        [▶运行实验] │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────┬────────────────────────────┬────────────────────────────┐
│ 2 关键指标对比             │ 3 敏感性分析              │ 实验说明                   │
│ Baseline GMV 2.48M         │ 广告投入      +25.1%      │ assumptions                │
│ Modeled GMV  3.10M         │ 转化率        +18.3%      │ confidence 78%             │
│ Baseline ROI 4.32          │ 客单价        +12.6%      │ MAPE 12.3%                 │
│ Modeled ROI  5.21          │ CPC           -10.4%      │ SIMULATED ≠ OBSERVED       │
└────────────────────────────┴────────────────────────────┴────────────────────────────┘

4 Saved scenarios
scenario / lever / change / expected / owner / status

5 Impact path
广告投入 +30% → 曝光 +28% → 访问 +22% → 转化 +15% → GMV +25.1%
```

## Interactions

```text
Run Experiment
  → validate fields
  → load persisted baseline
  → pending state
  → calculate modeled output
  → update comparison cards
  → persist scenario run
  → add scenario history
  → toast success
```

Error rules:
- No baseline → block simulation.
- Invalid change → inline validation.
- Model result remains explicitly Simulated.
- Scenario never overwrites observed facts.

---

# 9. 报告中心

## Layout

```text
报告中心            [09/11~09/18] [管理层] [新建报告]

┌──────────────────────────────────────┬─────────────────────┬──────────────────────┐
│ 最新周报                            │ 报告大纲            │ 导出与分发           │
│ GMV +12.5%                         │ 1 经营概览          │ [PDF] [PPT]          │
│ 主要由直播 + 优质内容带动           │ 2 内容复盘          │ [link] [email]       │
│                                     │ 3 直播复盘          │ recipients           │
│ GMV / Orders / ROI                 │ 4 投放分析          │ note                 │
│                                     │ 5 商品建议          │ [发送报告]           │
│                                     │ 6 风险与机会        │                      │
├──────────────────────────────────────┴─────────────────────┴──────────────────────┤
│ 历史报告 table                                      │ report preview                  │
├────────────────────────────┬─────────────────────────┬────────────────────────────────┤
│ 本周关键结论               │ 支持证据                │ Agent 自动生成摘要             │
│ 1 直播 +12.5%              │ GMV / orders trend      │ editable notes                 │
│ 2 内容 +28%                │                         │ [保存备注]                    │
└────────────────────────────┴─────────────────────────┴────────────────────────────────┘
```

## Interactions

- New Report → report composer.
- PDF export uses current selected report.
- PPT export uses same report source.
- Share Link creates view-only link.
- Send Email requires explicit recipients.
- Save Note persists human-authored note separately from generated summary.
- Report sections link back to source evidence and product pages.

---

# 10. Global source modal

```text
┌───────────────────────────────────────────────────────┐
│ 数据来源                                           × │
│                                                       │
│ 来源名称                      Provider                │
│ [Production DB]               [BWA Data Hub ▾]        │
│                                                       │
│ GMV        CVR        ROI        Repeat                │
│ 2483221    3.24       4.32       28.6                 │
│                                                       │
│ Notes                                                 │
│ [...................................................] │
│                                      [Cancel] [Save]  │
└───────────────────────────────────────────────────────┘
```

Save:
- validates schema
- updates shared prototype state
- refreshes KPI/World Builder inspector
- production version persists server-side

---

# 11. Global state hierarchy

```text
Observed
  = directly supported by source evidence

Inferred
  = derived conclusion
  = confidence required

Simulated
  = scenario output
  = assumptions + baseline required

Template
  = strategy/research template
  = never displayed as measured fact

Unavailable
  = no verified source
  = render absence, never fake data
```

---

# 12. Cross-page navigation map

```text
Overview
  ├─ channel card → Content / Live / Growth / Product
  ├─ alert → evidence detail
  └─ recommendation → proposed action

Persona Studio
  ├─ segment → detail
  ├─ signal → evidence
  └─ action → task proposal

World Builder
  ├─ entity → inspector
  ├─ related factor → graph highlight
  └─ simulate → Experiment

Content
  ├─ topic → topic detail
  ├─ audience → Persona
  └─ related SKU → Product

Live
  ├─ session → session detail
  ├─ audience → Persona
  └─ product → Product

Growth
  ├─ audience → Persona
  ├─ product campaign → Product
  └─ experiment → Experiment

Product
  ├─ audience → Persona
  ├─ content source → Content
  └─ recommendation → action proposal

Experiment
  ├─ World Builder
  └─ Report

Report
  └─ every key conclusion → source product surface / evidence
```

---

# 13. Runtime acceptance flows

## A. Overview to decision

```text
Open App
  ↓
Load persisted state
  ↓
Overview renders real metrics
  ↓
Human opens alert
  ↓
Evidence / source
  ↓
Navigate affected domain
  ↓
Review recommendation
  ↓
Human decides
```

## B. Persona evidence flow

```text
Persona Studio
  ↓ select "新手妈妈"
Behavior signal
  ↓
Evidence source
  ↓
Create task proposal
```

## C. Content to plan

```text
Content opportunity
  ↓
Generate brief
  ↓
Human edits
  ↓
Add to plan
```

## D. Live operations

```text
Live alert
  ↓
Inspect funnel leakage
  ↓
Review operational suggestion
  ↓
Explicit approval before external write
```

## E. Scenario to report

```text
Experiment
  ↓ run scenario
Modeled result
  ↓ save scenario
Report
  ↓ attach evidence + assumptions
Export / share
```

---

# 14. Accessibility

- Tab navigation works for all controls.
- Visible focus state.
- Status cannot rely on color alone.
- Tables use semantic headers.
- Buttons have explicit text.
- Modal closes with Esc.
- Search supports keyboard focus.
- Mobile keeps primary actions reachable.

---

# 15. Responsive behavior

Desktop is the primary operational experience.

Tablet:
- sidebar collapses to icon rail
- 3/4-column cards collapse to 1/2 columns
- inspectors move below main content

Mobile:
- KPI grids become 2 columns
- charts become stacked
- tables scroll horizontally
- World Builder graph remains pan/zoom capable
- no important action disappears

---

# 16. Component inventory

```text
AppShell
├─ Sidebar
├─ Topbar
│  ├─ Search
│  ├─ Refresh
│  ├─ Sources
│  └─ User
├─ ProvenanceBanner
├─ MetricRow
├─ OverviewSurface
├─ PersonaStudio
├─ WorldBuilder
├─ ContentStrategy
├─ LiveOps
├─ GrowthOptimization
├─ ProductAnalysis
├─ ScenarioExperiment
├─ Reports
├─ EvidenceTable
├─ Inspector
├─ SourceModal
├─ Toast
├─ EmptyState
├─ LoadingState
└─ ErrorState
```

---

# 17. Product truth requirements

1. UI and Agent use the same Business World state boundary.
2. No verified source → no fake KPI values.
3. Observed / Inferred / Simulated / Template are explicit.
4. Scenario output cannot overwrite observed baseline.
5. Every critical number has provenance/freshness.
6. External writes require explicit human approval.
7. Every page must have real depth: primary task + evidence + detail + next action.
8. World Builder is not the only deep surface; all 8 operational pages must stand on their own.
9. Build success is not runtime verification.
10. Browser-level behavior must match this handoff.

---

# 18. Current implementation mapping

```text
ui.html
├─ Landing
└─ App
   ├─ Overview        ← deep implementation
   ├─ Persona Studio  ← deep implementation
   ├─ World Builder   ← deep implementation
   ├─ Content         ← deep implementation
   ├─ Live            ← deep implementation
   ├─ Growth          ← deep implementation
   ├─ Product         ← deep implementation
   ├─ Experiment      ← deep implementation
   └─ Report          ← deep implementation

ui.md
└─ Canonical interaction / state / ASCII handoff
```

---

# 19. Interaction Audit — No Dead Controls

This UI handoff now includes a strict interaction rule:

```text
ANY CONTROL THAT LOOKS CLICKABLE
        │
        ├── has a real route / state change
        ├── opens a detail / inspector / approval surface
        ├── performs a prototype-safe action
        └── or is visibly disabled

NEVER:
  styled like a button but does nothing
  row hover with no click behavior
  fake tab with no state change
  external write without explicit human confirmation
```

## Fixed click contracts

- Landing 登录 → enters app overview.
- 预约演示 → opens demo-request interaction surface.
- Sidebar items → route to each product page and update URL hash.
- Cmd/Ctrl+K → focuses global search.
- Persona cards → select + open Persona detail interaction.
- Non-World-Builder segmented controls → toggle active state.
- Overview channel cards → navigate to Content / Live / Product / Growth.
- World Builder nodes → entity inspector.
- Scenario selector → changes modeled state.
- 发送到报告 → Reports.
- 在 World Builder 中查看 → World Builder.
- 内容机会 / 漏斗阶段 / metrics / recommendation rows / table rows → detail surface.
- 创建任务 / 生成 brief / 新建实验 / 新建报告 → prototype action surface.
- 直播“去执行” → HUMAN APPROVAL modal; never silent external write.
- 导出 / 分享 / 邮件 / 保存备注 → explicit feedback/action.
- 查看更多 / 查看全部 → detail surface instead of dead anchor.
- Esc closes modal; Enter/Space activates keyboard-focused interactive surfaces.

## Accessibility interaction contract

```text
pointer click
keyboard Enter / Space
Cmd/Ctrl+K search
Esc close overlays
focus-visible outline
role=button + tabindex for non-native interactive cards/rows
```

## Route contract

The prototype uses URL hash routing for stable deep links:

```text
#overview
#persona
#world
#content
#live
#growth
#product
#experiment
#report
```

A route change updates:

```text
active sidebar
visible view
fake product URL
browser hash
interactive wiring
```

## Human-approval boundary

Any operation that would mutate an external business platform must flow through:

```text
recommendation
   ↓
review evidence
   ↓
show exact proposed change
   ↓
HUMAN APPROVAL
   ↓
execute / cancel
```

The HTML prototype stops at the confirmation surface.


---

# 10. Canonical design-reference truth boundary

This handoff is the **design + interaction intent**, not runtime evidence.

- All numbers, timestamps, people, report rows, campaign rows, source names, and business outcomes rendered in `ui.html` are **design reference / sample data** unless a separate runtime evidence artifact proves them.
- The handoff may demonstrate how `Observed / Inferred / Simulated` should look, but those labels do not turn static sample values into verified observations.
- The handoff must never claim that an in-memory interaction persisted production data. Preview-only writes must say they are not persisted.
- Production truth is verified separately through the real product runtime, real source boundary, browser evidence, and persistence evidence. Current evidence lives in:
  - `docs/business-world-flows/index.html`
  - `docs/runtime-reality-evidence.md`
- High-risk or external writes require an explicit human approval surface. A design preview may demonstrate that approval flow but must not imply the external action executed.
- User-visible design copy must not expose implementation instructions such as “production should…”, developer debugging notes, internal audit labels, or agent-building commentary.
- Interactive controls must remain keyboard reachable, have visible focus, and dialogs/status feedback must expose usable accessibility semantics.

## Acceptance rule

A design-reference build passes only when a reviewer can answer all three questions without ambiguity:

1. **What is intended product behavior?**
2. **What on this page is only sample/design data?**
3. **Where is the separate evidence that proves the runtime actually does it?**
