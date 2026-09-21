'use client';

import { useEffect, useRef, useState } from 'react';

type Step = 'question' | 'scenario' | 'simulate' | 'action';

const steps: Array<{ id: Step; title: string; label: string; detail: string }> = [
  { id: 'question', title: '看见问题', label: '提出业务问题', detail: '用自然语言描述正在发生的经营异常，不需要业务专家学习 BI 或 SQL。' },
  { id: 'scenario', title: '选择场景', label: '选择人群与目标', detail: '把问题映射到直播、投放、内容、商品等业务场景，并锁定目标人群。' },
  { id: 'simulate', title: '运行模拟', label: '进入模拟工作区', detail: '进入工作区后选择变量、填写假设并运行；结果仅在保存成功后显示记录编号。' },
  { id: 'action', title: '得到行动', label: '输出可执行建议', detail: '把模拟结果转成下一步动作、预期收益和团队沟通材料。' },
];

const metrics = [
  ['发现问题效率', '待验证', '从人工复盘变成实时洞察'],
  ['方案产出效率', '待验证', '从经验判断变成多方案比较'],
  ['团队沟通效率', '待验证', '从散乱讨论变成统一结论'],
  ['决策周期', '待验证', '从会议等待变成当场推进'],
];

const roles = [
  ['经营负责人', '看清全局风险与增长机会'],
  ['内容负责人', '找到更适合人群的内容方向'],
  ['直播负责人', '优化场次节奏与转化动作'],
  ['品类负责人', '判断商品机会与组合策略'],
];

