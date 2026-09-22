-- Synthetic association examples with exact product identities; no permissions change.
begin;
do $$
declare
 baseline public.business_world_state%rowtype;
 associations jsonb := '{"source": "PR9 数据库演示集 · 人工构造的同单组合", "asOf": "2026-09-22T00:00:00.000Z", "period": "2026-09-22 独立关联购买演示样本", "methodology": "人工构造的汇总演示：分母为1000个虚构订单的假设样本，未采集或保存逐单交易。口径为同一订单内同时含全部成员商品去重。日夜组合240单，成长阶段组合120单；组合可重叠，不求和。与整体GMV、客单价和真实订单无关，不推算因果、增收或客单提升。", "mode": "simulated", "sampleOrders": 1000, "rows": [{"id": "day-night", "title": "日夜场景组合", "productIds": ["daily", "night"], "jointOrders": 240, "hypothesis": "研究日常与夜间使用场景是否适合组合介绍；先核对同一使用人群、尺码和库存，不能从同单比例推断优惠或增收。"}, {"id": "growth-stage", "title": "成长阶段组合", "productIds": ["newborn", "daily"], "jointOrders": 120, "hypothesis": "研究不同成长阶段的备货需求；先核对家庭是否确有跨阶段需求，避免将不适用的尺码强行组合。"}]}'::jsonb;
 next_payload jsonb;
begin
 select * into baseline from public.business_world_state where id='primary' for update;
 if not found then raise exception 'Primary demo dataset missing; no update applied'; end if;
 if baseline.source_type is distinct from 'simulated'
   or baseline.payload #>> '{meta,dataMode}' is distinct from 'simulated'
   or baseline.payload #>> '{meta,datasetVersion}' is distinct from 'business-world-diaper-pr9-v2'
   or jsonb_typeof(baseline.payload->'commerce') is distinct from 'object'
 then raise exception 'Unexpected demo dataset; no update applied'; end if;
 if (baseline.payload->'commerce') ? 'associations' and baseline.payload #> '{commerce,associations}' is distinct from associations
 then raise exception 'Existing associations differs; no overwrite applied'; end if;
 if exists (select 1 from jsonb_array_elements(associations->'rows') r cross join lateral jsonb_array_elements_text(r->'productIds') p(id) where (select count(*) from jsonb_array_elements(baseline.payload #> '{commerce,products}') x where x->>'id'=p.id) <> 1) then raise exception 'Product identity missing or ambiguous'; end if;
 next_payload := jsonb_set(baseline.payload,'{commerce,associations}',associations);
 if next_payload is distinct from baseline.payload then
   update public.business_world_state set payload=next_payload,updated_at=now() where id='primary';
 end if;
end $$;
commit;
select id,source_type,payload #> '{commerce,associations}' as associations from public.business_world_state where id='primary';
