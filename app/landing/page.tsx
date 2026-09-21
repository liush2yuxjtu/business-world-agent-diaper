'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Database, Download } from 'lucide-react';
import catalog from '@/lib/roadshow/catalog.json';
import { WorldNav, WorldStage, personaAsset, useBusinessSnapshot } from '../_components/world-model/world-model';
import { ScenarioRunner } from '../_components/world-model/scenario-runner';

export default function LandingPage() {
  const {snapshot,error,refresh} = useBusinessSnapshot();
  const [personaId,setPersonaId] = useState('new-parents');
  const [scenarioId,setScenarioId] = useState('channel');
  const persona = catalog.personas.find(p=>p.id===personaId) ?? catalog.personas[0];
  const scenario = catalog.scenarios.find(s=>s.id===scenarioId) ?? catalog.scenarios[1];
  return <main className="wm wm-page"><WorldNav/>
    <section className="wm-landing-hero"><div className="wm-landing-heading"><div><p className="wm-eyebrow">BUSINESS WORLD AGENT / 尿布行业演示</p><h1>商业世界里的每个角色，<br/><em>都有值得理解的选择。</em></h1></div><div><p className="wm-muted">把家庭需求、经营事件和商业伙伴连接在一起。与 World Agent 查看同一份数据，比较下一步行动。</p><div className="wm-hero-actions"><a className="wm-primary" href="/world">探索经营世界<ArrowUpRight size={17}/></a><a href="#demo">现场运行情景<ArrowRight size={15}/></a></div></div></div>
      <div className="wm-landing-preview"><div className="wm-preview-bar"><span><i className="wm-live-dot"/>WORLD MODEL / 点击一个家庭，了解它的选择</span><span className="wm-tag">交互预览 · 角色模板</span></div><WorldStage personaId={personaId} onPersona={setPersonaId}/><div className="wm-preview-detail"><div><b>{persona.name}</b>{persona.goal}。{persona.action}。</div><a href="/world">查看角色与关联事件<ArrowRight size={16}/></a></div></div>
    </section>
    <section className="wm-marketing-section" id="how"><div className="wm-section-head"><div><p className="wm-eyebrow">一个共同的经营视角</p><h2>先理解发生了什么，<br/>再讨论可以做什么。</h2></div><p className="wm-muted">从 Product Demo 的真实工作流程出发。</p></div><div className="wm-workflow">{[['01','发现事件','核对商品库存与经营快照，识别需要关注的信号。'],['02','理解角色','查看家庭的目标、顾虑与行为，连接相关商业实体。'],['03','比较情景','调整一个假设，查看基线和线性推演的差异。'],['04','保留决策','保存情景并重新读取，让团队回看假设与结果。']].map(([n,title,copy])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="wm-marketing-section"><p className="wm-eyebrow">面向业务团队</p><h2>每个角色的问题，<br/>放进同一个经营世界。</h2><div className="wm-marketing-roles">{catalog.personas.filter(p=>['ceo','marketing','product-manager','supply-chain'].includes(p.id)).map(p=><article key={p.id}><img src={personaAsset(p)} alt=""/><h3>{p.name}</h3><p>{p.goal}。{p.action}。</p></article>)}</div></section>
    <section className="wm-marketing-section" id="demo"><p className="wm-eyebrow">现场操作 / 数据库驱动</p><h2>现在，运行一次情景。</h2><p className="wm-muted">无需登录。演示使用数据库中的合成经营数据，保存成功后可刷新回看。线性推演不代表已发生的市场结果。</p><div className="wm-demo-selector">{catalog.scenarios.slice(0,4).map(s=><button key={s.id} aria-pressed={scenarioId===s.id} onClick={()=>setScenarioId(s.id)}>{s.name}</button>)}</div>{error&&<div role="alert" className="wm-load-error">{error}<button onClick={()=>void refresh()}>重试</button></div>}<ScenarioRunner snapshot={snapshot} scenario={scenario} context="路演现场情景"/></section>
    <section className="wm-marketing-section"><p className="wm-eyebrow">真实操作回放</p><h2>一次库存情景的讨论过程。</h2><p className="wm-muted">本次浏览器录屏：选择供应链角色、检查库存信号、运行情景，刷新后重新读取记录。</p><video controls preload="metadata" poster="/roadshow-assets/world/demo-cover.svg" className="wm-demo-video" aria-label="World Model 真实操作回放"><source src="/roadshow-assets/world-model-demo.webm" type="video/webm"/>浏览器暂不支持回放，可直接打开经营世界体验。</video><p className="wm-small">录制于 2026-09-21 · 合成经营数据 · 当前模型为方向性线性推演。</p></section>
    <section className="wm-closing"><div><p className="wm-eyebrow">下一次业务讨论，可以从这里开始。</p><h2>带着共同的基线，<br/>做出可以回看的判断。</h2></div><div className="wm-hero-actions"><a className="wm-primary" href="/world">打开经营世界<ArrowUpRight size={16}/></a><a href="/roadshow-assets/business-world-roadshow.pptx" download><Download size={16}/>下载路演 PPT</a></div></section>
    <footer className="wm-footer"><span>Business World Agent / Diaper Industry</span><span><Database size={12} style={{display:'inline',marginRight:5}}/>合成数据 · 真实存储 · 方向性情景</span></footer>
  </main>;
}
