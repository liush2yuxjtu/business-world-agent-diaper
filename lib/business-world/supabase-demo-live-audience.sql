-- Synthetic audience segments with explicit persona identities; no permissions change.
begin;
do $$
declare
 baseline public.business_world_state%rowtype;
 audience jsonb := '{"source": "PR9 数据库演示集 · 人工构造的直播分段", "asOf": "2026-09-22T00:00:00.000Z", "period": "2026-09-22 独立观众分段演示", "methodology": "人工构造的虚构观众分段，组内按观众标识去重；同一观众可能属于多个分段，组间不求和、不推算占比。以personaId明确关联现有人群档案，不由名称或人群库规模推断；独立于页面观看人数与直播漏斗样本。", "mode": "simulated", "segments": [{"personaId": "xiaoyu", "viewers": 1200}, {"personaId": "alin", "viewers": 800}, {"personaId": "wangyi", "viewers": 400}, {"personaId": "mia", "viewers": 200}]}'::jsonb;
 next_payload jsonb;
begin
 select * into baseline from public.business_world_state where id='primary' for update;
 if not found then raise exception 'Primary demo dataset missing; no update applied'; end if;
 if baseline.source_type is distinct from 'simulated'
   or baseline.payload #>> '{meta,dataMode}' is distinct from 'simulated'
   or baseline.payload #>> '{meta,datasetVersion}' is distinct from 'business-world-diaper-pr9-v2'
   or jsonb_typeof(baseline.payload->'live') is distinct from 'object'
 then raise exception 'Unexpected demo dataset; no update applied'; end if;
 if (baseline.payload->'live') ? 'audience' and baseline.payload #> '{live,audience}' is distinct from audience
 then raise exception 'Existing audience differs; no overwrite applied'; end if;
 if exists (select 1 from jsonb_array_elements(audience->'segments') s where (select count(*) from jsonb_array_elements(baseline.payload->'personas') p where p->>'id'=s->>'personaId') <> 1) then raise exception 'Persona identity missing or ambiguous'; end if;
 next_payload := jsonb_set(baseline.payload,'{live,audience}',audience);
 if next_payload is distinct from baseline.payload then
   update public.business_world_state set payload=next_payload,updated_at=now() where id='primary';
 end if;
end $$;
commit;
select id,source_type,payload #> '{live,audience}' as audience from public.business_world_state where id='primary';
