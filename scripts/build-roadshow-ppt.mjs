import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = process.env.BWA_SOURCE_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const require = createRequire(import.meta.url);
const {Presentation, PresentationFile} = await import(pathToFileURL(require.resolve('@oai/artifact-tool', {paths: runtime ? [runtime] : [root]})).href);
const buildDir = process.env.BWA_PPT_BUILD ?? path.join(root, '.roadshow-build');
const output = process.env.BWA_PPT_OUTPUT ?? path.join(root, 'public/roadshow-assets/business-world-roadshow.pptx');
const catalog = JSON.parse(await fs.readFile(path.join(root,'lib/roadshow/catalog.json'),'utf8'));
const evidencePath = process.env.BWA_EVIDENCE_DIR ?? path.join(root, 'docs/verification/roadshow-local');
const evidence = evidencePath ? JSON.parse(await fs.readFile(path.join(evidencePath,'report.json'),'utf8')) : null;
if (!evidence || evidence.result !== 'PASS' || !evidence.savedRun?.id) throw new Error('A passing real-browser report and screenshot are required. Set BWA_EVIDENCE_DIR.');
await fs.mkdir(buildDir,{recursive:true});
await fs.mkdir(path.dirname(output),{recursive:true});
const ppt = Presentation.create({slideSize:{width:1280,height:720}});
const font = 'World Sans SC';
function label(slide,value,x,y,w,h,size=26,color='#D4E0EC',bold=false){
 const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 shape.text=value;
 shape.text.style={typeface:font,fontSize:size,color,bold,autoFit:'none'};
 return shape;
}
async function artwork(slide,file,x,y,w,h){
 const filePath=path.join(root,'public/roadshow-assets',file);
 const bytes=await fs.readFile(filePath);
 const [,sourceWidth,sourceHeight]=bytes.toString().match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
 const scale=Math.min(w/Number(sourceWidth),h/Number(sourceHeight));
 const width=Number(sourceWidth)*scale,height=Number(sourceHeight)*scale;
 slide.images.add({blob:new Uint8Array(bytes),contentType:'image/svg+xml',alt:file,fit:'contain',position:{left:x+(w-width)/2,top:y+(h-height)/2,width,height}});
}
function base(i){const s=ppt.slides.add();s.background.fill='#09131F';label(s,catalog.slides[i].kicker,60,42,900,28,16,'#78DAD7');label(s,`Business World Agent    /    ${String(i+1).padStart(2,'0')} — 05`,60,667,1080,24,13,'#8FA6BA');return s;}
{
 const s=base(0);
 label(s,catalog.slides[0].title,60,185,480,170,48,'#F0F4F6',true);
 label(s,catalog.slides[0].copy,60,386,437,130,24,'#AABED0');
 label(s,'尿布行业 · 数据库驱动演示',60,560,500,36,20,'#78DAD7');
 await artwork(s,'world/world-model-scene.svg',550,151,680,420);
 s.speakerNotes.textFrame.setText('演示数据为合成数据，保存在现有 Supabase 数据库中。世界关系为业务结构示意，不是已验证的因果模型。资产由代码生成，未使用 image generation。产品依据：app/page.tsx、business-world-screens.tsx、real-service.ts。');
}
{
 const s=base(1);
 label(s,catalog.slides[1].title,60,135,510,145,44,'#F0F4F6',true);
 label(s,'同一个产品，人们在意的事情不同。\n\n目标、顾虑、触发条件与行为，\n决定要验证怎样的假设。',60,325,455,180,25,'#AABED0');
 label(s,'4 类数据库人群 / 16 个角色模板',60,560,450,36,20,'#78DAD7');
 for(let i=0;i<8;i++){
  const p=catalog.personas[i]; const x=565+(i%4)*159,y=151+Math.floor(i/4)*230;
  await artwork(s,`personas/consumer/${p.id}.svg`,x,y,139,139);
  label(s,p.name,x-5,y+154,155,39,18,'#DAE8ED');
 }
 s.speakerNotes.textFrame.setText('数据库中已有 xiaoyu、alin、wangyi、mia 四类合成人群。其他客户与业务角色为研究模板。不能将模板数量当作实际客户数量。');
}
{
 const s=base(2);
 label(s,catalog.slides[2].title.replace('\n',''),60,112,1160,80,45,'#F0F4F6',true);
 label(s,'信号进入讨论，角色解释影响，情景帮助比较。',60,208,1100,50,26,'#AABED0');
 const steps=[['events/stock-risk.svg','行业事件','核对当前库存'],['personas/business/supply-chain.svg','角色视角','理解供给风险'],['scenarios/inventory.svg','情景比较','明确假设与边界'],['feedback/saved.svg','保留决策','保存并重新读回']];
 for(let i=0;i<steps.length;i++){
  const [file,title,copy]=steps[i],x=65+i*310;
  await artwork(s,file,x+32,308,196,196);
  label(s,title,x,516,260,45,27,'#F0F4F6',true);
  label(s,copy,x,560,270,32,19,'#AABED0');
  if(i<steps.length-1)label(s,'→',x+262,380,40,50,30,'#78DAD7');
 }
 label(s,'库存提醒使用当前数据库值；其余事件模板明确标记为演示假设。',60,612,1160,34,20,'#AABED0');
 s.speakerNotes.textFrame.setText('库存规则：当前商品 stockDays <= 7 触发提醒，这是演示阈值。库存不足不等于已发生缺货，也不是时间趋势证据。其他需求、CPA、竞品价格、区域人口等事件为明确标记的模板。');
}
{
 const s=base(3);
 label(s,catalog.slides[3].title,60,135,435,150,43,'#F0F4F6',true);
 label(s,'调整投放效率假设。\n\n读取数据库基线，运行线性情景，\n保存后按记录 ID 重新读回。',60,329,428,171,23,'#AABED0');
 const screenshot=path.join(evidencePath,'scenario-saved.jpg');
 s.images.add({blob:new Uint8Array(await fs.readFile(screenshot)),contentType:'image/jpeg',alt:'本次真实浏览器操作：情景已保存并读回',fit:'contain',position:{left:522,top:128,width:700,height:469}});
 label(s,'本次运行截图 · 合成经营数据 · 非市场预测',526,605,680,32,17,'#78DAD7');
 s.speakerNotes.textFrame.setText(`真实操作证据：${evidence.baseUrl}。运行时间：${evidence.checkedAt}。情景 ID：${evidence.savedRun.id}。假设：${evidence.savedRun.prompt}。模型将同一倍率作用于 ROI 与转化率，非 AI 预测，也不是针对价格、库存或供给的专用优化器。不得把截图当成每次打开页面自动完成保存。`);
}
{
 const s=base(4);
 label(s,catalog.slides[4].title,60,137,600,150,47,'#F0F4F6',true);
 label(s,'比较结果时，保留来源与边界。\n重新打开记录，回看当时的假设。\n把下一步行动交给业务团队验证。',60,337,615,154,27,'#AABED0');
 label(s,'在线体验：/world',60,559,570,37,24,'#78DAD7');
 await artwork(s,'world/world-agent-recommendation.svg',810,135,354,354);
 label(s,'可回看的决策',801,521,380,52,30,'#F0F4F6',true);
 s.speakerNotes.textFrame.setText('在线体验路径 /world，完整路演 /roadshow，资产工作台 /roadshow-assets。网页与本 PPT 使用 lib/roadshow/catalog.json 和 public/roadshow-assets。当前不自动执行投放、下单、调价或库存操作。');
}
const candidate=path.join(buildDir,'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidate);
for(let i=0;i<ppt.slides.items.length;i++){
 const preview=await ppt.export({slide:ppt.slides.items[i],format:'png',scale:1.5});
 await fs.writeFile(path.join(buildDir,`slide-${i+1}.png`),new Uint8Array(await preview.arrayBuffer()));
}
const skill=process.env.BWA_PRESENTATION_SKILL;
if(!skill)throw new Error('Set BWA_PRESENTATION_SKILL for final validation.');
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 explicitTotalSlideCount:5,workspaceDir:path.dirname(root),candidatePath:candidate,finalPath:output,
 pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,
 receiptPath:path.join(buildDir,'validation.json')
});
console.log(JSON.stringify({output,slides:5,result}));
