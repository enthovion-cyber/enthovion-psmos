alter table if exists public.auth_security_events enable row level security;
alter table if exists public.auth_session_states enable row level security;
alter table if exists public.auth_oauth_accounts enable row level security;
alter table if exists public.auth_password_events enable row level security;
alter table if exists public.auth_rate_limit_events enable row level security;

drop policy if exists service_role_all_auth_security_events on public.auth_security_events;
create policy service_role_all_auth_security_events on public.auth_security_events for all to service_role using (true) with check (true);
drop policy if exists service_role_all_auth_session_states on public.auth_session_states;
create policy service_role_all_auth_session_states on public.auth_session_states for all to service_role using (true) with check (true);
drop policy if exists service_role_all_auth_oauth_accounts on public.auth_oauth_accounts;
create policy service_role_all_auth_oauth_accounts on public.auth_oauth_accounts for all to service_role using (true) with check (true);
drop policy if exists service_role_all_auth_password_events on public.auth_password_events;
create policy service_role_all_auth_password_events on public.auth_password_events for all to service_role using (true) with check (true);
drop policy if exists service_role_all_auth_rate_limit_events on public.auth_rate_limit_events;
create policy service_role_all_auth_rate_limit_events on public.auth_rate_limit_events for all to service_role using (true) with check (true);
