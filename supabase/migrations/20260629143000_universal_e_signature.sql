create table if not exists public.user_signature_profiles (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text references public."Company"(id) on delete set null,
  user_id text not null references public."User"(id) on delete cascade,
  full_name text not null,
  job_title text,
  department_id text,
  department_name text,
  signature_method text not null check (signature_method in ('Draw','Type','Upload','Initials')),
  signature_text text,
  signature_image_key text,
  signature_image_url text,
  signature_vector_json jsonb,
  initials text,
  style_config jsonb not null default '{}'::jsonb,
  status text not null default 'Draft' check (status in ('Not Created','Draft','Active','Disabled','Superseded')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text references public."User"(id) on delete set null,
  updated_by text references public."User"(id) on delete set null
);

create unique index if not exists user_signature_profiles_user_active_idx
on public.user_signature_profiles(user_id)
where status in ('Draft','Active','Disabled');

create table if not exists public.user_signature_profile_versions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  signature_profile_id text not null references public.user_signature_profiles(id) on delete cascade,
  user_id text not null references public."User"(id) on delete cascade,
  company_id text references public."Company"(id) on delete set null,
  version integer not null,
  signature_method text not null,
  signature_text text,
  signature_image_key text,
  signature_image_url text,
  signature_vector_json jsonb,
  initials text,
  style_config jsonb not null default '{}'::jsonb,
  status text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists user_signature_profile_versions_version_idx
on public.user_signature_profile_versions(signature_profile_id, version);

create table if not exists public.user_signature_pins (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text references public."Company"(id) on delete set null,
  user_id text not null references public."User"(id) on delete cascade,
  pin_hash text not null,
  status text not null default 'Active' check (status in ('Active','Locked','Disabled','Reset Required')),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_signature_pins_user_idx on public.user_signature_pins(user_id);

create table if not exists public.signature_requirements (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text references public."Company"(id) on delete cascade,
  site_id text references public."Site"(id) on delete cascade,
  module_name text not null,
  record_type text not null,
  action_type text not null,
  signature_role text not null,
  required_permission text,
  required boolean not null default true,
  sequence_order integer not null default 1,
  can_delegate boolean not null default true,
  requires_independent_signer boolean not null default false,
  blocks_action_until_signed boolean not null default true,
  declaration_text text not null default 'I confirm that I have reviewed the information above and approve this action using my electronic signature.',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists signature_requirements_lookup_idx
on public.signature_requirements(tenant_id, module_name, record_type, action_type, active, sequence_order);

create table if not exists public.electronic_signatures (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text references public."Company"(id) on delete set null,
  site_id text references public."Site"(id) on delete set null,
  user_id text not null references public."User"(id) on delete restrict,
  signature_profile_id text not null references public.user_signature_profiles(id) on delete restrict,
  signature_profile_version_id text references public.user_signature_profile_versions(id) on delete restrict,
  module_name text not null,
  record_type text not null,
  record_id text not null,
  record_number text,
  action_type text not null,
  signature_role text not null,
  declaration_text text,
  signature_snapshot_method text not null,
  signature_snapshot_text text,
  signature_snapshot_image_key text,
  signature_snapshot_image_url text,
  signature_snapshot_vector_json jsonb,
  signer_full_name text not null,
  signer_job_title text,
  signer_department text,
  signed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  auth_method text not null,
  auth_result text not null default 'Passed',
  signature_hash text not null,
  record_hash_before_signing text,
  signed_payload_hash text not null,
  status text not null default 'Signed' check (status in ('Signed','Rejected','Revoked By System','Superseded')),
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists electronic_signatures_unique_signed_action_idx
on public.electronic_signatures(tenant_id, module_name, record_type, record_id, action_type, signature_role)
where status = 'Signed';

create index if not exists electronic_signatures_record_idx
on public.electronic_signatures(tenant_id, module_name, record_type, record_id, signed_at desc);

create or replace function public.prevent_electronic_signature_mutation()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Electronic signatures are immutable and cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and old.status = 'Signed' then
    raise exception 'Signed electronic signature records are immutable';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists electronic_signatures_immutable_update on public.electronic_signatures;
create trigger electronic_signatures_immutable_update
before update or delete on public.electronic_signatures
for each row execute function public.prevent_electronic_signature_mutation();

alter table public.user_signature_profiles enable row level security;
alter table public.user_signature_profile_versions enable row level security;
alter table public.user_signature_pins enable row level security;
alter table public.signature_requirements enable row level security;
alter table public.electronic_signatures enable row level security;

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
select gen_random_uuid()::text, t.id, p.key, p.module_key, p.label, p.action, p.description
from public."Tenant" t
cross join (values
  ('signature.profile.view','signature','View Signature Profile','view','View own signature profile'),
  ('signature.profile.create','signature','Create Signature Profile','create','Create own e-signature profile'),
  ('signature.profile.edit','signature','Edit Signature Profile','edit','Edit own e-signature profile'),
  ('signature.profile.disable','signature','Disable Signature Profile','disable','Disable own e-signature profile'),
  ('signature.pin.set','signature','Set Signature PIN','create','Set signature PIN'),
  ('signature.pin.change','signature','Change Signature PIN','edit','Change signature PIN'),
  ('signature.pin.verify','signature','Verify Signature PIN','verify','Verify signature PIN'),
  ('signature.sign','signature','Sign Electronically','sign','Create an immutable electronic signature'),
  ('signature.reject','signature','Reject Signature','reject','Reject a required electronic signature'),
  ('signature.view','signature','View Signatures','view','View electronic signatures'),
  ('signature.requirements.manage','signature','Manage Signature Requirements','manage','Configure signature requirements'),
  ('signature.audit.view','signature','View Signature Audit','view','View signature audit records'),
  ('ptw.signatures.sign','ptw','Sign PTW','sign','Sign PTW records'),
  ('ptw.handover.sign','ptw','Sign PTW Handover','sign','Sign PTW shift handover'),
  ('ptw.gas.sign','ptw','Sign PTW Gas Test','sign','Sign PTW gas tests'),
  ('ptw.isolation.sign','ptw','Sign PTW Isolation','sign','Sign PTW isolation and LOTO'),
  ('ptw.close.sign','ptw','Sign PTW Closure','sign','Sign PTW closeout'),
  ('moc.workflow.sign','moc','Sign MOC Workflow','sign','Sign MOC workflow step'),
  ('moc.approval.sign','moc','Sign MOC Approval','sign','Sign MOC approval'),
  ('moc.close.sign','moc','Sign MOC Closure','sign','Sign MOC closure'),
  ('pssr.discipline_signoff.sign','pssr','Sign PSSR Discipline','sign','Sign PSSR discipline signoff'),
  ('pssr.authorization.sign','pssr','Sign PSSR Authorization','sign','Sign PSSR startup authorization'),
  ('pssr.certificate.sign','pssr','Sign PSSR Certificate','sign','Sign PSSR certificate')
) as p(key, module_key, label, action, description)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);

insert into public.signature_requirements
  (tenant_id, company_id, site_id, module_name, record_type, action_type, signature_role, required_permission, sequence_order, can_delegate, requires_independent_signer, blocks_action_until_signed, declaration_text)
select t.id, c.id, s.id, r.module_name, r.record_type, r.action_type, r.signature_role, r.required_permission, r.sequence_order, r.can_delegate, r.requires_independent_signer, r.blocks_action_until_signed, r.declaration_text
from public."Tenant" t
left join public."Company" c on c."tenantId" = t.id
left join public."Site" s on s."tenantId" = t.id and (s."companyId" = c.id or c.id is null)
cross join (values
  ('PTW','permit','issue','Requestor','ptw.signatures.sign',1,true,false,true,'I confirm this permit request is accurate and ready for authorization.'),
  ('PTW','permit','issue','Performing Authority','ptw.signatures.sign',2,true,false,true,'I accept responsibility for the work scope and controls.'),
  ('PTW','permit','issue','Issuing Authority','ptw.signatures.sign',3,true,true,true,'I confirm the permit has been reviewed and may be issued.'),
  ('PTW','shift_handover','complete','Outgoing Performing Authority','ptw.handover.sign',1,true,false,true,'I confirm the outgoing handover information is complete and accurate.'),
  ('PTW','shift_handover','complete','Incoming Performing Authority','ptw.handover.sign',2,true,true,true,'I accept responsibility for the permit and associated risks.'),
  ('PTW','gas_test','verify','Gas Tester','ptw.gas.sign',1,true,false,true,'I confirm the gas test readings were taken and recorded accurately.'),
  ('PTW','isolation','verify','Isolating Authority','ptw.isolation.sign',1,true,false,true,'I confirm isolation has been applied as recorded.'),
  ('PTW','permit','close','Closure Authority','ptw.close.sign',1,true,true,true,'I confirm the work area is safe and permit closure requirements are complete.'),
  ('MOC','approval','approve','Approver','moc.approval.sign',1,true,true,true,'I approve this MOC using my electronic signature.'),
  ('MOC','closure','close','Closure Authority','moc.close.sign',1,true,true,true,'I confirm MOC closure requirements are complete.'),
  ('PSSR','discipline_signoff','sign','Discipline Reviewer','pssr.discipline_signoff.sign',1,true,true,true,'I confirm my discipline review is complete.'),
  ('PSSR','startup_authorization','authorize','Plant Manager','pssr.authorization.sign',99,false,true,true,'I authorize startup after reviewing readiness evidence and open blockers.')
) as r(module_name, record_type, action_type, signature_role, required_permission, sequence_order, can_delegate, requires_independent_signer, blocks_action_until_signed, declaration_text)
where not exists (
  select 1 from public.signature_requirements existing
  where existing.tenant_id = t.id
    and coalesce(existing.site_id, '') = coalesce(s.id, '')
    and existing.module_name = r.module_name
    and existing.record_type = r.record_type
    and existing.action_type = r.action_type
    and existing.signature_role = r.signature_role
);
