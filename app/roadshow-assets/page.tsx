'use client';

import { useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import manifest from '@/public/roadshow-assets/manifest.json';
import { WorldNav } from '../_components/world-model/world-model';

export default function RoadshowAssetsPage() {
  const [category,setCategory]=useState('全部');
  const categories=['全部',...new Set(manifest.assets.map(a=>a.category))];
  const assets=manifest.assets.filter(a=>category==='全部'||a.category===category);
  return <main className="wm wm-page"><WorldNav/><div className="wm-lab"><div className="wm-lab-heading"><div><p className="wm-eyebrow">SHARED ASSETS / WEB + POWERPOINT</p><h1>同一套资产，组合整个经营世界。</h1><div className="wm-lab-stats"><span><b>{manifest.assets.length}</b>原创 SVG</span><span><b>16</b>角色模板</span><span><b>8</b>场景缩略图</span><span>3840 × 2160 / 方形 2160 × 2160</span></div></div><div className="wm-hero-actions"><a href="/roadshow-assets/business-world-assets.zip" download><Download size={16}/>下载全部资产</a><a href="/roadshow-assets/business-world-roadshow.pptx" download>下载 PPT</a></div></div><div className="wm-lab-filters" aria-label="资产类别">{categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><p className="wm-small" role="status">显示 {assets.length} 个资产。全部由代码生成，角色与包装均为原创概念设计。</p><section className="wm-asset-grid">{assets.map(a=><article className="wm-asset" key={a.id}><div><img src={a.path} alt={a.title} loading="lazy"/></div><section><h3>{a.title}</h3><p>{a.category} / SVG / Web & PPT</p><a href={a.path} target="_blank" rel="noreferrer">打开矢量原稿<ArrowUpRight size={12}/></a></section></article>)}</section></div><footer className="wm-footer"><span>可缩放的矢量资产 / 中文正文保持可编辑</span><a href="/world">打开经营世界</a></footer></main>;
}
