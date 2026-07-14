import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type MocRow = Record<string, any>;

@Injectable()
export class MocDashboardService {
  constructor(private readonly db: SupabaseService) {}

  async dashboard(tenantId: string, scope: Scope, userId: string, filters: Record<string, any> = {}) {
    const [register, kpis, riskOverview, typeDistribution, lifecycleHealth, temporary, emergency, actionHealth, approvalAging, approvalQueue, startupReadiness, recentActivity] = await Promise.all([
      this.register(tenantId, scope, filters),
      this.kpis(tenantId, scope),
      this.riskOverview(tenantId, scope),
      this.typeDistribution(tenantId, scope),
      this.lifecycleHealth(tenantId, scope),
      this.temporary(tenantId, scope),
      this.emergency(tenantId, scope),
      this.actionHealth(tenantId, scope),
      this.approvalAging(tenantId, scope),
      this.approvalQueue(tenantId, scope, userId),
      this.startupReadiness(tenantId, scope),
      this.recentActivity(tenantId, scope)
    ]);
    return { register, kpis, riskOverview, typeDistribution, lifecycleHealth, temporary, emergency, actionHealth, approvalAging, approvalQueue, startupReadiness, recentActivity, generatedAt: new Date().toISOString(), realtime: { connected: false, warning: 'Realtime is not enabled for this dashboard. Data refreshes on interval and manual refresh.' } };
  }

