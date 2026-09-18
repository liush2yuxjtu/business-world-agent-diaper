'use client';

import { useState } from 'react';
import {
  BarChart3, Bot, ChevronRight, Heart, Megaphone, Package, Play, Radio,
  ShoppingCart, Sparkles, Users, Video, WandSparkles
} from 'lucide-react';

export type BusinessPayload = {
  content: { engagementRate: number | null; weeklyOpportunities: number | null };
  live: { roomEntryRate: number | null; cartRate: number | null };
  commerce: { conversionRate: number | null; gmv: number | null; newCustomers: number | null };
  ads: { budget: number | null; roi: number | null; cpa: number | null };
  notes: string;
};

export type BusinessSnapshot = {
  provenance: {
    sourceMode: 'persisted-observation' | 'unavailable';
    provider: string;
    sourceLabel: string;
    asOf: string | null;
    updatedAt: string | null;
    storage: string;
    writable: boolean;
  };
  data: BusinessPayload | null;
};

const personas = [
  { name: '小雨', title: '新手家庭', goal: '安全、透气、夜间不漏', pain: '怕红屁屁、怕踩坑', content: '测评、成分科普、真实对比', trigger: '医生/达人背书、真实试用反馈' },
  { name: '阿琳', title: '复购家庭', goal: '高性价比、大包装、稳定复购', pain: '价格波动、优惠复杂', content: '囤货攻略、套装促销、直播福利', trigger: '满减、赠品、直播间限时价' },
  { name: '王姨', title: '长辈照护', goal: '简单放心、舒适不刺激', pain: '尺码难选、功能术语不懂', content: '大字说明、专家讲解、真实家庭演示', trigger: '子女推荐、口碑信任、线下体验' },
  { name: 'Mia', title: '内容分享者', goal: '高颜值、好用、愿意分享', pain: '普通内容不愿转发', content: '开箱、挑战、UGC互动、育儿日常', trigger: '社交认同、品牌活动、联名礼盒' },
];

const topics = ['宝宝整夜不漏尿挑战','夏季透气纸尿裤测评','新生儿囤货清单','红屁屁护理误区','纸尿裤尺码怎么选','夜用纸尿裤真实对比'];
const campaignHypotheses = ['新手家庭拉新','复购家庭复购','直播间引流','核心商品转化'];
const productHypotheses = ['新生儿系列','日常成长系列','夜间加强系列'];

function fmt(value: number | null | undefined, suffix = '') {
  return value == null ? '—' : `${value.toLocaleString('zh-CN')}${suffix}`;
}

function Metric({ label, value, observed = true }: { label: string; value: string; observed?: boolean }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{observed ? '已持久化观测' : 'Not observed yet'}</div></div>;
}

function HypothesisTag() {
  return <span className="hypothesis-tag">HYPOTHESIS</span>;
}

function Unknown({ children = '—' }: { children?: React.ReactNode }) {
  return <span className="unknown-value">{children}</span>;
}

