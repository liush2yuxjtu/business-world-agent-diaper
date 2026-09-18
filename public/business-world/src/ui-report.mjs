import {userText as h,METRICS,LEVERS,formatMetric as fmt} from './ui-state.mjs';
/** Both exports consume the selected immutable report, never the changing workspace snapshot. */
export function reportHtml(report){
  const b=report.baseline,r=report.scenario;
  return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+h(report.title)+'</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#172b4d;max-width:900px;margin:36px auto;padding:0 24px}h1{font-size:30px}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #ccd6e2;text-align:left}.notice{padding:12px;background:#eff4fa}p{overflow-wrap:anywhere;white-space:pre-wrap}button{padding:12px;border:1px solid #ccd6e2;border-radius:6px;background:white;cursor:pointer}@media print{button{display:none}body{margin:0;max-width:none}h2{break-after:avoid}table{break-inside:avoid}}</style><body><button id="printReport">打印 / 保存 PDF</button><h1>'+h(report.title)+'</h1><p>Business World Agent · '+h(new Date(report.createdAt).toLocaleString('zh-CN'))+'</p><p class="notice">人工录入 · 尚未核验。情景估算不是实际经营结果，也不代表销量预测。</p><h2>经营记录</h2><p>来源：'+h(b.name)+'\n记录时间：'+h(b.updatedAt)+'\n来源说明：'+h(b.notes||'未填写')+'</p><table><thead><tr><th>指标</th><th>基准记录</th>'+(r?'<th>情景估算</th>':'')+'</tr></thead><tbody>'+Object.entries(METRICS).map(([k,m])=>'<tr><td>'+h(m.label)+'</td><td>'+h(fmt(k,b.metrics[k]))+'</td>'+(r?'<td>'+h(fmt(k,r.modeled[k]))+'</td>':'')+'</tr>').join('')+'</tbody></table>'+(r?'<h2>情景与假设</h2><p>'+h(r.prompt)+'\n'+h(LEVERS[r.lever].label)+'：'+h(r.change)+'%\n'+h(r.assumptions.join('；'))+'\n计算方法：GMV ×（1 + 变化比例 × '+h(r.elasticity)+'）。灵敏度为设定假设，尚未通过历史数据校准。</p>':'<p>本报告未附加情景估算。</p>')+'<h2>人工备注</h2><p>'+h(report.note||'未填写')+'</p></body></html>';
}
export async function downloadPresentation(report){
  if(typeof globalThis.PptxGenJS!=='function')throw Error('export-unavailable');
  const pptx=new globalThis.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Business World Agent';pptx.subject='经营记录与情景比较';pptx.title=report.title;pptx.lang='zh-CN';
  pptx.theme={headFontFace:'Microsoft YaHei',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
  function slide(title,lines){const s=pptx.addSlide();s.background={color:'FFFFFF'};s.addText(title,{x:0.65,y:0.45,w:12,h:0.8,fontSize:28,bold:true,color:'172B4D',breakLine:false});s.addText(lines.join('\n'),{x:0.7,y:1.6,w:11.9,h:4.9,fontSize:18,breakLine:false,color:'354966',paraSpaceAfterPt:14,fit:'shrink',valign:'top'});s.addText('人工录入 · 尚未核验 / 情景估算不是实际结果',{x:0.7,y:6.85,w:12,h:0.3,fontSize:11,color:'53637A'});return s;}
  const b=report.baseline,r=report.scenario;
  slide(report.title,['Business World Agent','来源：'+b.name,'记录时间：'+b.updatedAt,'报告时间：'+report.createdAt]);
  slide('经营记录',Object.entries(METRICS).map(([k,m])=>m.label+'：'+fmt(k,b.metrics[k])+(r?'  → 情景 '+fmt(k,r.modeled[k]):'')));
  if(r)slide('情景与假设',[r.prompt,LEVERS[r.lever].label+' '+r.change+'%',...r.assumptions,'GMV ×（1 + 变化比例 × '+r.elasticity+'）','灵敏度为设定假设，尚未通过历史数据校准。']);
  // Long notes receive dedicated slides rather than being silently clipped.
  const notes=report.note||'未填写人工备注。';for(let i=0;i<notes.length;i+=500)slide('人工备注'+(notes.length>500?' · '+(Math.floor(i/500)+1):''),[notes.slice(i,i+500)]);
  await pptx.writeFile({fileName:'business-world-report.pptx',compression:true});
}
