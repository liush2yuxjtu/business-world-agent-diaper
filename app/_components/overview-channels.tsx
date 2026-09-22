import { ArrowRight, BarChart3, Radio, ShoppingCart, Video } from 'lucide-react';
import type { BusinessPayload } from './business-world-restored';

export function OverviewChannels({ data }: { data: BusinessPayload | null }) {
  const channels = [
    { screen: 'content', title: '内容', metric: '内容互动量', value: data?.content.interactions, unit: '次', Icon: Video, action: '进入内容策略' },
    { screen: 'live', title: '直播', metric: '直播 GMV', value: data?.live.gmv, unit: '元', Icon: Radio, action: '进入直播作战室' },
    { screen: 'product', title: '电商', metric: '商品 GMV', value: data?.commerce.gmv, unit: '元', Icon: ShoppingCart, action: '进入商品分析' },
    { screen: 'growth', title: '投放', metric: '投放消耗', value: data?.ads.spend, unit: '元', Icon: BarChart3, action: '进入投放优化' },
  ];
  return <section className="panel" aria-label="渠道工作区">
    <div className="section-title"><h2>渠道工作区</h2><small>{data?.meta.dataMode === 'simulated' ? '合成演示快照' : data ? '当前来源快照' : '等待来源数据'}</small></div>
    <p id="channel-metric-boundary">以下指标分别来自当前快照的内容、直播、商品与投放模块。统计对象和单位不同，不能相加；尚无统一渠道归因依据，不计算贡献占比。</p>
    <div className="overview-channel-cards">{channels.map(({ screen, title, metric, value, unit, Icon, action }) =>
      <a key={screen} href={`?screen=${screen}`} aria-label={`${title}：${action}`} aria-describedby="channel-metric-boundary">
        <span className="overview-channel-heading"><Icon aria-hidden="true" size={22}/><b>{title}</b></span>
        <span>{metric}</span><strong>{value == null ? '未提供' : `${value.toLocaleString('zh-CN')} ${unit}`}</strong>
        <small>{data?.meta.dataMode === 'simulated' ? '模拟值，非真实经营观测' : value == null ? '缺少指标，仍可进入工作区核查' : '以来源口径与观测时间为准'}</small>
        <span className="overview-channel-action">{action}<ArrowRight aria-hidden="true" size={16}/></span>
      </a>
    )}</div>
  </section>;
}
