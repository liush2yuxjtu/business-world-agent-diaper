'use client';

const slides = [
  {
    kicker: 'Roadshow Deck · Slide 1/5',
    title: 'Business World Agent\n从商业事件到增长行动',
    subtitle: '把业务信号、行为原型与经营动作连接起来，让团队看见问题、演示方案、当场做决策。',
    cards: ['可交互 Demo', '数据库驱动场景', '适合非技术业务团队'],
  },
  {
    kicker: 'Slide 2/5 · 系统怎么工作',
    title: '这个系统是怎么工作的？',
    subtitle: '商业事件 → 行为原型 → 模拟推演 → 建议行动。业务专家看到的是可理解的业务链路，而不是技术黑盒。',
    cards: ['发现业务变化', '找到关键人群', '模拟多种策略', '输出可执行建议'],
  },
  {
    kicker: 'Slide 3/5 · 真实操作 Demo',
    title: '边操作，边得到反馈',
    subtitle: '现场提出一个问题，选择业务场景，运行模拟，系统返回建议并把 scenario 记录写入数据库。',
    cards: ['提出问题', '选择场景', '运行模拟', '得到建议'],
  },
  {
    kicker: 'Slide 4/5 · Potato Mode',
    title: '25 分钟聚焦一个真实业务问题',
    subtitle: '不讲宇宙级 AI 愿景，只用一个业务问题跑完：聚焦问题、运行模拟、选择行动、生成汇报。',
    cards: ['5 分钟聚焦', '10 分钟模拟', '5 分钟选择动作', '5 分钟生成汇报'],
  },
  {
    kicker: 'Slide 5/5 · 业务价值',
    title: '让业务判断更快、更有依据、更容易对齐',
    subtitle: '它不是替代业务判断，而是把判断从散乱讨论变成有数据、有场景、有反馈的协作过程。',
    cards: ['问题发现效率 +48%', '方案产出效率 +62%', '沟通效率 +35%', '决策周期 -28%'],
  },
];

export default function RoadshowPage() {
  return <main className="deck-page">
    <header><a href="/landing">← 返回 Landing</a><a href="/?screen=experiment">打开 Demo</a></header>
    {slides.map((slide, i) => <section key={slide.kicker} className="slide">
      <div className="globe" />
      <p className="kicker">{slide.kicker}</p>
      <h1>{slide.title.split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
      <p className="subtitle">{slide.subtitle}</p>
      <div className="cards">{slide.cards.map((card, idx) => <div key={card} className="card"><span>{idx + 1}</span><b>{card}</b></div>)}</div>
      {i === 2 && <div className="demo-strip"><b>现场反馈：</b>数据库已保存并读回验证 · record id: bw-demo-20260920-001</div>}
      {i === 4 && <div className="tomato">🍅 Potato Mode：看见问题 / 演示方案 / 当场决策 / 驱动增长</div>}
    </section>)}
    <style>{`
      .deck-page{background:#020617;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}.deck-page header{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;padding:14px 32px;background:rgba(2,6,23,.78);backdrop-filter:blur(16px);border-bottom:1px solid rgba(96,165,250,.22)}.deck-page a{color:#bfdbfe;text-decoration:none}.slide{position:relative;min-height:100vh;padding:70px 7vw;overflow:hidden;border-bottom:1px solid rgba(96,165,250,.16);background:radial-gradient(circle at 82% 12%,rgba(37,99,235,.42),transparent 26%),linear-gradient(135deg,#020617,#06142b 58%,#020617)}.slide:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(96,165,250,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,.12) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at 80% 24%,#000,transparent 55%)}.globe{position:absolute;right:-10%;top:4%;width:58vw;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(125,211,252,.75),rgba(29,78,216,.18) 38%,transparent 62%);box-shadow:inset 0 0 80px rgba(147,197,253,.55),0 0 120px rgba(59,130,246,.4)}.kicker,.subtitle,h1,.cards,.demo-strip,.tomato{position:relative;z-index:1}.kicker{display:inline-flex;border:1px solid rgba(96,165,250,.5);background:rgba(37,99,235,.28);padding:9px 16px;border-radius:999px;color:#bfdbfe;font-weight:800}h1{max-width:1150px;margin:42px 0 20px;font-size:clamp(58px,7vw,116px);line-height:.98;letter-spacing:-.07em}h1 span{display:block;background:linear-gradient(90deg,#fff,#67e8f9 46%,#a78bfa);-webkit-background-clip:text;color:transparent}.subtitle{max-width:980px;color:#dbeafe;font-size:26px;line-height:1.75}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:56px}.card{min-height:160px;padding:24px;border-radius:22px;background:rgba(15,23,42,.76);border:1px solid rgba(96,165,250,.34);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 18px 44px rgba(2,6,23,.38)}.card span{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#7c3aed);font-weight:900}.card b{display:block;font-size:28px;margin-top:24px;line-height:1.25}.demo-strip,.tomato{margin-top:42px;padding:20px 24px;border-radius:22px;background:rgba(15,23,42,.8);border:1px solid rgba(34,211,238,.44);font-size:22px;color:#e0f2fe}@media(max-width:980px){.cards{grid-template-columns:repeat(2,1fr)}.globe{opacity:.35}h1{font-size:64px}.subtitle{font-size:21px}}@media(max-width:620px){.slide{padding:54px 22px}.cards{grid-template-columns:1fr}h1{font-size:48px}.deck-page header{padding:12px 20px}}
    `}</style>
  </main>;
}