export function OverviewRestored({ data }: { data: BusinessPayload | null }) {
  return <>
    <section className="world-hero panel restored-world">
      <div className="world-core">
        <div className="orbit"><Sparkles/><b>Business<br/>World Agent</b><small>真实 baseline · 未知值不造数</small></div>
        {personas.map((p,i)=><div className={`orbit-person p${i+1}`} key={p.name}><span>{p.name}</span><small>{p.title}</small></div>)}
      </div>
      <div className="worlds">
        <WorldCard n="1" title="抖音短视频世界" text="内容触达 · 互动 · 评论" icon={Video}/>
        <WorldCard n="2" title="抖音直播世界" text="进房 · 互动 · 加购" icon={Radio}/>
        <WorldCard n="3" title="千川 / 巨量投放世界" text="预算 · CPA · ROI" icon={Megaphone}/>
        <WorldCard n="4" title="电商交易世界" text="GMV · 转化 · 新客" icon={ShoppingCart}/>
        <WorldCard n="5" title="家庭使用世界" text="研究假设 · 待真实验证" icon={Heart}/>
        <WorldCard n="6" title="消费者世界" text="Persona hypothesis · 待分群验证" icon={Users}/>
      </div>
    </section>
    <section className="metrics-row">
      <Metric label="内容互动率" value={fmt(data?.content.engagementRate,'%')} observed={data?.content.engagementRate != null}/>
      <Metric label="直播加购率" value={fmt(data?.live.cartRate,'%')} observed={data?.live.cartRate != null}/>
      <Metric label="商品转化率" value={fmt(data?.commerce.conversionRate,'%')} observed={data?.commerce.conversionRate != null}/>
      <Metric label="ROI" value={fmt(data?.ads.roi)} observed={data?.ads.roi != null}/>
    </section>
    <section className="panel flow-band"><b>经营闭环</b>{['洞察消费者','设计内容','直播讲解','广告放大','购买转化','复盘优化'].map((x,i)=><div key={x}><span>{i+1}</span>{x}{i<5&&<ChevronRight/>}</div>)}</section>
  </>;
}

function WorldCard({ n, title, text, icon: Icon }: { n: string; title: string; text: string; icon: typeof Video }) {
  return <div className="world-card"><span>{n}</span><Icon/><div><b>{title}</b><small>{text}</small></div></div>;
}

export function PersonaRestored() {
  return <>
    <section className="hero-panel restored-persona-hero"><div><div className="eyebrow">Persona Studio</div><h2>恢复完整人群结构，但不恢复假的人群规模</h2><p>研究假设可以保留；人口占比、转化、GMV 等必须等待真实分群数据。</p></div><div className="hero-baby">HYPOTHESIS<br/><small>NOT OBSERVED FACT</small></div></section>
    <div className="two-col">
      <section className="panel">
        <div className="section-title"><span>核心人群假设</span><small>结构保留 · 指标待验证</small></div>
        <div className="persona-grid">
          {personas.map(p=><article className="persona-card" key={p.name}>
            <div className="persona-photo"><div className="avatar-orb">{p.name.slice(0,1)}</div><span className="persona-badge">{p.title}</span><HypothesisTag/></div>
            <div className="persona-name">{p.name}<span>研究假设，不是已观测分群事实</span></div>
            <dl>
              <div><dt>核心需求</dt><dd>{p.goal}</dd></div>
              <div><dt>主要痛点</dt><dd>{p.pain}</dd></div>
              <div><dt>偏好内容</dt><dd>{p.content}</dd></div>
              <div><dt>购买触发</dt><dd>{p.trigger}</dd></div>
              <div><dt>人群规模</dt><dd><Unknown/></dd></div>
              <div><dt>转化率</dt><dd><Unknown/></dd></div>
            </dl>
          </article>)}
        </div>
      </section>
      <aside className="panel insight"><div className="section-title"><span>AI 研究框架</span><Bot size={18}/></div><ol>
        <li><b>保留假设，不冒充事实</b><p>Persona 名称与研究方向是 product contract；数值结论必须由真实行为数据验证。</p></li>
        <li><b>连接真实分群后再计算指标</b><p>Population、share、conversion、复购等字段当前保持未知。</p></li>
        <li><b>同一 reality boundary 服务 UI 与 Agent</b><p>避免 UI 看起来真实、Agent 却仍读取 mock。</p></li>
      </ol></aside>
    </div>
  </>;
}

