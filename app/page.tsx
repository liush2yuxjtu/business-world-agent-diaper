'use client';

import { useMemo, useState } from 'react';
import {
  BarChart3, Bot, Box, ChevronRight, CircleDollarSign, ClipboardList, FlaskConical,
  Heart, Home, Lightbulb, Megaphone, MessageCircle, Package, Play, Radio,
  Search, ShoppingCart, Sparkles, Target, Users, Video, WandSparkles
} from 'lucide-react';

type Persona = {
  name: string; title: string; age: string; stage: string; city: string; share: string;
  goal: string; pain: string; content: string; trigger: string; quote: string;
};

const personas: Persona[] = [
  {name:'小雨',title:'新手妈妈',age:'28岁',stage:'0–6个月宝宝',city:'一线城市白领',share:'28%',goal:'安全、透气、夜间不漏',pain:'怕红屁屁、怕踩坑',content:'测评、成分科普、真实对比',trigger:'医生/达人背书、真实试用反馈',quote:'给宝宝最安心的守护'},
  {name:'阿琳',title:'精打细算宝妈',age:'32岁',stage:'二胎妈妈',city:'新一线城市',share:'32%',goal:'高性价比、大包装、稳定复购',pain:'价格波动、优惠复杂',content:'囤货攻略、套装促销、直播福利',trigger:'满减、赠品、直播间限时价',quote:'精打细算，也能给宝宝最好的'},
  {name:'王阿姨',title:'带娃长辈',age:'58岁',stage:'隔代育儿',city:'三四线城市',share:'18%',goal:'简单放心、舒适不刺激',pain:'尺码难选、功能术语不懂',content:'大字说明、专家讲解、真实家庭演示',trigger:'子女推荐、口碑信任、线下体验',quote:'宝宝舒服，我们才放心'},
  {name:'Mia',title:'分享型妈妈',age:'30岁',stage:'1–3岁宝宝',city:'活跃内容分享者 / KOC',share:'22%',goal:'高颜值、好用、愿意分享',pain:'普通内容不愿转发',content:'开箱、挑战、UGC互动、育儿日常',trigger:'社交认同、品牌活动、联名礼盒',quote:'好用又好看，当然要分享给妈妈圈'},
];

const nav = [
  ['overview','总览',Home],['persona','Persona Studio',Users],['world','World Builder',Sparkles],
  ['content','内容策略',ClipboardList],['live','直播作战室',Radio],['growth','投放优化',BarChart3],
  ['product','商品分析',Package],['experiment','模拟实验',FlaskConical],['report','报告',Box],
] as const;

const campaigns = [
  ['新手妈妈拉新','0–6个月宝宝','¥80万','4.8%','¥28.6','3.2','投放中'],
  ['二胎家庭复购','2胎+家庭','¥60万','3.9%','¥24.8','4.1','投放中'],
  ['直播间引流','短视频到直播','¥100万','5.6%','¥22.1','4.5','投放中'],
  ['爆款纸尿裤转化','全量人群','¥46万','3.2%','¥31.5','2.8','优化中'],
];

function Metric({label,value,sub}:{label:string,value:string,sub:string}){
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>
}

function PersonaCard({p}:{p:Persona}){
  return <article className="persona-card">
    <div className="persona-photo"><div className="avatar-orb">{p.name.slice(0,1)}</div><span className="persona-badge">{p.title}</span><span className="share">人群规模 {p.share}</span></div>
    <div className="persona-name">{p.name}<span>「{p.quote}」</span></div>
    <div className="persona-meta"><span>{p.age}</span><span>{p.stage}</span><span>{p.city}</span></div>
    <dl>
      <div><dt>核心需求</dt><dd>{p.goal}</dd></div><div><dt>主要痛点</dt><dd>{p.pain}</dd></div>
      <div><dt>偏好内容</dt><dd>{p.content}</dd></div><div><dt>购买触发</dt><dd>{p.trigger}</dd></div>
    </dl>
  </article>
}

