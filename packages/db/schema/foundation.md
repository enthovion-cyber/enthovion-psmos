# Foundation Data Model

The Phase 1 foundation uses Supabase PostgreSQL. Tenant isolation is enforced in application services with a required `tenantId` on every tenant-owned query. Production migrations should add PostgreSQL RLS policies mirroring the same `tenantId` checks.

Implemented foundation tables:

- `Tenant`, `Site`, `Unit`, `Area`
- `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserSite`
- `AuditLog`
- `Notification`
- `Document`, `DocumentVersion`
- `Action`
- `WorkflowTemplate`, `WorkflowInstance`, `WorkflowStep`
- `SearchIndex`

Equipment Registry is intentionally not implemented in this Step 1 foundation pass because the mandatory build order requires it as Step 2 after platform foundation completion.
