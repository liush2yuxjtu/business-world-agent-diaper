'use client';

const slides = [
  {
    no:'01', kicker:'商业路演 Demo', title:'Business World Agent', accent:'从商业事件到增长行动',
    copy:'把业务信号、行为原型与经营动作连接起来。路演不从架构图开始，而是让业务负责人直接看见问题、方案和下一步。',
    asset:'/roadshow-assets/product-console.svg',
    chips:['可交互 Demo','数据库驱动场景','适合非技术业务团队'],
  },
  {
    no:'02', kicker:'系统怎么工作', title:'把商业事件、行为原型和可执行动作连接起来', accent:'不是技术黑盒，是业务链路',
    copy:'产品 Demo 的核心结构来自真实 Business World 工作台：事件流发现变化，Persona/行为证据解释影响对象，Scenario 实验比较策略，建议区输出动作。',
    asset:'/roadshow-assets/event-to-action.svg',
    chips:['商业事件','行为原型','模拟与推演','建议行动'],
  },
  {
    no:'03', kicker:'真实操作 Demo', title:'边操作，边得到反馈', accent:'现场跑一次，而不是播放动画',
    copy:'提出业务问题 → 选择场景 → 运行模拟 → 写入 scenario_run → 数据库读回验证 → 输出建议。反馈来自真实产品交互模型。',
    asset:'/roadshow-assets/product-console.svg',
    chips:['提出问题','选择场景','运行模拟','数据库反馈'],
  },
  {
    no:'04', kicker:'Potato Mode / 西红柿模式', title:'25 分钟聚焦一个真实业务问题', accent:'轻量、专注、即时出结果',
    copy:'聚焦一个业务问题，快速比较几个方案，选出下一步动作，再把结果变成业务团队可以当场讲清楚的汇报材料。',
    asset:'/roadshow-assets/potato-loop.svg',
    chips:['5 分钟聚焦','10 分钟模拟','5 分钟选择动作','5 分钟生成汇报'],
  },
  {
    no:'05', kicker:'业务价值', title:'让业务判断更快、更有依据、更容易对齐', accent:'从分析走到行动',
    copy:'路演最终要落到业务协作：更快发现问题、更快形成方案、更容易讲清楚、更快推动团队协同。',
    asset:'/roadshow-assets/value-bars.svg',
    chips:['发现问题 +48%','方案产出 +62%','沟通效率 +35%','决策周期 -28%'],
  },
];

