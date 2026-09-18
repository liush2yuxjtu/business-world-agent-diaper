'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  BarChart3, Bot, ChevronRight, Heart, Megaphone, Package, Play, Radio,
  ShoppingCart, Sparkles, Users, Video, WandSparkles
} from 'lucide-react';

export type BusinessPayload = {
  meta: { dataMode: 'simulated' | 'observed'; datasetVersion: string; designSource: string; warning: string };
  personas: Array<{
    id: string; name: string; title: string; goal: string; pain: string; content: string; trigger: string;
    population: number | null; conversionRate: number | null; repeatRate: number | null; gmvShare: number | null;
  }>;
  content: {
    engagementRate: number | null; weeklyOpportunities: number | null; totalPlays: number | null; interactions: number | null;
    topTopics: Array<{ title: string; persona: string; potential: string }>;
    scripts: Array<{ name: string; durationSec: number; format: string }>;
  };
  live: {
    roomEntryRate: number | null; cartRate: number | null; avgWatchSec: number | null; payConversionRate: number | null;
    exposureUv: number | null; watchUv: number | null; peakOnline: number | null; paidOrders: number | null; gmv: number | null;
    sessions: Array<{ id: string; title: string; durationMin: number; watchUv: number; cartRate: number; paidOrders: number; gmv: number }>;
  };
  commerce: {
    conversionRate: number | null; gmv: number | null; newCustomers: number | null; refundRate: number | null;
    sellThroughRate: number | null; aov: number | null;
    products: Array<{ id: string; name: string; size: string; price: number; gmv: number; conversionRate: number; stockDays: number; refundRate: number; image: string }>;
  };
  ads: {
    budget: number | null; spend: number | null; roi: number | null; cpa: number | null; ctr: number | null; newCustomerCost: number | null;
    channelMix: Array<{ channel: string; share: number }>;
    campaigns: Array<{ id: string; name: string; channel: string; budget: number; spend: number; ctr: number; cpa: number; roi: number; status: string }>;
    creatives: Array<{ name: string; roi: number }>;
  };
  report: { period: string; audience: string; headline: string; summary: string; sections: string[] };
  notes: string;
};

export type BusinessSnapshot = {
  provenance: {
    sourceMode: 'persisted-observation' | 'simulated' | 'unavailable';
    provider: string;
    sourceLabel: string;
    asOf: string | null;
    updatedAt: string | null;
    storage: string;
    writable: boolean;
  };
  data: BusinessPayload | null;
};







function fmt(value: number | null | undefined, suffix = '') {
  return value == null ? '—' : `${value.toLocaleString('zh-CN')}${suffix}`;
}

function Metric({ label, value, observed = true }: { label: string; value: string; observed?: boolean }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{observed ? '已持久化数据' : '待观测'}</div></div>;
}

function HypothesisTag() {
  return <span className="hypothesis-tag">研究假设</span>;
}

function Unknown({ children = '—' }: { children?: React.ReactNode }) {
  return <span className="unknown-value">{children}</span>;
}

