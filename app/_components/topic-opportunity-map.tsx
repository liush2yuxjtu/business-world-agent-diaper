'use client';
import { topicOpportunity, opportunityModeLabels } from '@/lib/business-world/topic-opportunity';
import type { BusinessPayload } from './business-world-restored';

type Topic = BusinessPayload['content']['topTopics'][number];
export function TopicOpportunityMap({topics, dataMode, selected, onSelect}: {topics: Topic[]; dataMode: string; selected: number; onSelect: (index: number) => void}) {
  const points = topics.map((topic,index)=>({topic,index,score:topicOpportunity(topic.opportunityScore,dataMode)}));
  const scored = points.filter(point=>point.score !== null);
  const missing = points.filter(point=>point.score === null);
  const active = points[selected];
  return <section className="panel topic-opportunity-map" aria-label="内容主题机会矩阵">
    <h2>内容主题机会矩阵</h2>
    <p>横轴：竞争强度，纵轴：市场机会，范围均为0–100。分数含义与来源见所选选题依据；不同评分口径不能直接比较。气泡大小固定，不代表收益或人群规模。</p>
    <div className="topic-map-scroll"><div className="topic-map-canvas" role="group" aria-label="选题气泡图">
      <span className="topic-axis-y">市场机会 ↑</span><span className="topic-axis-x">竞争强度 →</span>
      <span className="topic-high">100</span><span className="topic-low">0</span><span className="topic-max">100</span>
      {scored.map(({topic,index,score})=><button key={topic.title} className="topic-bubble" aria-pressed={selected===index} aria-controls="content-topic-detail" style={{left:`${10+score!.competition*.8}%`,bottom:`${15+score!.opportunity*.7}%`}} onClick={()=>onSelect(index)} aria-label={`${topic.title}，竞争强度${score!.competition}，市场机会${score!.opportunity}，${opportunityModeLabels[score!.mode]}`}><span>{index+1}</span><span className="topic-bubble-name">{topic.title}</span></button>)}
      {!scored.length&&<p className="topic-map-empty">当前快照未提供带来源的完整评分，暂不绘制气泡。选题仍可从下方列表打开。</p>}
    </div></div>
    {scored.length>0&&<div className="topic-map-key" aria-label="图中选题">{scored.map(({topic,index,score})=><button key={topic.title} aria-pressed={selected===index} onClick={()=>onSelect(index)}>{index+1}. {topic.title} · 竞争 {score!.competition} / 机会 {score!.opportunity}</button>)}</div>}
    {active?.score&&<div className="soft-note topic-score-source" role="status"><b>{active.topic.title} · {opportunityModeLabels[active.score.mode]}</b><p>竞争强度 {active.score.competition} / 市场机会 {active.score.opportunity}</p><p>评分来源：{active.score.source}</p><p>评分口径：{active.score.methodology}</p><p>截至：{active.score.asOf}</p></div>}
    {missing.length>0&&<p>未定位选题（缺少完整评分或评分依据）：{missing.map(({topic})=>topic.title).join('、')}。不会根据列表顺序或机会标签推测坐标。</p>}
  </section>;
}
