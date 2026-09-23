-- Add categories only to the known synthetic PR9 demo dataset.
-- Does not grant permissions or alter observed platform records.
begin;
do $$
declare
  before_row public.business_world_state%rowtype;
  after_payload jsonb;
  categorized jsonb;
begin
  select * into strict before_row from public.business_world_state where id = 'primary' for update;
  if before_row.source_type is distinct from 'simulated'
    or before_row.payload #>> '{meta,dataMode}' is distinct from 'simulated'
    or before_row.payload #>> '{meta,datasetVersion}' is distinct from 'business-world-diaper-pr9-v2'
    or jsonb_array_length(before_row.payload #> '{commerce,products}') is distinct from 3
    or (select array_agg(p->>'id' order by p->>'id') from jsonb_array_elements(before_row.payload #> '{commerce,products}') p)
       is distinct from array['daily','newborn','night']::text[]
  then raise exception 'Unexpected dataset; no category update applied';
  end if;
  if exists (
    select 1 from jsonb_array_elements(before_row.payload #> '{commerce,products}') p
    where p ? 'category' and p->>'category' is distinct from
      case p->>'id' when 'night' then '夜间护理' else '日常护理' end
  ) then raise exception 'Existing category differs; no overwrite applied';
  end if;
  select jsonb_agg(p || jsonb_build_object('category',
    case p->>'id' when 'night' then '夜间护理' else '日常护理' end) order by ord)
    into categorized
    from jsonb_array_elements(before_row.payload #> '{commerce,products}') with ordinality as products(p,ord);
  after_payload := jsonb_set(before_row.payload, '{commerce,products}', categorized);
  if after_payload is distinct from before_row.payload then
    update public.business_world_state set payload=after_payload, updated_at=now() where id='primary';
  end if;
end $$;
commit;
select id, source_type, payload #>> '{meta,dataMode}' as data_mode,
  p->>'id' as product_id, p->>'category' as category, p->>'gmv' as gmv
from public.business_world_state,
  lateral jsonb_array_elements(payload #> '{commerce,products}') p
where id='primary';