export function OverviewRestored({ data }: { data: BusinessPayload | null }) {
  const personas = data?.personas ?? [];
  return <>
    <section className="world-hero panel restored-world">
      <figure className="world-core generated-world-art">
        <Image src="/business-world/images/business-world-overview.png" width={1254} height={1254} sizes="(max-width: 1100px) 80vw, 36vw" loading="eager" alt="AI 生成的纸尿裤经营世界概念图：消费者研究、短视频、直播、广告、交易履约与家庭使用相互连接"/>
        <figcaption><b>一个相互连接的经营世界</b><span>AI 生成概念插画 · 非实时经营数据</span></figcaption>
        <div className="world-persona-labels">{personas.map(p=><span key={p.name}>{p.name} · {p.title}</span>)}</div>
      </figure>
      <div className="worlds">
        <WorldCard n="1" title="抖音短视频世界" text="内容触达 · 互动 · 评论" icon={Video}/>
        <WorldCard n="2" title="抖音直播世界" text="进房 · 互动 · 加购" icon={Radio}/>
        <WorldCard n="3" title="千川 / 巨量投放世界" text="预算 · CPA · ROI" icon={Megaphone}/>
        <WorldCard n="4" title="电商交易世界" text="GMV · 转化 · 新客" icon={ShoppingCart}/>
        <WorldCard n="5" title="家庭使用世界" text="研究假设 · 待真实验证" icon={Heart}/>
        <WorldCard n="6" title="消费者世界" text="Persona 研究假设 · 待分群验证" icon={Users}/>
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

export function PersonaRestored({ data }: { data: BusinessPayload | null }) {
  const personas = data?.personas ?? [];
  return <>
    <section className="hero-panel restored-persona-hero"><div><div className="eyebrow">Persona Studio</div><h2>人群结构与模拟指标来自 Supabase 数据集</h2><p>当前数值是模拟数据，用于完成产品体验；接入真实分群后再切换为 observed。</p></div><div className="hero-baby">研究假设<br/><small>非已观测事实</small></div></section>
    <div className="two-col">
      <section className="panel">
        <div className="section-title"><span>核心人群</span><small>Supabase simulated dataset</small></div>
        <div className="persona-grid">
          {personas.map(p=><article className="persona-card" key={p.name}>
            <div className="persona-photo"><div className="avatar-orb">{p.name.slice(0,1)}</div><span className="persona-badge">{p.title}</span><HypothesisTag/></div>
            <div className="persona-name">{p.name}<span>模拟分群 · 非真实客户观测</span></div>
            <dl>
              <div><dt>核心需求</dt><dd>{p.goal}</dd></div>
              <div><dt>主要痛点</dt><dd>{p.pain}</dd></div>
              <div><dt>偏好内容</dt><dd>{p.content}</dd></div>
              <div><dt>购买触发</dt><dd>{p.trigger}</dd></div>
              <div><dt>人群规模</dt><dd>{fmt(p.population,' 人')}</dd></div>
              <div><dt>转化率</dt><dd>{fmt(p.conversionRate,'%')}</dd></div>
            </dl>
          </article>)}
        </div>
      </section>
      <aside className="panel insight"><div className="section-title"><span>AI 研究框架</span><Bot size={18}/></div><ol>
        <li><b>保留假设，不冒充事实</b><p>Persona 名称与研究方向是 产品结构；数值结论必须由真实行为数据验证。</p></li>
        <li><b>连接真实分群后再计算指标</b><p>人群规模、占比、转化、复购等字段当前保持未知。</p></li>
        <li><b>统一经营快照贯穿分析与模拟</b><p>经营指标、策略分析与模拟都引用同一份来源信息。</p></li>
      </ol></aside>
    </div>
  </>;
}

export function WorldRestored({ data }: { data: BusinessPayload | null }) {
  const personas = data?.personas ?? [];
  const worlds = [
    ['内容世界', fmt(data?.content.engagementRate,'%'), '互动率'],
    ['直播世界', fmt(data?.live.roomEntryRate,'%'), '进房率'],
    ['交易世界', fmt(data?.commerce.conversionRate,'%'), '转化率'],
    ['投放世界', fmt(data?.ads.roi), 'ROI'],
  ];
  return <section className="panel builder restored-builder">
    <div className="world-hero restored-world-builder">
      <div className="world-core"><div className="orbit"><Sparkles/><b>经营<br/>基线</b><small>已连接数据</small></div>{personas.map((p,i)=><div className={`orbit-person p${i+1}`} key={p.name}><span>{p.name}</span><small>研究假设</small></div>)}</div>
      <div className="worlds">{worlds.map(([title,value,label],i)=><div className="world-card" key={title}><span>{i+1}</span><Sparkles/><div><b>{title}</b><small>{label}: {value}</small></div></div>)}</div>
    </div>
    <div className="observation-note"><b>观测数据 ≠ 研究假设</b><span>观测数据进入经营基线；Persona 与模拟假设单独标记，不与实际经营结果混淆。</span></div>
  </section>;
}

export function ContentRestored({ data }: { data: BusinessPayload | null }) {
  const topics = data?.content.topTopics ?? [];
  const scripts = data?.content.scripts ?? [];
  return <>
    <section className="metrics-row"><Metric label="内容互动率" value={fmt(data?.content.engagementRate,'%')} observed={data?.content.engagementRate != null}/><Metric label="本周内容机会" value={fmt(data?.content.weeklyOpportunities,' 条')} observed={data?.content.weeklyOpportunities != null}/><Metric label="真实评论洞察" value="—" observed={false}/><Metric label="素材表现" value="—" observed={false}/></section>
    <div className="content-grid">
      <section className="panel"><div className="section-title"><span>选题机会</span><small>研究假设 · 待数据验证</small></div><div className="topic-list">{topics.map((t,i)=><div className="topic" key={t.title}><b>{i+1}</b><span><strong>{t.title}</strong><small>{t.persona} · simulated</small></span><em>{t.potential}</em></div>)}</div>
      <div className="section-title spaced"><span>短视频脚本结构</span><small>效果指标待数据验证</small></div><div className="script-grid">{scripts.map((x,i)=><div className="script" key={x.name}><div className="thumb">{x.format==='cta'?'LIVE':`${x.durationSec}s`}</div><b>{x.name}</b><p>Supabase 中持久化的模拟脚本结构；真实表现数据接入后替换。</p></div>)}</div></section>
      <aside className="panel live-plan"><div className="section-title"><span>内容 → 直播桥接</span><span className="live">内容桥接</span></div><div className="live-preview"><div className="presenter">内容<br/><span>→ 直播</span></div><Play size={34}/></div><div className="chip-grid"><span>真实测评</span><span>尺码指南</span><span>场景演示</span><span>用户问答</span></div></aside>
    </div>
  </>;
}

export function LiveRestored({ data }: { data: BusinessPayload | null }) {
  return <div className="two-col restored-live-layout">
    <section className="panel live-plan"><div className="section-title"><span>直播间作战面板</span><span className="live">LIVE</span></div><div className="live-preview"><div className="presenter">LIVE<br/><span>真实数据待接入</span></div><Play size={34}/></div><div className="live-funnel-grid">
      <Funnel label="进房率" value={fmt(data?.live.roomEntryRate,'%')} observed={data?.live.roomEntryRate != null}/>
      <Funnel label="加购率" value={fmt(data?.live.cartRate,'%')} observed={data?.live.cartRate != null}/>
      <Funnel label="观看时长" value={fmt(data?.live.avgWatchSec," 秒")} observed={data?.live.avgWatchSec != null}/>
      <Funnel label="支付转化" value={fmt(data?.live.payConversionRate,"%")} observed={data?.live.payConversionRate != null}/>
    </div></section>
    <aside className="panel insight"><div className="section-title"><span>直播策略结构</span><Radio size={18}/></div><ol>
      <li><b>开场定位</b><p>策略步骤可保留，实际效果指标必须来自真实直播数据。</p></li>
      <li><b>核心卖点</b><p>围绕透气、防漏、尺码、护理组织内容。</p></li>
      <li><b>转化节点</b><p>优惠、问答、商品卡行为等需真实平台数据验证。</p></li>
    </ol></aside>
  </div>;
}

function Funnel({ label, value, observed }: { label: string; value: string; observed: boolean }) {
  return <div><span>{label}</span><b>{value}</b><small>{observed?'已持久化数据':'待观测'}</small></div>;
}

export function GrowthRestored({ data }: { data: BusinessPayload | null }) {
  const campaigns = data?.ads.campaigns ?? [];
  const creatives = data?.ads.creatives ?? [];
  return <>
    <section className="metrics-row"><Metric label="总预算" value={fmt(data?.ads.budget,' 元')} observed={data?.ads.budget != null}/><Metric label="ROI" value={fmt(data?.ads.roi)} observed={data?.ads.roi != null}/><Metric label="CPA" value={fmt(data?.ads.cpa,' 元')} observed={data?.ads.cpa != null}/><Metric label="CTR" value={fmt(data?.ads.ctr,"%")} observed={data?.ads.ctr != null}/></section>
    <div className="two-col growth-layout"><section className="panel"><div className="section-title"><span>投放活动控制台</span><small>投放结构</small></div><div className="campaign-grid">{campaigns.map((c,i)=><div className="campaign" key={c.id}><div className="campaign-head"><div className="mini-avatar">{i+1}</div><div><b>{c.name}</b><small>{c.channel} · {c.status}</small></div><HypothesisTag/></div><div className="campaign-kpis"><span>预算<b>{fmt(c.budget,' 元')}</b></span><span>CTR<b>{fmt(c.ctr,'%')}</b></span><span>CPA<b>{fmt(c.cpa,' 元')}</b></span><span>ROI<b>{fmt(c.roi)}</b></span></div><button disabled>模拟数据 · 只读</button></div>)}</div>
    <div className="split-lower"><div><div className="section-title"><span>人群投放矩阵</span></div><div className="bars">{(data?.personas ?? []).map(p=><div key={p.name}><span>{p.title}</span><i style={{width:`${Math.min(100,p.gmvShare ?? 0)}%`}}/><b>{fmt(p.gmvShare,'%')}</b></div>)}</div></div><div><div className="section-title"><span>创意 A/B 测试</span></div><div className="creative-row">{creatives.map((x,i)=><div key={x.name}><div className="creative-thumb">{i+1}</div><b>{x.name}</b><span>ROI {fmt(x.roi)}</span></div>)}</div></div></div></section>
    <aside className="panel insight"><div className="section-title"><span>投放优化建议</span><WandSparkles size={18}/></div><ol><li><b>先连接投放活动数据</b><p>没有千川观察值时，不生成“增加预算 30%”这类伪精确建议。</p></li><li><b>保留决策结构</b><p>预算、人群、素材、ROI 的界面和交互仍然存在。</p></li><li><b>观测后再给行动建议</b><p>所有建议都应显示数据来源与更新时间。</p></li></ol></aside></div>
  </>;
}

export function ProductRestored({ data }: { data: BusinessPayload | null }) {
  const products = data?.commerce.products ?? [];
  return <>
    <section className="metrics-row"><Metric label="GMV" value={fmt(data?.commerce.gmv,' 元')} observed={data?.commerce.gmv != null}/><Metric label="商品转化率" value={fmt(data?.commerce.conversionRate,'%')} observed={data?.commerce.conversionRate != null}/><Metric label="新客" value={fmt(data?.commerce.newCustomers,' 人')} observed={data?.commerce.newCustomers != null}/><Metric label="退款率" value={fmt(data?.commerce.refundRate,"%")} observed={data?.commerce.refundRate != null}/></section>
    <div className="two-col product-restored-layout"><section className="panel"><div className="section-title"><span>商品组合</span><small>AI 概念包装 · 非在售 SKU</small></div><div className="restored-product-grid">{products.map(product=><article className="restored-product-card" key={product.id}><figure className="restored-product-image generated-product-art"><Image src={`/business-world/images/${product.image}.png`} width={1254} height={1254} sizes="(max-width: 700px) 75vw, (max-width: 1100px) 30vw, 22vw" alt={`${product.name} AI 概念包装`}/><figcaption>{product.size} · AI 概念图</figcaption></figure><div><b>{product.name}</b><small>GMV {fmt(product.gmv,' 元')} · 转化率 {fmt(product.conversionRate,'%')} · 库存 {fmt(product.stockDays,' 天')}</small><HypothesisTag/></div></article>)}</div></section>
    <aside className="panel insight"><div className="section-title"><span>交易洞察结构</span><BarChart3 size={18}/></div><ol><li><b>商品表现</b><p>真实抖店商品 / 订单数据接入后填充。</p></li><li><b>库存与售后</b><p>保持产品信息架构，但未观测值显示未知。</p></li><li><b>人群 × 商品</b><p>等真实 Persona 与交易数据同时存在后再归因。</p></li></ol></aside></div>
  </>;
}

export function ExperimentRestored({ snapshot }: { snapshot: BusinessSnapshot | null }) {
  const [prompt,setPrompt]=useState('评估当前投放效率提升 10% 的方向性影响');
  const [lever,setLever]=useState('ad_efficiency');
  const [changePercent,setChangePercent]=useState('10');
  const [result,setResult]=useState<{
    id: string;
    result: {
      assumption: string;
      baselineRoi: number | null;
      modeledRoi: number | null;
      baselineConversionRate: number | null;
      modeledConversionRate: number | null;
    };
  }|null>(null);
  const [status,setStatus]=useState('');
  async function run(){
    setStatus('运行中…'); setResult(null);
    try{
      const response=await fetch('/api/business-world/scenario',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,lever,changePercent:Number(changePercent)})});
      const body=await response.json();
      if(!response.ok) throw new Error(body.error||'模拟失败');
      setResult(body); setStatus('模拟结果已保存');
    }catch(error){setStatus(error instanceof Error?error.message:'模拟失败')}
  }
  return <div className="simulator restored-simulator"><section className="panel experiment-panel"><div className="section-title"><span>模拟实验</span><small>推演结果 · 非实际发生</small></div><p>以当前经营快照为基线进行情景推演；缺少基础指标时不会生成结果。</p><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/><div className="experiment-controls"><select value={lever} onChange={e=>setLever(e.target.value)}><option value="ad_efficiency">投放效率</option><option value="content_engagement">内容互动</option><option value="live_watch_time">直播观看</option><option value="checkout_conversion">交易转化</option><option value="repeat_purchase">复购</option></select><input type="number" value={changePercent} onChange={e=>setChangePercent(e.target.value)}/><button className="primary" onClick={run} disabled={!snapshot?.data}><Play size={16}/>运行并保存</button></div><div className="model-warning">模拟结果用于方案比较，不代表市场实际已经发生。</div></section>
    <section className="panel sim-result restored-model-result"><div className="pulse">SIM</div><h3>方向性结果</h3>{status&&<p role="status" aria-live="polite">{status}</p>}{result?<><div className="scenario-result-grid"><div><span>基线 ROI</span><b>{fmt(result.result.baselineRoi)}</b></div><div><span>推演 ROI</span><b>{fmt(result.result.modeledRoi)}</b></div><div><span>基线转化率</span><b>{fmt(result.result.baselineConversionRate,'%')}</b></div><div><span>推演转化率</span><b>{fmt(result.result.modeledConversionRate,'%')}</b></div></div><p className="confidence">假设：{result.result.assumption}</p></>:<p>运行后在这里展示推演结果；缺少基础指标时对应结果保持为空。</p>}</section></div>;
}

