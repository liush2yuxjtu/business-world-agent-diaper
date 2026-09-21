-- Immutable report snapshots; recipient access returns document only, never owner hashes.
begin;
create table if not exists public.business_world_report_share (
  id uuid primary key,
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  report_id uuid not null references public.business_world_report(id),
  revision integer not null check (revision > 0),
  document jsonb not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
alter table public.business_world_report_share enable row level security;
do $$ begin
if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'business_world_report_share' and policyname = 'report_share_owner') then
create policy report_share_owner on public.business_world_report_share for all to anon
  using (owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner'))
  with check (
    owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner')
    and exists (select 1 from public.business_world_report r where r.id = report_id and r.owner_hash = (current_setting('request.headers', true)::jsonb ->> 'x-report-owner'))
  );
end if;
end $$;
revoke all on public.business_world_report_share from anon;
grant select, insert on public.business_world_report_share to anon;
grant update (revoked_at) on public.business_world_report_share to anon;
create index if not exists business_world_report_share_owner on public.business_world_report_share(owner_hash, report_id, created_at desc);
create or replace function public.read_business_world_report_share(share_id uuid, access_hash text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select s.document from public.business_world_report_share s
  where s.id = share_id and s.token_hash = access_hash
    and s.revoked_at is null and s.expires_at > now()
  limit 1;
$$;
revoke all on function public.read_business_world_report_share(uuid, text) from public;
grant execute on function public.read_business_world_report_share(uuid, text) to anon;
commit;
