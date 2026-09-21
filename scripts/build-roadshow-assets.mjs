import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'lib/roadshow/catalog.json'), 'utf8'));
const output = path.join(root, 'public/roadshow-assets');
const assets = [];
const esc = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const text = (x,y,value,size=28,color='#DBE6F7',extra='') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="World Sans SC, Arial, PingFang SC, Microsoft YaHei, sans-serif" ${extra}>${esc(value)}</text>`;
const defs = `<defs><linearGradient id="metal" x2=".7" y2="1"><stop stop-color="#F4F9FF"/><stop offset=".48" stop-color="#AEC8E5"/><stop offset="1" stop-color="#4A739E"/></linearGradient><radialGradient id="glass" cx="35%" cy="25%"><stop stop-color="#124568"/><stop offset="1" stop-color="#041323"/></radialGradient><radialGradient id="planet"><stop stop-color="#14364B"/><stop offset=".7" stop-color="#0A2237"/><stop offset="1" stop-color="#09111F"/></radialGradient><linearGradient id="line"><stop stop-color="#6FE8EC"/><stop offset="1" stop-color="#9F8AEC"/></linearGradient></defs>`;
function svg(title, content, width=512,height=512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width===512?2160:3840}" height="2160" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(title)}</title>${defs}${content}</svg>\n`;
}
function save(file,title,category,content,width=512,height=512){
  const dest=path.join(output,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
  const data=svg(title,content,width,height);fs.writeFileSync(dest,data);
  assets.push({id:file.replace('.svg',''),title,category,path:`/roadshow-assets/${file}`,viewBox:`0 0 ${width} ${height}`,format:'svg',license:'Original project artwork',usage:['web','ppt']});
  return data;
}
function portrait(person){
  const hairColors=['#192C40','#2D2430','#727581','#323C44','#3A252C','#55383A','#292F4F','#2D2C32'];
  const skin=['#E8B894','#D79D79','#EBC6A7','#C78F6C'][person.hair%4];
  const long=[1,4,5,7].includes(person.hair);
  const older=person.hair===2;
  return `<circle cx="256" cy="256" r="245" fill="#0D1C30"/><circle cx="256" cy="256" r="232" fill="${person.color}" opacity=".12"/><path d="M70 479Q79 330 209 320H299Q427 330 442 479" fill="${person.color}"/><path d="M212 293V337Q256 376 299 336V293" fill="${skin}"/>${long?`<path d="M134 275V182Q129 68 254 66Q380 70 377 188L387 362H324L174 358H125Z" fill="${hairColors[person.hair]}"/>`:''}<path d="M165 195Q159 105 251 97Q350 103 348 194L339 269Q318 320 258 327Q197 319 176 272Z" fill="${skin}"/><ellipse cx="170" cy="223" rx="13" ry="23" fill="${skin}"/><ellipse cx="343" cy="223" rx="13" ry="23" fill="${skin}"/><path d="M162 201Q146 111 205 85Q279 43 335 103Q367 128 349 206L327 184L313 134Q254 177 187 163L179 203Z" fill="${hairColors[person.hair]}"/><path d="M200 216Q218 203 236 213M280 213Q300 203 317 215" fill="none" stroke="${hairColors[person.hair]}" stroke-width="7" stroke-linecap="round"/><ellipse cx="220" cy="231" rx="5" ry="7" fill="#17212D"/><ellipse cx="300" cy="231" rx="5" ry="7" fill="#17212D"/><path d="M254 231L247 260L264 263" stroke="#AD745D" fill="none" stroke-width="4" stroke-linecap="round"/><path d="M234 282Q258 297 282 281" fill="none" stroke="#884D48" stroke-width="5" stroke-linecap="round"/>${older||person.group==='business'?'<g stroke="#526078" stroke-width="5" fill="none"><rect x="191" y="213" width="51" height="37" rx="12"/><rect x="273" y="213" width="51" height="37" rx="12"/><path d="M242 228H273"/></g>':''}${person.group==='business'?`<path d="M207 327L254 377L302 327L328 354L302 480H205L183 354Z" fill="#F3F1EC"/><path d="M246 372L262 372L275 446L254 470L236 446Z" fill="#526883"/><path d="M182 340L205 480H79Q89 367 182 340M328 340L303 480H434Q425 367 328 340" fill="${person.color}"/>`:'<path d="M209 326Q254 359 300 326" stroke="#F4EADB" stroke-width="13" fill="none"/><path d="M256 361V480" stroke="#FFFFFF" stroke-opacity=".15" stroke-width="3"/>'}<circle cx="421" cy="397" r="42" fill="#0A1727" stroke="${person.color}" stroke-width="2"/><path d="M404 396L416 408L439 385" stroke="${person.color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}
const icons={
  consumer:'<circle cx="256" cy="191" r="59"/><path d="M140 354Q143 273 256 272Q366 273 373 354Z"/><path d="M225 152Q249 169 280 143"/>',
  retailer:'<path d="M139 211H374V361H139Z M119 208L147 145H366L395 208Z M164 361V260H232V361 M280 257H345V307H280Z"/><path d="M119 208Q142 252 166 208Q190 252 213 208Q236 252 260 208Q283 252 307 208Q331 252 355 208Q375 247 395 208"/>',
  ecommerce:'<path d="M122 137H159L188 309H353L389 181H167 M204 215H368 M214 253H357 M246 181V300 M301 181V300"/><circle cx="217" cy="354" r="16"/><circle cx="335" cy="354" r="16"/>',
  distributor:'<path d="M120 243L256 156L395 243V369H120Z M156 239H358 M170 285H219V335H170Z M237 285H284V335H237Z M302 285H349V335H302Z M227 197H277V240H227Z"/>',
  factory:'<path d="M123 363V226L207 177V231L289 176V236H386V363Z M321 232V129H353V232 M157 277H198V318H157Z M230 277H271V318H230Z M307 277H348V318H307Z"/>',
  logistics:'<path d="M108 181H294V323H108Z M294 224H349L396 273V323H294 M323 246H345L371 276H323Z"/><circle cx="169" cy="335" r="28"/><circle cx="345" cy="335" r="28"/><path d="M145 211H238M145 240H213"/>',
  regulator:'<path d="M110 204L256 131L402 204Z M129 360H385 M119 381H397 M153 224V338 M218 224V338 M285 224V338 M352 224V338"/>',
  brand:'<path d="M256 121L288 200L374 209L309 266L328 351L256 307L182 351L202 266L136 209L223 200Z"/>',
  creator:'<rect x="162" y="122" width="189" height="281" rx="28"/><path d="M217 154H296 M243 347H271 M233 215L290 250L233 285Z M108 199L130 213 M107 252H130 M377 182L398 166 M377 230H401"/>',
  supplier:'<path d="M139 197L256 133L374 197V329L256 390L139 329Z M139 197L256 260L374 197 M256 260V390 M195 166L315 228V286"/>'
};
function icon(id,color='#69DBE8'){return `<g fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">${icons[id]??icons.brand}</g>`;}
function tile(id,color='#69DBE8'){return `<rect x="24" y="24" width="464" height="464" rx="92" fill="#0D1C2D" stroke="#294455" stroke-width="2"/><circle cx="256" cy="256" r="172" fill="${color}" opacity=".06"/>${icon(id,color)}`;}
function agent(state='neutral'){
  const color=state==='alert'?'#F2BD82':state==='recommendation'?'#91CCA9':'#69DBE8';
  return `<ellipse cx="256" cy="452" rx="136" ry="19" fill="#69DBE8" opacity=".08"/><circle cx="256" cy="247" r="210" fill="none" stroke="#254151" stroke-width="2" stroke-dasharray="6 12"/><ellipse cx="256" cy="420" rx="113" ry="32" fill="none" stroke="${color}" opacity=".3"/><path d="M175 356Q177 292 256 290Q335 292 338 356L320 404H193Z" fill="url(#metal)"/><path d="M187 341Q154 329 142 362L133 398Q144 417 159 400L186 375M328 341Q359 329 372 362L381 398Q370 417 356 400L329 375" fill="url(#metal)"/><rect x="137" y="125" width="237" height="193" rx="85" fill="url(#metal)"/><rect x="157" y="144" width="198" height="145" rx="66" fill="url(#glass)" stroke="#345E7A" stroke-width="3"/><path d="M198 221Q210 194 224 221M284 221Q297 194 309 221" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>${state==='thinking'?'<circle cx="233" cy="259" r="4" fill="#91D5ED"/><circle cx="254" cy="259" r="4" fill="#91D5ED"/><circle cx="275" cy="259" r="4" fill="#91D5ED"/>':'<path d="M244 253Q256 263 268 253" fill="none" stroke="#7CAADE" stroke-width="4" stroke-linecap="round"/>'}<path d="M257 126V92" stroke="#AFCDE2" stroke-width="9"/><circle cx="257" cy="78" r="13" fill="${color}"/><circle cx="256" cy="350" r="22" fill="#102C48" stroke="${color}" stroke-width="3"/><path d="M245 350L253 358L269 342" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>${state==='simulating'?'<path d="M81 140A218 218 0 0 1 429 120M430 121L425 91M430 121L398 118" fill="none" stroke="#B9A3F7" stroke-width="6"/>':''}${state==='alert'?'<circle cx="370" cy="124" r="29" fill="#F2BD82"/><path d="M370 106V126M370 136V140" stroke="#17212D" stroke-width="6" stroke-linecap="round"/>':''}`;
}
const continents=[
 '119,166 147,119 196,110 239,135 227,177 196,199 193,225 168,245 149,214 121,203',
 '190,259 234,246 258,280 241,321 221,347 218,385 199,361 190,311 176,281',
 '269,156 296,132 328,151 328,176 355,169 360,137 386,150 419,186 429,223 398,231 376,208 351,221 331,203 303,195 286,181',
 '271,218 312,218 340,244 333,283 307,329 285,318 270,275 254,247',
 '369,323 401,303 428,331 420,354 381,361 363,346'
];
function globe(){
 let grid='';for(const k of [45,93,145,197])grid+=`<ellipse cx="256" cy="256" rx="${k}" ry="221" fill="none" stroke="#28506A" stroke-width="1"/>`;
 for(const r of [55,115,175])grid+=`<ellipse cx="256" cy="256" rx="221" ry="${r}" fill="none" stroke="#28506A" stroke-width="1"/>`;
 return `<circle cx="256" cy="256" r="228" fill="url(#planet)" stroke="#538897" stroke-width="2"/>${grid}<g fill="#377478" fill-opacity=".46" stroke="#5FADAB" stroke-opacity=".35">${continents.map(p=>`<polygon points="${p}"/>`).join('')}</g><g fill="#8EE2D7">${[[169,180],[291,169],[352,218],[299,263],[216,297],[392,335]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4"/><circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#80CDC9" opacity=".4"/>`).join('')}</g>`;
}
const nested=(content,x,y,w)=>`<g transform="translate(${x} ${y}) scale(${w/512})">${content}</g>`;
for(const p of catalog.personas)save(`personas/${p.group}/${p.id}.svg`,`${p.name} · 原创角色插画`,p.group==='consumer'?'客户画像':'业务角色',portrait(p));
for(const e of catalog.entities)save(`entities/${e.id}.svg`,e.name,'商业实体',tile(e.id));
for(const s of catalog.agentStates)save(`world/world-agent-${s.id}.svg`,s.name,'World Agent',agent(s.id));
save('world/world-agent-core.svg','Business World Agent','World Agent',agent());
save('world/world-model-globe.svg','商业区域示意球体 · 非精确地理底图','世界地图',globe());
let scene=`<rect width="1280" height="720" fill="#09131F"/>${nested(globe(),295,22,680)}<ellipse cx="640" cy="360" rx="532" ry="249" fill="none" stroke="#25394C" stroke-dasharray="4 9"/>`;
const positions=[[45,45],[60,230],[66,425],[999,45],[982,230],[989,425]];
[catalog.personas[0],catalog.personas[1],catalog.personas[2],catalog.personas[8],catalog.personas[9],catalog.personas[11]].forEach((p,i)=>{
 const [x,y]=positions[i];scene+=`<path d="M${x+110} ${y+86}Q640 ${y+86} 640 355" stroke="${p.color}" stroke-opacity=".32" fill="none" stroke-width="2"/>${nested(portrait(p),x,y,125)}${text(x+136,y+45,p.name,22)}${text(x+136,y+78,p.kpi,15,'#879DB5')}`;
});
scene+=nested(agent(),475,160,330)+text(640,507,'Business World Agent',30,'#F5F4F2','text-anchor="middle"')+text(640,543,'连接角色 · 查看证据 · 比较情景',18,'#91B6C9','text-anchor="middle"');
catalog.entities.slice(0,8).forEach((e,i)=>{scene+=nested(tile(e.id),210+i*110,589,72)+text(246+i*110,686,e.name,16,'#ADC1D1','text-anchor="middle"');});
save('world/world-model-scene.svg','角色、世界与商业实体','世界地图',scene,1280,720);
let constellation='<rect width="1280" height="720" fill="#09131F"/>';
catalog.personas.slice(0,8).forEach((p,i)=>{const x=50+(i%4)*310,y=28+Math.floor(i/4)*346;constellation+=nested(portrait(p),x+47,y,175)+text(x+135,y+213,p.name,27,'#F5F4F2','text-anchor="middle"')+text(x+135,y+251,p.kpi,19,p.color,'text-anchor="middle"');});
save('world/persona-constellation.svg','八类家庭行为原型','客户画像',constellation,1280,720);
for(const s of catalog.scenarios){
 let content=`<rect width="1280" height="720" rx="32" fill="#0A1828"/><circle cx="900" cy="355" r="245" fill="${s.color}" opacity=".06"/>${nested(tile(s.entity,s.color),691,112,375)}${text(82,160,'SCENARIO / '+s.id.toUpperCase(),20,s.color)}${text(80,274,s.name,66,'#EDF5FB')}${text(84,340,s.description,28,'#A6B9CF')}<path d="M85 426H517" stroke="#2C445A" stroke-width="2"/><circle cx="92" cy="426" r="7" fill="${s.color}"/>${text(84,482,'调整变量  '+s.leverName,24)}${text(84,528,'比较基线与情景结果',24,'#8DA9BE')}${text(84,650,'方向性线性推演 · 非经营预测',18,'#8DA9BE')}`;
 save(`scenarios/${s.id}.svg`,s.name,'场景缩略图',content,1280,720);
}
for(const e of catalog.events)save(`events/${e.id}.svg`,e.name,'行业事件',`${tile(e.entity,e.color)}<circle cx="383" cy="121" r="49" fill="#0A1828" stroke="${e.color}" stroke-width="4"/><path d="M383 97V126M383 140V144" stroke="${e.color}" stroke-width="9" stroke-linecap="round"/>`);
for(const [i,size] of catalog.productSizes.entries()){
 const color=['#91CCA9','#69DBE8','#B9A3F7','#F2BD82','#8EAFF0','#F7A6B7'][i];
 save(`diaper/pack-${size.toLowerCase()}.svg`,`${size} 码纸尿裤 · 概念包装`,'尿布产品',`<ellipse cx="256" cy="448" rx="151" ry="23" fill="#0B1527" opacity=".4"/><path d="M125 112L310 81L390 122V405L202 438L125 396Z" fill="#EAE9E0"/><path d="M310 81L390 122V405L310 368Z" fill="#C2D8D7"/><path d="M125 112L310 81V368L125 396Z" fill="${color}"/><path d="M128 128L307 99M128 376L307 349" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="4"/>${text(153,170,'WORLD CARE',17,'#153746')}${text(153,222,'舒适成长',31,'#173C43')}<path d="M153 265L190 255Q211 283 244 246L282 250L269 315Q218 355 166 324Z" fill="#F7F5EA"/><path d="M173 277Q190 307 180 325M258 265Q242 294 249 325" stroke="#C3D4CC" stroke-width="4" fill="none"/>${text(152,369,size,32,'#1B3D45')}${text(337,345,size,25,'#31575F')}`);
}
const attributePaths={absorbency:'M256 128Q165 247 175 290Q188 371 256 371Q333 371 339 293Q342 245 256 128Z',softness:'M147 308Q107 263 149 228Q163 156 229 178Q278 108 327 186Q390 170 398 231Q429 294 378 325H170Z',breathability:'M135 195Q189 151 244 195Q299 239 358 195M135 260Q189 216 244 260Q299 304 358 260M135 325Q189 281 244 325Q299 369 358 325',fit:'M161 163Q256 215 351 163L332 349Q256 392 180 349ZM202 238L248 286L309 220'};
for(const a of catalog.attributes)save(`diaper/${a.id}.svg`,a.name,'产品属性',`<circle cx="256" cy="256" r="225" fill="#112436"/><path d="${attributePaths[a.id]}" fill="none" stroke="#91CCA9" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`);
for(const [i,f] of catalog.feedback.entries())save(`feedback/${f.id}.svg`,f.name,'操作反馈',`<circle cx="256" cy="256" r="212" fill="#112436"/><circle cx="256" cy="256" r="142" fill="none" stroke="${i===4?'#F2BD82':'#69DBE8'}" stroke-width="10" ${i<2?'stroke-dasharray="65 25"':''}/>${i===4?'<path d="M256 173V265M256 305V315" stroke="#F2BD82" stroke-width="17" stroke-linecap="round"/>':'<path d="M194 257L241 304L327 214" fill="none" stroke="#91CCA9" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>'}`);
const steps=[['库存信号','logistics'],['相关人群','consumer'],['方向性推演','ecommerce'],['行动草案','brand']];
let flow='<rect width="1280" height="720" fill="#09131F"/>';
steps.forEach(([label,id],i)=>{const x=45+i*310;flow+=nested(tile(id),x,205,255)+text(x+125,510,label,29,'#E8F2F7','text-anchor="middle"')+text(x+125,556,String(i+1).padStart(2,'0'),19,'#69DBE8','text-anchor="middle"');if(i<3)flow+=`<path d="M${x+264} 330H${x+300}M${x+290} 320L${x+300} 330L${x+290} 340" fill="none" stroke="#7898AD" stroke-width="3"/>`;});
save('world/event-to-action.svg','事件、角色、推演与行动','商业链路',flow,1280,720);
save('world/decision-loop.svg','保留假设、比较情景、回看记录','商业链路',flow.replace('库存信号','经营基线').replace('相关人群','明确假设').replace('方向性推演','保存情景').replace('行动草案','回看决策'),1280,720);
let map=`<rect width="1280" height="720" fill="#09131F"/>${nested(globe(),12,34,630)}${text(712,135,'全球机会研究',44)}${text(713,187,'区域模板 · 尚未接入分区指标',24,'#91A8BC')}`;
catalog.regions.forEach((r,i)=>{map+=`<circle cx="735" cy="${253+i*61}" r="6" fill="#69DBE8"/>${text(763,261+i*61,r.name,27)}${text(1188,261+i*61,'待接入',21,'#7D98AD','text-anchor="end"')}`;});
save('world/market-opportunity-map.svg','全球机会研究 · 无区域实测数据','世界地图',map,1280,720);
save('world/demo-cover.svg','Business World 产品演示封面','演示封面',`${scene}<circle cx="640" cy="349" r="52" fill="#F1F6F7"/><path d="M625 322L665 349L625 377Z" fill="#102234"/>`,1280,720);
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:catalog.version,rules:{generation:'code-only',imageGen:false,vectorFirst:true,pptWebShared:true,wideMaster:'3840x2160',squareMaster:'2160x2160'},assets},null,2)+'\n');
console.log(`Generated ${assets.length} shared SVG assets.`);
