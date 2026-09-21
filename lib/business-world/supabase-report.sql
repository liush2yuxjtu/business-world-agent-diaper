-- Browser-scoped demo report workspace. No access to other business tables is changed.
begin;
create table if not exists public.business_world_report (
  id uuid primary key,
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  document jsonb not null,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now()
);
alter table public.business_world_report enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'business_world_report' and policyname = 'report_browser_scope') then
    create policy report_browser_scope on public.business_world_report
      for all to anon
      using (owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner'))
      with check (owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner'));
  end if;
end $$;
grant select, insert, update on public.business_world_report to anon;
revoke delete on public.business_world_report from anon;
create index if not exists business_world_report_owner_created on public.business_world_report(owner_hash, created_at desc);
commit;
