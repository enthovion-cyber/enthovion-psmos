-- Admin User Management - RLS enablement. Backend service role enforces detailed RBAC.

alter table if exists public."UserCompanyMembership" enable row level security;
alter table if exists public."UserUnitAccess" enable row level security;
alter table if exists public."UserAreaAccess" enable row level security;
alter table if exists public."UserPermissionOverride" enable row level security;
alter table if exists public."PermissionPreset" enable row level security;
alter table if exists public."UserEmailDeliveryLog" enable row level security;
alter table if exists public."PasswordResetToken" enable row level security;
alter table if exists public."UserBulkImportJob" enable row level security;
alter table if exists public."UserBulkImportRow" enable row level security;
alter table if exists public."UserSecurityEvent" enable row level security;

drop policy if exists "service_role_all_user_company_membership" on public."UserCompanyMembership";
create policy "service_role_all_user_company_membership" on public."UserCompanyMembership" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_unit_access" on public."UserUnitAccess";
create policy "service_role_all_user_unit_access" on public."UserUnitAccess" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_area_access" on public."UserAreaAccess";
create policy "service_role_all_user_area_access" on public."UserAreaAccess" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_permission_override" on public."UserPermissionOverride";
create policy "service_role_all_user_permission_override" on public."UserPermissionOverride" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_permission_preset" on public."PermissionPreset";
create policy "service_role_all_permission_preset" on public."PermissionPreset" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_email_delivery_log" on public."UserEmailDeliveryLog";
create policy "service_role_all_user_email_delivery_log" on public."UserEmailDeliveryLog" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_password_reset_token" on public."PasswordResetToken";
create policy "service_role_all_password_reset_token" on public."PasswordResetToken" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_bulk_import_job" on public."UserBulkImportJob";
create policy "service_role_all_user_bulk_import_job" on public."UserBulkImportJob" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_bulk_import_row" on public."UserBulkImportRow";
create policy "service_role_all_user_bulk_import_row" on public."UserBulkImportRow" for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_user_security_event" on public."UserSecurityEvent";
create policy "service_role_all_user_security_event" on public."UserSecurityEvent" for all to service_role using (true) with check (true);
