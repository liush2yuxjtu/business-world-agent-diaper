'use client';

import { useState } from 'react';
import { liveStages, readLiveFunnel, stageLeakage, type LiveStage } from '@/lib/business-world/live-funnel';
import type { BusinessPayload } from './business-world-restored';

const fmt = (value: number | null | undefined, unit: string) => value == null ? '未提供' : `${value.toLocaleString('zh-CN')} ${unit}`;
const gaps: Record<LiveStage, string> = {
  exposure: '需要同一周期、去重人群和递进事件定义，才能把曝光作为完整漏斗起点。',
  entry: '需要曝光与进房为同一递进人群；不能直接把独立观看人数除以曝光人数，替代来源报告的进房率。',
  retained: '需要停留阈值及达到阈值的人数；平均停留秒数不能换算成停留人数。',
  productClick: '需要点击商品的去重人数及前一阶段人数，当前整体快照没有提供。',
  cart: '需要加购去重人数和相邻阶段分母；不能从整体加购率反推人数。',
  paid: '需要支付去重人数；订单数量不等于支付人数，也不能直接作为逐级转化率分子。',
};

export function LiveFunnelPanel({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const [selected, setSelected] = useState<LiveStage>('exposure');
  const funnel = readLiveFunnel(data?.live.funnel, data?.meta.dataMode ?? '');
  const leakage = stageLeakage(funnel, selected);
  const title = liveStages.find(([id]) => id === selected)![1];
  const reported: Record<LiveStage, Array<[string, string]>> = {
    exposure: [['曝光人数', fmt(data?.live.exposureUv, '人')]],
    entry: [['观看人数', fmt(data?.live.watchUv, '人')], ['来源报告进房率', fmt(data?.live.roomEntryRate, '%')]],
    retained: [['平均停留', fmt(data?.live.avgWatchSec, '秒')]],
    productClick: [['商品点击人数', '未提供']],
    cart: [['来源报告加购率', fmt(data?.live.cartRate, '%')]],
    paid: [['支付订单', fmt(data?.live.paidOrders, '单')], ['来源报告支付转化率', fmt(data?.live.payConversionRate, '%')]],
  };
  return <section className="panel live-funnel-panel">
    <div className="section-title"><h2>直播漏斗</h2><small>{funnel ? funnel.mode === 'simulated' ? '模拟漏斗 · 非真实观测' : '来源报告的同口径漏斗' : '阶段口径待补齐'}</small></div>
    <p className="caption">{funnel ? '阶段人数来自同一递进人群；流失仅表示相邻阶段人数差，不证明流失原因。' : '当前整体指标缺少完整递进人群定义，不能据此绘制转化比例或推算流失人数。点击阶段查看已有证据与缺口。'}</p>
    <div className="live-funnel-stages" role="group" aria-label="直播漏斗阶段">
      {liveStages.map(([id, label], index) => <button key={id} aria-pressed={selected === id} aria-controls="live-funnel-evidence" onClick={() => setSelected(id)}><span>{index + 1}. {label}</span><b>{fmt(funnel?.counts[id], '人')}</b></button>)}
    </div>
    <section id="live-funnel-evidence" aria-label={`${title}阶段证据`} aria-live="polite">
      <h3>{title} · 证据与流失分析</h3>
      {funnel ? <>
        <dl className="detail-list"><div><dt>本阶段去重人数</dt><dd>{fmt(funnel.counts[selected], '人')}</dd></div></dl>
        {leakage ? <p>相邻阶段：{leakage.before.toLocaleString('zh-CN')} → {leakage.after.toLocaleString('zh-CN')} 人；转化率 {leakage.conversion.toFixed(2)}%；未进入本阶段 {leakage.lost.toLocaleString('zh-CN')} 人（{leakage.lossRate.toFixed(2)}%）。{funnel.mode === 'simulated' ? '这些是模拟样本计算结果。' : ''}</p> : <p>{selected === 'exposure' ? '起始阶段没有前一阶段，不计算流失率。' : '相邻阶段人数缺失或分母为0，暂不能计算转化与流失。'}</p>}
        <dl className="detail-list">{[['来源',funnel.source],['统计周期',funnel.period],['递进人群',funnel.cohort],['去重与事件口径',funnel.methodology],['观测时间',funnel.asOf]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
        <p>需要按渠道、内容或商品进一步核验原因，不将人数差自动归因为讲解或投放问题。</p>
      </> : <p>{gaps[selected]}</p>}
      <h4>整体快照中的相关指标</h4>
      <p className="caption">{data?.meta.dataMode === 'simulated' ? '合成演示指标，非真实经营记录。' : '以下指标保留来源原口径。'}与上方递进漏斗可能不同口径，不混算。</p>
      <dl className="detail-list">{reported[selected].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      <button className="text-link" onClick={onSource}>查看直播快照来源</button>
    </section>
  </section>;
}
