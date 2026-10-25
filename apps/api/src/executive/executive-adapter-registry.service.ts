import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { ExecutiveModuleAdapterResult, ExecutiveScope, ExecutiveSourceItem, ExecutiveSourceTrace } from './executive-adapter-contract.service';

type Row = Record<string, any>;
type AdapterDefinition = { key: string; label: string; route: string; permission?: string; table?: string; tenantColumn?: string; siteColumn?: string; unitColumn?: string; open: (row: Row) => boolean; critical: (row: Row) => boolean; overdue: (row: Row) => boolean; pending: (row: Row) => boolean; stale: (row: Row) => boolean };

const closed = (value: unknown) => ['closed', 'completed', 'cancelled', 'archived', 'retired', 'inactive', 'void', 'approved'].includes(String(value ?? '').toLowerCase());
const date = (value: unknown) => value ? new Date(String(value)) : null;
const overdue = (row: Row) => { const value = date(row.due_date ?? row.dueDate ?? row.investigation_due_date); return Boolean(value && value.getTime() < Date.now() && !closed(row.status ?? row.finding_status)); };
const critical = (row: Row) => ['critical', 'high', 'safety-critical'].includes(String(row.criticality ?? row.severity ?? row.priority ?? row.potential_severity).toLowerCase());
const stale = (row: Row) => Boolean(row.stale_status && String(row.stale_status).toLowerCase() !== 'current') || Boolean(date(row.updated_at ?? row.updatedAt) && Date.now() - (date(row.updated_at ?? row.updatedAt)?.getTime() ?? Date.now()) > 1000 * 60 * 60 * 24 * 30);

const adapters: AdapterDefinition[] = [
  { key: 'regulatory', label: 'Regulatory Register', route: '/regulatory/register', permission: 'regulatory.register.view', table: 'regulatory_register_items', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.register_status ?? r.status), critical, overdue, pending: (r) => /pending review|pending approval/i.test(String(r.review_status ?? r.status)), stale },
  { key: 'actions', label: 'Universal Actions / CAPA', route: '/actions', permission: 'actions.view', table: 'Action', tenantColumn: 'tenantId', siteColumn: 'siteId', open: (r) => !closed(r.status), critical, overdue, pending: (r) => /pending.*approval/i.test(String(r.status)), stale },
  { key: 'incidents', label: 'Incident Investigation', route: '/incidents', permission: 'incidents.view', table: 'incidents', tenantColumn: 'tenant_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical, overdue, pending: (r) => /review|approval/i.test(String(r.status)), stale },
  { key: 'audit', label: 'Audit / Compliance Assurance', route: '/audit-compliance/findings', permission: 'audit.findings.view', table: 'audit_findings', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.finding_status ?? r.status), critical, overdue, pending: (r) => /review|approval/i.test(String(r.finding_status ?? r.status)), stale },
  { key: 'ptw', label: 'Permit to Work', route: '/ptw', permission: 'ptw.view', table: 'ptw_permits', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => /critical|high/i.test(String(r.risk_level ?? r.priority ?? r.permit_type)), overdue, pending: (r) => /pending|issued/i.test(String(r.status)), stale },
  { key: 'moc', label: 'Management of Change', route: '/moc', permission: 'moc.view', table: 'moc_requests', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => /critical|emergency|high/i.test(String(r.risk_level ?? r.priority ?? r.type)), overdue, pending: (r) => /pending|review/i.test(String(r.status)), stale },
  { key: 'pssr', label: 'Pre-Startup Safety Review', route: '/pssr', permission: 'pssr.view', table: 'pssr_reviews', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => Boolean(r.startup_blocker || /critical|high/i.test(String(r.risk_level ?? r.status))), overdue, pending: (r) => /pending/i.test(String(r.status)), stale },
  { key: 'hazop', label: 'HAZOP / PHA', route: '/hazop', permission: 'hazop.view', table: 'hazop_recommendations', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => /critical|high|p1/i.test(String(r.priority ?? r.severity)), overdue, pending: (r) => /review|pending/i.test(String(r.status)), stale },
  { key: 'lopa', label: 'LOPA / SIL', route: '/lopa', permission: 'lopa.view', table: 'lopa_recommendations', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => /critical|high/i.test(String(r.priority ?? r.severity)), overdue, pending: (r) => /review|pending/i.test(String(r.status)), stale },
  { key: 'psi', label: 'Process Safety Information', route: '/process-safety-information', permission: 'psi.view', table: 'psi_documents', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => /critical/i.test(String(r.criticality ?? r.document_type)), overdue, pending: (r) => /pending/i.test(String(r.status)), stale: (r) => r.status === 'STALE' || stale(r) },
  { key: 'mechanical-integrity', label: 'Mechanical Integrity', route: '/mechanical-integrity', permission: 'mechanical_integrity.dashboard.view', table: 'equipment', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => Boolean(r.criticality === 'SAFETY_CRITICAL' || /critical/i.test(String(r.criticality ?? '')) || r.status === 'DEFICIENT'), overdue: (r) => Boolean(r.next_inspection_due && new Date(r.next_inspection_due).getTime() < Date.now()), pending: (r) => /pending/i.test(String(r.status)), stale },
  { key: 'training', label: 'Training & Competency', route: '/training-competency', permission: 'training.dashboard.view', table: 'training_assignments', tenantColumn: 'company_id', siteColumn: 'site_id', open: (r) => !closed(r.status), critical: (r) => Boolean(r.is_safety_critical || /critical/i.test(String(r.priority ?? ''))), overdue, pending: (r) => /pending/i.test(String(r.status)), stale },
  { key: 'review', label: 'Review & Approval', route: '/review-approval', permission: 'review.view', open: () => false, critical: () => false, overdue: () => false, pending: () => false, stale: () => false },
  { key: 'reports', label: 'Reports / Export', route: '/reports', permission: 'reports.view', open: () => false, critical: () => false, overdue: () => false, pending: () => false, stale: () => false }
];