export function WorldRestored({ data }: { data: BusinessPayload | null }) {
  const worlds = [
    ['内容世界', fmt(data?.content.engagementRate,'%'), '互动率'],
    ['直播世界', fmt(data?.live.roomEntryRate,'%'), '进房率'],
    ['交易世界', fmt(data?.commerce.conversionRate,'%'), '转化率'],
    ['投放世界', fmt(data?.ads.roi), 'ROI'],
  ];
  return <section className="panel builder restored-builder">
    <div className="world-hero restored-world-builder">
      <div className="world-core"><div className="orbit"><Sparkles/><b>REAL<br/>BASELINE</b><small>observation layer</small></div>{personas.map((p,i)=><div className={`orbit-person p${i+1}`} key={p.name}><span>{p.name}</span><small>hypothesis</small></div>)}</div>
      <div className="worlds">{worlds.map(([title,value,label],i)=><div className="world-card" key={title}><span>{i+1}</span><Sparkles/><div><b>{title}</b><small>{label}: {value}</small></div></div>)}</div>
    </div>
    <div className="observation-note"><b>Observation ≠ assumption</b><span>真实观测进入 baseline；Persona / scenario assumptions 单独标记，不混为市场事实。</span></div>
  </section>;
}

export function ContentRestored({ data }: { data: BusinessPayload | null }) {
  return <>
    <section className="metrics-row"><Metric label="内容互动率" value={fmt(data?.content.engagementRate,'%')} observed={data?.content.engagementRate != null}/><Metric label="本周内容机会" value={fmt(data?.content.weeklyOpportunities,' 条')} observed={data?.content.weeklyOpportunities != null}/><Metric label="真实评论洞察" value="—" observed={false}/><Metric label="素材表现" value="—" observed={false}/></section>
    <div className="content-grid">
      <section className="panel"><div className="section-title"><span>选题机会</span><small>HYPOTHESIS UNTIL OBSERVED</small></div><div className="topic-list">{topics.map((t,i)=><div className="topic" key={t}><b>{i+1}</b><span><strong>{t}</strong><small>{personas[i%personas.length].title} · research hypothesis</small></span><em>待观测</em></div>)}</div>
      <div className="section-title spaced"><span>短视频脚本结构</span><small>不显示假的 CTR / uplift</small></div><div className="script-grid">{['问题切入','真实场景','直播桥接'].map((x,i)=><div className="script" key={x}><div className="thumb">{i===2?'LIVE':`${15+i*15}s`}</div><b>{x}</b><p>保留创意结构；表现数据接入真实抖音来源后再显示。</p></div>)}</div></section>
      <aside className="panel live-plan"><div className="section-title"><span>内容 → 直播桥接</span><span className="live">FLOW</span></div><div className="live-preview"><div className="presenter">内容<br/><span>→ 直播</span></div><Play size={34}/></div><div className="chip-grid"><span>真实测评</span><span>尺码指南</span><span>场景演示</span><span>用户问答</span></div></aside>
    </div>
  </>;
}

export function LiveRestored({ data }: { data: BusinessPayload | null }) {
  return <div className="two-col restored-live-layout">
    <section className="panel live-plan"><div className="section-title"><span>直播间作战面板</span><span className="live">LIVE</span></div><div className="live-preview"><div className="presenter">LIVE<br/><span>真实数据待接入</span></div><Play size={34}/></div><div className="live-funnel-grid">
      <Funnel label="进房率" value={fmt(data?.live.roomEntryRate,'%')} observed={data?.live.roomEntryRate != null}/>
      <Funnel label="加购率" value={fmt(data?.live.cartRate,'%')} observed={data?.live.cartRate != null}/>
      <Funnel label="观看时长" value="—" observed={false}/>
      <Funnel label="支付转化" value="—" observed={false}/>
    </div></section>
    <aside className="panel insight"><div className="section-title"><span>直播策略结构</span><Radio size={18}/></div><ol>
      <li><b>开场定位</b><p>策略步骤可保留，实际效果指标必须来自真实直播数据。</p></li>
      <li><b>核心卖点</b><p>围绕透气、防漏、尺码、护理组织内容。</p></li>
      <li><b>转化节点</b><p>优惠、问答、商品卡行为等需真实平台数据验证。</p></li>
    </ol></aside>
  </div>;
}

