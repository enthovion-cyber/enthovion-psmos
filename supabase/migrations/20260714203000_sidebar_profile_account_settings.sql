create table if not exists public.user_profile_preferences (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."User"(id) on delete cascade,
  company_id text references public."Company"(id) on delete cascade,
  timezone text,
  language text,
  theme_preference text,
  sidebar_collapsed boolean,
  notification_preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profile_preferences_user_company_unique unique (user_id, company_id)
);

create table if not exists public.user_avatar_files (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."User"(id) on delete cascade,
  company_id text references public."Company"(id) on delete set null,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  uploaded_by text references public."User"(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_account_deletion_requests (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public."User"(id) on delete cascade,
  company_id text references public."Company"(id) on delete set null,
  request_type text not null,
  status text not null default 'pending',
  reason text,
  requested_by text references public."User"(id) on delete set null,
  reviewed_by text references public."User"(id) on delete set null,
  reviewed_at timestamptz,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_account_deletion_request_type_check check (request_type in ('deactivate','delete','leave_workspace')),
  constraint user_account_deletion_request_status_check check (status in ('pending','approved','rejected','cancelled','completed'))
);

create index if not exists idx_user_profile_preferences_user on public.user_profile_preferences(user_id);
create index if not exists idx_user_avatar_files_user on public.user_avatar_files(user_id);
create index if not exists idx_user_account_deletion_requests_user on public.user_account_deletion_requests(user_id);
create index if not exists idx_user_account_deletion_requests_company on public.user_account_deletion_requests(company_id);

alter table if exists public.user_profile_preferences enable row level security;
alter table if exists public.user_avatar_files enable row level security;
alter table if exists public.user_account_deletion_requests enable row level security;

drop policy if exists service_role_all_user_profile_preferences on public.user_profile_preferences;
create policy service_role_all_user_profile_preferences on public.user_profile_preferences for all to service_role using (true) with check (true);

drop policy if exists service_role_all_user_avatar_files on public.user_avatar_files;
create policy service_role_all_user_avatar_files on public.user_avatar_files for all to service_role using (true) with check (true);

drop policy if exists service_role_all_user_account_deletion_requests on public.user_account_deletion_requests;
create policy service_role_all_user_account_deletion_requests on public.user_account_deletion_requests for all to service_role using (true) with check (true);