  async register(tenantId: string, scope: Scope, filters: Record<string, any> = {}) {
    let query = this.db.from('mocs').select('*').eq('tenant_id', tenantId);
    query = this.scopeMocQuery(query, scope);
    query = this.applyFilters(query, filters);
    const limit = Math.min(Math.max(Number(filters.limit ?? 25), 1), 100);
    const page = Math.max(Number(filters.page ?? 1), 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sort = this.parseSort(filters.sort);
    const rows = await this.safeMany<MocRow>(query.order(sort.column, { ascending: sort.ascending }).range(from, to));
    const decorated = await this.decorateMocs(tenantId, rows);
    return { items: this.applyDecoratedFilters(decorated, filters), page, limit, hasMore: rows.length === limit, total: decorated.length };
  }

  async kpis(tenantId: string, scope: Scope) {
    const [mocs, temporary, emergency, actions, startupBlockers, closureBlockers, pssr] = await Promise.all([
      this.mocs(tenantId, scope),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_startup_blockers').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_workflow_blocker_snapshots').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId), scope))
    ]);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const openActions = actions.filter((row) => this.openStatus(row.status));
    return [
      this.kpi('total', 'Total MOCs', mocs.length, 'blue'),
      this.kpi('draft', 'Draft', this.count(mocs, (moc) => moc.status === 'Draft'), 'slate', { status: 'Draft' }),
      this.kpi('submitted', 'Submitted', this.count(mocs, (moc) => moc.status === 'Submitted'), 'blue', { status: 'Submitted' }),
      this.kpi('under-review', 'Under Review', this.count(mocs, (moc) => moc.status === 'Under Review'), 'amber', { status: 'Under Review' }),
      this.kpi('approved', 'Approved', this.count(mocs, (moc) => moc.status === 'Approved'), 'green', { status: 'Approved' }),
      this.kpi('implementation', 'In Implementation', this.count(mocs, (moc) => moc.status === 'Implementation'), 'amber', { status: 'Implementation' }),
      this.kpi('pending-pssr', 'Pending PSSR', this.count(mocs, (moc) => moc.status === 'Pending PSSR') || this.count(pssr, (row) => this.pssrRequired(row) && !this.pssrComplete(row)), 'amber', { pssr_pending: true }),
      this.kpi('ready-startup', 'Ready For Startup', this.count(mocs, (moc) => moc.status === 'Ready For Startup'), 'green', { status: 'Ready For Startup' }),
      this.kpi('closed-month', 'Closed This Month', this.count(mocs, (moc) => moc.status === 'Closed' && new Date(moc.updated_at) >= startOfMonth), 'green', { status: 'Closed' }),
      this.kpi('high-risk', 'High Risk', this.count(mocs, (moc) => moc.risk_level === 'High'), 'red', { risk_level: 'High' }),
      this.kpi('critical-risk', 'Critical Risk', this.count(mocs, (moc) => moc.risk_level === 'Critical'), 'red', { risk_level: 'Critical' }),
      this.kpi('temporary-active', 'Temporary Active', this.count(temporary, (row) => !this.temporaryRemoved(row) && !this.isExpired(row.expiry_date)), 'purple', { is_temporary: true }),
      this.kpi('temporary-expiring', 'Temporary Expiring Soon', this.count(temporary, (row) => !this.temporaryRemoved(row) && this.daysUntil(row.expiry_date) <= 30 && this.daysUntil(row.expiry_date) >= 0), 'amber', { is_temporary: true, expiring_within_days: 30 }),
      this.kpi('temporary-overdue', 'Overdue Temporary Changes', this.count(temporary, (row) => !this.temporaryRemoved(row) && this.isExpired(row.expiry_date)), 'red', { overdue_temporary: true }),
      this.kpi('emergency-review', 'Emergency 72-Hour Review', this.count(emergency, (row) => !this.reviewComplete(row) && this.daysUntilDateTime(row.review_due_at ?? row.post_review_due_date) <= 1), 'red', { is_emergency: true }),
      this.kpi('startup-blockers', 'Startup Blockers', this.uniqueCount(startupBlockers.filter((row) => row.blocking !== false && this.openStatus(row.status)), 'moc_id'), 'red', { startup_blocked: true }),
      this.kpi('closure-blockers', 'Closure Blockers', this.uniqueCount(closureBlockers.filter((row) => row.blocking !== false && this.openStatus(row.status)), 'moc_id'), 'red', { closure_blocked: true }),
      this.kpi('overdue-actions', 'Overdue Required Actions', this.count(openActions, (row) => row.due_date && this.isExpired(row.due_date)), 'red', { overdue_actions: true })
    ];
  }

  async riskOverview(tenantId: string, scope: Scope) {
    const mocs = await this.mocs(tenantId, scope);
    const critical = mocs.filter((moc) => moc.risk_level === 'Critical');
    const highCritical = mocs.filter((moc) => ['High', 'Critical'].includes(moc.risk_level));
    const criticalAlerts = (await this.decorateMocs(tenantId, critical.slice(0, 6))) as any[];
    return {
      distribution: this.distribution(mocs, 'risk_level', ['Low', 'Medium', 'High', 'Critical']),
      byChangeType: this.groupRisk(mocs, 'change_type'),
      byUnit: this.groupRisk(mocs, 'unit_id'),
      byDepartment: this.groupRisk(mocs, 'department_id'),
      criticalMocs: await this.decorateMocs(tenantId, critical.slice(0, 8)),
      plantManagerAttention: await this.decorateMocs(tenantId, highCritical.slice(0, 8)),
      criticalAlerts: criticalAlerts.map((moc) => ({
        id: moc.id,
        mocNumber: moc.moc_number,
        title: moc.title,
        unit: moc.unit?.name ?? moc.unit_id ?? 'Unassigned',
        area: moc.area?.name ?? moc.area_id ?? 'Unassigned',
        plantManagerNotified: Boolean(moc.plant_manager_notified_at ?? moc.notification_sent_at),
        hazopRequired: Boolean(moc.hazop_required ?? moc.requires_hazop),
        pssrRequired: moc.pssrStatus !== 'Not Required',
        startupBlocked: moc.startupBlockerStatus === 'Blocked',
        currentWorkflowStep: moc.currentWorkflowStep,
        href: `/moc/${moc.id}`
      }))
    };
  }

  async typeDistribution(tenantId: string, scope: Scope) {
    const mocs = await this.mocs(tenantId, scope);
    const buckets = ['Permanent Process Change', 'Temporary Change', 'Emergency Change', 'Like-for-Like Replacement', 'Organizational Change', 'Document / Procedure Change', 'Software Change'];
    const total = mocs.length || 1;
    return buckets.map((label) => {
      const count = mocs.filter((moc) => (moc.change_type ?? 'Permanent Process Change') === label).length;
      return { label, count, percent: Math.round((count / total) * 100), filter: { change_type: label } };
    });
  }

  async lifecycleHealth(tenantId: string, scope: Scope) {
    const mocs = await this.mocs(tenantId, scope);
    const stages = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Released For Startup', 'Closed', 'Rejected', 'Cancelled', 'Overdue Temporary Change'];
    const active = mocs.filter((moc) => !['Closed', 'Rejected', 'Cancelled'].includes(moc.status)).length || 1;
    return stages.map((stage) => {
      const count = mocs.filter((moc) => moc.status === stage).length;
      return { stage, count, percent: Math.round((count / active) * 100), filter: { status: stage } };
    });
  }

  async temporary(tenantId: string, scope: Scope) {
    const controls = await this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId), scope).order('expiry_date'));
    const mocs = await this.mocsById(tenantId, controls.map((row) => row.moc_id));
    const items = controls.map((row) => this.decorateTemporary(row, mocs[row.moc_id])).filter(Boolean);
    return {
      summary: {
        active: items.filter((item) => item.status !== 'Removed / Reversed' && !item.overdue).length,
        expiringWithin30: items.filter((item) => item.daysRemaining <= 30 && item.daysRemaining >= 0).length,
        expiringWithin7: items.filter((item) => item.daysRemaining <= 7 && item.daysRemaining >= 0).length,
        overdue: items.filter((item) => item.overdue).length,
        activeOver60Days: items.filter((item) => item.normalizationRisk).length,
        extensionRequestsPending: items.filter((item) => item.status === 'Extension Requested').length
      },
      items: items.slice(0, 12)
    };
  }

  async emergency(tenantId: string, scope: Scope) {
    const controls = await this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId), scope).order('review_due_at'));
    const mocs = await this.mocsById(tenantId, controls.map((row) => row.moc_id));
    const actions = await this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).ilike('source_type', '%Emergency%'), scope));
    const items = controls.map((row) => this.decorateEmergency(row, mocs[row.moc_id])).filter(Boolean);
    return {
      summary: {
        created: items.length,
        due: items.filter((item) => !item.reviewComplete && item.hoursRemaining <= 24 && item.hoursRemaining >= 0).length,
        overdue: items.filter((item) => item.overdue).length,
        convertedPermanent: items.filter((item) => item.changeType === 'Permanent Process Change').length,
        openFollowupActions: actions.filter((row) => this.openStatus(row.status)).length
      },
      items: items.slice(0, 12)
    };
  }

  async actionHealth(tenantId: string, scope: Scope) {
    const actions = await this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId), scope));
    const open = actions.filter((row) => row.required !== false && this.openStatus(row.status));
    return {
      summary: {
        totalRequired: actions.filter((row) => row.required !== false).length,
        open: open.length,
        overdue: open.filter((row) => row.due_date && this.isExpired(row.due_date)).length,
        startupBlocked: this.uniqueCount(open.filter((row) => row.required_before_startup), 'moc_id'),
        closureBlocked: this.uniqueCount(open.filter((row) => row.required_before_closure), 'moc_id'),
        pendingVerification: actions.filter((row) => ['Pending Verification', 'PENDING_VERIFICATION'].includes(row.status) || row.verification_status === 'Not Verified').length,
        missingEvidence: actions.filter((row) => row.evidence_required && !['Uploaded', 'Accepted'].includes(row.evidence_status)).length,
        evidenceRejected: actions.filter((row) => ['Rejected', 'REJECTED'].includes(row.evidence_status)).length,
        completedVerified: actions.filter((row) => ['Completed', 'Closed'].includes(row.status) && (!row.verification_required || row.verification_status === 'Verified')).length,
        blockedMocs: this.uniqueCount(open.filter((row) => row.required_before_closure || row.required_before_startup), 'moc_id')
      },
      groups: this.actionGroups(actions)
    };
  }

  async approvalAging(tenantId: string, scope: Scope) {
    let stepsQuery = this.db.from('workflow_instance_steps').select('*, workflow_instances!inner(*)').eq('workflow_instances.tenant_id', tenantId).eq('status', 'Active');
    if (scope.selectedSiteId) stepsQuery = stepsQuery.eq('workflow_instances.site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) stepsQuery = stepsQuery.in('workflow_instances.site_id', scope.allowedSiteIds);
    const steps = await this.safeMany<any>(stepsQuery.order('due_at'));
    const now = Date.now();
    const ageDays = (step: any) => Math.max(0, Math.floor((now - new Date(step.created_at ?? step.assigned_at ?? step.updated_at ?? new Date()).getTime()) / 86400000));
    return {
      pendingUnder3Days: steps.filter((step) => ageDays(step) < 3 && !this.isPast(step.due_at)).length,
      pending3To7Days: steps.filter((step) => ageDays(step) >= 3 && ageDays(step) <= 7 && !this.isPast(step.due_at)).length,
      pendingOver7Days: steps.filter((step) => ageDays(step) > 7 && !this.isPast(step.due_at)).length,
      overdueApprovals: steps.filter((step) => this.isPast(step.due_at)).length,
      items: steps.slice(0, 12).map((step) => ({ id: step.id, ageDays: ageDays(step), dueAt: step.due_at, stepName: step.step_name, approver: step.assigned_user_id ?? step.assigned_role_id, mocId: step.workflow_instances?.record_id }))
    };
  }

  async approvalQueue(tenantId: string, scope: Scope, userId: string) {
    let stepsQuery = this.db.from('workflow_instance_steps').select('*, workflow_instances!inner(*)').eq('workflow_instances.tenant_id', tenantId).eq('status', 'Active');
    if (scope.selectedSiteId) stepsQuery = stepsQuery.eq('workflow_instances.site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) stepsQuery = stepsQuery.in('workflow_instances.site_id', scope.allowedSiteIds);
    const steps = await this.safeMany<any>(stepsQuery.order('due_at'));
    const mocIds = steps.map((step) => step.workflow_instances?.record_id).filter(Boolean);
    const mocs = await this.mocsById(tenantId, mocIds);
    const items = steps.map((step) => {
      const moc = mocs[step.workflow_instances?.record_id];
      if (!moc) return null;
      const overdue = step.due_at ? new Date(step.due_at).getTime() < Date.now() : false;
      return { id: step.id, mocId: moc.id, mocNumber: moc.moc_number, title: moc.title, currentStep: step.step_name, assignedApprover: step.assigned_user_id ?? step.assigned_role_id ?? 'Role based', dueDate: step.due_at, slaStatus: overdue ? 'Overdue' : 'On Track', riskLevel: moc.risk_level, href: `/moc/${moc.id}` };
    }).filter(Boolean);
    return {
      summary: {
        myPendingApprovals: items.filter((item: any) => item.assignedApprover === userId).length,
        overdueApprovals: items.filter((item: any) => item.slaStatus === 'Overdue').length,
        highCriticalApprovals: items.filter((item: any) => ['High', 'Critical'].includes(item.riskLevel)).length,
        returnedForRevision: this.count(await this.mocs(tenantId, scope), (moc) => moc.status === 'Draft' && moc.submitted_at),
        rejectedMocs: this.count(await this.mocs(tenantId, scope), (moc) => moc.status === 'Rejected'),
        escalatedApprovals: items.filter((item: any) => item.slaStatus === 'Overdue').length
      },
      items: items.slice(0, 12)
    };
  }

  async startupReadiness(tenantId: string, scope: Scope) {
    const [pssr, blockers, actions, training, checks] = await Promise.all([
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_startup_blockers').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_training_assignments').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeOperationalQuery(this.db.from('moc_startup_readiness_checks').select('*').eq('tenant_id', tenantId), scope))
    ]);
    const mocIds = Array.from(new Set([...pssr.map((row) => row.moc_id), ...blockers.map((row) => row.moc_id), ...checks.map((row) => row.moc_id)]));
    const mocs = await this.mocsById(tenantId, mocIds);
    const items = mocIds.map((id) => {
      const moc = mocs[id];
      if (!moc) return null;
      const row = pssr.find((item) => item.moc_id === id);
      const latest = checks.filter((item) => item.moc_id === id).sort((a, b) => String(b.checked_at ?? '').localeCompare(String(a.checked_at ?? '')))[0];
      const mocBlockers = blockers.filter((item) => item.moc_id === id && item.blocking !== false && this.openStatus(item.status));
      const startupActions = actions.filter((item) => item.moc_id === id && item.required_before_startup);
      const trainingAssignments = training.filter((item) => item.moc_id === id);
      const trainingComplete = trainingAssignments.length ? Math.round((trainingAssignments.filter((item) => ['Completed', 'Verified', 'Waived'].includes(item.status)).length / trainingAssignments.length) * 100) : 100;
      return { mocId: id, mocNumber: moc.moc_number, title: moc.title, pssrStatus: row?.pssr_status ?? row?.status ?? 'Not Required', startupBlockersCount: mocBlockers.length, requiredActionsBeforeStartup: startupActions.filter((item) => this.openStatus(item.status)).length, trainingReadiness: trainingComplete, engineeringReadiness: latest?.readiness_score ?? 0, href: `/moc/${id}` };
    }).filter(Boolean);
    return {
      summary: {
        requiringPssr: pssr.filter((row) => this.pssrRequired(row)).length,
        pssrPending: pssr.filter((row) => this.pssrRequired(row) && !this.pssrComplete(row)).length,
        pssrComplete: pssr.filter((row) => this.pssrComplete(row)).length,
        startupBlocked: this.uniqueCount(blockers.filter((row) => row.blocking !== false && this.openStatus(row.status)), 'moc_id'),
        readyForStartup: this.count(await this.mocs(tenantId, scope), (moc) => moc.status === 'Ready For Startup'),
        releasedForStartup: this.count(await this.mocs(tenantId, scope), (moc) => Boolean(moc.released_for_startup_at) || moc.status === 'Released For Startup')
      },
      items: items.slice(0, 12)
    };
  }

  async recentActivity(tenantId: string, scope: Scope) {
    let query = this.db.from('moc_history_events').select('*').eq('tenant_id', tenantId);
    query = this.scopeOperationalQuery(query, scope);
    const events = await this.safeMany<any>(query.order('created_at', { ascending: false }).limit(30));
    const mocs = await this.mocsById(tenantId, events.map((event) => event.moc_id));
    return events.map((event) => ({ ...event, mocNumber: mocs[event.moc_id]?.moc_number, mocTitle: mocs[event.moc_id]?.title, href: `/moc/${event.moc_id}` }));
  }

  async preview(tenantId: string, scope: Scope, id: string) {
    const moc = await this.safeSingle<any>(this.scopeMocQuery(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id), scope).maybeSingle());
    if (!moc) return null;
    const [actions, pssr, temporary, emergency] = await Promise.all([
      this.safeMany<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.safeSingle<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.safeSingle<any>(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.safeSingle<any>(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle())
    ]);
    return { moc, actionSummary: this.actionSummary(actions), pssr, temporary: temporary ? this.decorateTemporary(temporary, moc) : null, emergency: emergency ? this.decorateEmergency(emergency, moc) : null };
  }

  async export(tenantId: string, scope: Scope, format: 'csv' | 'pdf') {
    const register = await this.register(tenantId, scope, { limit: 100 });
    const rows = register.items ?? [];
    if (format === 'csv') {
      const header = ['MOC Number', 'Title', 'Change Type', 'Status', 'Risk', 'Site', 'Unit', 'Area', 'Originator', 'Target Date', 'Updated'];
      const body = rows.map((row: any) => [row.moc_number, row.title, row.change_type, row.status, row.risk_level, row.site?.name ?? row.site_id, row.unit?.name ?? row.unit_id, row.area?.name ?? row.area_id, row.originator?.displayName ?? row.originator_id, row.target_implementation_date ?? '', row.updated_at ?? ''].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','));
      return { format, fileName: `moc-register-${new Date().toISOString().slice(0, 10)}.csv`, content: [header.join(','), ...body].join('\n') };
    }
    return { format, fileName: `moc-dashboard-${new Date().toISOString().slice(0, 10)}.json`, content: { generatedAt: new Date().toISOString(), register } };
  }

  async exportReport(tenantId: string, scope: Scope, report: 'register' | 'temporary' | 'high-critical' | 'audit-evidence') {
    const filters = report === 'high-critical' ? { risk_level: 'High', limit: 100 } : { limit: 100 };
    const register = await this.register(tenantId, scope, filters);
    const temporary = report === 'temporary' ? await this.temporary(tenantId, scope) : null;
    const activity = report === 'audit-evidence' ? await this.recentActivity(tenantId, scope) : null;
    const rows = report === 'temporary' ? (temporary?.items ?? []) : report === 'audit-evidence' ? activity ?? [] : register.items ?? [];
    const header = Object.keys(rows[0] ?? { report: report, generatedAt: new Date().toISOString() });
    const body = rows.map((row: any) => header.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','));
    return { format: 'csv', report, fileName: `moc-${report}-${new Date().toISOString().slice(0, 10)}.csv`, content: [header.join(','), ...body].join('\n') };
  }

  private async mocs(tenantId: string, scope: Scope) {
    return this.safeMany<MocRow>(this.scopeMocQuery(this.db.from('mocs').select('*').eq('tenant_id', tenantId), scope).order('updated_at', { ascending: false }).limit(1000));
  }

  private async mocsById(tenantId: string, ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) return {};
    const rows = await this.safeMany<MocRow>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).in('id', uniqueIds));
    return Object.fromEntries(rows.map((row) => [row.id, row]));
  }

  private async decorateMocs(tenantId: string, rows: MocRow[]) {
    if (!rows.length) return [];
    const [sites, units, areas, departments, users, equipment, actions, pssr, startupBlockers, closureBlockers, workflows] = await Promise.all([
      this.lookup(tenantId, 'Site', 'id,name,code', rows.map((row) => row.site_id), 'tenantId'),
      this.lookup(tenantId, 'Unit', 'id,name,code', rows.map((row) => row.unit_id), 'tenantId'),
      this.lookup(tenantId, 'Area', 'id,name,code', rows.map((row) => row.area_id), 'tenantId'),
      this.lookup(tenantId, 'Department', 'id,name,code', rows.map((row) => row.department_id), 'tenantId'),
      this.lookup(tenantId, 'User', 'id,displayName,email,title', rows.map((row) => row.originator_id), 'tenantId'),
      this.safeMany<any>(this.db.from('moc_affected_equipment').select('*, equipment:Equipment(id,tag,name,type)').eq('tenant_id', tenantId).in('moc_id', rows.map((row) => row.id))),
      this.safeMany<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).in('moc_id', rows.map((row) => row.id))),
      this.safeMany<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).in('moc_id', rows.map((row) => row.id))),
      this.safeMany<any>(this.db.from('moc_startup_blockers').select('*').eq('tenant_id', tenantId).in('moc_id', rows.map((row) => row.id))),
      this.safeMany<any>(this.db.from('moc_workflow_blocker_snapshots').select('*').eq('tenant_id', tenantId).in('moc_id', rows.map((row) => row.id))),
      this.safeMany<any>(this.db.from('workflow_instances').select('*, steps:workflow_instance_steps(*)').eq('tenant_id', tenantId).eq('module', 'MOC').in('record_id', rows.map((row) => row.id)))
    ]);
    return rows.map((row) => {
      const rowActions = actions.filter((item) => item.moc_id === row.id && item.required !== false);
      const completeActions = rowActions.filter((item) => ['Completed', 'Closed'].includes(item.status)).length;
      const primary = equipment.find((item) => item.moc_id === row.id && item.role === 'PRIMARY') ?? equipment.find((item) => item.moc_id === row.id);
      const wf = workflows.find((item) => item.record_id === row.id);
      const currentStep = (wf?.steps ?? []).find((step: any) => step.status === 'Active') ?? (wf?.steps ?? [])[0];
      const pssrRow = pssr.find((item) => item.moc_id === row.id);
      const temporary = row.change_type === 'Temporary Change';
      const tempExpiry = row.temporary_expiry_date ?? row.expiry_date ?? row.target_implementation_date;
      const overdueActionsCount = rowActions.filter((item) => this.openStatus(item.status) && item.due_date && this.isExpired(item.due_date)).length;
      const startupBlocked = startupBlockers.some((item) => item.moc_id === row.id && this.openStatus(item.status));
      const closureBlocked = closureBlockers.some((item) => item.moc_id === row.id && this.openStatus(item.status));
      const healthStatus = overdueActionsCount || startupBlocked || closureBlocked || row.risk_level === 'Critical' || (temporary && this.isExpired(tempExpiry)) ? 'Red' : rowActions.some((item) => this.openStatus(item.status)) || ['Submitted', 'Under Review'].includes(row.status) ? 'Amber' : 'Green';
      return {
        ...row,
        site: sites[row.site_id],
        unit: units[row.unit_id],
        area: areas[row.area_id],
        department: departments[row.department_id],
        originator: users[row.originator_id],
        primaryEquipment: primary?.equipment ?? primary?.equipment_snapshot ?? null,
        currentWorkflowStep: currentStep?.step_name ?? wf?.status ?? row.status,
        currentApprover: currentStep?.assigned_user_id ?? currentStep?.assigned_role_id ?? null,
        daysOpen: this.daysBetween(row.created_at, new Date().toISOString()),
        temporaryExpiryDate: temporary ? tempExpiry : null,
        requiredActionsCompletion: rowActions.length ? Math.round((completeActions / rowActions.length) * 100) : 100,
        pssrStatus: pssrRow?.pssr_status ?? pssrRow?.status ?? 'Not Required',
        startupBlockersCount: startupBlockers.filter((item) => item.moc_id === row.id && this.openStatus(item.status)).length,
        closureBlockersCount: closureBlockers.filter((item) => item.moc_id === row.id && this.openStatus(item.status)).length,
        startupBlockerStatus: startupBlocked ? 'Blocked' : 'Clear',
        closureBlockerStatus: closureBlocked ? 'Blocked' : 'Clear',
        overdueActionsCount,
        healthStatus
      };
    });
  }

  private async lookup(tenantId: string, table: string, select: string, ids: string[], tenantColumn: 'tenantId' | 'tenant_id') {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) return {};
    const rows = await this.safeMany<any>(this.db.from(table).select(select).eq(tenantColumn, tenantId).in('id', uniqueIds));
    return Object.fromEntries(rows.map((row) => [row.id, row]));
  }

  private scopeMocQuery(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('site_id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('site_id', scope.allowedSiteIds);
    return query;
  }

  private scopeOperationalQuery(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('site_id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('site_id', scope.allowedSiteIds);
    return query;
  }

  private applyFilters(query: any, filters: Record<string, any>) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.change_type ?? filters.changeType) query = query.eq('change_type', filters.change_type ?? filters.changeType);
    if (filters.risk_level ?? filters.riskLevel) query = query.eq('risk_level', filters.risk_level ?? filters.riskLevel);
    if (filters.site_id) query = query.eq('site_id', filters.site_id);
    if (filters.unit_id) query = query.eq('unit_id', filters.unit_id);
    if (filters.area_id) query = query.eq('area_id', filters.area_id);
    if (filters.department_id) query = query.eq('department_id', filters.department_id);
    if (filters.originator_id) query = query.eq('originator_id', filters.originator_id);
    if (filters.is_temporary === 'true' || filters.is_temporary === true) query = query.eq('change_type', 'Temporary Change');
    if (filters.is_emergency === 'true' || filters.is_emergency === true) query = query.eq('change_type', 'Emergency Change');
    if (filters.pssr_pending === 'true' || filters.pssr_pending === true) query = query.eq('status', 'Pending PSSR');
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.search) {
      const value = this.escapeSearch(String(filters.search).trim());
      query = query.or(`moc_number.ilike.%${value}%,title.ilike.%${value}%,description.ilike.%${value}%,affected_system.ilike.%${value}%,location_description.ilike.%${value}%`);
    }
    return query;
  }

  private applyDecoratedFilters(rows: MocRow[], filters: Record<string, any>) {
    let result = rows;
    if (filters.startup_blocked === 'true' || filters.startup_blocked === true) result = result.filter((row) => row.startupBlockerStatus === 'Blocked');
    if (filters.closure_blocked === 'true' || filters.closure_blocked === true) result = result.filter((row) => row.closureBlockerStatus === 'Blocked');
    if (filters.overdue_actions === 'true' || filters.overdue_actions === true) result = result.filter((row) => Number(row.overdueActionsCount ?? 0) > 0);
    if (filters.missing_evidence === 'true' || filters.pending_verification === 'true') result = result.filter((row) => Number(row.requiredActionsCompletion ?? 100) < 100);
    if (filters.normalization_risk === 'true' || filters.normalization_risk === true) result = result.filter((row) => row.change_type === 'Temporary Change' && Number(row.daysOpen ?? 0) > 60);
    if (filters.overdue_temporary === 'true' || filters.overdue_temporary === true) result = result.filter((row) => row.change_type === 'Temporary Change' && this.isExpired(row.temporaryExpiryDate));
    return result;
  }

  private parseSort(value?: unknown) {
    const allowed = new Set(['moc_number', 'title', 'status', 'risk_level', 'change_type', 'target_implementation_date', 'created_at', 'updated_at']);
    const parts = String(value ?? 'updated_at.desc').split('.');
    const requestedColumn = parts[0] || 'updated_at';
    const direction = parts[1] || 'desc';
    return {
      column: allowed.has(requestedColumn) ? requestedColumn : 'updated_at',
      ascending: direction === 'asc'
    };
  }

  private escapeSearch(value: string) {
    return value.replace(/[,%*()]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private kpi(id: string, label: string, count: number, tone: string, filter: Record<string, any> = {}) {
    return { id, label, count, tone, trend: null, filter };
  }

  private distribution(rows: any[], key: string, buckets: string[]) {
    return buckets.map((bucket) => ({ label: bucket, count: rows.filter((row) => (row[key] ?? 'Low') === bucket).length }));
  }

  private groupRisk(rows: any[], key: string) {
    const groups = new Map<string, any>();
    for (const row of rows) {
      const label = row[key] ?? 'Unassigned';
      const current = groups.get(label) ?? { label, total: 0, Low: 0, Medium: 0, High: 0, Critical: 0 };
      current.total += 1;
      current[row.risk_level ?? 'Low'] = (current[row.risk_level ?? 'Low'] ?? 0) + 1;
      groups.set(label, current);
    }
    return Array.from(groups.values()).sort((a, b) => b.total - a.total).slice(0, 8);
  }

  private actionGroups(actions: any[]) {
    const definitions = [
      ['SOP/P&ID/Document updates', /sop|p&id|document|psi|sds/i],
      ['Training', /training/i],
      ['HAZOP/LOPA/PSSR', /hazop|lopa|pssr|sis/i],
      ['Engineering', /engineering|calculation|design|datasheet/i],
      ['Equipment Registry', /equipment/i],
      ['Environmental/Compliance', /environment|compliance|permit/i],
      ['Temporary/Emergency', /temporary|emergency/i]
    ] as const;
    return definitions.map(([label, pattern]) => {
      const rows = actions.filter((row) => pattern.test(`${row.action_type ?? ''} ${row.source_type ?? ''} ${row.title ?? ''} ${row.linked_module ?? ''}`));
      return { label, total: rows.length, open: rows.filter((row) => this.openStatus(row.status)).length, overdue: rows.filter((row) => this.openStatus(row.status) && row.due_date && this.isExpired(row.due_date)).length };
    });
  }

  private actionSummary(actions: any[]) {
    return { total: actions.length, open: actions.filter((row) => this.openStatus(row.status)).length, overdue: actions.filter((row) => this.openStatus(row.status) && row.due_date && this.isExpired(row.due_date)).length };
  }

  private decorateTemporary(row: any, moc: any) {
    if (!moc) return null;
    const daysRemaining = this.daysUntil(row.expiry_date);
    const activeDays = row.current_duration_days ?? this.daysBetween(moc.created_at, new Date().toISOString());
    return { ...row, mocId: moc.id, mocNumber: moc.moc_number, title: moc.title, owner: row.responsible_owner_id ?? row.removal_owner_id ?? moc.originator_id, expiryDate: row.expiry_date, daysRemaining, status: daysRemaining < 0 ? 'Overdue' : row.status ?? 'Active', riskLevel: moc.risk_level, overdue: daysRemaining < 0, normalizationRisk: Boolean(row.normalization_risk) || activeDays > 60, href: `/moc/${moc.id}` };
  }

  private decorateEmergency(row: any, moc: any) {
    if (!moc) return null;
    const due = row.review_due_at ?? row.post_review_due_date;
    const hoursRemaining = due ? Math.ceil((new Date(due).getTime() - Date.now()) / 3600000) : 0;
    return { ...row, mocId: moc.id, mocNumber: moc.moc_number, title: moc.title, changeType: moc.change_type, implementedBy: row.implemented_by, implementedAt: row.implemented_at ?? row.implementation_datetime, reviewDueAt: due, reviewStatus: row.review_status ?? 'Pending', reviewComplete: this.reviewComplete(row), overdue: !this.reviewComplete(row) && hoursRemaining < 0, hoursRemaining, riskLevel: moc.risk_level, href: `/moc/${moc.id}` };
  }

  private count<T>(rows: T[], predicate: (row: T) => boolean) {
    return rows.filter(predicate).length;
  }

  private uniqueCount(rows: any[], key: string) {
    return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
  }

  private openStatus(status?: string) {
    return !['Completed', 'Closed', 'Verified', 'Waived', 'Cancelled', 'Rejected', 'No Longer Required'].includes(status ?? 'Open');
  }

  private temporaryRemoved(row: any) {
    return ['Removed / Reversed', 'Closed'].includes(row.status);
  }

  private reviewComplete(row: any) {
    return ['Completed', 'Closed', 'Reviewed'].includes(row.review_status ?? row.status);
  }

  private pssrRequired(row: any) {
    return Boolean(row.pssr_required ?? row.required);
  }

  private pssrComplete(row: any) {
    return ['Completed', 'Ready'].includes(row.pssr_status ?? row.status);
  }

  private isExpired(date?: string) {
    if (!date) return false;
    return new Date(date).getTime() < new Date(new Date().toDateString()).getTime();
  }

  private isPast(date?: string) {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
  }

  private daysUntil(date?: string) {
    if (!date) return 9999;
    const target = new Date(`${date}T00:00:00`).getTime();
    const today = new Date(new Date().toDateString()).getTime();
    return Math.ceil((target - today) / 86400000);
  }

  private daysUntilDateTime(date?: string) {
    if (!date) return 9999;
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  }

  private daysBetween(from?: string, to?: string) {
    if (!from || !to) return 0;
    return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  }

  private async safeMany<T>(query: PromiseLike<any>) {
    try {
      return await this.db.many<T>(query);
    } catch {
      return [];
    }
  }

  private async safeSingle<T>(query: PromiseLike<any>) {
    try {
      return await this.db.single<T>(query);
    } catch {
      return null;
    }
  }
}
