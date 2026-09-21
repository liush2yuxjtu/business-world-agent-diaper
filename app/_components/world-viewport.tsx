'use client';
import { useRef, useState, type ReactNode } from 'react';

export function WorldViewport({children}:{children:ReactNode}) {
  const viewport=useRef<HTMLDivElement>(null);
  const drag=useRef<{id:number;x:number;y:number;left:number;top:number}|null>(null);
  const [scale,setScale]=useState(100);
  const move=(x:number,y:number)=>viewport.current?.scrollBy({left:x,top:y,behavior:'instant'});
  const reset=()=>{setScale(100);viewport.current?.scrollTo({left:0,top:0,behavior:'instant'});};
  return <section className="world-map-panel" aria-label="经营关系图">
    <div className="world-map-controls" role="group" aria-label="关系图视角">
      <button disabled={scale<=50} onClick={()=>setScale(n=>Math.max(50,n-10))} aria-label="缩小关系图">−</button>
      <output aria-live="polite" aria-label="关系图缩放比例">{scale}%</output>
      <button disabled={scale>=160} onClick={()=>setScale(n=>Math.min(160,n+10))} aria-label="放大关系图">＋</button>
      <button onClick={reset}>重置视角</button>
      <button onClick={()=>move(-120,0)} aria-label="关系图向左平移">←</button><button onClick={()=>move(120,0)} aria-label="关系图向右平移">→</button>
      <button onClick={()=>move(0,-120)} aria-label="关系图向上平移">↑</button><button onClick={()=>move(0,120)} aria-label="关系图向下平移">↓</button>
    </div>
    <p id="world-map-help">选中节点查看右侧详情。可拖动空白处或使用滚动条；聚焦图后用方向键平移，＋/−缩放，Home重置。</p>
    <div ref={viewport} className="world-map-viewport" tabIndex={0} role="region" aria-label="可平移缩放的关系图" aria-describedby="world-map-help"
      onKeyDown={e=>{if(e.target!==e.currentTarget)return;const keys:Record<string,[number,number]>={ArrowLeft:[-120,0],ArrowRight:[120,0],ArrowUp:[0,-120],ArrowDown:[0,120]};if(keys[e.key]){e.preventDefault();move(...keys[e.key]);}else if(e.key==='+'||e.key==='='){e.preventDefault();setScale(n=>Math.min(160,n+10));}else if(e.key==='-'){e.preventDefault();setScale(n=>Math.max(50,n-10));}else if(e.key==='Home'){e.preventDefault();reset();}}}
      onPointerDown={e=>{if(e.button!==0||(e.target as HTMLElement).closest('a,button,input,select,textarea'))return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}}
      onPointerMove={e=>{const d=drag.current;if(d?.id!==e.pointerId)return;e.currentTarget.scrollLeft=d.left+d.x-e.clientX;e.currentTarget.scrollTop=d.top+d.y-e.clientY;}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
      <div className="world-map-content" style={{zoom:scale/100}}>{children}</div>
    </div>
  </section>;
}
