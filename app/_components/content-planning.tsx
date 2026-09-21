'use client';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { calendarWeek, shiftCalendarWeek, localCalendarDate } from '@/lib/business-world/content-calendar';
import { personaEvidenceFields } from '@/lib/business-world/persona-evidence';
import type { ContentDraft } from '@/lib/business-world/content-draft-model';

const endpoint = '/api/business-world/content-drafts';
const messages: Record<string, string> = {
  CONTENT_INVALID: '请检查标题、正文、日期和渠道。', CONTENT_MISSING: '当前浏览器未找到这份草稿。',
  CONTENT_SOURCE_MISSING: '选题已变化或不可用，请刷新内容页后重新选择。',
  CONTENT_CONFLICT: '草稿已有更新，请保留未保存内容，重新读取后再保存。',
  CONTENT_UNAVAILABLE: '暂时无法确认保存结果，请先重新读取草稿列表。',
};
async function read<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messages[data?.code] ?? messages.CONTENT_UNAVAILABLE);
  return data;
}
const errorText = (error: unknown) => error instanceof Error && Object.values(messages).includes(error.message) ? error.message : messages.CONTENT_UNAVAILABLE;

export function ContentPlanning({ topicTitle, personaId }: { topicTitle?: string; personaId?: string }) {
  const taskMode = personaId !== undefined;
  const draftLabel = taskMode ? '任务提案' : '内容 brief';
  const queryKey = taskMode ? 'task' : 'draft';
  const belongs = (draft: ContentDraft) => taskMode ? draft.kind === 'task' : draft.kind !== 'task';
  const editor = useRef<HTMLFormElement>(null);
  const [focusEditor,setFocusEditor]=useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle,setNewTitle]=useState(''); const [newAudience,setNewAudience]=useState(''); const [newBody,setNewBody]=useState('');
  const [week,setWeek]=useState('');
  useEffect(()=>setWeek(localCalendarDate()),[]);
  const [queueScope,setQueueScope]=useState<'all'|'topic'>('all');
  const [items, setItems] = useState<ContentDraft[]>([]);
  const [selected, setSelected] = useState<ContentDraft | null>(null);
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [date, setDate] = useState(''); const [channel, setChannel] = useState('');
  const [planDate, setPlanDate] = useState(''); const [planChannel, setPlanChannel] = useState('');
  const [planning, setPlanning] = useState(false); const [busy, setBusy] = useState(true);
  useEffect(()=>{if(!focusEditor||busy)return; editor.current?.scrollIntoView({block:'start',behavior:'smooth'});editor.current?.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true});setFocusEditor(false);},[focusEditor,busy]);
  const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const dirty = !!selected && (title !== selected.title || body !== selected.body || (selected.kind === 'plan' && (date !== selected.scheduledFor || channel !== selected.channel)));
  function display(draft: ContentDraft) {
    setSelected(draft); setTitle(draft.title); setBody(draft.body); setDate(draft.scheduledFor ?? ''); setChannel(draft.channel ?? ''); setPlanning(false);setCreating(false);
    if(draft.scheduledFor)setWeek(draft.scheduledFor);
    const url = new URL(location.href); url.searchParams.set(queryKey, draft.id); history.replaceState(null, '', url);
  }
  async function list() { const result = await read<{ drafts: ContentDraft[] }>(await fetch(endpoint, { cache: 'no-store' })); setItems(result.drafts.filter(belongs)); }
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const result = await read<{ drafts: ContentDraft[] }>(await fetch(endpoint, { cache: 'no-store' }));
        const id = new URLSearchParams(location.search).get(queryKey);
        const draft = id ? await read<ContentDraft>(await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { cache: 'no-store' })) : null;
        if (alive) { setItems(result.drafts.filter(belongs)); if (draft) { if (!belongs(draft)) throw new Error(messages.CONTENT_MISSING); display(draft); } }
      } catch (error) { if (alive) setError(errorText(error)); }
      finally { if (alive) setBusy(false); }
    })();
    return () => { alive = false; };
  }, []);
  async function operate(action: () => Promise<void>) {
    setBusy(true); setError(''); setStatus('');
    try { await action(); } catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  }
  async function choose(id: string, keepEdit = false) {
    await operate(async () => {
      const draft = await read<ContentDraft>(await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { cache: 'no-store' }));
      if (keepEdit) { setSelected(draft); setStatus('已读取最新版本，编辑框中的未保存内容仍保留。'); } else {display(draft); setFocusEditor(true);}
    });
  }
  async function createBrief() {
    if ((!taskMode && !topicTitle) || dirty) return;
    await operate(async () => {
      const draft = await read<ContentDraft>(await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskMode ? { kind: 'task', personaId } : { kind: 'brief', topicTitle }) }));
      const verified = await read<ContentDraft>(await fetch(`${endpoint}?id=${draft.id}`, { cache: 'no-store' }));
      display(verified); await list(); setStatus(`${draftLabel}已保存并回读，可继续编辑。`);
    });
  }
  async function createTopic(event: FormEvent) {
    event.preventDefault(); if(dirty || taskMode)return;
    await operate(async()=>{
      const draft=await read<ContentDraft>(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'new-topic',title:newTitle,body:newBody,audience:newAudience})}));
      const verified=await read<ContentDraft>(await fetch(`${endpoint}?id=${draft.id}`,{cache:'no-store'}));
      display(verified);await list();setNewTitle('');setNewAudience('');setNewBody('');setStatus('新选题已保存为可编辑 brief，尚待验证，未加入计划或发布。');
    });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    await operate(async () => {
      const draft = await read<ContentDraft>(await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, revision: selected.revision, title, body, ...(selected.kind === 'plan' ? { scheduledFor: date, channel } : {}) }) }));
      display(draft); await list(); setStatus('草稿修改已保存。');
    });
  }
  async function addPlan(event: FormEvent) {
    event.preventDefault(); if (!selected || dirty || selected.kind !== 'brief') return;
    await operate(async () => {
      const draft = await read<ContentDraft>(await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'plan', briefId: selected.id, revision: selected.revision, scheduledFor: planDate, channel: planChannel }) }));
      const verified = await read<ContentDraft>(await fetch(`${endpoint}?id=${draft.id}`, { cache: 'no-store' }));
      display(verified); await list(); setStatus('已加入发布计划，仅保存计划，没有发布到外部平台。');
    });
  }
  return <section className="panel report-editor" aria-label={taskMode ? "人群任务提案" : "内容 brief 与发布计划"}>
    <h2>{taskMode ? "人群任务提案" : "内容 brief 与发布计划"}</h2><p>{taskMode ? "从当前人群的需求与行为线索形成研究提案。保存仅建立任务草稿，不会执行外部操作。" : "从所选选题生成可编辑模板，核对内容后再加入计划。"}草稿通过当前浏览器访问；清除浏览器数据后无法自动找回。</p>
    <div className="report-actions">{!taskMode&&<button disabled={busy||dirty} onClick={()=>setCreating(!creating)}>新建选题</button>}<button className="primary" disabled={busy || dirty || (!taskMode && !topicTitle)} onClick={() => void createBrief()}>{taskMode ? "创建任务提案" : "生成 brief"}</button><button disabled={busy || dirty} onClick={() => void operate(list)}>刷新草稿列表</button></div>
    <p>{taskMode ? "任务依据：当前选中的人群及其保存时快照。" : `当前选题：${topicTitle ?? "尚未选择"}。`}{selected?.origin==='manual-topic'?'当前草稿正文由用户填写，不代表平台观测或模型已完成研究。':'从已有选题生成的内容由固定模板整理，不代表真实模型已完成研究。'}</p>
    {creating&&!taskMode&&<form onSubmit={createTopic}><h3>新选题草稿</h3><p>手动提出的研究假设，不是平台已观测的机会。保存仅创建 brief。</p><label>新选题标题<input autoFocus required maxLength={120} disabled={busy} value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></label><label>目标人群<input required maxLength={200} disabled={busy} value={newAudience} onChange={e=>setNewAudience(e.target.value)}/></label><label>选题说明<textarea required maxLength={12000} rows={5} disabled={busy} value={newBody} onChange={e=>setNewBody(e.target.value)}/></label><button className="primary" disabled={busy||dirty} type="submit">保存新选题草稿</button><button type="button" disabled={busy} onClick={()=>setCreating(false)}>取消新建</button></form>}
    {!taskMode&&<section className="content-brief-queue" aria-label="brief 工作队列"><h3>brief 工作队列</h3><p>仅列出当前浏览器已保存的 brief，按创建时间排列；点击读取正文与保存时依据。计划和任务不会混入此队列。</p><div className="section-tabs" role="group" aria-label="brief 队列范围"><button aria-pressed={queueScope==='all'} onClick={()=>setQueueScope('all')}>全部 brief</button><button aria-pressed={queueScope==='topic'} onClick={()=>setQueueScope('topic')}>当前选题 brief</button></div>{items.filter(item=>item.kind==='brief'&&(queueScope==='all'||item.source.topicTitle===topicTitle)).length ? <ul>{items.filter(item=>item.kind==='brief'&&(queueScope==='all'||item.source.topicTitle===topicTitle)).map(item=><li key={item.id}><button disabled={busy||dirty} aria-pressed={selected?.id===item.id} onClick={()=>void choose(item.id)}><b>{item.title}</b><span>第{item.revision}版 · {item.source.persona}</span><small>{item.origin==='manual-topic'?'用户选题假设 · 尚待验证':item.source.dataMode==='simulated'?'合成数据演示':'经营快照'} · {new Date(item.createdAt).toLocaleString('zh-CN')}</small></button></li>)}</ul>:<p role="status">{busy?'正在读取 brief 队列…':queueScope==='topic'?'当前选题没有已保存的 brief。可以生成一份再编辑。':'尚无已保存的 brief。可生成 brief 或新建选题。'}</p>}{dirty&&<p>有未保存修改，队列只能筛选；保存或放弃修改后才能打开另一份 brief。</p>}</section>}
    <label>已保存草稿<select disabled={busy || dirty} value={selected?.id ?? ''} onChange={e => { if (e.target.value) void choose(e.target.value); }}><option value="" disabled>{taskMode ? "选择任务提案" : "选择 brief 或计划"}</option>{items.map(item => <option key={item.id} value={item.id}>{item.kind === 'task' ? '任务提案' : item.kind === 'brief' ? '内容 brief' : '发布计划'} · {item.title}</option>)}</select></label>
    {busy && <p role="status">正在处理草稿…</p>}{error && <p role="alert" className="report-error">{error}</p>}{status && <p role="status">{status}</p>}
    {selected && <><p>{selected.kind === 'task' ? '任务提案 · 未执行' : selected.kind === 'brief' ? '内容 brief' : '发布计划'} · 第 {selected.revision} 版 · 来源需求：{selected.source.topicTitle} · 人群：{selected.source.persona} · {selected.origin==='manual-topic'?'用户选题假设 · 尚待验证':selected.source.dataMode === 'simulated' ? '合成数据演示' : '经营快照'}</p><p>来源：{selected.source.sourceLabel} · 观测时间：{selected.source.asOf ?? '未指定'}</p>
      {selected.personaEvidence && <details><summary>查看保存时的人群依据</summary><dl>{personaEvidenceFields(selected.personaEvidence,selected.source.dataMode).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>人群：{selected.personaEvidence.title}；需求：{selected.personaEvidence.goal}</p><p>痛点：{selected.personaEvidence.pain}；触发线索：{selected.personaEvidence.trigger}</p><p>内容方向：{selected.personaEvidence.content}</p><p>转化率：{selected.personaEvidence.conversionRate ?? '未观测'}%；复购率：{selected.personaEvidence.repeatRate ?? '未观测'}%。</p><p>以上依据保留保存时的快照，编辑提案正文不会修改来源。{selected.source.dataMode === 'simulated' ? '这些是合成人群假设，并非真实客户观测。' : '以快照来源和观测时间为准。'}</p></details>}
      <form ref={editor} onSubmit={save}><label>草稿标题<input required maxLength={120} disabled={busy} value={title} onChange={e => setTitle(e.target.value)}/></label><label>草稿正文<textarea required maxLength={12000} rows={10} disabled={busy} value={body} onChange={e => setBody(e.target.value)}/></label>
        {selected.kind === 'plan' && <><label>计划日期<input type="date" required disabled={busy} value={date} onChange={e => setDate(e.target.value)}/></label><label>计划渠道<input required maxLength={80} disabled={busy} value={channel} onChange={e => setChannel(e.target.value)}/></label></>}
        <div className="report-actions"><button type="submit" className="primary" disabled={busy || !dirty}>保存草稿修改</button><button type="button" disabled={busy || !dirty} onClick={() => display(selected)}>放弃未保存修改</button><button type="button" disabled={busy} onClick={() => void choose(selected.id, dirty)}>重新读取当前草稿</button></div>
      </form>{dirty && <p>{taskMode ? "有未保存修改。保存或放弃后，才可切换任务提案。" : "有未保存修改。保存或放弃后，才可切换草稿或加入计划。"}</p>}
      {selected.kind === 'brief' && <button disabled={busy || dirty} onClick={() => setPlanning(!planning)}>加入计划</button>}
      {selected.basedOnBrief && <p>基于 brief 第 {selected.basedOnBrief.revision} 版建立的独立计划。<button disabled={busy || dirty} onClick={() => void choose(selected.basedOnBrief!.id)}>查看来源 brief</button></p>}
    </>}
    {planning && selected?.kind === 'brief' && <form onSubmit={addPlan}><h3>确认发布计划</h3><p>将当前已保存 brief 第 {selected.revision} 版复制为计划。此操作不会向外部平台发布内容。</p><label>发布日期<input type="date" required disabled={busy} value={planDate} onChange={e => setPlanDate(e.target.value)}/></label><label>发布渠道<input required maxLength={80} disabled={busy} value={planChannel} onChange={e => setPlanChannel(e.target.value)}/></label><button className="primary" disabled={busy || dirty} type="submit">确认加入发布计划</button><button type="button" disabled={busy} onClick={() => setPlanning(false)}>取消加入</button></form>}
    {!taskMode && <><h3>本周内容日历</h3><p>仅展示当前浏览器最近100份草稿中的已确认计划；所有条目都尚未发布。</p><div className="report-actions"><button disabled={!week} onClick={()=>setWeek(shiftCalendarWeek(week,-1))}>上一周</button><button onClick={()=>setWeek(localCalendarDate())}>本周</button><button disabled={!week} onClick={()=>setWeek(shiftCalendarWeek(week,1))}>下一周</button><label>查看日期<input aria-label="日历定位日期" type="date" value={week} onChange={e=>setWeek(e.target.value)}/></label></div><div className="content-week" aria-label="每周发布计划">{calendarWeek(week).map((day,i)=><section className="content-day" key={day} aria-label={`${day} 发布计划`}><h4>{['周一','周二','周三','周四','周五','周六','周日'][i]} <time dateTime={day}>{day}</time></h4>{items.filter(item=>item.kind==='plan'&&item.scheduledFor===day).length?items.filter(item=>item.kind==='plan'&&item.scheduledFor===day).map(item=><button key={item.id} disabled={busy||dirty} aria-pressed={selected?.id===item.id} onClick={()=>void choose(item.id)}><b>{item.title}</b><small>{item.channel} · 计划草稿，未发布</small></button>):<p>暂无计划</p>}</section>)}</div><h3>发布计划列表</h3>{items.filter(item => item.kind === 'plan').length ? <div className="table-scroll"><table><thead><tr><th>日期</th><th>渠道</th><th>内容</th><th>状态</th></tr></thead><tbody>{items.filter(item => item.kind === 'plan').sort((a,b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? '')).map(item => <tr key={item.id}><td>{item.scheduledFor}</td><td>{item.channel}</td><td><button disabled={busy || dirty} onClick={() => void choose(item.id)}>{item.title}</button></td><td>计划草稿 · 未发布</td></tr>)}</tbody></table></div> : <p>尚无已确认的发布计划。</p>}</>}
  </section>;
}
