begin;
create table if not exists public.business_world_content_draft (
  id uuid primary key,
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  document jsonb not null,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now()
);
alter table public.business_world_content_draft enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'business_world_content_draft' and policyname = 'content_draft_owner') then
    create policy content_draft_owner on public.business_world_content_draft for all to anon
      using (owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner'))
      with check (owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner'));
  end if;
end $$;
grant select, insert, update on public.business_world_content_draft to anon;
revoke delete on public.business_world_content_draft from anon;
create index if not exists business_world_content_draft_owner_created on public.business_world_content_draft(owner_hash, created_at desc);
commit;