function PersonaView(){
  return <>
    <Header title="Persona Studio / 人群洞察中心" subtitle="基于多平台消费行为与真实用户洞察，理解纸尿裤消费者，制定精准内容与投放策略。" />
    <section className="hero-panel"><div><div className="eyebrow">纸尿裤品类增长机会</div><h2>连接真实家庭，找到每个阶段的增长杠杆</h2><p>从抖音短视频、直播、交易与投放行为中，形成持续更新的消费者画像。</p></div><div className="hero-baby">宝宝成长<br/><small>从每一片纸尿裤开始</small></div></section>
    <section className="metrics-row"><Metric label="目标人群规模" value="1,250万" sub="0–3岁婴幼儿家庭"/><Metric label="品类内容同比增长" value="+62%" sub="抖音平台"/><Metric label="月均相关内容量" value="28.5万" sub="短视频 + 直播"/><Metric label="电商GMV同比增长" value="+48%" sub="行业大盘"/></section>
    <div className="two-col"><section className="panel"><div className="section-title"><span>核心人群画像</span><button>+ 新建人群</button></div><div className="persona-grid">{personas.map(p=><PersonaCard key={p.name} p={p}/>)}</div></section>
    <aside className="panel insight"><div className="section-title"><span>AI 洞察建议</span><Bot size={18}/></div><ol><li><b>纸尿裤品类的核心机会</b><p>围绕“安全、舒适、性价比”展开，并重点放大夜间使用场景。</p></li><li><b>人群差异化策略</b><p>新手妈妈重科普，精打细算重福利，长辈重简单，分享型重社交传播。</p></li><li><b>下一步行动建议</b><p>按人群生成短视频脚本、直播话术与千川素材包。</p></li></ol><button className="primary">生成完整策略方案 <ChevronRight size={16}/></button></aside></div>
    <section className="panel journey"><div className="section-title"><span>消费者旅程</span><small>从内容种草到购买复购</small></div><div className="journey-flow"><Journey icon={Video} title="抖音短视频" text="看视频 · 点赞 · 评论 · 收藏"/><ChevronRight/><Journey icon={Radio} title="抖音直播" text="进入直播 · 问答 · 领券"/><ChevronRight/><Journey icon={ShoppingCart} title="商品详情 / 购物车" text="查看详情 · 对比 · 加购"/><ChevronRight/><Journey icon={Heart} title="下单 / 复购" text="支付 · 评价 · 推荐"/></div></section>
  </>
}

function Journey({icon:Icon,title,text}:{icon:any,title:string,text:string}){return <div className="journey-node"><Icon/><div><b>{title}</b><span>{text}</span></div></div>}
function Header({title,subtitle}:{title:string,subtitle:string}){return <header className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div><button className="primary"><Play size={16}/> 开始模拟</button></header>}

function ContentView(){
  const topics=['宝宝整夜不漏尿挑战','夏季透气纸尿裤测评','新生儿囤货清单','红屁屁护理误区','纸尿裤尺码怎么选','夜用纸尿裤真实对比'];
  return <><Header title="内容策略中心 / Content Strategy Studio" subtitle="基于不同人群的消费洞察，生成抖音短视频创意、直播话术与内容计划。"/>
    <section className="metrics-row"><Metric label="本周内容机会" value="36 ↑" sub="基于热点与人群洞察"/><Metric label="预计互动提升" value="+62%" sub="对比历史内容表现"/><Metric label="直播预约点击率" value="8.3%" sub="预计高于行业水平"/><Metric label="素材复用效率" value="3.1倍" sub="一稿多用，多场景复用"/></section>
    <div className="content-grid"><section className="panel"><div className="section-title"><span>AI 选题机会</span><button>查看更多</button></div><div className="topic-list">{topics.map((t,i)=><div className="topic" key={t}><b>{i+1}</b><span><strong>{t}</strong><small>{['新手妈妈 小雨','精打细算宝妈 阿琳','分享型妈妈 Mia'][i%3]}</small></span><em>🔥 {92-i*4}</em></div>)}</div>
      <div className="section-title spaced"><span>短视频脚本卡片</span><button>查看更多脚本</button></div><div className="script-grid">{['整夜不漏尿挑战','夏季透气纸尿裤测评','新生儿囤货清单'].map((x,i)=><div className="script" key={x}><div className="thumb">00:{45-i*7}</div><b>{x}</b><p><strong>开场钩子：</strong>{['这片纸尿裤真的能整夜不漏？','夏天宝宝屁屁会闷吗？实测给你看','这3样新手妈妈最容易囤错'][i]}</p><p><strong>核心卖点：</strong>真实测试 + 场景化展示</p></div>)}</div></section>
      <aside className="panel live-plan"><div className="section-title"><span>直播作战计划</span><span className="live">LIVE</span></div><h2>今天 20:00 夏日透气专场：让宝宝清爽一整夏</h2><div className="live-preview"><div className="presenter">主播<br/><span>手持纸尿裤讲解</span></div><Play size={34}/></div><h3>核心讲解点</h3><div className="chip-grid"><span>吸水实验</span><span>透气对比</span><span>尺码讲解</span><span>优惠机制</span></div><h3>直播流程</h3><ol className="timeline"><li>20:00 开场欢迎 + 福利预告</li><li>20:10 夏季纸尿裤真实体验</li><li>20:30 产品组合讲解 + 尺码指南</li><li>21:00 用户问题答疑 + 红屁屁护理</li><li>21:30 限时优惠 + 促单冲刺</li></ol></aside>
    </div></>
}

