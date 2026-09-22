-- Synthetic question examples with explicit session identities; no permissions change.
begin;
do $$
declare
 baseline public.business_world_state%rowtype;
 questions jsonb := '{"source": "PR9 数据库演示集 · 人工构造的直播问题", "asOf": "2026-09-22T00:00:00.000Z", "mode": "simulated", "methodology": "参照设计稿的商品、物流、尺码、正品咨询类别人工构造；不来自真实客户或实时平台。问题以明确sessionId关联现有演示场次，时间为演示时间，不代表平台采集时间。", "items": [{"id": "demo-q-product", "sessionId": "live-001", "at": "2026-09-22T06:31:00.000Z", "text": "这个纸尿裤适合敏感肌吗？", "category": "product"}, {"id": "demo-q-shipping", "sessionId": "live-002", "at": "2026-09-22T06:28:00.000Z", "text": "什么时候发货？", "category": "shipping"}, {"id": "demo-q-size", "sessionId": "live-001", "at": "2026-09-22T06:26:00.000Z", "text": "有没有大尺码？", "category": "size"}, {"id": "demo-q-authenticity", "sessionId": "live-002", "at": "2026-09-22T06:24:00.000Z", "text": "这是正品吗？", "category": "authenticity"}]}'::jsonb;
 next_payload jsonb;
begin
 select * into baseline from public.business_world_state where id='primary' for update;
 if not found then raise exception 'Primary demo dataset missing; no update applied'; end if;
 if baseline.source_type is distinct from 'simulated'
   or baseline.payload #>> '{meta,dataMode}' is distinct from 'simulated'
   or baseline.payload #>> '{meta,datasetVersion}' is distinct from 'business-world-diaper-pr9-v2'
   or jsonb_typeof(baseline.payload->'live') is distinct from 'object'
 then raise exception 'Unexpected demo dataset; no update applied'; end if;
 if (baseline.payload->'live') ? 'questions' and baseline.payload #> '{live,questions}' is distinct from questions
 then raise exception 'Existing questions differs; no overwrite applied'; end if;
 if exists (select 1 from jsonb_array_elements(questions->'items') s where (select count(*) from jsonb_array_elements(baseline.payload #> '{live,sessions}') p where p->>'id'=s->>'sessionId') <> 1) then raise exception 'Session identity missing or ambiguous'; end if;
 next_payload := jsonb_set(baseline.payload,'{live,questions}',questions);
 if next_payload is distinct from baseline.payload then
   update public.business_world_state set payload=next_payload,updated_at=now() where id='primary';
 end if;
end $$;
commit;
select id,source_type,payload #> '{live,questions}' as questions from public.business_world_state where id='primary';