export function ReportRestored({ snapshot }: { snapshot: BusinessSnapshot | null }) {
  const p=snapshot?.provenance;
  const d=snapshot?.data;
  return <div className="report-restored-grid"><section className="panel report-summary"><div className="section-title"><span>经营摘要</span><small>来源可追溯</small></div><div className="report-summary-list">
    <ReportLine label="数据来源" value={p?.sourceLabel ?? '暂无'}/>
    <ReportLine label="数据存储" value={p?.storage ?? '暂无'}/>
    <ReportLine label="内容" value={d?.content.engagementRate == null?'暂无观测数据':`互动率 ${fmt(d.content.engagementRate,'%')}`}/>
    <ReportLine label="直播" value={d?.live.cartRate == null?'暂无观测数据':`加购率 ${fmt(d.live.cartRate,'%')}`}/>
    <ReportLine label="投放" value={d?.ads.roi == null?'暂无观测数据':`ROI ${fmt(d.ads.roi)}`}/>
    <ReportLine label="交易" value={d?.commerce.gmv == null?'暂无观测数据':`GMV ${fmt(d.commerce.gmv,' 元')}`}/><ReportLine label="报告周期" value={d?.report.period || "暂无"}/><ReportLine label="摘要" value={d?.report.summary || "暂无"}/>
  </div></section><aside className="panel report-evidence"><div className="section-title"><span>数据来源</span><small>来源详情</small></div><div className="report-summary-list"><ReportLine label="来源名称" value={p?.sourceLabel ?? "暂无"}/><ReportLine label="数据服务" value={p?.provider ?? "暂无"}/><ReportLine label="观测时间" value={p?.asOf ?? "暂无"}/><ReportLine label="最后更新" value={p?.updatedAt ?? "暂无"}/></div><div className="model-warning">暂未获得的指标保持为空，并在报告中保留来源与更新时间。</div></aside></div>;
}

function ReportLine({label,value}:{label:string;value:string}){return <div><b>{label}</b><span>{value}</span></div>}
