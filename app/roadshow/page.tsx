'use client';

import { Download, ArrowUpRight } from 'lucide-react';
import catalog from '@/lib/roadshow/catalog.json';
import { WorldNav, useBusinessSnapshot } from '../_components/world-model/world-model';
import { ScenarioRunner } from '../_components/world-model/scenario-runner';

export default function RoadshowPage() {
  const {snapshot,error,refresh}=useBusinessSnapshot();
  return <main className="wm wm-deck"><WorldNav/>{catalog.slides.map((slide,i)=><section key={slide.id} className="wm-deck-slide" data-slide={i+1}><div><p className="wm-eyebrow">{slide.kicker}</p><h1>{slide.title}</h1><p className="wm-muted">{slide.copy}</p><div className="wm-hero-actions"><a className="wm-primary" href={slide.id==='experiment'?'#live-demo':'/world'}>{slide.id==='experiment'?'现场运行一次':'打开经营世界'}<ArrowUpRight size={16}/></a></div></div><img src={`/roadshow-assets/${slide.visual}`} alt={slide.title.replace('\n','')}/><span className="wm-slide-number">BUSINESS WORLD AGENT / {String(i+1).padStart(2,'0')} — 05</span></section>)}<section className="wm-deck-live" id="live-demo"><p className="wm-eyebrow">PRODUCT DEMO / 现场反馈</p><h2>真实运行，真实保存。</h2>{error&&<div role="alert" className="wm-load-error">{error}<button onClick={()=>void refresh()}>重试</button></div>}<ScenarioRunner snapshot={snapshot} scenario={catalog.scenarios[1]} context="五页路演现场演示"/></section><section className="wm-deck-download"><p>五页路演 / 与网页共用同一份内容与资产</p><a href="/roadshow-assets/business-world-roadshow.pptx" download><Download size={18}/>下载 PowerPoint 路演稿</a></section></main>;
}
