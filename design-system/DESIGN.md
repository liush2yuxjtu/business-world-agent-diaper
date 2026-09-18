# Business World 设计约定

视觉依据：`../docs/design/screen-concepts/2026-09-18/01-overview.png` 至 `09-reports.png`。

- 数值真源：`tokens.css`。组件设计真源：`components.html`。
- `app/globals.css` 消费 tokens；`app/_components/business-world-screens.tsx` 实现业务内容与交互。
- 深森林色侧栏、暖白画布、白色内容板、珊瑚色主动作、薄荷与淡紫辅助状态。
- 参考图的英文布局转为现有中文产品文案。保留数据读取、来源面板和情景 API，不用图中虚构数值替代数据。
- 当前只有既有概念包装素材。没有真人肖像、直播源、月度 cohort 或预测时序，不绘造这些数据。
- 表格在窄屏内部横向滚动，页面不得整体溢出。侧栏在移动端变为横向导航。
- 交互验收：人群选择、内容选择、导航搜索、只读来源、报告页签与导出、模拟的待运行/运行中/成功/错误状态。
- 截图验收条件与剩余差异见 `../docs/design/screen-alignment.md`。

`tokens.json` 已按 tokens.css 更新，仍只作派生导出。Penpot/Webflow mappings 属于历史派生物，不是本版真源；本次未重新发布外部设计平台。
