create table if not exists documents (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  unit_id text references "Unit"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  folder_id text,
  document_number text not null,
  title text not null,
  description text,
  document_type text not null,
  status text not null default 'Draft',
  current_version_id text,
  owner_id text not null references "User"(id) on delete restrict,
  created_by text references "User"(id) on delete set null,
  obsolete_reason text,
  archive_reason text,
  replacement_document_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_id, document_number)
);

create table if not exists document_versions (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  version_number text not null,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size bigint not null default 0,
  uploaded_by text references "User"(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  change_summary text,
  is_current boolean not null default false,
  unique(document_id, version_number)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'documents_current_version_fkey'
  ) then
    alter table documents
      add constraint documents_current_version_fkey foreign key (current_version_id) references document_versions(id) on delete set null;
  end if;
end $$;

create table if not exists document_relations (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  related_module text not null,
  related_record_id text not null,
  equipment_id text references "Equipment"(id) on delete set null,
  relation_type text not null default 'Reference',
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(document_id, related_module, related_record_id, relation_type)
);

create table if not exists document_reviews (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  review_frequency_months integer not null default 12,
  last_review_date date,
  next_review_date date not null,
  review_owner_id text references "User"(id) on delete set null,
  review_status text not null default 'Scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(document_id)
);

create table if not exists document_approvals (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  approver_id text references "User"(id) on delete set null,
  decision text not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists document_comments (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  author_id text references "User"(id) on delete set null,
  body text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_access_logs (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  user_id text references "User"(id) on delete set null,
  action text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists document_tags (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  tag text not null,
  unique(document_id, tag)
);

create table if not exists document_folders (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  site_id text references "Site"(id) on delete cascade,
  parent_id text references document_folders(id) on delete cascade,
  name text not null,
  path text not null,
  created_at timestamptz not null default now(),
  unique(tenant_id, site_id, path)
);

create index if not exists documents_tenant_site_status_idx on documents(tenant_id, site_id, status, updated_at desc);
create index if not exists documents_type_review_idx on documents(tenant_id, document_type, status);
create index if not exists document_versions_document_idx on document_versions(document_id, uploaded_at desc);
create index if not exists document_relations_record_idx on document_relations(tenant_id, related_module, related_record_id);
create index if not exists document_reviews_due_idx on document_reviews(tenant_id, next_review_date, review_status);
create index if not exists document_access_logs_doc_idx on document_access_logs(document_id, created_at desc);
create index if not exists document_tags_tag_idx on document_tags(tenant_id, tag);

alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_relations enable row level security;
alter table document_reviews enable row level security;
alter table document_access_logs enable row level security;
alter table document_comments enable row level security;
alter table document_approvals enable row level security;
alter table document_tags enable row level security;
alter table document_folders enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_documents_edit', 'tenant_alkylation', 'documents.edit', 'documents', 'Edit Documents'),
  ('perm_documents_delete', 'tenant_alkylation', 'documents.delete', 'documents', 'Delete Documents'),
  ('perm_documents_archive', 'tenant_alkylation', 'documents.archive', 'documents', 'Archive Documents'),
  ('perm_documents_download', 'tenant_alkylation', 'documents.download', 'documents', 'Download Documents'),
  ('perm_documents_link', 'tenant_alkylation', 'documents.link', 'documents', 'Link Documents'),
  ('perm_documents_comment', 'tenant_alkylation', 'documents.comment', 'documents', 'Comment on Documents')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r.id in ('role_platform_admin', 'role_corporate_admin', 'role_site_admin', 'role_hse_manager')
  and p.id in ('perm_documents_view','perm_documents_upload','perm_documents_approve','perm_documents_edit','perm_documents_delete','perm_documents_archive','perm_documents_download','perm_documents_link','perm_documents_comment')
on conflict do nothing;

insert into document_folders (id, tenant_id, site_id, name, path)
values
  ('doc_folder_ops', 'tenant_alkylation', 'site_jubail', 'Operations', '/Operations'),
  ('doc_folder_psi', 'tenant_alkylation', 'site_jubail', 'Process Safety Information', '/Process Safety Information'),
  ('doc_folder_cert', 'tenant_alkylation', 'site_jubail', 'Certificates', '/Certificates')
on conflict (id) do update set name = excluded.name;
