'use client';

import { audiencePersona, readLiveAudience } from '@/lib/business-world/live-audience';
import { entityHref } from '@/lib/business-world/entity-links';
import type { BusinessPayload } from './business-world-restored';

export function LiveAudiencePanel({ data }: { data: BusinessPayload | null }) {
  const audience = readLiveAudience(data?.live.audience, data?.meta.dataMode ?? '');
  return <section className="panel" aria-label="直播观众分段">
    <div className="section-title"><h2>观众分段</h2><small>{audience?.mode === 'simulated' ? '合成演示人群 · 非真实观众' : audience ? '来源报告的人群分段' : '分段依据待补齐'}</small></div>
    {audience ? <>
      <p className="caption">仅展示来源明确关联的分段；人数不等于人群库规模，也不与其他周期或漏斗指标混算。</p>
      <div className="live-audience-segments">{audience.segments.map(segment => {
        const person = audiencePersona(data?.personas ?? [], segment.personaId);
        return <div className="live-audience-segment" key={segment.personaId}>
          <strong>{segment.viewers.toLocaleString('zh-CN')} 人</strong>
          {person ? <a className="text-link" href={entityHref('persona', person.id)}>查看人群：{person.title}</a> : <p>关联人群档案缺失或标识不唯一，暂不能跳转。</p>}
        </div>;
      })}</div>
      {!audience.segments.length && <p className="empty-state">该来源尚无分段记录。</p>}
      <dl className="detail-list"><div><dt>来源</dt><dd>{audience.source}</dd></div><div><dt>统计周期</dt><dd>{audience.period}</dd></div><div><dt>分段口径</dt><dd>{audience.methodology}</dd></div><div><dt>数据时间</dt><dd>{audience.asOf}</dd></div></dl>
    </> : <p className="empty-state">尚无有效的直播观众分段依据，不把全部人群档案推定为直播观众。</p>}
  </section>;
}
