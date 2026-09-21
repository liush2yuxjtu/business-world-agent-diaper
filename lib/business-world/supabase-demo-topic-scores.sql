-- Explicitly synthetic topic coordinates; never observed business evidence.
begin;
do $$
declare
  baseline public.business_world_state%rowtype;
  scores jsonb := '{"宝宝整夜不漏尿挑战":{"competition":20,"opportunity":85,"source":"PR9 数据库演示集 · 人工设定的合成评分","methodology":"为演示0–100竞争强度与市场机会坐标人工设定，未使用平台采样、真实订单或模型预测；仅用于交互演示，不构成业务排序建议。","asOf":"2026-09-22T00:00:00.000Z","mode":"simulated"},"夏季透气纸尿裤测评":{"competition":50,"opportunity":80,"source":"PR9 数据库演示集 · 人工设定的合成评分","methodology":"为演示0–100竞争强度与市场机会坐标人工设定，未使用平台采样、真实订单或模型预测；仅用于交互演示，不构成业务排序建议。","asOf":"2026-09-22T00:00:00.000Z","mode":"simulated"},"新生儿囤货清单":{"competition":20,"opportunity":40,"source":"PR9 数据库演示集 · 人工设定的合成评分","methodology":"为演示0–100竞争强度与市场机会坐标人工设定，未使用平台采样、真实订单或模型预测；仅用于交互演示，不构成业务排序建议。","asOf":"2026-09-22T00:00:00.000Z","mode":"simulated"},"红屁屁护理误区":{"competition":80,"opportunity":45,"source":"PR9 数据库演示集 · 人工设定的合成评分","methodology":"为演示0–100竞争强度与市场机会坐标人工设定，未使用平台采样、真实订单或模型预测；仅用于交互演示，不构成业务排序建议。","asOf":"2026-09-22T00:00:00.000Z","mode":"simulated"},"纸尿裤尺码怎么选":{"competition":50,"opportunity":20,"source":"PR9 数据库演示集 · 人工设定的合成评分","methodology":"为演示0–100竞争强度与市场机会坐标人工设定，未使用平台采样、真实订单或模型预测；仅用于交互演示，不构成业务排序建议。","asOf":"2026-09-22T00:00:00.000Z","mode":"simulated"},"夜用纸尿裤真实对比":{"competition":80,"opportunity":90,"source":"PR9 数据库演示集 · 人工设定的合成评分","methodology":"为演示0–100竞争强度与市场机会坐标人工设定，未使用平台采样、真实订单或模型预测；仅用于交互演示，不构成业务排序建议。","asOf":"2026-09-22T00:00:00.000Z","mode":"simulated"}}'::jsonb;
  topics jsonb;
  next_payload jsonb;
begin
  select * into strict baseline from public.business_world_state where id='primary' for update;
  if baseline.source_type is distinct from 'simulated'
    or baseline.payload #>> '{meta,dataMode}' is distinct from 'simulated'
    or baseline.payload #>> '{meta,datasetVersion}' is distinct from 'business-world-diaper-pr9-v2'
    or jsonb_array_length(baseline.payload #> '{content,topTopics}') is distinct from 6
    or (select count(distinct t->>'title') from jsonb_array_elements(baseline.payload #> '{content,topTopics}') t) <> 6
    or exists(select 1 from jsonb_array_elements(baseline.payload #> '{content,topTopics}') t where not scores ? (t->>'title'))
  then raise exception 'Unexpected demo topics; no update applied'; end if;
  if exists(select 1 from jsonb_array_elements(baseline.payload #> '{content,topTopics}') t
    where t ? 'opportunityScore' and t->'opportunityScore' is distinct from scores->(t->>'title'))
  then raise exception 'Existing score differs; no overwrite applied'; end if;
  select jsonb_agg(t || jsonb_build_object('opportunityScore',scores->(t->>'title')) order by ord)
    into topics from jsonb_array_elements(baseline.payload #> '{content,topTopics}') with ordinality as entries(t,ord);
  next_payload := jsonb_set(baseline.payload,'{content,topTopics}',topics);
  if next_payload is distinct from baseline.payload then
    update public.business_world_state set payload=next_payload,updated_at=now() where id='primary';
  end if;
end $$;
commit;
select t->>'title' as title, t->'opportunityScore' as score from public.business_world_state,
 lateral jsonb_array_elements(payload #> '{content,topTopics}') t where id='primary';

