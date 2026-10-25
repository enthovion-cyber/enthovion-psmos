import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ActionsService } from '../actions/actions.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { ExecutiveAggregationService } from './executive-aggregation.service';
import { ExecutiveCriticalRiskService } from './executive-critical-risk.service';

type Row = Record<string, any>;
type TrendPoint = { periodStart: string; periodEnd: string; value: number | null; sourceCount: number; status: string; sourceRows: Row[] };

/**
 * Phase 7 is an evidence-preserving historical layer. It never derives a past
 * result from a current mutable record: a point is emitted only for dated,
 * persisted source observations and missing periods remain missing.
 */
@Injectable()
export class ExecutiveTrendsService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly aggregation: ExecutiveAggregationService,
    private readonly actions: ActionsService,
    private readonly criticalRisk: ExecutiveCriticalRiskService,
  ) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.trend.dashboard.view');
    const scope = this.scope(user, query);
    const [runs, repeats, alerts, insights, risks, overdue, escalations] = await Promise.all([
      this.listRuns(user, query), this.listRows(user, 'executive_repeat_issue_candidates', scope, 'created_at'),
      this.listRows(user, 'executive_trend_alerts', scope, 'created_at'), this.listRows(user, 'executive_trend_insights', scope, 'created_at'),
      this.listRows(user, 'executive_risk_aggregation_runs', scope, 'completed_at'), this.listRows(user, 'executive_overdue_action_snapshots', scope, 'calculated_at'),
      this.listRows(user, 'executive_escalations', scope, 'created_at'),
    ]);
    const completed = runs.rows.filter((run: Row) => /^Completed/.test(String(run.run_status)));
    return {
      scope,
      generatedAt: new Date().toISOString(),
      dataQuality: completed.length ? 'Observed Historical Data' : 'No Historical Data',
      summary: {
        historicalRuns: completed.length,
        activeRepeatIssues: repeats.filter((row) => !['Rejected', 'Archived'].includes(String(row.repeat_status))).length,
        activeAlerts: alerts.filter((row) => ['Active', 'Acknowledged'].includes(String(row.alert_status))).length,
        activeInsights: insights.filter((row) => row.insight_status === 'Active').length,
        criticalRiskObservations: risks.length,
        overdueActionObservations: overdue.length,
        escalationObservations: escalations.length,
      },
      latestRuns: completed.slice(0, 8),
      recentAlerts: alerts.slice(0, 8),
      insights: insights.slice(0, 8),
      warnings: completed.length ? [] : ['No verified Phase 7 historical runs exist for the selected scope. Current values are not backfilled into history.'],
    };
  }

  async explorer(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.trend.explorer.view');
    const runs = await this.listRuns(user, query);
    const points = await this.pointsForRuns(user, runs.rows.map((row: Row) => row.id));
    return { runs: runs.rows, total: runs.total, points, dataQuality: points.length ? 'Observed Historical Data' : 'No Historical Data' };
  }

  async createRun(user: RequestUser, dto: Row = {}) {
    this.require(user, 'executive.trend.run.create');
    const scope = this.scope(user, dto);
    const source = this.sourceKey(dto.source ?? dto.metricCode ?? 'psm-health');
    const from = this.date(dto.dateRangeStart ?? dto.date_range_start, this.monthsAgo(11));
    const to = this.date(dto.dateRangeEnd ?? dto.date_range_end, new Date().toISOString());
    if (from > to) throw new BadRequestException('The trend start date must be before the end date.');
    const granularity = ['Daily', 'Weekly', 'Monthly'].includes(String(dto.granularity)) ? String(dto.granularity) : 'Monthly';
    const run = await this.db.single<Row>(this.db.from('executive_trend_runs').insert({
      id: crypto.randomUUID(), company_id: user.tenantId, site_id: scope.siteId, department_id: scope.departmentId,
      unit_id: scope.unitId, area_id: scope.areaId, equipment_id: scope.equipmentId,
      run_code: `ETR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      run_title: String(dto.title ?? `${this.label(source)} historical trend`), run_type: dto.runType ?? 'Manual', run_status: 'Running',
      scope_type: scope.siteId ? 'Site' : 'Company', scope_record_id: scope.siteId, scope_snapshot_json: scope,
      filter_json: { source, ...dto.filters }, date_range_start: from, date_range_end: to, granularity, time_zone: String(dto.timeZone ?? 'UTC'),
      data_quality_status: 'Unavailable', supersedes_run_id: dto.supersedesRunId ?? null, initiated_by: user.id, started_at: new Date().toISOString(),
    }).select('*').single());
    try {
      const rows = await this.sourceRows(user, source, scope, from, to);
      const points = this.points(rows, source, from, to, granularity);
      const series = await this.db.single<Row>(this.db.from('executive_trend_series').insert({
        id: crypto.randomUUID(), company_id: user.tenantId, site_id: scope.siteId, trend_run_id: run.id,
        series_code: source, series_title: this.label(source), metric_code: source, source_module: this.sourceModule(source),
        scope_type: scope.siteId ? 'Site' : 'Company', scope_record_id: scope.siteId, unit: this.unit(source),
        directionality: this.direction(source), calculation_type: 'Verified historical observations',
        data_quality_status: this.quality(points), source_count: rows.length,
      }).select('*').single());
      for (const point of points) {
        const saved = await this.db.single<Row>(this.db.from('executive_trend_series_points').insert({
          id: crypto.randomUUID(), company_id: user.tenantId, site_id: scope.siteId, trend_series_id: series.id, trend_run_id: run.id,
          period_start_at: point.periodStart, period_end_at: point.periodEnd, observation_as_of_at: point.sourceRows[0]?.observed_at ?? null,
          metric_value: point.value, observation_count: point.sourceCount, source_count: point.sourceCount,
          point_status: point.status, data_quality_status: point.status === 'Observed' ? 'Observed' : point.status,
          calculation_method_snapshot_json: { source, granularity, rule: 'Actual dated source observations only; absent periods are not zero.' },
          warning_json: point.status === 'Missing' ? { reason: 'No verified source observation exists for this period.' } : null,
        }).select('*').single());
        for (const row of point.sourceRows) await this.lineage(user, run.id, series.id, saved.id, source, row);
      }
      const observed = points.filter((point) => point.status === 'Observed');
      const completed = await this.db.single<Row>(this.db.from('executive_trend_runs').update({
        run_status: 'Completed', completed_at: new Date().toISOString(), source_record_count: rows.length,
        observation_count: observed.length, missing_period_count: points.length - observed.length,
        data_quality_status: this.quality(points), source_coverage_json: { observedPeriods: observed.length, requestedPeriods: points.length },
        result_summary_json: { source, latestValue: observed.at(-1)?.value ?? null, pointCount: points.length },
        calculation_warning_json: observed.length ? null : { reason: 'No verified historical observations were available.' },
      }).eq('id', run.id).eq('company_id', user.tenantId).select('*').single());
      await this.generateInsights(user, completed, series, points);
      await this.history(user, { trend_run_id: run.id, event_type: 'TREND_RUN_COMPLETED', event_title: 'Historical trend run completed', after_value_json: { source, sourceCount: rows.length } });
      return this.runDetail(user, run.id);
    } catch (error) {
      await this.db.single(this.db.from('executive_trend_runs').update({ run_status: 'Failed', failed_at: new Date().toISOString(), safe_error_summary: 'The historical trend could not be generated from permitted verified sources.' }).eq('id', run.id).eq('company_id', user.tenantId).select('id').single()).catch(() => null);
      throw error;
    }
  }

  async runDetail(user: RequestUser, id: string) {
    this.require(user, 'executive.trend.run.view');
    const run = await this.run(user, id);
    const [series, lineage, history] = await Promise.all([
      this.db.many<Row>(this.db.from('executive_trend_series').select('*').eq('company_id', user.tenantId).eq('trend_run_id', id)),
      this.db.many<Row>(this.db.from('executive_trend_source_lineage').select('*').eq('company_id', user.tenantId).eq('trend_run_id', id).limit(250)),
      this.db.many<Row>(this.db.from('executive_trend_history_events').select('*').eq('company_id', user.tenantId).eq('trend_run_id', id).order('created_at', { ascending: false })),
    ]);
    const points = await this.db.many<Row>(this.db.from('executive_trend_series_points').select('*').eq('company_id', user.tenantId).eq('trend_run_id', id).order('period_start_at'));
    return { run, series, points, lineage: this.maskLineage(user, lineage), history };
  }

  async listRuns(user: RequestUser, query: Row = {}) {
    this.require(user, 'executive.trend.run.view');
    const scope = this.scope(user, query); let request: any = this.db.from('executive_trend_runs').select('*', { count: 'exact' }).eq('company_id', user.tenantId).order('started_at', { ascending: false });
    if (scope.siteId) request = request.eq('site_id', scope.siteId); else if (!user.corporateView && user.selectedSiteId) request = request.eq('site_id', user.selectedSiteId);
    const { data, count, error } = await request.range(Number(query.offset ?? 0), Number(query.offset ?? 0) + Math.min(Number(query.limit ?? 50), 100) - 1);
    if (error) throw new BadRequestException('Trend run history is unavailable. Apply the Phase 7 migration.');
    return { rows: data ?? [], total: count ?? 0 };
  }

  async cancelRun(user: RequestUser, id: string) { this.require(user, 'executive.trend.run.cancel'); const run = await this.run(user, id); if (run.run_status !== 'Running') throw new BadRequestException('Only a running trend job can be cancelled.'); return this.db.single<Row>(this.db.from('executive_trend_runs').update({ run_status: 'Cancelled', failed_at: new Date().toISOString(), safe_error_summary: 'Cancelled by an authorized user.' }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); }
  async archiveRun(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.trend.run.archive'); if (!String(dto.reason ?? '').trim()) throw new BadRequestException('An archive reason is required.'); await this.run(user, id); return this.db.single<Row>(this.db.from('executive_trend_runs').update({ run_status: 'Archived', archived_at: new Date().toISOString(), archive_reason: String(dto.reason).trim() }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); }
  async recalculate(user: RequestUser, id: string, dto: Row = {}) { this.require(user, 'executive.trend.run.recalculate'); const old = await this.run(user, id); return this.createRun(user, { ...old.filter_json, ...dto, title: `${old.run_title} (recalculated)`, dateRangeStart: old.date_range_start, dateRangeEnd: old.date_range_end, granularity: old.granularity, siteId: old.site_id, supersedesRunId: id }); }

  async repeatIssues(user: RequestUser, query: Row = {}) { this.require(user, 'executive.trend.repeat_issue.view'); const rows = await this.listRows(user, 'executive_repeat_issue_candidates', this.scope(user, query), 'latest_occurrence_at'); return { rows, total: rows.length }; }
  async detectRepeats(user: RequestUser, dto: Row = {}) {
    this.require(user, 'executive.trend.repeat_issue.detect');
    const run = await this.createRun(user, { ...dto, source: 'repeat-detection', title: 'Repeat issue detection evidence run' });
    const scope = this.scope(user, dto); const rows = await this.sourceRows(user, 'repeat-detection', scope, this.date(dto.dateRangeStart, this.monthsAgo(24)), this.date(dto.dateRangeEnd, new Date().toISOString()));
    const groups = new Map<string, Row[]>();
    for (const row of rows) { const key = String(row.canonical_identity_key ?? ''); if (!key) continue; groups.set(key, [...(groups.get(key) ?? []), row]); }
    const created: Row[] = [];
    for (const [key, matches] of groups) {
      if (matches.length < Math.max(2, Number(dto.minimumOccurrenceCount ?? 2))) continue;
      const first = matches[0]!; const code = `ERI-${key.replace(/[^A-Za-z0-9]/g, '').slice(0, 20).toUpperCase()}`;
      const candidate = await this.db.single<Row>(this.db.from('executive_repeat_issue_candidates').upsert({
        id: crypto.randomUUID(), company_id: user.tenantId, site_id: first.site_id ?? scope.siteId, repeat_code: code,
        repeat_title: `Potential repeat: ${first.source_title ?? first.source_module}`, repeat_type: 'Canonical source recurrence', detection_method: 'Deterministic taxonomy and canonical identity', detection_rule_version: '1',
        match_basis_json: { canonicalIdentityKey: key, dimensions: ['source_module', 'source_record_type', 'source classification'] }, match_quality_status: 'Verified taxonomy match', repeat_status: 'Potential Repeat', occurrence_count: matches.length,
        first_occurrence_at: matches[0]!.observed_at, latest_occurrence_at: matches.at(-1)!.observed_at, affected_sites_count: new Set(matches.map((row) => row.site_id).filter(Boolean)).size,
        affected_units_count: new Set(matches.map((row) => row.unit_id).filter(Boolean)).size, primary_source_module: first.source_module, source_criticality: first.source_criticality ?? null, executive_priority: first.executive_priority ?? null,
        detected_run_id: run.run.id, updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,repeat_code' }).select('*').single());
      for (const match of matches) await this.db.single(this.db.from('executive_repeat_issue_occurrences').upsert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: match.site_id ?? null, repeat_candidate_id: candidate.id, source_module: match.source_module, source_record_type: match.source_record_type, source_record_id: match.source_record_id, canonical_identity_key: key, occurrence_at: match.observed_at, source_classification: match.source_classification ?? null }, { onConflict: 'repeat_candidate_id,source_module,source_record_type,source_record_id' }).select('id').single());
      created.push(candidate);
    }
    return { run: run.run, candidates: created, status: rows.length ? 'Detection completed from verified dated sources.' : 'No source history available; no repeat conclusion was produced.' };
  }

  async repeatDetail(user: RequestUser, id: string) { this.require(user, 'executive.trend.repeat_issue.view'); const candidate = await this.repeat(user, id); const [occurrences, reviews, history] = await Promise.all([this.db.many<Row>(this.db.from('executive_repeat_issue_occurrences').select('*').eq('company_id', user.tenantId).eq('repeat_candidate_id', id).order('occurrence_at')), this.db.many<Row>(this.db.from('executive_repeat_issue_reviews').select('*').eq('company_id', user.tenantId).eq('repeat_candidate_id', id).order('reviewed_at', { ascending: false })), this.db.many<Row>(this.db.from('executive_trend_history_events').select('*').eq('company_id', user.tenantId).eq('repeat_candidate_id', id).order('created_at', { ascending: false }))]); return { candidate, occurrences, reviews, history }; }
  async createRepeatAction(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.trend.repeat_issue.create_action'); const repeat = await this.repeat(user, id); const ownerId = String(dto.ownerId ?? '').trim(); if (!ownerId || !dto.dueDate || !dto.title || !dto.description) throw new BadRequestException('Action title, description, owner, and due date are required.'); const action = await this.actions.create(user.tenantId, user.id, { title: String(dto.title), description: String(dto.description), ownerId, dueDate: String(dto.dueDate), priority: repeat.executive_priority === 'Critical' ? 'SAFETY_CRITICAL' : 'HIGH', sourceModule: 'executive', sourceType: 'ExecutiveRepeatIssue', sourceRecordId: id, siteId: repeat.site_id ?? undefined, evidenceRequired: true, verificationRequired: true }); await this.db.single(this.db.from('executive_repeat_issue_candidates').update({ related_capa_action_id: action.id, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('id').single()); await this.history(user, { repeat_candidate_id: id, event_type: 'REPEAT_ACTION_CREATED', event_title: 'Universal action created from confirmed repeat issue', after_value_json: { actionId: action.id } }); return action; }
  async addToManagementReview(user: RequestUser, kind: 'repeat' | 'insight' | 'alert', id: string) { this.require(user, 'executive.trend.management_review_candidate.create'); const source = kind === 'repeat' ? await this.repeat(user, id) : await this.db.single<Row>(this.db.from(kind === 'insight' ? 'executive_trend_insights' : 'executive_trend_alerts').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle()); if (!source) throw new NotFoundException('Trend source record was not found.'); const existingId = source.management_review_candidate_id; if (existingId) return this.db.single<Row>(this.db.from('executive_trend_management_review_candidates').select('*').eq('id', existingId).eq('company_id', user.tenantId).maybeSingle()); const candidate = await this.db.single<Row>(this.db.from('executive_trend_management_review_candidates').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: source.site_id ?? null, candidate_code: `ETMRC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, candidate_title: source.repeat_title ?? source.insight_title ?? source.alert_title ?? 'Executive trend review candidate', candidate_type: kind, trend_run_id: source.detected_run_id ?? source.trend_run_id ?? null, insight_id: kind === 'insight' ? id : null, repeat_candidate_id: kind === 'repeat' ? id : null, alert_id: kind === 'alert' ? id : null, source_snapshot_json: source, data_quality_status: source.data_quality_status ?? source.match_quality_status ?? 'Unknown', original_summary: source.insight_summary ?? source.repeat_title ?? source.alert_title ?? 'Executive trend review candidate', created_by: user.id }).select('*').single()); const table = kind === 'repeat' ? 'executive_repeat_issue_candidates' : kind === 'insight' ? 'executive_trend_insights' : 'executive_trend_alerts'; await this.db.single(this.db.from(table).update({ management_review_candidate_id: candidate.id, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('id').single()); return candidate; }
  async reviewRepeat(user: RequestUser, id: string, decision: 'Confirmed Repeat' | 'Rejected', dto: Row) { this.require(user, decision === 'Confirmed Repeat' ? 'executive.trend.repeat_issue.confirm' : 'executive.trend.repeat_issue.reject'); const reason = String(dto.reason ?? '').trim(); if (!reason) throw new BadRequestException('A review reason is required.'); const before = await this.repeat(user, id); const after = await this.db.single<Row>(this.db.from('executive_repeat_issue_candidates').update({ repeat_status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_reason: reason, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); await this.db.single(this.db.from('executive_repeat_issue_reviews').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: after.site_id, repeat_candidate_id: id, decision_type: decision, decision_reason: reason, reviewed_by: user.id, previous_status: before.repeat_status, new_status: decision }).select('id').single()); if (decision === 'Confirmed Repeat') await this.clusterConfirmedRepeat(user, after); await this.history(user, { repeat_candidate_id: id, event_type: `REPEAT_${decision.replaceAll(' ', '_').toUpperCase()}`, event_title: `Repeat issue ${decision.toLowerCase()}`, before_value_json: before, after_value_json: after }); return after; }
  async recurringClusters(user: RequestUser, query: Row = {}) { this.require(user, 'executive.trend.recurring_cluster.view'); const rows = await this.listRows(user, 'executive_recurring_issue_clusters', this.scope(user, query), 'updated_at'); return { rows, total: rows.length }; }
  async clusterDetail(user: RequestUser, id: string) { this.require(user, 'executive.trend.recurring_cluster.view'); const cluster = await this.db.single<Row>(this.db.from('executive_recurring_issue_clusters').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle()); if (!cluster || !this.allowed(user, cluster.site_id)) throw new NotFoundException('Recurring issue cluster was not found.'); const members = await this.db.many<Row>(this.db.from('executive_recurring_issue_cluster_members').select('*').eq('company_id', user.tenantId).eq('cluster_id', id)); return { cluster, members }; }

  async alerts(user: RequestUser, query: Row = {}) { this.require(user, 'executive.trend.alert.view'); const rows = await this.listRows(user, 'executive_trend_alerts', this.scope(user, query), 'created_at'); return { rows, total: rows.length }; }
  async acknowledgeAlert(user: RequestUser, id: string) { this.require(user, 'executive.trend.alert.acknowledge'); return this.updateAlert(user, id, { alert_status: 'Acknowledged', acknowledged_by: user.id, acknowledged_at: new Date().toISOString() }); }
  async resolveAlert(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.trend.alert.resolve'); const reason = String(dto.reason ?? '').trim(); if (!reason) throw new BadRequestException('A resolution reason is required.'); return this.updateAlert(user, id, { alert_status: 'Resolved', resolved_at: new Date().toISOString(), resolution_reason: reason }); }
  async escalateAlert(user: RequestUser, id: string) { this.require(user, 'executive.trend.alert.resolve'); const alert = await this.db.single<Row>(this.db.from('executive_trend_alerts').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle()); if (!alert) throw new NotFoundException('Trend alert was not found.'); const rule = alert.rule_id ? await this.db.single<Row>(this.db.from('executive_trend_alert_rules').select('*').eq('id', alert.rule_id).eq('company_id', user.tenantId).maybeSingle()) : null; if (!rule?.active || !rule.approved_at || !rule.escalation_enabled) throw new BadRequestException('An approved trend alert rule with controlled escalation enabled is required.'); const riskCaseId = String(alert.trigger_details_json?.riskCaseId ?? '').trim(); const recipientUserId = Array.isArray(rule.recipient_users_json) ? String(rule.recipient_users_json[0] ?? '') : ''; if (!riskCaseId || !recipientUserId) throw new BadRequestException('This alert has no permitted Phase 5 risk case or approved escalation recipient.'); const escalation = await this.criticalRisk.createEscalation(user, { riskCaseId, recipientUserId, reason: `Trend alert: ${alert.alert_title}`, priority: alert.alert_severity }); return this.updateAlert(user, id, { escalation_id: escalation.id, alert_status: 'Escalated' }); }
  async insights(user: RequestUser, query: Row = {}) { this.require(user, 'executive.trend.insight.view'); const rows = await this.listRows(user, 'executive_trend_insights', this.scope(user, query), 'created_at'); return { rows, total: rows.length }; }
  async reviewInsight(user: RequestUser, id: string, dto: Row) { this.require(user, 'executive.trend.insight.review'); const reason = String(dto.reason ?? '').trim(); if (!reason) throw new BadRequestException('A review reason is required.'); return this.db.single<Row>(this.db.from('executive_trend_insights').update({ insight_status: dto.dismiss ? 'Dismissed' : 'Reviewed', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_reason: reason, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); }
  async alertRules(user: RequestUser, query: Row = {}) { this.require(user, 'executive.trend.alert_rule.view'); const rows = await this.listRows(user, 'executive_trend_alert_rules', this.scope(user, query), 'created_at'); return { rows, total: rows.length }; }
  async alertRule(user: RequestUser, id: string) {
    this.require(user, 'executive.trend.alert_rule.view');
    const rule = await this.db.single<Row>(this.db.from('executive_trend_alert_rules').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle());
    if (!rule) throw new NotFoundException('Trend alert rule was not found.');
    return rule;
  }
  async saveAlertRule(user: RequestUser, dto: Row, id?: string) { this.require(user, 'executive.trend.alert_rule.manage'); const scope = this.scope(user, dto); const row = { rule_title: String(dto.ruleTitle ?? dto.rule_title ?? '').trim(), rule_type: String(dto.ruleType ?? dto.rule_type ?? '').trim(), severity: String(dto.severity ?? 'Medium'), scope_config_json: dto.scopeConfig ?? {}, trigger_config_json: dto.triggerConfig ?? {}, minimum_data_quality: dto.minimumDataQuality ?? 'Observed', minimum_observation_count: Number(dto.minimumObservationCount ?? 2), notification_enabled: Boolean(dto.notificationEnabled), escalation_enabled: false, management_review_candidate_enabled: Boolean(dto.managementReviewCandidateEnabled), active: false, updated_by: user.id, updated_at: new Date().toISOString() }; if (!row.rule_title || !row.rule_type) throw new BadRequestException('Rule title and type are required. Automatic escalation remains disabled until separately approved.'); if (id) return this.db.single<Row>(this.db.from('executive_trend_alert_rules').update(row).eq('id', id).eq('company_id', user.tenantId).select('*').single()); return this.db.single<Row>(this.db.from('executive_trend_alert_rules').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: scope.siteId, rule_code: `ETAR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, rule_version: 1, created_by: user.id, ...row }).select('*').single()); }
  async testAlertRule(user: RequestUser, id: string, dto: Row = {}) { this.require(user, 'executive.trend.alert_rule.manage'); const rule = await this.db.single<Row>(this.db.from('executive_trend_alert_rules').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle()); if (!rule) throw new NotFoundException('Trend alert rule was not found.'); const insights = await this.listRows(user, 'executive_trend_insights', this.scope(user, dto), 'created_at'); return { dryRun: true, rule, matchedInsights: insights.filter((row) => row.insight_status === 'Active'), productionAlertsCreated: 0, escalationsCreated: 0 }; }

  async reviewCluster(user: RequestUser, id: string, dto: Row) {
    this.require(user, 'executive.trend.recurring_cluster.manage');
    const status = String(dto.status ?? dto.cluster_status ?? 'Under Review');
    const cluster = await this.db.single<Row>(this.db.from('executive_recurring_issue_clusters').update({ cluster_status: status, review_status: 'Reviewed', updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single());
    if (!cluster) throw new NotFoundException('Recurring cluster was not found.');
    await this.history(user, { cluster_id: id, event_type: 'CLUSTER_REVIEWED', event_title: `Recurring cluster reviewed: ${status}`, after_value_json: cluster });
    return cluster;
  }
  async addClusterToManagementReview(user: RequestUser, id: string) {
    this.require(user, 'executive.trend.management_review_candidate.create');
    const cluster = await this.db.single<Row>(this.db.from('executive_recurring_issue_clusters').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle());
    if (!cluster) throw new NotFoundException('Cluster was not found.');
    if (cluster.management_review_candidate_id) {
      return this.db.single<Row>(this.db.from('executive_trend_management_review_candidates').select('*').eq('id', cluster.management_review_candidate_id).eq('company_id', user.tenantId).maybeSingle());
    }
    const candidate = await this.db.single<Row>(this.db.from('executive_trend_management_review_candidates').insert({
      id: crypto.randomUUID(), company_id: user.tenantId, site_id: cluster.site_id ?? null,
      candidate_code: `ETMRC-CLUST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, candidate_title: cluster.cluster_title, candidate_type: 'cluster',
      trend_run_id: cluster.created_run_id ?? null, cluster_id: id, source_snapshot_json: cluster,
      data_quality_status: cluster.data_quality_status ?? 'Observed', original_summary: `Recurring issue cluster: ${cluster.cluster_title} (${cluster.confirmed_occurrence_count} confirmed occurrences)`, created_by: user.id,
    }).select('*').single());
    await this.db.single(this.db.from('executive_recurring_issue_clusters').update({ management_review_candidate_id: candidate.id, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('id').single());
    return candidate;
  }

  lookups(): Record<string, string[]> {
    return {
      'trend-types': ['Point-in-time Count', 'Period Event Count', 'Rate', 'Percentage', 'Ratio', 'Average', 'Median', 'Score', 'Status Distribution', 'Age Distribution'],
      'trend-granularities': ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'],
      'trend-directions': ['Improving', 'Stable', 'Declining', 'Worsening', 'New Issue', 'Resolved Issue', 'Mixed', 'Insufficient Data', 'Not Comparable', 'Not Calculated'],
      'trend-data-quality-statuses': ['High Data Quality', 'Moderate Data Quality', 'Low Data Quality', 'Insufficient Data', 'Not Comparable', 'Observed', 'Partial Data', 'No Historical Data'],
      'trend-comparability-statuses': ['Comparable', 'Incomparable - Scope Difference', 'Incomparable - Methodology Difference', 'Incomparable - Missing Denominator', 'Incomparable - Insufficient Data'],
      'repeat-issue-types': ['Repeat Audit Finding', 'Repeat Regulatory Gap', 'Repeat MI Deficiency', 'Repeat Equipment Failure', 'Repeat Barrier Impairment', 'Repeat Incident Recommendation', 'Repeat PHA/LOPA Recommendation', 'Repeat PSSR Blocker', 'Repeat MOC Implementation Issue', 'Repeat Training Gap', 'Repeat Evidence Deficiency', 'Repeat Action Delay', 'Repeat CAPA Verification Failure', 'Repeat CAPA Reopening', 'Repeat Executive Escalation', 'Repeat Management Commitment Delay'],
      'repeat-issue-statuses': ['Potential Repeat', 'Needs Review', 'Confirmed Repeat', 'Confirmed Cross-Site Repeat', 'Repeat After CAPA', 'Recurring Issue', 'Not Repeat', 'Duplicate Source Link', 'Insufficient Evidence', 'Superseded', 'Archived'],
      'recurring-cluster-statuses': ['Open', 'Under Review', 'Escalated', 'Management Review', 'Resolved', 'Archived'],
      'trend-insight-types': ['Worsening condition', 'Repeat recurrence', 'Sustained improvement', 'Data quality anomaly', 'Escalation SLA breach rate', 'Backlog growth'],
      'trend-alert-types': ['KPI Threshold Breach', 'Sustained Worsening Trend', 'Critical Backlog Increase', 'Repeat Critical Issue', 'Repeat Barrier Impairment', 'Reopened Critical CAPA', 'Escalation SLA Deterioration', 'Management Commitment Backlog', 'Site Performance Decline', 'PSM Element Performance Decline', 'Data Quality Deterioration'],
      'trend-alert-statuses': ['Active', 'Acknowledged', 'Under Review', 'Follow-Up Assigned', 'Escalated', 'Resolved', 'Dismissed With Reason', 'Superseded'],
    };
  }

  async operational(user: RequestUser, section: string, query: Row = {}) { this.require(user, this.permissionFor(section)); const source = this.sourceKey(section); const scope = this.scope(user, query); const rows = await this.sourceRows(user, source, scope, this.date(query.dateRangeStart, this.monthsAgo(11)), this.date(query.dateRangeEnd, new Date().toISOString())); return { rows, total: rows.length, dataQuality: rows.length ? 'Observed Historical Data' : 'No Historical Data', source: this.label(source) }; }
  async comparisons(user: RequestUser, dto: Row = {}) { this.require(user, 'executive.trend.compare.view'); const rows = await this.listRows(user, 'executive_trend_comparisons', this.scope(user, dto), 'created_at'); return { rows, total: rows.length, status: rows.length ? 'Stored comparison' : 'No historical comparison has been generated.' }; }
  async methodology(user: RequestUser) { this.require(user, 'executive.trend.methodology.view'); return this.db.many<Row>(this.db.from('executive_trend_methodology_versions').select('*').or(`company_id.is.null,company_id.eq.${user.tenantId}`).order('effective_from', { ascending: false })); }
  async settings(user: RequestUser) { this.require(user, 'executive.trend.settings.view'); return this.db.single<Row>(this.db.from('executive_kpi_settings').select('enable_executive_trends,executive_trend_defaults_json').eq('company_id', user.tenantId).maybeSingle()); }
  async saveSettings(user: RequestUser, dto: Row) { this.require(user, 'executive.trend.settings.edit'); return this.db.single<Row>(this.db.from('executive_kpi_settings').update({ enable_executive_trends: Boolean(dto.enabled ?? true), executive_trend_defaults_json: dto.defaults ?? dto }).eq('company_id', user.tenantId).select('*').single()); }

  private async sourceRows(user: RequestUser, source: string, scope: Row, from: string, to: string): Promise<Row[]> {
    const spec = this.sourceSpec(source); let request: any = this.db.from(spec.table).select('*').eq('company_id', user.tenantId).gte(spec.date, from).lte(spec.date, to).order(spec.date);
    if (scope.siteId) request = request.eq('site_id', scope.siteId);
    const rows = await this.db.many<Row>(request.limit(5000));
    return rows.map((row) => ({ ...row, observed_at: row[spec.date], source_module: row.source_module ?? spec.module, source_record_type: spec.recordType, source_record_id: row.id, canonical_identity_key: this.identity(source, row), source_title: row.case_title ?? row.escalation_reason ?? row.commitment_title ?? row.element_code ?? source, source_classification: row.case_type ?? row.action_status ?? row.escalation_status ?? row.element_status ?? null }));
  }
  private sourceSpec(source: string) { const specs: Record<string, { table: string; date: string; module: string; recordType: string }> = { 'critical-risks': { table: 'executive_risk_aggregation_runs', date: 'completed_at', module: 'executive', recordType: 'RiskAggregationRun' }, 'overdue-actions': { table: 'executive_overdue_action_snapshots', date: 'calculated_at', module: 'actions', recordType: 'OverdueActionSnapshot' }, 'escalations': { table: 'executive_escalations', date: 'created_at', module: 'executive', recordType: 'ExecutiveEscalation' }, 'management-review': { table: 'executive_management_review_meetings', date: 'scheduled_start_at', module: 'executive', recordType: 'ManagementReviewMeeting' }, modules: { table: 'executive_module_health_results', date: 'calculated_at', module: 'executive', recordType: 'ModuleHealthResult' }, 'psm-elements': { table: 'executive_psm_element_scores', date: 'calculated_at', module: 'executive', recordType: 'PsmElementScore' }, 'repeat-detection': { table: 'executive_risk_cases', date: 'first_detected_at', module: 'executive', recordType: 'ExecutiveRiskCase' } }; return specs[source] ?? { table: 'executive_kpi_snapshots', date: 'generated_at', module: 'executive', recordType: 'KpiSnapshot' }; }
  private points(rows: Row[], source: string, from: string, to: string, granularity: string): TrendPoint[] { const periods = this.periods(from, to, granularity); return periods.map(({ start, end }) => { const included = rows.filter((row) => String(row.observed_at) >= start && String(row.observed_at) < end); if (!included.length) return { periodStart: start, periodEnd: end, value: null, sourceCount: 0, status: 'Missing', sourceRows: [] }; return { periodStart: start, periodEnd: end, value: this.value(source, included), sourceCount: included.length, status: 'Observed', sourceRows: included }; }); }
  private value(source: string, rows: Row[]) { if (source === 'critical-risks') return rows.reduce((sum, row) => sum + Number(row.active_case_count ?? 0), 0) / rows.length; if (source === 'overdue-actions') return rows.length; if (source === 'escalations') return rows.length; if (source === 'management-review') return rows.length; if (source === 'modules') { const values = rows.map((row) => Number(row.health_score ?? row.score_value)).filter(Number.isFinite); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; } if (source === 'psm-elements') { const values = rows.map((row) => Number(row.score_value)).filter(Number.isFinite); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; } return rows.length; }
  private async generateInsights(user: RequestUser, run: Row, series: Row, points: TrendPoint[]) { const observed = points.filter((point) => point.status === 'Observed' && point.value !== null); if (observed.length < 3) return; const tail = observed.slice(-3); const values = tail.map((point) => point.value!); const worsening = this.direction(String(series.metric_code)) === 'Lower is better' ? values[0]! < values[1]! && values[1]! < values[2]! : values[0]! > values[1]! && values[1]! > values[2]!; if (!worsening) return; const insight = await this.db.single<Row>(this.db.from('executive_trend_insights').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: run.site_id, insight_code: `ETI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, insight_title: `${series.series_title} has worsened for three observed periods`, insight_type: 'Worsening condition', insight_summary: 'A deterministic comparison of three consecutive observed periods identified sustained deterioration.', trend_run_id: run.id, trend_series_id: series.id, rule_code: 'three-consecutive-observed-periods', rule_version: '1', baseline_value: values[0], current_value: values[2], comparison_period_json: { periods: tail.map((point) => point.periodStart) }, data_quality_status: 'Observed', explanation_json: { values, directionality: series.directionality, automaticEscalation: false } }).select('*').single()); await this.history(user, { trend_run_id: run.id, insight_id: insight.id, event_type: 'TREND_INSIGHT_CREATED', event_title: 'Worsening condition detected from verified history', after_value_json: insight }); }
  private async clusterConfirmedRepeat(user: RequestUser, candidate: Row) { const key = `${candidate.primary_source_module ?? 'executive'}-${candidate.psm_element_id ?? 'unmapped'}`; const existing = await this.db.single<Row>(this.db.from('executive_recurring_issue_clusters').select('*').eq('company_id', user.tenantId).eq('cluster_code', `ERC-${key.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24)}`).maybeSingle()); const cluster = existing ? await this.db.single<Row>(this.db.from('executive_recurring_issue_clusters').update({ confirmed_occurrence_count: Number(existing.confirmed_occurrence_count ?? 0) + Number(candidate.occurrence_count ?? 0), affected_sites_count: Math.max(Number(existing.affected_sites_count ?? 0), Number(candidate.affected_sites_count ?? 0)), last_seen_at: candidate.latest_occurrence_at, updated_at: new Date().toISOString() }).eq('id', existing.id).select('*').single()) : await this.db.single<Row>(this.db.from('executive_recurring_issue_clusters').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: candidate.site_id, cluster_code: `ERC-${key.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24)}`, cluster_title: `Recurring ${candidate.primary_source_module ?? 'executive'} issue pattern`, cluster_type: 'Confirmed repeat pattern', clustering_method: 'Confirmed canonical taxonomy', rule_version: '1', dimension_config_json: { sourceModule: candidate.primary_source_module, psmElementId: candidate.psm_element_id }, confirmed_occurrence_count: candidate.occurrence_count, affected_sites_count: candidate.affected_sites_count, affected_units_count: candidate.affected_units_count, first_seen_at: candidate.first_occurrence_at, last_seen_at: candidate.latest_occurrence_at, data_quality_status: candidate.match_quality_status, created_run_id: candidate.detected_run_id }).select('*').single()); await this.db.single(this.db.from('executive_recurring_issue_cluster_members').upsert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: candidate.site_id, cluster_id: cluster.id, repeat_candidate_id: candidate.id, source_module: candidate.primary_source_module ?? 'executive', source_record_type: 'RepeatIssueCandidate', source_record_id: candidate.id, inclusion_reason: 'Human-confirmed repeat issue' }, { onConflict: 'cluster_id,source_module,source_record_type,source_record_id' }).select('id').single()); }
  private async lineage(user: RequestUser, runId: string, seriesId: string, pointId: string, source: string, row: Row) { await this.db.single(this.db.from('executive_trend_source_lineage').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: row.site_id ?? null, trend_run_id: runId, trend_series_id: seriesId, point_id: pointId, source_module: row.source_module ?? this.sourceModule(source), source_record_type: row.source_record_type, source_record_id: row.source_record_id, source_updated_at: row.updated_at ?? null, source_observed_at: row.observed_at ?? null, source_ingested_at: row.created_at ?? null }).select('id').single()); }
  private async pointsForRuns(user: RequestUser, ids: string[]) { return ids.length ? this.db.many<Row>(this.db.from('executive_trend_series_points').select('*').eq('company_id', user.tenantId).in('trend_run_id', ids).order('period_start_at')) : []; }
  private async listRows(user: RequestUser, table: string, scope: Row, date: string): Promise<Row[]> { let request: any = this.db.from(table).select('*').eq('company_id', user.tenantId).order(date, { ascending: false }).limit(250); if (scope.siteId) request = request.eq('site_id', scope.siteId); try { return await this.db.many<Row>(request); } catch { throw new BadRequestException('Executive trends storage is unavailable. Apply the Phase 7 migration and verify the selected scope.'); } }
  private async run(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('executive_trend_runs').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle()); if (!row || !this.allowed(user, row.site_id)) throw new NotFoundException('Trend run was not found in the permitted scope.'); return row; }
  private async repeat(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('executive_repeat_issue_candidates').select('*').eq('id', id).eq('company_id', user.tenantId).maybeSingle()); if (!row || !this.allowed(user, row.site_id)) throw new NotFoundException('Repeat issue was not found in the permitted scope.'); return row; }
  private async updateAlert(user: RequestUser, id: string, update: Row) { const row = await this.db.single<Row>(this.db.from('executive_trend_alerts').update({ ...update, updated_at: new Date().toISOString() }).eq('id', id).eq('company_id', user.tenantId).select('*').single()); if (!row) throw new NotFoundException('Trend alert was not found.'); return row; }
  private scope(user: RequestUser, query: Row) { const base = this.aggregation.scope(user, query); return { ...base, departmentId: query.departmentId ?? query.department_id ?? null }; }
  private require(user: RequestUser, permission: string) { const overviewRead = permission.endsWith('.view') && user.permissions.includes('executive.dashboard.view'); if (!user.isSuperAdmin && !user.isCompanyAdmin && !overviewRead && !user.permissions.includes(permission)) throw new ForbiddenException('You do not have permission to access this Executive Trends resource.'); }
  private allowed(user: RequestUser, siteId: string | null) { return !siteId || user.isSuperAdmin || user.isCompanyAdmin || user.corporateView || user.siteIds.includes(siteId); }
  private sourceKey(value: unknown) { const key = String(value).toLowerCase().replaceAll('_', '-'); const aliases: Record<string, string> = { 'critical-risk': 'critical-risks', 'critical-barriers': 'critical-risks', 'action-aging': 'overdue-actions', 'action-extensions': 'overdue-actions', 'capa-effectiveness': 'overdue-actions', 'stale-records': 'modules', 'psm-health': 'psm-elements', kpis: 'kpis' }; return aliases[key] ?? key; }
  private sourceModule(source: string) { return this.sourceSpec(source).module; }
  private label(source: string) { return source.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' '); }
  private unit(source: string) { return ['modules', 'psm-elements'].includes(source) ? 'Score' : 'Count'; }
  private direction(source: string) { return ['overdue-actions', 'critical-risks', 'escalations', 'repeat-detection'].includes(source) ? 'Lower is better' : 'Higher is better'; }
  private quality(points: TrendPoint[]) { const observed = points.filter((point) => point.status === 'Observed').length; if (!observed) return 'No Historical Data'; return observed === points.length ? 'Observed' : 'Partial Data'; }
  private date(value: unknown, fallback: string) { const parsed = value ? new Date(String(value)) : new Date(fallback); if (Number.isNaN(parsed.getTime())) throw new BadRequestException('A valid ISO date is required.'); return parsed.toISOString(); }
  private monthsAgo(months: number) { const date = new Date(); date.setUTCMonth(date.getUTCMonth() - months); return date.toISOString(); }
  private periods(from: string, to: string, granularity: string) { const output: Array<{ start: string; end: string }> = []; const cursor = new Date(from); cursor.setUTCHours(0, 0, 0, 0); if (granularity === 'Monthly') cursor.setUTCDate(1); while (cursor.toISOString() <= to) { const start = new Date(cursor); const next = new Date(cursor); if (granularity === 'Daily') next.setUTCDate(next.getUTCDate() + 1); else if (granularity === 'Weekly') next.setUTCDate(next.getUTCDate() + 7); else next.setUTCMonth(next.getUTCMonth() + 1); output.push({ start: start.toISOString(), end: next.toISOString() }); cursor.setTime(next.getTime()); if (output.length > 366) break; } return output; }
  private identity(source: string, row: Row) { if (source === 'repeat-detection') return [row.source_module, row.source_record_type, row.psm_element_id ?? '', row.risk_category ?? row.case_type ?? '', row.site_id ?? ''].join('|'); return String(row.canonical_source_key ?? row.canonical_action_key ?? row.id); }
  private permissionFor(section: string) { const key = this.sourceKey(section); if (['modules'].includes(key)) return 'executive.trend.module.view'; if (key === 'psm-elements') return 'executive.trend.psm_element.view'; if (['sites', 'units', 'departments'].includes(key)) return `executive.trend.${key.slice(0, -1)}.view`; if (['critical-risks', 'overdue-actions', 'escalations', 'management-review'].includes(key)) return `executive.trend.${key === 'critical-risks' ? 'escalation' : key === 'management-review' ? 'management_review' : key.slice(0, -1)}.view`; return 'executive.trend.explorer.view'; }
  private maskLineage(user: RequestUser, rows: Row[]) { return user.permissions.includes('executive.trend.restricted_trace.view') || user.isCompanyAdmin || user.isSuperAdmin ? rows : rows.map((row) => row.restricted ? { ...row, source_record_id: null, source_hash: null } : row); }
  private async history(user: RequestUser, event: Row) { await this.db.single(this.db.from('executive_trend_history_events').insert({ id: crypto.randomUUID(), company_id: user.tenantId, site_id: user.selectedSiteId ?? null, actor_user_id: user.id, ...event }).select('id').single()).catch(() => null); await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: event.event_type, entityType: 'ExecutiveTrend', entityId: event.trend_run_id ?? event.repeat_candidate_id ?? event.insight_id ?? crypto.randomUUID(), after: event.after_value_json ?? null, metadata: { sourceModule: 'Executive KPI Dashboard Phase 7' } }).catch(() => null); }
}