function GrowthView(){return <><Header title="投放优化中心 / Growth & Media Optimizer" subtitle="基于千川 / 巨量投放数据与消费者洞察，优化人群定向、创意、预算分配与转化效率。"/>
  <section className="metrics-row"><Metric label="总预算" value="¥286万" sub="较上月 +18%"/><Metric label="ROI" value="3.8" sub="较上月 +42%"/><Metric label="获客成本 CPA" value="¥26.5" sub="较上月 -30%"/><Metric label="新客增长" value="+62%" sub="新增用户 12.6万"/></section>
  <div className="two-col growth-layout"><section className="panel"><div className="section-title"><span>投放活动控制台</span><small>巨量千川</small></div><div className="campaign-grid">{campaigns.map(c=><div className="campaign" key={c[0]}><div className="campaign-head"><div className="mini-avatar">{c[0][0]}</div><div><b>{c[0]}</b><small>{c[1]}</small></div><span className="status">● {c[6]}</span></div><div className="campaign-kpis"><span>预算<b>{c[2]}</b></span><span>CTR<b>{c[3]}</b></span><span>CPA<b>{c[4]}</b></span><span>ROI<b>{c[5]}</b></span></div><button>查看详情</button></div>)}</div>
    <div className="split-lower"><div><div className="section-title"><span>人群投放矩阵</span></div><div className="bars">{personas.map((p,i)=><div key={p.name}><span>{p.title}</span><i style={{width:`${58+i*9}%`}}/><b>{22+i*4}%</b></div>)}</div></div><div><div className="section-title"><span>创意 A/B 测试</span></div><div className="creative-row">{['C1 整夜不漏','C2 透气实测','C3 医护安全','C4 超薄轻柔'].map((x,i)=><div><div className="creative-thumb">{i+1}</div><b>{x}</b><span>ROI {3.2+i*.4}</span></div>)}</div></div></div>
  </section><aside className="panel insight"><div className="section-title"><span>AI 优化建议</span><WandSparkles size={18}/></div><ol><li><b>增加阿琳人群预算</b><p>二胎妈妈 ROI 达 4.1，建议增加 20–30% 预算。</p></li><li><b>聚焦低效创意</b><p>暂停 C3 素材，将预算集中到 C2 透气实测。</p></li><li><b>直播观看人群再营销</b><p>对近 7 天观看未购买用户开启专属商品卡。</p></li><li><b>为新手妈妈提供专属优惠组合</b><p>“试用装 + 单包 + 晚安裤”降低首次购买门槛。</p></li></ol></aside></div>
  <section className="panel chart-panel"><div className="section-title"><span>投放效果趋势（近7天）</span><span>曝光 · 点击 · 直播进房 · 加购 · 支付</span></div><div className="fake-chart"><svg viewBox="0 0 1000 180" preserveAspectRatio="none"><polyline points="0,140 130,110 260,108 390,65 520,78 650,74 780,82 900,70 1000,90"/><polyline points="0,160 130,145 260,138 390,105 520,112 650,105 780,110 900,103 1000,118" className="line2"/></svg></div></section>
  </>}

