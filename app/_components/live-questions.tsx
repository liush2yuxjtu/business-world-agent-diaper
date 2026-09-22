'use client';

import { useState } from 'react';
import { questionCategories, questionSuggestion, readLiveQuestions } from '@/lib/business-world/live-questions';
import type { BusinessPayload } from './business-world-restored';

export function LiveQuestionsPanel({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const questions = readLiveQuestions(data?.live.questions, data?.meta.dataMode ?? '');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<{ questionId: string; kind: 'reply' | 'task'; text: string } | null>(null);
  const question = questions?.items.find(item => item.id === selectedId);
  const matches = data?.live.sessions.filter(item => item.id === question?.sessionId) ?? [];
  const session = matches.length === 1 ? matches[0] : null;
  return <section className="panel" aria-label="直播问题与建议">
    <div className="section-title"><h2>直播问题</h2><small>{questions?.mode === 'simulated' ? '合成留言演示 · 非实时接入' : questions ? '来源问题快照 · 非实时接入' : '问题来源待接入'}</small></div>
    {questions ? <>
      <p>选择问题后可整理回复或任务建议。建议由固定核查模板生成，仍需人工核实，不代表 Agent 已研究或平台已执行。</p>
      <div className="live-question-list">{questions.items.map(item => <button type="button" key={item.id} aria-pressed={selectedId === item.id} aria-controls="live-question-detail" onClick={() => { setSelectedId(item.id); setDraft(null); }}>
        <small>{questionCategories[item.category]} · {item.at}</small><span>{item.text}</span>
      </button>)}</div>
      {!questions.items.length && <p>该来源暂无问题。</p>}
      <div id="live-question-detail" aria-live="polite">{question ? <>
        <h3>问题详情</h3><blockquote>{question.text}</blockquote>
        <dl className="detail-list"><div><dt>问题标识</dt><dd>{question.id}</dd></div><div><dt>场次</dt><dd>{session?.title ?? '关联场次缺失或不唯一，暂不能形成建议'}</dd></div><div><dt>问题时间</dt><dd>{question.at}</dd></div></dl>
        <div className="campaign-review-actions"><button type="button" disabled={!session} onClick={() => setDraft({ questionId: question.id, kind: 'reply', text: questionSuggestion(question, 'reply') })}>整理回复建议</button><button type="button" disabled={!session} onClick={() => setDraft({ questionId: question.id, kind: 'task', text: questionSuggestion(question, 'task') })}>整理任务建议</button></div>
        {draft?.questionId === question.id && <div className="live-question-draft"><h3>{draft.kind === 'reply' ? '回复建议 · 未发送' : '任务建议 · 未创建'}</h3><p>原问题：{question.text}</p><label htmlFor="live-question-draft">{draft.kind === 'reply' ? '修改回复建议' : '修改任务建议'}</label><textarea id="live-question-draft" rows={7} maxLength={4000} value={draft.text} onChange={event => setDraft({ ...draft, text: event.target.value })}/><p role="status">仅保留在当前页面，切换问题或刷新会清除；不会发送留言、创建已保存任务或修改外部平台。</p></div>}
      </> : <p>尚未选择问题。</p>}</div>
      <details><summary>查看问题来源与演示口径</summary><dl className="detail-list"><div><dt>来源</dt><dd>{questions.source}</dd></div><div><dt>来源时间</dt><dd>{questions.asOf}</dd></div><div><dt>口径</dt><dd>{questions.methodology}</dd></div></dl>{onSource && <button type="button" onClick={onSource}>查看问题快照来源</button>}</details>
    </> : <p>尚无有效的问题来源，不把示例留言冒充实时观众提问。</p>}
  </section>;
}