@Injectable()
export class ExecutiveAdapterRegistryService {
  constructor(private readonly db: SupabaseService) {}

  definitions() { return adapters; }
  async aggregateAll(user: RequestUser, scope: ExecutiveScope) { return Promise.all(adapters.map((adapter) => this.aggregate(user, scope, adapter))); }
  async aggregate(user: RequestUser, scope: ExecutiveScope, adapterOrKey: AdapterDefinition | string): Promise<ExecutiveModuleAdapterResult> {
    const adapter = typeof adapterOrKey === 'string' ? adapters.find((candidate) => candidate.key === adapterOrKey) : adapterOrKey;
    const start = Date.now();
    if (!adapter) return this.empty(user, scope, 'unknown', 'Unknown module', 'unavailable', 'The requested executive adapter is not registered.');
    if (!this.allowed(user, adapter.permission)) return this.empty(user, scope, adapter.key, adapter.label, 'permission_restricted', 'You do not have permission to view this source module.');
    if (!adapter.table || !adapter.tenantColumn) return this.empty(user, scope, adapter.key, adapter.label, 'unavailable', 'This source module has not registered a production executive adapter.');
    if ((scope.unitId || scope.areaId || scope.equipmentId) && !adapter.unitColumn) return this.empty(user, scope, adapter.key, adapter.label, 'unavailable', 'This adapter does not support the selected unit, area, or equipment scope.');
    try {
      let request: any = this.db.from(adapter.table).select('*').eq(adapter.tenantColumn, user.tenantId).limit(2000);
      if (scope.siteId && adapter.siteColumn) request = request.eq(adapter.siteColumn, scope.siteId);
      if (scope.unitId && adapter.unitColumn) request = request.eq(adapter.unitColumn, scope.unitId);
      const rows = await this.db.many<Row>(request);
      return this.fromRows(user, scope, adapter, rows, start);
    } catch {
      return this.empty(user, scope, adapter.key, adapter.label, 'error', 'The source adapter could not read its permitted aggregate data.');
    }
  }