function Funnel({ label, value, observed }: { label: string; value: string; observed: boolean }) {
  return <div><span>{label}</span><b>{value}</b><small>{observed?'observed':'not observed'}</small></div>;
}

export function GrowthRestored({ data }: { data: BusinessPayload | null }) {
  return <>
    <section className="metrics-row"><Metric label="总预算" value={fmt(data?.ads.budget,' 元')} observed={data?.ads.budget != null}/><Metric label="ROI" value={fmt(data?.ads.roi)} observed={data?.ads.roi != null}/><Metric label="CPA" value={fmt(data?.ads.cpa,' 元')} observed={data?.ads.cpa != null}/><Metric label="Campaign-level data" value="—" observed={false}/></section>
    <div className="two-col growth-layout"><section className="panel"><div className="section-title"><span>投放活动控制台</span><small>campaign structure preserved</small></div><div className="campaign-grid">{campaignHypotheses.map((name,i)=><div className="campaign" key={name}><div className="campaign-head"><div className="mini-avatar">{i+1}</div><div><b>{name}</b><small>campaign hypothesis</small></div><HypothesisTag/></div><div className="campaign-kpis"><span>预算<b>—</b></span><span>CTR<b>—</b></span><span>CPA<b>—</b></span><span>ROI<b>—</b></span></div><button disabled>等待真实 Campaign 数据</button></div>)}</div>
    <div className="split-lower"><div><div className="section-title"><span>人群投放矩阵</span></div><div className="bars">{personas.map(p=><div key={p.name}><span>{p.title}</span><i style={{width:'0%'}}/><b>—</b></div>)}</div></div><div><div className="section-title"><span>创意 A/B 测试</span></div><div className="creative-row">{['透气实测','夜间防漏','尺码指南','家庭场景'].map((x,i)=><div key={x}><div className="creative-thumb">{i+1}</div><b>{x}</b><span>ROI —</span></div>)}</div></div></div></section>
    <aside className="panel insight"><div className="section-title"><span>AI 优化框架</span><WandSparkles size={18}/></div><ol><li><b>先连接真实 Campaign 数据</b><p>没有千川观察值时，不生成“增加预算 30%”这类伪精确建议。</p></li><li><b>保留决策结构</b><p>预算、人群、素材、ROI 的界面和交互仍然存在。</p></li><li><b>观测后再给行动建议</b><p>所有建议必须带 provenance 与 freshness。</p></li></ol></aside></div>
  </>;
}

export function ProductRestored({ data }: { data: BusinessPayload | null }) {
  return <>
    <section className="metrics-row"><Metric label="GMV" value={fmt(data?.commerce.gmv,' 元')} observed={data?.commerce.gmv != null}/><Metric label="商品转化率" value={fmt(data?.commerce.conversionRate,'%')} observed={data?.commerce.conversionRate != null}/><Metric label="新客" value={fmt(data?.commerce.newCustomers,' 人')} observed={data?.commerce.newCustomers != null}/><Metric label="库存风险" value="—" observed={false}/></section>
    <div className="two-col product-restored-layout"><section className="panel"><div className="section-title"><span>商品组合</span><small>structure preserved</small></div><div className="restored-product-grid">{productHypotheses.map((name,i)=><article className="restored-product-card" key={name}><div className="restored-product-image"><Package size={30}/><span>{['NB / S','M / L','XL+'][i]}</span></div><div><b>{name}</b><small>GMV — · Conversion —</small><HypothesisTag/></div></article>)}</div></section>
    <aside className="panel insight"><div className="section-title"><span>交易洞察结构</span><BarChart3 size={18}/></div><ol><li><b>商品表现</b><p>真实抖店商品 / 订单数据接入后填充。</p></li><li><b>库存与售后</b><p>保持产品信息架构，但未观测值显示未知。</p></li><li><b>人群 × 商品</b><p>等真实 Persona 与交易数据同时存在后再归因。</p></li></ol></aside></div>
  </>;
}

