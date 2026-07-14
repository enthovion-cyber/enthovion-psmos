# Incident Dashboard / Register PDF Gap Audit

Source PDF: `C:\Users\Jibrael Khan\Downloads\Incident Dashboard-Register Module.pdf`

Scope verified: `/incidents` dashboard/register only.

| PDF requirement | Current implementation status | File/component/API/model | Fixed | Remaining gap |
| --- | --- | --- | --- | --- |
| Incident Dashboard Header | Implemented with title, subtitle, context totals, create/export/refresh actions, permission-aware disabled reasons | `apps/web/src/features/incidents/components/register/IncidentDashboardHeader.tsx`, `GET /incidents` | Yes | None |
| Incident Summary Cards | Implemented from backend summary counts for total/open/closed/draft/triage/near miss/PSM/PSE/high-potential/overdue/actions/follow-ups | `IncidentSummaryCards.tsx`, `GET /incidents/summary`, `IncidentService.summary` | Yes | None |
| Critical Attention Panel | Implemented with fatality/catastrophic, high-potential, Tier 1/2, fire/explosion, regulatory, overdue, action, MOC/PSSR, HAZOP/LOPA, chemical/SDS reasons | `CriticalAttentionPanel.tsx`, `GET /incidents/attention`, `IncidentService.attention` | Yes | None |
| Process Safety / PSM Event Panel | Implemented with PSM/PSE totals, API RP 754 Tier 1-4, LOPC, not determined, pending review, toxic release, safeguard/IPL failure, envelope exceedance | `PsmEventPanel.tsx`, `GET /incidents/psm-events`, `IncidentService.psmEvents` | Yes | None |
| Potential Severity / High-Potential Near Miss Panel | Implemented with high-potential near misses, fatality potential, major injury/process safety potential, actual-low/potential-high, review pending | `HighPotentialNearMissPanel.tsx`, `GET /incidents/high-potential`, `IncidentService.highPotential` | Yes | None |
| Investigation Status Panel | Implemented with status distribution, overdue RCA/investigation, pending triage/review, changes requested, closed this month, reopened, cycle time | `InvestigationStatusPanel.tsx`, `GET /incidents/investigation-status`, `IncidentService.investigationStatus` | Yes | None |
| Corrective Action / CAPA Snapshot Panel | Implemented using Universal Action table where available, with row-level incident counters fallback | `CorrectiveActionSnapshotPanel.tsx`, `GET /incidents/action-snapshot`, `IncidentService.actionSnapshot` | Yes | None |
| Incident Trend Snapshot Panel | Implemented monthly incident, near miss, PSM, severity, site/unit/area/type/classification, repeat events, tier trends | `IncidentTrendSnapshotPanel.tsx`, `GET /incidents/trends`, `IncidentService.trends` | Yes | None |
| Incident Register Table | Implemented server-side register, badges, pagination controls, row actions, redacted restricted state, required PDF columns | `IncidentRegisterTable.tsx`, `GET /incidents/register`, `IncidentService.register` | Yes | None |
| Advanced Filters / Search | Implemented site/unit/area/type/classification/status/severity/tier/priority/owner/booleans/date/search filters | `IncidentAdvancedFilters.tsx`, `GET /incidents/filters/context`, `IncidentService.applyFilters` | Yes | None |
| Saved Views | Implemented system/default views plus user saved views CRUD backed by database | `IncidentSavedViews.tsx`, `/incidents/saved-views`, `incident_register_saved_views` | Yes | None |
| Bulk Actions | Implemented bulk update and bulk assign with reason, read-only closed protection, audit/history events | `IncidentBulkActions.tsx`, `POST /incidents/bulk-update`, `POST /incidents/bulk-assign` | Yes | None |
| Export / Report Actions | Implemented CSV export for register, PSM, high-potential, overdue views with permission checks and audit event | `IncidentExportActions.tsx`, `/incidents/export*`, `IncidentService.export` | Yes | None |
| Loading / Empty / No-results / Error states | Implemented in dashboard, panels, table, filters, saved views, export/bulk controls | `IncidentDashboardPage.tsx`, register components | Yes | None |
| Permission denied / Partial access / Restricted redaction | Implemented backend permission map, restricted/confidential redaction, frontend safe state | `IncidentService.decorateRows`, `IncidentRegisterTable.tsx` | Yes | None |
| Backend unavailable / exporting / bulk-processing states | Implemented query error surfaces, export/bulk loading states | Hooks and register controls | Yes | None |
| Core incident fields | Implemented migration columns and register mapping for all requested core fields including actual/potential severity, PSE tier, LOPC, release, regulatory, RCA, team, actions, links, restricted/confidential, tags | `20260712133000_incident_dashboard_register_module.sql`, `IncidentService` | Yes | None |
| Actual severity separate from potential severity | Implemented distinct DB columns, filters, badges, summaries, table columns | Migration, `ActualSeverityBadge.tsx`, `PotentialSeverityBadge.tsx` | Yes | None |
| Near misses prioritized by potential severity | Implemented high-potential panel and attention rules use potential severity/risk score | `IncidentService.highPotential`, `IncidentService.attention` | Yes | None |
| PSM/PSE/API RP 754 tier support | Implemented fields, filters, summary counts, PSM panel, badges | Migration, `PsmEventPanel.tsx`, `PseTierBadge.tsx` | Yes | None |
| Thresholds not hardcoded | Implemented `pse_threshold_exceeded`, `threshold_basis`, and `pse_tier = Not Determined` support; no company threshold values embedded in code | Migration, service panels | Yes | None |
| Database models | Implemented incidents, history events, saved views, classification reviews, metrics cache | Supabase migration | Yes | None |
| Backend APIs | Implemented summary, attention, PSM events, high-potential, investigation status, action snapshot, trends, register, context, saved views, bulk actions, export, equipment/chemical/user search | `IncidentController`, `IncidentService` | Yes | None |
| Backend services | Implemented consolidated Nest service for register, summary, attention, PSM classification views, trends, filters, saved views, bulk, export, permissions, history/audit integrations | `apps/api/src/incidents/incident.service.ts` | Yes | Split service files can be extracted later if the codebase wants one service per concern. |
| Company/site isolation | Implemented tenant and site scoped queries plus SiteGuard/controller auth | `IncidentController`, `IncidentService.scopeQuery` | Yes | None |
| Permissions | Implemented permission constants, controller decorators, migration permission seed | `permission-keys.ts`, migration, `IncidentController` | Yes | None |
| Audit/history hooks | Implemented audit writes for saved views, bulk updates, exports; incident history events for register mutations | `IncidentService.writeHistory`, `AuditService` calls | Yes | None |
| Frontend structure | Implemented route, components, hooks, services, schemas, types, badges under `features/incidents` | `apps/web/src/app/(app)/incidents/page.tsx`, `features/incidents/*` | Yes | None |
| Dark/light responsive UI | Implemented industrial cards/tables with Tailwind dark/light classes and responsive grid/table behavior | Register components | Yes | None |
| Server-side pagination/filter/sort/search | Implemented backend range/order/filter/search with frontend controls | `IncidentService.register`, `IncidentAdvancedFilters.tsx` | Yes | None |
| Tests/verification | API build passes; incident frontend files have no focused TypeScript errors | `nest build`, focused `tsc` filter | Yes | Full web typecheck still contains unrelated pre-existing non-incident errors. |
