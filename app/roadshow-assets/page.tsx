'use client';

const assets = [
  {id:'globe-grid',title:'Hero / 商业世界背景',src:'/roadshow-assets/globe-grid.svg',note:'3840×2160 SVG · 用于 Landing hero 与路演背景'},
  {id:'product-console',title:'Product Demo Console',src:'/roadshow-assets/product-console.svg',note:'复用仓库 Product Demo 的事件流、模拟实验、AI 建议和数据库反馈模式'},
  {id:'event-to-action',title:'商业事件 → 行动',src:'/roadshow-assets/event-to-action.svg',note:'商业事件、行为原型、模拟推演、建议行动四段链路'},
  {id:'potato-loop',title:'Potato Mode',src:'/roadshow-assets/potato-loop.svg',note:'25 分钟：聚焦问题 → 模拟 → 建议 → 汇报'},
  {id:'value-bars',title:'业务价值',src:'/roadshow-assets/value-bars.svg',note:'四个路演指标模块，可直接用于 closing slide'},
];

export default function RoadshowAssetsPage(){
  return <main className="asset-lab">
    <header>
      <div><p>Business World Agent · Roadshow Asset Lab</p><h1>路演资产工作台</h1><span>五张概念稿 → 高清矢量 assets → Web screens → PPT</span></div>
      <nav><a href="/landing">Landing</a><a href="/roadshow">Roadshow</a><a href="/?screen=experiment">Product Demo</a></nav>
    </header>
    <section className="principles">
      <div><b>Vector first</b><span>所有核心视觉用 SVG，缩放到 4K / 8K 仍然清晰。</span></div>
      <div><b>Product truth</b><span>视觉组件从仓库 Product Demo 的真实交互模式提取，不做空壳截图。</span></div>
      <div><b>One asset, two outputs</b><span>同一资产同时服务网页与 PPT，避免两套视觉体系漂移。</span></div>
    </section>
    <section className="grid">
      {assets.map((asset,index)=><article key={asset.id}>
        <div className="cap"><span>{String(index+1).padStart(2,'0')}</span><div><b>{asset.title}</b><small>{asset.note}</small></div></div>
        <div className="preview"><img src={asset.src} alt={asset.title}/></div>
        <div className="meta"><code>{asset.src}</code><a href={asset.src} target="_blank">打开原始 SVG ↗</a></div>
      </article>)}
    </section>
    <section className="composition">
      <div>
        <p>Screen composition</p>
        <h2>不是把 PPT 截图贴进网页，而是让同一套资产参与真实布局。</h2>
        <span>Landing 用 Product Demo Console 做伪交互主视觉；Roadshow 用 Event-to-Action 与 Potato Mode 做解释页；最后用 Value Bars 收尾。</span>
      </div>
      <div className="mini">
        <img src="/roadshow-assets/product-console.svg" alt="Product demo console"/>
        <img src="/roadshow-assets/event-to-action.svg" alt="Event to action flow"/>
      </div>
    </section>
    <style>{`
      .asset-lab{min-height:100vh;background:#020617;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,'PingFang SC','Microsoft YaHei',sans-serif;padding:34px 4vw 80px}.asset-lab *{box-sizing:border-box}header{display:flex;justify-content:space-between;gap:28px;align-items:flex-end;padding-bottom:26px;border-bottom:1px solid #17345e}header p{color:#60a5fa;font-weight:800}header h1{font-size:64px;margin:6px 0;letter-spacing:-.05em}header span{color:#9fb7d8}nav{display:flex;gap:10px;flex-wrap:wrap}nav a,.meta a{color:#dbeafe;text-decoration:none;border:1px solid #2857a1;border-radius:999px;padding:9px 14px;background:#08152b}.principles{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:28px 0}.principles div{padding:22px;border:1px solid #1f4077;background:#071326;border-radius:20px}.principles b{display:block;font-size:22px;margin-bottom:6px}.principles span{color:#9fb7d8;line-height:1.7}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}article{border:1px solid #1f4077;background:#061126;border-radius:24px;overflow:hidden}.cap{display:flex;gap:16px;align-items:flex-start;padding:20px}.cap>span{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#22d3ee,#7c3aed);font-weight:900}.cap b{display:block;font-size:22px}.cap small{display:block;color:#9fb7d8;margin-top:5px;line-height:1.5}.preview{aspect-ratio:16/9;background:radial-gradient(circle at 70% 20%,#102b63,#020617 65%);display:grid;place-items:center;overflow:hidden}.preview img{width:100%;height:100%;object-fit:contain}.meta{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:16px 20px;color:#7dd3fc}.meta code{overflow-wrap:anywhere}.composition{margin-top:28px;padding:28px;border:1px solid #1f4077;background:linear-gradient(135deg,#071326,#0a1730);border-radius:24px;display:grid;grid-template-columns:.8fr 1.2fr;gap:26px;align-items:center}.composition p{color:#22d3ee;font-weight:800}.composition h2{font-size:38px;line-height:1.05;margin:10px 0}.composition span{color:#9fb7d8;line-height:1.8}.mini{display:grid;grid-template-columns:1fr 1fr;gap:14px}.mini img{width:100%;border:1px solid #2356a0;border-radius:16px;background:#020617}@media(max-width:900px){.grid,.principles,.composition,.mini{grid-template-columns:1fr}header{align-items:flex-start;flex-direction:column}header h1{font-size:46px}}
    `}</style>
  </main>;
}