export function ExperimentRestored({ snapshot }: { snapshot: BusinessSnapshot | null }) {
  const [prompt,setPrompt]=useState('评估当前投放效率提升 10% 的方向性影响');
  const [lever,setLever]=useState('ad_efficiency');
  const [changePercent,setChangePercent]=useState('10');
  const [result,setResult]=useState<Record<string,unknown>|null>(null);
  const [status,setStatus]=useState('');
  async function run(){
    setStatus('运行中…'); setResult(null);
    try{
      const response=await fetch('/api/business-world/scenario',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,lever,changePercent:Number(changePercent)})});
      const body=await response.json();
      if(!response.ok) throw new Error(body.error||'Scenario failed');
      setResult(body); setStatus('已持久化 modeled Scenario run');
    }catch(error){setStatus(error instanceof Error?error.message:'Scenario failed')}
  }
  return <div className="simulator restored-simulator"><section className="panel experiment-panel"><div className="section-title"><span>Scenario Experiment</span><small>MODELLED · NOT OBSERVED</small></div><p>真实 baseline + 透明数学模型。没有 baseline 数值时，模型结果保持未知。</p><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/><div className="experiment-controls"><select value={lever} onChange={e=>setLever(e.target.value)}><option value="ad_efficiency">投放效率</option><option value="content_engagement">内容互动</option><option value="live_watch_time">直播观看</option><option value="checkout_conversion">交易转化</option><option value="repeat_purchase">复购</option></select><input type="number" value={changePercent} onChange={e=>setChangePercent(e.target.value)}/><button className="primary" onClick={run} disabled={!snapshot?.data}><Play size={16}/>运行并保存</button></div><div className="model-warning">Scenario 是 modeled result，不是 observed market outcome。</div></section>
    <section className="panel sim-result restored-model-result"><div className="pulse">MODEL</div><h3>方向性结果</h3>{status&&<p>{status}</p>}{result?<pre>{JSON.stringify(result,null,2)}</pre>:<p>运行后在这里展示 modeled output；未知 baseline 不会被补成假数字。</p>}</section></div>;
}

export function ReportRestored({ snapshot }: { snapshot: BusinessSnapshot | null }) {
  const p=snapshot?.provenance;
  const d=snapshot?.data;
  return <div className="report-restored-grid"><section className="panel report-summary"><div className="section-title"><span>Executive Summary</span><small>EVIDENCE-LINKED</small></div><div className="report-summary-list">
    <ReportLine label="Source" value={p?.sourceLabel ?? 'Unavailable'}/>
    <ReportLine label="Storage" value={p?.storage ?? 'Unavailable'}/>
    <ReportLine label="Content" value={d?.content.engagementRate == null?'Performance not observed':`Engagement ${fmt(d.content.engagementRate,'%')}`}/>
    <ReportLine label="Live" value={d?.live.cartRate == null?'Performance not observed':`Cart rate ${fmt(d.live.cartRate,'%')}`}/>
    <ReportLine label="Ads" value={d?.ads.roi == null?'Performance not observed':`ROI ${fmt(d.ads.roi)}`}/>
    <ReportLine label="Commerce" value={d?.commerce.gmv == null?'Performance not observed':`GMV ${fmt(d.commerce.gmv,' 元')}`}/>
  </div></section><aside className="panel report-evidence"><div className="section-title"><span>Provenance</span><small>REALITY BOUNDARY</small></div><pre>{JSON.stringify({sourceMode:p?.sourceMode,provider:p?.provider,asOf:p?.asOf,updatedAt:p?.updatedAt,storage:p?.storage},null,2)}</pre><div className="model-warning">Unknown metrics remain null. Report layout is rich; evidence remains strict.</div></aside></div>;
}

function ReportLine({label,value}:{label:string;value:string}){return <div><b>{label}</b><span>{value}</span></div>}