function OverviewView(){return <><Header title="纸尿裤电商 Business World Agent" subtitle="连接消费者、内容、直播、投放与购买转化，形成可执行的品牌经营闭环。"/><section className="world-hero panel"><div className="world-core"><div className="orbit"><Sparkles/><b>Business<br/>World Agent</b><small>让数据与 AI 连接真实消费者</small></div>{personas.map((p,i)=><div className={`orbit-person p${i+1}`} key={p.name}><span>{p.name}</span><small>{p.title}</small></div>)}</div><div className="worlds"><WorldCard n="1" title="抖音短视频世界" text="种草触达 · 激发兴趣" icon={Video}/><WorldCard n="2" title="抖音直播世界" text="实时互动 · 加速转化" icon={Radio}/><WorldCard n="3" title="千川 / 巨量投放世界" text="精准投放 · 放大生意" icon={Megaphone}/><WorldCard n="4" title="电商交易世界" text="顺畅购买 · 持续复购" icon={ShoppingCart}/><WorldCard n="5" title="家庭使用世界" text="真实体验 · 产品口碑" icon={Home}/><WorldCard n="6" title="社交口碑世界" text="口碑传播 · 信任扩散" icon={MessageCircle}/></div></section>
  <section className="metrics-row"><Metric label="内容互动率" value="6.8%" sub="↑ +120%"/><Metric label="直播间加购率" value="22.5%" sub="↑ +80%"/><Metric label="商品转化率" value="8.3%" sub="↑ +65%"/><Metric label="ROI" value="3.8" sub="↑ +90%"/></section>
  <section className="panel flow-band"><b>经营闭环</b>{['洞察消费者','设计内容','直播讲解','广告放大','购买转化','复盘优化'].map((x,i)=><div><span>{i+1}</span>{x}{i<5&&<ChevronRight/>}</div>)}</section></>}
function WorldCard({n,title,text,icon:Icon}:{n:string,title:string,text:string,icon:any}){return <div className="world-card"><span>{n}</span><Icon/><div><b>{title}</b><small>{text}</small></div></div>}

function WorldBuilderView(){return <><Header title="World Builder / 消费者世界构建器" subtitle="将真实消费者、内容、商品、直播、投放和交易行为连接成可运行的数字市场。"/><section className="panel builder"><div className="builder-steps">{['Consumer Agent Bank','Market World','Scenario Experiment','Decision Engine'].map((x,i)=><div><span>{i+1}</span><b>{x}</b><p>{['长期消费者状态机与决策体','商品、价格、渠道、品牌与社交关系','注入刺激并运行多轮模拟','输出人群反应、机会与行动建议'][i]}</p></div>)}</div><div className="simulator"><div><h3>模拟任务</h3><textarea defaultValue="如果将“夏季透气”卖点用于新手妈妈短视频，并在直播间叠加满299减40，千川预算增加20%，会发生什么？"/><button className="primary"><Play size={16}/> 运行 World Simulation</button></div><div className="sim-result"><div className="pulse">AI</div><h3>预测结果</h3><p>新手妈妈短视频互动率预计 +18%～26%，直播进房率 +12%，最终 ROI 预计从 3.8 提升至 4.2。</p><div className="confidence">Reliability Score <b>R1 82 · R2 78 · R3 74 · R4 80</b></div></div></div></section></>}

export default function App(){
  const [active,setActive]=useState('persona');
  const view=useMemo(()=>active==='persona'?<PersonaView/>:active==='content'?<ContentView/>:active==='growth'?<GrowthView/>:active==='world'?<WorldBuilderView/>:<OverviewView/>,[active]);
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">↗</div><div><b>Business<br/>World Agent</b><small>AI × CONSUMER WORLD</small></div></div><nav>{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(['live','product','experiment','report'].includes(id)?'overview':id)}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-promo">让 AI 连接每一个<br/>真实的消费者<small>For A Brighter Tomorrow</small><div className="diaper-box">DIAPER</div></div></aside><section className="workspace"><div className="topbar"><div className="search"><Search size={16}/><span>搜索人群、内容、商品或策略...</span></div><div className="date">2024-05-01　~　2024-05-31</div><div className="team">BWA 团队</div></div><div className="canvas">{view}</div></section></main>
}
