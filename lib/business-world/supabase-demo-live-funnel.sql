-- A separate synthetic cohort; do not derive people from independent rates/orders.
begin;
do $$
declare
 baseline public.business_world_state%rowtype;
 funnel jsonb := '{"source":"PR9 数据库演示集 · 人工构造的递进人群样本","asOf":"2026-09-22T00:00:00.000Z","period":"2026-09-22 演示场次（独立合成样本）","cohort":"固定10000个虚构观众标识，同一场次按曝光→进房→停留→商品点击→加购→支付逐级取子集。","methodology":"所有数值为人工构造的演示人数；各阶段按同一虚构观众标识去重，停留为累计观看至少30秒，支付为至少一笔已支付订单的去重观众。后续阶段均为前一阶段子集。该样本独立于页面整体快照指标，不与观看UV、订单数或来源报告比例混算；人数差不代表已证实原因。","unit":"unique_people","mode":"simulated","counts":{"exposure":10000,"entry":3600,"retained":2400,"productClick":960,"cart":480,"paid":144}}'::jsonb;
 next_payload jsonb;
begin
 select * into baseline from public.business_world_state where id='primary' for update;
 if not found then raise exception 'Primary demo dataset missing; no update applied'; end if;
 if baseline.source_type is distinct from 'simulated'
   or baseline.payload #>> '{meta,dataMode}' is distinct from 'simulated'
   or baseline.payload #>> '{meta,datasetVersion}' is distinct from 'business-world-diaper-pr9-v2'
   or jsonb_typeof(baseline.payload->'live') is distinct from 'object'
 then raise exception 'Unexpected demo dataset; no update applied'; end if;
 if (baseline.payload->'live') ? 'funnel' and baseline.payload #> '{live,funnel}' is distinct from funnel
 then raise exception 'Existing funnel differs; no overwrite applied'; end if;
 next_payload := jsonb_set(baseline.payload,'{live,funnel}',funnel);
 if next_payload is distinct from baseline.payload then
   update public.business_world_state set payload=next_payload,updated_at=now() where id='primary';
 end if;
end $$;
commit;
select id,source_type,payload #> '{live,funnel}' as funnel from public.business_world_state where id='primary';
