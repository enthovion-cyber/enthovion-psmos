# Architecture

PSM OS is a tenant-isolated SaaS monorepo. NestJS owns server-side domain behavior, Supabase owns PostgreSQL access and migrations, Redis/BullMQ handles asynchronous work, and Next.js owns the authenticated operational UI.

## Foundation Boundaries

- IAM, RBAC, tenant hierarchy, audit logging, document control, search, notifications, workflows, and actions are platform services.
- PSM feature modules consume platform engines rather than reimplementing action, workflow, permission, notification, search, or audit behavior.
- Every tenant-owned table includes `tenantId`; every service method that reads or mutates tenant data must receive tenant context.

## Step 1 Scope

The current foundation includes:

- Workspace manifests and local Docker dependencies
- Supabase foundation SQL migration and seed
- NestJS bootstrap, config, Supabase service, auth, users, roles, permissions, tenants, audit, documents, actions, workflows, notifications, and search modules
- Next.js app shell, auth screens, dashboard, API client, query provider, and auth state
- Shared packages for types, constants, validation, UI tokens, utilities, and core engines

Equipment Registry is intentionally reserved for Step 2.
