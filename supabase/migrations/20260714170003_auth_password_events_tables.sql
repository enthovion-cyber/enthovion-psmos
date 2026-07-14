create table if not exists public.auth_password_events (
  id text primary key default gen_random_uuid()::text,
  user_id text references public."User"("id") on delete set null,
  company_id text references public."Company"("id") on delete set null,
  event_type text not null,
  requested_by text references public."User"("id") on delete set null,
  force_password_change boolean not null default false,
  email_delivery_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
