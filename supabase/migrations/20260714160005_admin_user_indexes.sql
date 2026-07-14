-- Admin User Management - indexes for lists, effective permissions, and audits.

create index if not exists "idx_User_tenant_status" on public."User" ("tenantId", "status");
create index if not exists "idx_User_email_lower" on public."User" (lower("email"));
create index if not exists "idx_UserRole_role" on public."UserRole" ("roleId");
create index if not exists "idx_UserRole_user" on public."UserRole" ("userId");
create index if not exists "idx_UserSite_user" on public."UserSite" ("userId");
create index if not exists "idx_UserPermissionOverride_user" on public."UserPermissionOverride" ("tenantId", "userId");
create index if not exists "idx_Invitation_tenant_status" on public."Invitation" ("tenantId", "status");
create index if not exists "idx_UserBulkImportRow_job" on public."UserBulkImportRow" ("jobId", "rowNumber");
create index if not exists "idx_UserSecurityEvent_user" on public."UserSecurityEvent" ("tenantId", "userId", "createdAt" desc);
create index if not exists "idx_AuditLog_user_entity" on public."AuditLog" ("tenantId", "entityType", "entityId");