export default function LandingPage() {
  const [active, setActive] = useState<Step>('question');
  const [scene,setScene] = useState('直播电商');
  const [requestOpen,setRequestOpen] = useState(false);
  const [requestText,setRequestText] = useState('');
  const [requestDraft,setRequestDraft] = useState('');
  const [requestError,setRequestError] = useState(false);
  const requestDialog=useRef<HTMLDialogElement>(null);
  const requestInput=useRef<HTMLTextAreaElement>(null);
  const activeIndex = steps.findIndex((step) => step.id === active);
  const activeStep = steps[activeIndex];
  const scenes: Record<string,string> = {'直播电商':'如何比较直播观看变化对经营指标的影响？','广告投放':'如何比较投放效率变化对经营指标的影响？','内容运营':'如何比较内容互动变化对经营指标的影响？','用户增长':'如何比较复购变化对经营指标的影响？'};
  useEffect(()=>{
    if(requestOpen)requestDialog.current?.showModal();
    else if(requestDialog.current?.open)requestDialog.current.close();
  },[requestOpen]);
  function prepareRequest(){
    if(requestText.trim().length<3){setRequestError(true);requestInput.current?.focus();return;}
    setRequestError(false);
    setRequestDraft(`演示需求草稿\n关注场景：${scene}\n希望了解：${requestText.trim()}\n状态：未发送，尚未确认预约时间。`);
  }

  return <main className="bw-landing">
    <section className="hero">
      <nav className="topnav" aria-label="Business World navigation">
        <a className="brand" href="/">
          <span className="orb" />
          <b>Business World Agent</b>
        </a>
        <div className="navlinks">
          <a href="#how">产品能力</a>
          <a href="#demo">交互体验</a>
          <a href="#potato">Potato Mode</a>
          <a href="/roadshow">路演稿</a>
        </div>
        <a className="login" href="/?screen=overview">登录</a>
      </nav>

      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">AI 驱动的商业决策伙伴</p>
          <h1>看见商业行为，<br />驱动下一步增长</h1>
          <p className="lead">Business World Agent 把商业事件、行为原型与经营动作连接起来，让非技术业务团队也能在一个下午看见问题、演示方案、当场做决策。</p>
          <div className="hero-actions">
            <a className="cta" href="/?screen=experiment">立即体验 Demo →</a>
            <button className="ghost" onClick={()=>setRequestOpen(true)}>预约演示</button>
          </div>
          <div className="trust-row">
            <span>无需技术背景</span><span>合成演示数据</span><span>面向真实业务场景</span>
          </div>
        </div>

        <div className="product-stage" aria-label="Interactive product preview">
          <div className="window chrome">
            <div className="window-bar"><span /><span /><span /><b>Business World Agent</b></div>
            <div className="tabbar"><span className="active">总览</span><span>行为洞察</span><span>事件流</span><span>模拟实验</span><span>建议行动</span></div>
            <p className="preview-boundary">界面概念示意 · 下列数字非实测结果，也不是收益预测。</p><div className="metrics-strip">
              <div><small>用户行为提升</small><b>+48%</b><em>示意数字</em></div>
              <div><small>转化效率</small><b>+62%</b><em>示意数字</em></div>
              <div><small>经营成本</small><b className="danger">-28%</b><em>示意数字</em></div>
            </div>
            <div className="event-panel">
              <h3>事件流</h3>
              <p><span className="dot red" />直播间停留下降 <b>-32%</b></p>
              <p><span className="dot green" />新手家庭转化上升 <b>+48%</b></p>
              <p><span className="dot violet" />投放成本波动 <b>+28%</b></p>
            </div>
            <div className="ask-box">如何比较经营假设？<a href="/?screen=experiment" aria-label="进入模拟工作区">↗</a></div>
            <div className="answer-box">
              <b>研究方向示例</b>
              <p>福利时点与停留、转化之间的关系需要实验验证，当前没有因果或收益证据。</p>
              <div><span>明确假设</span><span>保留基线</span><span>比较结果</span></div>
            </div>
          </div>
          <div className="floating-card left"><b>内容表现</b><span>优质短视频带来更多自然流量</span><strong>+62%</strong></div>
          <div className="floating-card right"><b>投放效果</b><span>单次获客成本出现波动</span><strong className="danger">+28%</strong></div>
        </div>
      </div>
    </section>

    <section id="how" className="section how">
      <div className="section-head">
        <p className="eyebrow">系统怎么工作</p>
        <h2>从商业事件，到行为原型，再到可执行动作。</h2>
        <p>给业务专家看的版本很简单：先看到发生了什么，再理解影响的是谁，然后模拟不同方案，最后输出团队可以马上执行的下一步。</p>
      </div>
      <div className="flow-grid">
        {steps.map((step, index) => <button key={step.id} className={active === step.id ? 'flow active' : 'flow'} aria-pressed={active === step.id} onClick={() => setActive(step.id)}>
          <span>{index + 1}</span><b>{step.title}</b><small>{step.detail}</small>
        </button>)}
      </div>
    </section>

    <section id="demo" className="section demo-section">
      <div className="demo-copy">
        <p className="eyebrow">交互体验</p>
        <h2>选择研究方向，进入工作区比较情景。</h2>
        <p>面向非技术业务负责人时，演示重点不是数据库表结构，而是让 TA 看见：问题如何被提出，方案如何被模拟，结果如何反馈给团队。</p>
      </div>
      <div className="demo-console">
        <div className="console-left">
          <label>业务问题</label>
          <div className="prompt">{scenes[scene]}</div>
          <label>分析场景</label>
          <div className="scenario-tabs" role="group" aria-label="演示关注场景">{Object.keys(scenes).map(name=><button key={name} aria-pressed={scene===name} className={scene===name?"selected":""} onClick={()=>setScene(name)}>{name}</button>)}</div>
          <label>当前步骤</label>
          <div className="step-title"><span>{activeIndex + 1}</span><b>{activeStep.label}</b></div>
          <p>{activeStep.detail}</p>
          <a className="run" href="/?screen=experiment">进入模拟工作区</a>
        </div>
        <div className="console-right">
          <div className="status-line">本页用于了解操作流程。实际运行、保存和历史读回请进入模拟工作区；当前尚未运行实验。</div>
          <div className="result-card">
            <h3>待验证的方案示例</h3>
            <ol>
              <li><b>提前 15 分钟发放直播福利</b><span>成交转化变化待实验验证</span></li>
              <li><b>预热阶段加强短视频投放</b><span>进入人数变化待观测</span></li>
              <li><b>针对核心人群推送专属权益</b><span>复购变化待观测</span></li>
            </ol>
          </div>
          <div className="db-proof">
            <b>怎样确认保存成功</b>
            <p>在工作区运行后，检查返回的记录编号、保存时间和基线来源；刷新后能读取同一记录，才表示保存成功。</p>
          </div>
        </div>
      </div>
    </section>

    <section id="potato" className="section potato">
      <div>
        <p className="eyebrow">Potato Mode / 西红柿模式</p>
        <h2>25 分钟解决一个真实业务问题。</h2>
        <p>别再把“AI 改造经营”讲成宇宙社会学。路演现场就聚焦一个业务问题：直播停留下降怎么办？25 分钟内跑完问题、模拟、建议、汇报。</p>
      </div>
      <div className="potato-steps">
        <div><span>1</span><b>快速聚焦</b><small>一个业务问题</small></div>
        <div><span>2</span><b>运行模拟</b><small>多种方案对比</small></div>
        <div><span>3</span><b>获取建议</b><small>输出可执行方案</small></div>
        <div><span>4</span><b>当场讲解</b><small>一键生成汇报内容</small></div>
      </div>
    </section>

    <section className="section value">
      <div className="section-head"><p className="eyebrow">待验证的价值目标 · 不代表已实现收益</p><h2>让业务团队从分析走到行动。</h2></div>
      <div className="value-grid">{metrics.map(([name, value, desc]) => <div key={name} className="value-card"><b>{name}</b><strong>{value}</strong><p>{desc}</p></div>)}</div>
      <div className="role-row">{roles.map(([name, desc]) => <div key={name}><b>{name}</b><span>{desc}</span></div>)}</div>
    </section>

    <section className="final-cta">
      <h2>把一次路演 Demo，变成每天都能用的经营协作界面。</h2>
      <p>看见问题 / 演示方案 / 当场决策 / 驱动增长</p>
      <a className="cta" href="/?screen=experiment">打开可交互 Demo →</a>
    </section>

    <dialog ref={requestDialog} className="demo-request" aria-labelledby="demo-request-title" onClose={()=>setRequestOpen(false)}>
      <div className="request-heading"><h2 id="demo-request-title">预约演示</h2><button aria-label="关闭预约演示" onClick={()=>setRequestOpen(false)}>关闭</button></div>
      <p>先整理希望了解的业务问题。这里仅生成需求草稿，不会发送给任何人，也不会确认预约时间。</p>
      <label htmlFor="request-scene">关注场景</label><select id="request-scene" value={scene} onChange={e=>{setScene(e.target.value);setRequestDraft('');}}>{Object.keys(scenes).map(name=><option key={name}>{name}</option>)}</select>
      <label htmlFor="request-question">希望了解的问题</label><textarea id="request-question" ref={requestInput} maxLength={1000} value={requestText} aria-invalid={requestError} aria-describedby="request-help" onChange={e=>{setRequestText(e.target.value);setRequestDraft('');setRequestError(false);}}/>
      <p id="request-help" role={requestError?'alert':undefined}>{requestError?'请填写至少3个字的业务问题。':'填写3–1000个字，无需提供电话、邮箱或账户信息。'}</p>
      <button className="cta" onClick={prepareRequest}>生成需求草稿</button>
      {requestDraft && <section aria-label="演示需求草稿"><h3>需求草稿 · 未发送</h3><pre>{requestDraft}</pre><p role="status">草稿已生成，仅保留在当前页面；预约尚未提交。</p></section>}
      <a className="ghost" href="/?screen=overview">先进入工作区体验</a>
    </dialog>

    <style>{`
      .demo-request{width:min(560px,calc(100vw - 32px));max-height:90vh;overflow:auto;border:1px solid #475569;border-radius:18px;padding:24px;background:#0f172a;color:#f8fafc}.demo-request::backdrop{background:#020617bb}.demo-request .request-heading{display:flex;gap:12px;justify-content:space-between;align-items:center}.demo-request p{line-height:1.7;color:#cbd5e1}.demo-request label{display:block;margin-top:16px}.demo-request textarea,.demo-request select{display:block;width:100%;margin-top:8px;background:#020617;color:#f8fafc;border:1px solid #64748b;border-radius:8px;padding:10px}.demo-request textarea{min-height:100px}.demo-request pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}.demo-request .ghost{margin-top:18px}.bw-landing button{cursor:pointer}.bw-landing button:focus-visible,.bw-landing a:focus-visible,.demo-request input:focus-visible,.demo-request select:focus-visible,.demo-request textarea:focus-visible{outline:3px solid #67e8f9;outline-offset:3px}.preview-boundary{font-size:13px;color:#cbd5e1}.bw-landing{min-height:100vh;background:#030712;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;overflow:hidden}.bw-landing *{box-sizing:border-box}.hero{position:relative;min-height:100vh;padding:24px 6vw 70px;background:radial-gradient(circle at 75% 12%,rgba(55,125,255,.45),transparent 28%),radial-gradient(circle at 88% 58%,rgba(115,63,255,.28),transparent 30%),linear-gradient(135deg,#020617 0%,#06142b 55%,#030712 100%)}.hero:before{content:'';position:absolute;inset:-20%;background-image:linear-gradient(rgba(92,167,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(92,167,255,.12) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at 65% 30%,#000 0,transparent 58%);pointer-events:none}.topnav{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(148,163,184,.18);padding-bottom:18px}.brand{display:flex;align-items:center;gap:12px;font-size:18px}.orb{width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#7c3aed 32%,#06b6d4 70%,#172554);box-shadow:0 0 30px rgba(34,211,238,.8)}.navlinks{display:flex;gap:34px;color:#cbd5e1;font-size:14px}.login,.cta,.ghost{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;padding:12px 18px;font-weight:700}.login,.cta{background:linear-gradient(135deg,#22d3ee,#7c3aed);color:#fff;box-shadow:0 12px 38px rgba(34,211,238,.28)}.ghost{background:transparent;border:1px solid rgba(148,163,184,.38);color:#f8fafc}.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:.88fr 1.12fr;gap:54px;align-items:center;padding-top:90px}.eyebrow{display:inline-flex;width:max-content;border:1px solid rgba(96,165,250,.45);background:rgba(37,99,235,.24);color:#bfdbfe;border-radius:999px;padding:8px 14px;font-weight:700}.hero h1{font-size:clamp(58px,7vw,116px);letter-spacing:-.075em;line-height:.95;margin:26px 0 24px;background:linear-gradient(90deg,#fff,#67e8f9 44%,#a78bfa);-webkit-background-clip:text;color:transparent}.lead{font-size:22px;line-height:1.85;max-width:760px;color:#dbeafe}.hero-actions{display:flex;gap:16px;margin:34px 0 28px}.trust-row{display:flex;flex-wrap:wrap;gap:18px;color:#cbd5e1}.trust-row span:before{content:'✓';color:#38bdf8;margin-right:8px}.product-stage{position:relative;min-height:680px;perspective:1600px}.window{position:absolute;inset:34px 0 auto auto;width:min(780px,100%);min-height:560px;border:1px solid rgba(96,165,250,.45);border-radius:26px;background:linear-gradient(135deg,rgba(8,19,45,.96),rgba(15,23,42,.82));box-shadow:0 0 80px rgba(59,130,246,.38);padding:22px;transform:rotateY(-10deg) rotateX(4deg)}.window-bar{display:flex;align-items:center;gap:8px;color:#e0f2fe}.window-bar span{width:10px;height:10px;border-radius:50%;background:#38bdf8}.window-bar b{margin-left:10px}.tabbar{display:flex;gap:22px;margin:22px 0;color:#94a3b8;font-size:13px}.tabbar .active{color:#fff;border-bottom:2px solid #60a5fa;padding-bottom:8px}.metrics-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.metrics-strip div,.event-panel,.answer-box,.ask-box,.floating-card,.demo-console,.value-card,.role-row,.potato-steps div,.flow{border:1px solid rgba(96,165,250,.28);background:rgba(15,23,42,.78);border-radius:18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}.metrics-strip div{padding:18px}.metrics-strip b{display:block;font-size:34px;color:#22d3ee;margin:4px 0}.danger{color:#fb7185!important}.metrics-strip small,.metrics-strip em{display:block;color:#93c5fd;font-style:normal}.event-panel{margin-top:18px;padding:20px}.event-panel p{display:flex;align-items:center;gap:10px;justify-content:space-between;color:#dbeafe}.dot{width:10px;height:10px;border-radius:50%;display:inline-block}.red{background:#fb7185}.green{background:#34d399}.violet{background:#a78bfa}.ask-box{margin-top:18px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;color:#dbeafe}.ask-box a{display:grid;place-items:center;border:0;border-radius:12px;background:#4f46e5;color:#fff;width:42px;height:42px}.answer-box{margin-top:16px;padding:18px}.answer-box p{color:#cbd5e1}.answer-box div{display:flex;gap:14px;color:#22d3ee;font-weight:700}.floating-card{position:absolute;z-index:2;padding:18px;width:220px;color:#dbeafe}.floating-card strong{display:block;font-size:34px;color:#22d3ee;margin-top:8px}.floating-card.left{left:0;top:330px}.floating-card.right{right:-18px;top:220px}.section{padding:90px 6vw;background:#030712}.section-head{max-width:900px;margin-bottom:34px}.section h2{font-size:clamp(38px,4.6vw,72px);line-height:1.05;letter-spacing:-.06em;margin:18px 0}.section p{font-size:18px;color:#cbd5e1;line-height:1.8}.flow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.flow{text-align:left;color:#f8fafc;padding:24px;cursor:pointer}.flow span,.step-title span,.potato-steps span{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#7c3aed);font-weight:900}.flow b{display:block;font-size:24px;margin:18px 0 8px}.flow small{color:#cbd5e1;line-height:1.7}.flow.active{border-color:#22d3ee;box-shadow:0 0 38px rgba(34,211,238,.25)}.demo-section{display:grid;grid-template-columns:.7fr 1.3fr;gap:34px;align-items:start;background:linear-gradient(180deg,#030712,#071426)}.demo-console{display:grid;grid-template-columns:.95fr 1.05fr;gap:18px;padding:22px}.console-left,.console-right{padding:10px}.demo-console label{display:block;color:#93c5fd;margin:18px 0 8px}.prompt,.scenario-tabs button,.step-title,.status-line,.result-card,.db-proof{border:1px solid rgba(96,165,250,.24);background:rgba(2,6,23,.5);border-radius:14px;padding:14px}.scenario-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.scenario-tabs button{color:#cbd5e1}.scenario-tabs .selected{color:#fff;border-color:#8b5cf6;background:rgba(124,58,237,.32)}.step-title{display:flex;gap:14px;align-items:center}.run{display:block;text-align:center;width:100%;margin-top:18px;border:0;border-radius:16px;padding:16px;background:linear-gradient(135deg,#22d3ee,#7c3aed);color:white;font-weight:900}.status-line{display:flex;gap:10px;align-items:center;color:#dbeafe}.status-line span{width:12px;height:12px;border-radius:50%;background:#64748b}.status-line .pulse{background:#facc15;animation:pulse 1s infinite}.status-line .ok{background:#22c55e}.result-card{margin-top:16px}.result-card li{margin:14px 0;color:#cbd5e1}.result-card span{display:block;color:#22d3ee}.db-proof{margin-top:16px}.potato{display:grid;grid-template-columns:.8fr 1.2fr;gap:50px;align-items:center;background:radial-gradient(circle at 8% 48%,rgba(239,68,68,.18),transparent 24%),#030712}.potato-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.potato-steps div{padding:22px}.potato-steps b{display:block;margin:16px 0 6px}.potato-steps small{color:#cbd5e1}.value-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.value-card{padding:24px}.value-card strong{display:block;font-size:48px;color:#22d3ee;margin:14px 0}.role-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:18px;padding:18px}.role-row div{padding:18px;border-right:1px solid rgba(96,165,250,.16)}.role-row div:last-child{border-right:0}.role-row span{display:block;color:#cbd5e1;margin-top:6px}.final-cta{text-align:center;padding:100px 6vw 120px;background:radial-gradient(circle at 50% 0,rgba(124,58,237,.35),transparent 35%),#030712}.final-cta h2{font-size:clamp(38px,5vw,74px);letter-spacing:-.06em;line-height:1.05}.final-cta p{color:#cbd5e1;font-size:20px;margin:20px 0 34px}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,.7)}50%{box-shadow:0 0 0 8px rgba(250,204,21,0)}}@media(max-width:1080px){.hero-grid,.demo-section,.potato{grid-template-columns:1fr}.product-stage{min-height:620px}.window{position:relative;inset:auto;width:100%;transform:none}.floating-card{display:none}.flow-grid,.value-grid,.role-row,.potato-steps{grid-template-columns:repeat(2,1fr)}.navlinks{display:none}}@media(max-width:680px){.hero{padding:18px 20px}.hero h1{font-size:52px}.lead{font-size:18px}.hero-actions,.topnav{align-items:flex-start;flex-direction:column}.section{padding:70px 20px}.flow-grid,.value-grid,.role-row,.potato-steps,.demo-console,.metrics-strip{grid-template-columns:1fr}.product-stage{min-height:auto}.window{min-height:auto}.hero-copy{padding-top:25px}}
    `}</style>
  </main>;
}
