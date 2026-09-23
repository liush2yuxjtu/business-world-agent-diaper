'use client';

import { useState } from 'react';
import type { BusinessSnapshot } from './business-world-restored';
import { reportEvidence, reportEvidenceSections, type ReportEvidenceSection } from '@/lib/business-world/report-evidence';

export function ReportEvidencePanel({ snapshot, section, onSection, navigationDisabled }: {
  snapshot: BusinessSnapshot | null;
  section: ReportEvidenceSection;
  onSection: (section: ReportEvidenceSection) => void;
  navigationDisabled: boolean;
}) {
  const [entityId,setEntityId] = useState('');
  const evidence = reportEvidence(snapshot, section);
  const entity = evidence?.entities.find(item=>item.id===entityId);
  const title = reportEvidenceSections.find(([id])=>id===section)![1];
  return <section className="panel report-evidence-panel" aria-label="报告固定来源证据">
    <h2>报告固定来源证据</h2>
    <p>以下只读取当前报告预览所用的快照。要点引用的是这份快照，不表示其因果判断已经验证；查看当前业务页面会读取当前数据，两者可能不同。</p>
    <div className="report-evidence-tabs" role="group" aria-label="报告证据分类">{reportEvidenceSections.map(([id,label])=><button key={id} aria-pressed={id===section} aria-controls="report-evidence-details" onClick={()=>{setEntityId('');onSection(id);}}>{label}</button>)}</div>
    {evidence ? <section id="report-evidence-details" aria-label={`${title}报告证据`}>
      <h3>{title} · 固定快照</h3>
      <dl className="detail-list">{evidence.metrics.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      <h3>来源与时间</h3><dl className="detail-list">{evidence.source.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      {section!=='overview' && <><h3>这份快照中的明细</h3><div className="report-evidence-entities">{evidence.entities.map(item=><button key={item.id} aria-pressed={entity?.id===item.id} aria-controls="report-evidence-entity" onClick={()=>setEntityId(item.id)}>{item.label}</button>)}</div>{!evidence.entities.length&&<p>这份快照没有此类明细，不从当前数据补入历史。</p>}</>}
      {entity && <section id="report-evidence-entity" aria-label="报告内实体证据"><h4>{entity.label}</h4><dl className="detail-list">{entity.fields.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>}
      <a className="text-link" href={evidence.currentPageHref} aria-disabled={navigationDisabled} tabIndex={navigationDisabled?-1:undefined} onClick={event=>{if(navigationDisabled)event.preventDefault();}}>打开当前{title}页面（读取当前数据）</a>
      {navigationDisabled&&<p>请先保存或放弃未保存的人工备注，再离开报告。</p>}
    </section> : <p>当前没有报告快照，无法显示证据。</p>}
  </section>;
}
