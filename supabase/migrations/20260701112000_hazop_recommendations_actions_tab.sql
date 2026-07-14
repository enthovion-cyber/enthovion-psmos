alter table if exists public.hazop_recommendations
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists node_id text,
  add column if not exists safeguard_id text,
  add column if not exists risk_assessment_id text,
  add column if not exists lopa_trigger_id text,
  add column if not exists source_type text not null default 'Manual',
  add column if not exists recommendation_text text,
  add column if not exists rationale text,
  add column if not exists department_id text,
  add column if not exists verification_required boolean not null default false,
  add column if not exists evidence_required boolean not null default false,
  add column if not exists closure_blocker boolean not null default false,
  add column if not exists linked_action_id text,
  add column if not exists action_status_snapshot text,
  add column if not exists lopa_related boolean not null default false,
  add column if not exists verified_by text,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_status text not null default 'Not Required',
  add column if not exists evidence_status text not null default 'Not Required',
  add column if not exists cancelled_by text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists deferred_until date,
  add column if not exists deferral_status text,
  add column if not exists notes text;

update public.hazop_recommendations r
set recommendation_text = coalesce(r.recommendation_text, r.description),
    linked_action_id = coalesce(r.linked_action_id, r.action_id),
    evidence_status = case when coalesce(r.evidence_required, false) then 'Missing' else coalesce(r.evidence_status, 'Not Required') end,
    verification_status = case when coalesce(r.verification_required, false) then 'Pending' else coalesce(r.verification_status, 'Not Required') end
where r.recommendation_text is null or r.linked_action_id is null;

create table if not exists public.hazop_recommendation_evidence (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  recommendation_id text not null references public.hazop_recommendations(id) on delete cascade,
  evidence_type text not null,
  attachment_id text,
  document_id text,
  document_version_id text,
  file_name text,
  storage_path text,
  comment text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_recommendation_verifications (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  recommendation_id text not null references public.hazop_recommendations(id) on delete cascade,
  verifier_id text,
  decision text not null,
  verification_comment text,
  verified_at timestamptz,
  e_signature_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_recommendation_deferrals (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  recommendation_id text not null references public.hazop_recommendations(id) on delete cascade,
  deferral_reason text not null,
  new_due_date date not null,
  approved_by text,
  approved_at timestamptz,
  status text not null default 'Requested',
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists hazop_recommendations_study_due_idx on public.hazop_recommendations (study_id, due_date, status);
create index if not exists hazop_recommendations_source_idx on public.hazop_recommendations (study_id, source_type);
create index if not exists hazop_recommendations_action_idx on public.hazop_recommendations (tenant_id, linked_action_id);
create index if not exists hazop_rec_evidence_rec_idx on public.hazop_recommendation_evidence (recommendation_id, uploaded_at desc);
create index if not exists hazop_rec_verification_rec_idx on public.hazop_recommendation_verifications (recommendation_id, created_at desc);
create index if not exists hazop_rec_deferral_rec_idx on public.hazop_recommendation_deferrals (recommendation_id, created_at desc);

alter table public.hazop_recommendation_evidence enable row level security;
alter table public.hazop_recommendation_verifications enable row level security;
alter table public.hazop_recommendation_deferrals enable row level security;

grant select, insert, update, delete on public.hazop_recommendation_evidence to authenticated;
grant select, insert, update, delete on public.hazop_recommendation_verifications to authenticated;
grant select, insert, update, delete on public.hazop_recommendation_deferrals to authenticated;

do $$
declare
  permission_key text;
begin
  foreach permission_key in array array[
    'hazop.recommendations.view',
    'hazop.recommendations.create',
    'hazop.recommendations.edit',
    'hazop.recommendations.delete',
    'hazop.recommendations.cancel',
    'hazop.recommendations.defer',
    'hazop.recommendations.verify',
    'hazop.recommendations.evidence.upload',
    'hazop.recommendations.action.create',
    'hazop.recommendations.action.link',
    'hazop.recommendations.export'
  ]
  loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'hazop', initcap(replace(permission_key, '.', ' ')), split_part(permission_key, '.', 3), permission_key
      from public."Tenant" t
      where not exists (
        select 1 from public."Permission" p where p."tenantId" = t."id" and p."key" = permission_key
      );
    end if;

    if to_regclass('public.permissions') is not null then
      insert into public.permissions (id, tenant_id, key, module, name)
      select gen_random_uuid()::text, t.id, permission_key, 'hazop', initcap(replace(permission_key, '.', ' '))
      from public.tenants t
      where not exists (
        select 1 from public.permissions p where p.tenant_id = t.id and p.key = permission_key
      );
    end if;
  end loop;
end $$;