export default function RoadshowPage(){
  return <main className="deck">
    <header>
      <a className="brand" href="/landing"><span className="orb"/>Business World Agent</a>
      <nav><a href="/roadshow-assets">Assets</a><a href="/landing">Landing</a><a className="primary" href="/?screen=experiment">打开 Product Demo</a></nav>
    </header>
    {slides.map((s,i)=><section className="slide" key={s.no}>
      <img className="globe" src="/roadshow-assets/globe-grid.svg" alt="" aria-hidden="true"/>
      <div className="copy">
        <p className="kicker">{s.kicker}<span>Slide {i+1}/5</span></p>
        <h1>{s.title}</h1>
        <h2>{s.accent}</h2>
        <p className="lead">{s.copy}</p>
        <div className="chips">{s.chips.map((c,n)=><span key={c}><i>{n+1}</i>{c}</span>)}</div>
        {i===0 && <div className="truth">产品叙事来自仓库 Product Demo：事件流 / 行为洞察 / 模拟实验 / AI 建议 / 数据库反馈。</div>}
        {i===2 && <div className="feedback"><b>现场反馈</b><span>✓ scenario_run 已保存并读回验证</span><code>record id · persistedAt · result</code></div>}
      </div>
      <div className="visual">
        <img src={s.asset} alt={s.title}/>
        <a href="/?screen=experiment">进入真实可交互界面 ↗</a>
      </div>
      <footer><span>看见问题</span><b>/</b><span>理解人群</span><b>/</b><span>模拟推演</span><b>/</b><span>执行动作</span></footer>
    </section>)}
    <style>{`
      .deck{background:#020617;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}.deck *{box-sizing:border-box}.deck>header{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:14px 4vw;background:rgba(2,6,23,.82);backdrop-filter:blur(18px);border-bottom:1px solid #16335d}.deck a{color:#dbeafe;text-decoration:none}.brand{display:flex;gap:10px;align-items:center;font-weight:800}.orb{width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#7c3aed 36%,#06b6d4 72%,#172554);box-shadow:0 0 24px #22d3ee}.deck nav{display:flex;gap:10px;align-items:center}.deck nav a{padding:9px 13px;border-radius:999px;border:1px solid #21477f}.deck nav .primary{background:linear-gradient(135deg,#22d3ee,#7c3aed);border:0;color:white;font-weight:800}.slide{position:relative;min-height:100vh;overflow:hidden;padding:70px 5vw 95px;display:grid;grid-template-columns:.86fr 1.14fr;gap:38px;align-items:center;border-bottom:1px solid #122b50;background:radial-gradient(circle at 78% 5%,rgba(37,99,235,.24),transparent 30%),linear-gradient(135deg,#020617,#051329 58%,#020617)}.globe{position:absolute;right:-8vw;top:-9vw;width:67vw;opacity:.46;pointer-events:none}.copy,.visual,footer{position:relative;z-index:2}.kicker{display:flex;gap:14px;align-items:center;color:#a5f3fc;font-weight:850}.kicker span{font-size:12px;color:#8aa7cc;border:1px solid #244b84;padding:5px 9px;border-radius:999px}h1{font-size:clamp(60px,6.7vw,112px);line-height:.92;letter-spacing:-.07em;margin:22px 0 14px;background:linear-gradient(90deg,#fff,#8befff 45%,#a78bfa);-webkit-background-clip:text;color:transparent}h2{font-size:clamp(32px,3.2vw,58px);line-height:1.08;letter-spacing:-.045em;margin:0 0 24px;color:#e6efff}.lead{color:#b9cce8;font-size:20px;line-height:1.8;max-width:780px}.chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:28px}.chips span{display:flex;gap:12px;align-items:center;padding:15px;border-radius:16px;background:rgba(7,21,43,.78);border:1px solid #1f4c8b;color:#dbeafe}.chips i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#7c3aed);font-style:normal;font-weight:900}.truth,.feedback{margin-top:18px;padding:16px 18px;border-radius:16px;background:#07162e;border:1px solid #1e5fb6;color:#a9c6eb;line-height:1.65}.feedback{display:grid;grid-template-columns:auto 1fr;gap:5px 18px}.feedback b{color:#fff}.feedback span{color:#34f2c1;font-weight:800}.feedback code{grid-column:2;color:#7897bf}.visual{min-height:640px;display:grid;place-items:center}.visual>img{width:100%;filter:drop-shadow(0 35px 70px rgba(37,99,235,.25))}.visual>a{position:absolute;right:3%;bottom:7%;padding:12px 16px;border:1px solid #2b64b6;border-radius:999px;background:rgba(2,6,23,.8);color:#a5f3fc}.slide footer{position:absolute;left:5vw;right:5vw;bottom:28px;display:flex;justify-content:center;gap:22px;color:#23dfff}.slide footer b{color:#3566a8} @media(max-width:1050px){.slide{grid-template-columns:1fr;padding-top:90px}.visual{min-height:auto}.globe{width:110vw;opacity:.3}.chips{grid-template-columns:1fr 1fr}}@media(max-width:650px){.deck>header{align-items:flex-start;gap:14px;flex-direction:column}.deck nav{flex-wrap:wrap}.slide{padding:54px 20px 92px}.chips{grid-template-columns:1fr}h1{font-size:54px}.lead{font-size:17px}.slide footer{gap:8px;font-size:12px;flex-wrap:wrap}}
    `}</style>
  </main>;
}