  private fromRows(user: RequestUser, scope: ExecutiveScope, adapter: AdapterDefinition, rows: Row[], start: number): ExecutiveModuleAdapterResult {
    if (!rows.length) return this.empty(user, scope, adapter.key, adapter.label, 'no_data', 'The permitted source returned no records for this scope.', start);
    const criticalRows = rows.filter(adapter.critical); const overdueRows = rows.filter(adapter.overdue); const pendingRows = rows.filter(adapter.pending); const staleRows = rows.filter(adapter.stale);
    const traces = rows.map((row) => this.trace(adapter, row));
    const score = Math.max(0, 100 - criticalRows.length * 22 - overdueRows.length * 8 - pendingRows.length * 4 - staleRows.length * 5);
    const status = score < 40 ? 'critical' : score < 60 ? 'high_risk' : score < 75 ? 'attention_required' : score < 90 ? 'monitor' : 'healthy';
    return { moduleKey: adapter.key, moduleLabel: adapter.label, companyId: user.tenantId, siteId: scope.siteId, unitId: scope.unitId, dateRange: { start: scope.dateRangeStart, end: scope.dateRangeEnd }, adapterStatus: criticalRows.length || overdueRows.length ? 'connected_with_warnings' : 'connected', moduleHealthStatus: status, healthScoreFoundation: score, metrics: [this.metric('open_items', 'Open items', rows.filter(adapter.open).length, rows.length), this.metric('critical_items', 'Critical or high-risk items', criticalRows.length, rows.length), this.metric('overdue_items', 'Overdue items', overdueRows.length, rows.length), this.metric('pending_approvals', 'Pending approvals', pendingRows.length, rows.length), this.metric('stale_records', 'Stale records', staleRows.length, rows.length)], criticalItems: criticalRows.map((row) => this.item(adapter, row)), overdueItems: overdueRows.map((row) => ({ sourceRecordId: String(row.id), sourceRecordType: adapter.key, title: this.title(row), dueDate: String(row.due_date ?? row.dueDate ?? row.investigation_due_date), overdueDays: this.daysOverdue(row), ownerUserId: row.owner_user_id ?? row.ownerId ?? null, severity: String(row.severity ?? row.criticality ?? row.priority ?? ''), drilldownRoute: adapter.route, restricted: false })), pendingApprovals: pendingRows.map((row) => ({ sourceRecordId: String(row.id), sourceRecordType: adapter.key, title: this.title(row), currentStage: row.review_stage ?? row.current_stage ?? null, reviewerUserId: row.reviewer_user_id ?? null, dueDate: row.due_date ?? null, slaStatus: overdue(row) ? 'Overdue' : 'Pending', drilldownRoute: adapter.route, restricted: false })), staleRecords: staleRows.map((row) => ({ sourceRecordId: String(row.id), sourceRecordType: adapter.key, title: this.title(row), staleReason: row.stale_status ?? 'Record has not been refreshed within the configured period.', staleSince: row.updated_at ?? row.updatedAt ?? null, drilldownRoute: adapter.route, restricted: false })), sourceTrace: traces, warnings: criticalRows.length || overdueRows.length ? ['Module contains critical or overdue permitted records.'] : [], errors: [], calculatedAt: new Date().toISOString(), durationMs: Date.now() - start };
  }
  private empty(user: RequestUser, scope: ExecutiveScope, key: string, label: string, adapterStatus: ExecutiveModuleAdapterResult['adapterStatus'], message: string, start = Date.now()): ExecutiveModuleAdapterResult {
    const health = adapterStatus === 'permission_restricted' ? 'restricted' : adapterStatus === 'unavailable' || adapterStatus === 'error' ? 'unavailable' : 'incomplete_data';
    return { moduleKey: key, moduleLabel: label, companyId: user.tenantId, siteId: scope.siteId, unitId: scope.unitId, dateRange: { start: scope.dateRangeStart, end: scope.dateRangeEnd }, adapterStatus, moduleHealthStatus: health, healthScoreFoundation: null, metrics: [], criticalItems: [], overdueItems: [], pendingApprovals: [], staleRecords: [], sourceTrace: [], warnings: adapterStatus === 'no_data' ? [message] : [], errors: adapterStatus === 'error' || adapterStatus === 'unavailable' ? [{ code: `ADAPTER_${adapterStatus.toUpperCase()}`, safeMessage: message, source: key }] : [], calculatedAt: new Date().toISOString(), durationMs: Date.now() - start };
  }
  private metric(metricCode: string, metricTitle: string, value: number, denominator: number) { return { metricCode, metricTitle, value, textValue: null, unit: 'records', numerator: value, denominator, status: value === 0 ? 'Good' : 'Monitor', thresholdStatus: null, confidenceStatus: 'Source aggregate', sourceCount: denominator, restrictedCount: 0, excludedCount: 0, warnings: [] }; }
  private item(adapter: AdapterDefinition, row: Row): ExecutiveSourceItem { const severity = critical(row) ? String(row.severity ?? row.criticality ?? row.priority).toLowerCase() === 'critical' ? 'critical' : 'high' : 'medium'; return { sourceRecordId: String(row.id), sourceRecordType: adapter.key, title: this.title(row), severity, criticality: row.criticality ?? null, status: row.status ?? row.finding_status ?? null, ownerUserId: row.owner_user_id ?? row.ownerId ?? null, dueDate: row.due_date ?? row.dueDate ?? null, ageDays: this.age(row), siteId: row.site_id ?? row.siteId ?? null, unitId: row.unit_id ?? row.unitId ?? null, drilldownRoute: adapter.route, restricted: false, safePlaceholder: false }; }
  private trace(adapter: AdapterDefinition, row: Row): ExecutiveSourceTrace { return { metricCode: 'module_health', sourceModule: adapter.key, sourceRecordType: adapter.key, sourceRecordId: String(row.id), included: true, excludedReason: null, restricted: false, contribution: 1, snapshot: { status: row.status ?? row.finding_status ?? null, severity: row.severity ?? row.criticality ?? row.priority ?? null, dueDate: row.due_date ?? row.dueDate ?? null } }; }
  private title(row: Row) { return String(row.title ?? row.name ?? row.incident_title ?? row.finding_title ?? row.code ?? row.id); }
  private age(row: Row) { const created = date(row.created_at ?? row.createdAt); return created ? Math.floor((Date.now() - created.getTime()) / 86400000) : null; }
  private daysOverdue(row: Row) { const due = date(row.due_date ?? row.dueDate ?? row.investigation_due_date); return due ? Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000)) : 0; }
  private allowed(user: RequestUser, permission?: string) { return !permission || Boolean(user.isCompanyAdmin || user.isSuperAdmin || user.permissions.includes(permission)); }
}
