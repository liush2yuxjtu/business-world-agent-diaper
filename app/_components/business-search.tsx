'use client';
import { useEffect, useMemo, useState, type RefObject } from 'react';
import { Search } from 'lucide-react';
import type { BusinessSnapshot } from './business-world-restored';
import { buildSearchIndex, searchEntries } from '@/lib/business-world/search-model';
import { readHistory, type ScenarioRun } from '@/lib/business-world/scenario-client';

export function BusinessSearch({snapshot,pages,query,setQuery,inputRef}:{snapshot:BusinessSnapshot|null;pages:ReadonlyArray<readonly [string,string]>;query:string;setQuery:(s:string)=>void;inputRef:RefObject<HTMLInputElement|null>}) {
  const [runs,setRuns]=useState<ScenarioRun[]>([]);
  const [historyState,setHistoryState]=useState<'idle'|'loading'|'ready'|'error'>('idle');
  const [retry,setRetry]=useState(0);
  const [selected,setSelected]=useState(0);
  const open=!!query.trim();
  useEffect(()=>{
    if(!open) return;
    let alive=true;
    setRuns([]);
    setHistoryState('loading');
    const term=query.normalize('NFKC').trim().split(/\s+/).filter(s=>!['情景','实验','scenario'].includes(s.toLowerCase()))[0] ?? '';
    const timer=setTimeout(()=>{readHistory(term).then(result=>{if(alive){setRuns(result);setHistoryState('ready');}}).catch(()=>{if(alive){setRuns([]);setHistoryState('error');}});},250);
    return ()=>{alive=false;clearTimeout(timer);};
  },[open,query,retry]);
  const matches=useMemo(()=>searchEntries(buildSearchIndex(snapshot,pages,runs),query),[snapshot,pages,runs,query]);
  const current=Math.min(selected,Math.max(0,matches.length-1));
  const navigate=(href:string)=>{window.location.href=href;};
  return <div className="search real-search"><Search size={16}/><input ref={inputRef} aria-label="搜索页面、实体、证据或情景" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open?'feature-search-results':undefined} aria-activedescendant={open&&matches.length?`search-match-${current}`:undefined} placeholder="搜索页面、实体、证据或情景" value={query} onChange={e=>{setSelected(0);setQuery(e.target.value);}} onKeyDown={e=>{
    if(e.key==='ArrowDown'){e.preventDefault();setSelected((current+1)%Math.max(1,matches.length));}
    if(e.key==='ArrowUp'){e.preventDefault();setSelected((current-1+matches.length)%Math.max(1,matches.length));}
    if(e.key==='Enter'&&matches[current]){e.preventDefault();navigate(matches[current].href);}
    if(e.key==='Escape'){e.preventDefault();setQuery('');}
  }}/>{open&&<div className="search-results"><div id="feature-search-results" role="listbox" aria-label="搜索结果">{matches.map((entry,i)=><button id={`search-match-${i}`} key={entry.id} role="option" aria-selected={i===current} onMouseEnter={()=>setSelected(i)} onClick={()=>navigate(entry.href)}><small>{entry.kind}</small><span>{entry.label}</span></button>)}</div><p role="status">{matches.length?`${matches.length} 个结果`:'当前已加载数据中没有匹配结果。'}</p>{historyState==='loading'&&<p role="status">正在检索已保存情景…</p>}{historyState==='ready'&&<p>情景按首个非类别关键词检索，最多显示最近20条匹配记录；可用完整情景编号精确查找。</p>}{historyState==='error'&&<p role="alert">情景历史暂时无法读取，页面与实体结果仍可使用。<button onClick={()=>setRetry(n=>n+1)}>重试情景搜索</button></p>}</div>}</div>;
}

export function EntitySearchDetail({snapshot,entityId,onClose,onSource}:{snapshot:BusinessSnapshot|null;entityId:string;onClose:()=>void;onSource:()=>void}) {
  const entry=buildSearchIndex(snapshot,[]).find(item=>item.id===entityId&&item.fields);
  return <section className="panel search-entity-detail" aria-label="搜索实体详情"><div className="section-title"><h2>{entry?`${entry.kind}：${entry.label}`:'未找到该实体'}</h2><button onClick={onClose}>关闭详情</button></div>{entry?<><dl className="detail-list">{entry.fields!.map(([label,v])=><div key={label}><dt>{label}</dt><dd>{v}</dd></div>)}</dl><p>详情来自当前经营快照；合成数据不能作为真实经营证据。</p><button onClick={onSource}>查看来源详情</button></>:<p>该实体不在当前快照中，可能已被移除或来源不可用。请刷新数据后重新搜索。</p>}</section>;
}
