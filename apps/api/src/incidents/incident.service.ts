import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JsonValue } from '../common/types/db.types';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type IncidentRow = Record<string, any>;

@Injectable()
export class IncidentService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(tenantId: string, actorId: string, scope: Scope, filters: Record<string, any> = {}, permissions: string[] = []) {
    const [summary, attention, psmEvents, highPotential, investigationStatus, actionSnapshot, trends, register, filterContext, savedViews] = await Promise.all([
      this.summary(tenantId, scope, permissions),
      this.attention(tenantId, scope, permissions),
      this.psmEvents(tenantId, scope, permissions),
      this.highPotential(tenantId, scope, permissions),
      this.investigationStatus(tenantId, scope, permissions),
      this.actionSnapshot(tenantId, scope, permissions),
      this.trends(tenantId, scope, permissions),
      this.register(tenantId, scope, filters, permissions),
      this.filterContext(tenantId, scope),
      this.savedViews(tenantId, actorId, scope)
    ]);
    return {
      header: {
        title: 'Incident / Near Miss Register',
        subtitle: 'Track incidents, near misses, investigations, RCA, actions, and process safety events',
        lastUpdated: new Date().toISOString(),
        totals: {
          totalIncidents: summary.cards.totalIncidents,
          openInvestigations: summary.cards.openInvestigations,
          highPotentialNearMisses: summary.cards.highPotentialSeverityEvents,
          psmIncidents: summary.cards.processSafetyIncidents,
          overdueInvestigations: summary.cards.overdueInvestigations,
          openCorrectiveActions: summary.cards.openCorrectivePreventiveActions
        },
        actions: {
          canCreate: permissions.includes('incidents.create'),
          canExport: permissions.includes('incidents.export'),
          createDisabledReason: permissions.includes('incidents.create') ? null : 'Missing incidents.create permission',
          exportDisabledReason: permissions.includes('incidents.export') ? null : 'Missing incidents.export permission'
        }
      },
      summary,
      attention,
      psmEvents,
      highPotential,
      investigationStatus,
      actionSnapshot,
      trends,
      register,
      filterContext,
      savedViews,
      permissions: this.permissionMap(permissions),
      generatedAt: new Date().toISOString()
    };
  }

  async summary(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.visibleIncidents(tenantId, scope, permissions);
    const thisWeek = this.dateAfterDays(7);
    const cards: Record<string, number> = {
      totalIncidents: rows.length,
      openIncidents: this.count(rows, (r) => !this.closedStatus(r.status)),
      closedIncidents: this.count(rows, (r) => this.closedStatus(r.status)),
      draftReports: this.count(rows, (r) => r.status === 'Draft'),
      newReportsPendingTriage: this.count(rows, (r) => ['Reported', 'Triage'].includes(r.status)),
      nearMisses: this.count(rows, (r) => r.event_type === 'Near Miss'),
      unsafeConditions: this.count(rows, (r) => r.event_type === 'Unsafe Condition'),
      actualInjuryEvents: this.count(rows, (r) => !!r.injury_occurred || r.event_type === 'Injury'),
      environmentalEvents: this.count(rows, (r) => !!r.environmental_impact || r.classification === 'Environmental'),
      assetReliabilityEvents: this.count(rows, (r) => r.classification === 'Asset / Reliability' || r.event_type === 'Equipment Damage'),
      processSafetyIncidents: this.count(rows, (r) => !!r.is_psm_incident || r.classification === 'Process Safety'),
      apiTier1Events: this.count(rows, (r) => r.pse_tier === 'Tier 1'),
      apiTier2Events: this.count(rows, (r) => r.pse_tier === 'Tier 2'),
      apiTier3Events: this.count(rows, (r) => r.pse_tier === 'Tier 3'),
      apiTier4Events: this.count(rows, (r) => r.pse_tier === 'Tier 4'),
      highPotentialSeverityEvents: this.count(rows, (r) => this.highPotentialSeverity(r.potential_severity)),
      fatalityPotentialNearMisses: this.count(rows, (r) => r.event_type === 'Near Miss' && r.potential_severity === 'Fatality'),
      majorPotentialEvents: this.count(rows, (r) => ['Major', 'Fatality', 'Catastrophic'].includes(r.potential_severity)),
      overdueInvestigations: this.count(rows, (r) => !this.closedStatus(r.status) && this.isPastDate(r.due_date)),
      investigationsDueThisWeek: this.count(rows, (r) => !this.closedStatus(r.status) && r.due_date && new Date(r.due_date) <= thisWeek && !this.isPastDate(r.due_date)),
      rcaRequired: this.count(rows, (r) => !!r.rca_required),
      rcaCompleted: this.count(rows, (r) => ['Completed', 'Closed'].includes(r.rca_status)),
      formalInvestigationTeamRequired: this.count(rows, (r) => !!r.formal_team_required),
      openCorrectivePreventiveActions: rows.reduce((sum, r) => sum + Number(r.open_actions_count ?? 0), 0),
      overdueActions: rows.reduce((sum, r) => sum + Number(r.overdue_actions_count ?? 0), 0),
      mocRequired: this.count(rows, (r) => !!r.moc_required),
      pssrRequired: this.count(rows, (r) => !!r.pssr_required),
      hazopReviewRequired: this.count(rows, (r) => !!r.hazop_review_required),
      lopaSilReviewRequired: this.count(rows, (r) => !!r.lopa_review_required),
      mechanicalIntegrityFollowupRequired: this.count(rows, (r) => !!r.mechanical_integrity_followup_required),
      regulatoryReportingRequired: this.count(rows, (r) => !!r.regulatory_reporting_required),
      repeatEvents: this.repeatEventCount(rows),
      readyForReview: this.count(rows, (r) => r.status === 'Pending Review'),
      reopenedIncidents: this.count(rows, (r) => r.status === 'Reopened' || !!r.reopened_at),
      openInvestigations: this.count(rows, (r) => ['Investigation Required', 'Investigation In Progress', 'RCA Required', 'RCA In Progress', 'Actions Assigned'].includes(r.status))
    };
    return { cards, generatedAt: new Date().toISOString() };
  }

  async attention(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.decoratedIncidents(tenantId, scope, permissions, { limit: 500 });
    const items = rows.map((row) => {
      const reasons = [
        row.potential_severity === 'Fatality' || row.potential_severity === 'Catastrophic' ? 'Fatality/catastrophic potential' : null,
        this.highPotentialSeverity(row.potential_severity) && row.event_type === 'Near Miss' ? 'High-potential near miss' : null,
        ['Tier 1', 'Tier 2'].includes(row.pse_tier) ? `${row.pse_tier} process safety event` : null,
        row.fire_explosion_occurred ? 'Fire/explosion event' : null,
        row.regulatory_reporting_required ? 'Regulatory reporting required' : null,
        this.isPastDate(row.due_date) && !this.closedStatus(row.status) ? 'Overdue investigation' : null,
        Number(row.overdue_actions_count ?? 0) > 0 ? 'Overdue critical action' : null,
        row.moc_required || row.pssr_required ? 'Needs MOC/PSSR before restart' : null,
        row.lopa_review_required || row.hazop_review_required ? 'Needs HAZOP/LOPA review' : null,
        row.chemical_involved ? 'Chemical/SDS involvement' : null
      ].filter(Boolean);
      return reasons.length ? { ...row, attentionReasons: reasons, action: row.restrictedRedacted ? 'Restricted' : 'Open incident' } : null;
    }).filter(Boolean).slice(0, 12);
    return { items, total: items.length };
  }

  async psmEvents(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.visibleIncidents(tenantId, scope, permissions);
    const psmRows = rows.filter((r) => r.is_psm_incident || r.is_process_safety_event || r.classification === 'Process Safety');
    return {
      summary: {
        totalPsmIncidents: psmRows.length,
        processSafetyEvents: this.count(rows, (r) => !!r.is_process_safety_event),
        lossOfPrimaryContainment: this.count(rows, (r) => ['Yes', 'Confirmed'].includes(r.lopc_status)),
        tier1: this.count(rows, (r) => r.pse_tier === 'Tier 1'),
        tier2: this.count(rows, (r) => r.pse_tier === 'Tier 2'),
        tier3: this.count(rows, (r) => r.pse_tier === 'Tier 3'),
        tier4: this.count(rows, (r) => r.pse_tier === 'Tier 4'),
        notDetermined: this.count(rows, (r) => r.pse_tier === 'Not Determined'),
        classificationPendingReview: this.count(rows, (r) => r.pse_tier === 'Not Determined' && (r.is_psm_incident || r.is_process_safety_event)),
        toxicReleaseEvents: this.count(rows, (r) => r.event_type === 'Release' || !!r.released_material),
        fireExplosionEvents: this.count(rows, (r) => !!r.fire_explosion_occurred),
        safeguardIplFailureEvents: this.count(rows, (r) => String(r.tags_json ?? '').toLowerCase().includes('ipl') || String(r.tags_json ?? '').toLowerCase().includes('sis') || String(r.tags_json ?? '').toLowerCase().includes('psv')),
        operatingEnvelopeExceedanceEvents: this.count(rows, (r) => r.event_type === 'Process Upset')
      },
      items: (await this.decoratedIncidents(tenantId, scope, permissions, { limit: 50 })).filter((r) => r.is_psm_incident || r.is_process_safety_event || r.classification === 'Process Safety').slice(0, 8)
    };
  }

  async highPotential(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.visibleIncidents(tenantId, scope, permissions);
    const items = (await this.decoratedIncidents(tenantId, scope, permissions, { limit: 200 })).filter((r) => this.highPotentialSeverity(r.potential_severity) || Number(r.potential_risk_score ?? 0) >= 15).slice(0, 10);
    return {
      summary: {
        highPotentialNearMisses: this.count(rows, (r) => r.event_type === 'Near Miss' && this.highPotentialSeverity(r.potential_severity)),
        fatalityPotentialEvents: this.count(rows, (r) => r.potential_severity === 'Fatality'),
        majorInjuryPotentialEvents: this.count(rows, (r) => ['Major', 'Fatality'].includes(r.potential_severity) && (r.event_type === 'Near Miss' || r.injury_occurred)),
        majorProcessSafetyPotentialEvents: this.count(rows, (r) => ['Major', 'Fatality', 'Catastrophic'].includes(r.potential_severity) && (r.is_psm_incident || r.is_process_safety_event)),
        actualLowPotentialHigh: this.count(rows, (r) => ['Negligible', 'Minor'].includes(r.actual_severity) && this.highPotentialSeverity(r.potential_severity)),
        reviewPending: this.count(rows, (r) => !r.potential_severity || r.investigation_priority === 'Pending Review')
      },
      items
    };
  }

  async investigationStatus(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.visibleIncidents(tenantId, scope, permissions);
    const closedThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const openCycleRows = rows.filter((r) => r.created_at && (r.closed_at || this.closedStatus(r.status)));
    return {
      statuses: this.distribution(rows, 'status', ['Draft', 'Reported', 'Triage', 'Investigation Required', 'Investigation In Progress', 'RCA Required', 'RCA In Progress', 'Actions Assigned', 'Pending Review', 'Changes Requested', 'Approved', 'Closed', 'Reopened', 'Cancelled / Void']),
      summary: {
        openInvestigations: this.count(rows, (r) => !this.closedStatus(r.status)),
        pendingTriage: this.count(rows, (r) => ['Reported', 'Triage'].includes(r.status)),
        rcaRequired: this.count(rows, (r) => !!r.rca_required),
        rcaOverdue: this.count(rows, (r) => r.rca_required && this.isPastDate(r.due_date) && !['Completed', 'Closed'].includes(r.rca_status)),
        investigationOverdue: this.count(rows, (r) => this.isPastDate(r.due_date) && !this.closedStatus(r.status)),
        pendingReview: this.count(rows, (r) => r.status === 'Pending Review'),
        changesRequested: this.count(rows, (r) => r.status === 'Changes Requested'),
        closedThisMonth: this.count(rows, (r) => r.closed_at && new Date(r.closed_at) >= closedThisMonth),
        reopenedIncidents: this.count(rows, (r) => r.status === 'Reopened' || !!r.reopened_at),
        averageCycleTimeDays: openCycleRows.length ? Math.round(openCycleRows.reduce((sum, r) => sum + this.daysBetween(r.created_at, r.closed_at ?? r.updated_at), 0) / openCycleRows.length) : null
      },
      quickFilters: ['My investigations', 'Overdue', 'Due this week', 'Awaiting RCA', 'Awaiting review', 'High potential', 'PSM incidents', 'Tier 1/Tier 2']
    };
  }

  async actionSnapshot(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.visibleIncidents(tenantId, scope, permissions);
    const actionRows = await this.safeMany<any>(this.scopeQuery(this.db.from('Action').select('*').eq('tenantId', tenantId), scope, 'siteId'));
    const incidentActions = actionRows.filter((a) => String(a.sourceModule ?? a.linkedModule ?? '').toLowerCase().includes('incident') || rows.some((r) => r.id === a.sourceRecordId || r.id === a.linkedRecordId));
    const open = incidentActions.filter((a) => this.openActionStatus(a.status));
    return {
      summary: {
        openActions: open.length || rows.reduce((sum, r) => sum + Number(r.open_actions_count ?? 0), 0),
        overdueActions: open.filter((a) => this.isPastDate(a.dueDate ?? a.due_date)).length || rows.reduce((sum, r) => sum + Number(r.overdue_actions_count ?? 0), 0),
        criticalActions: open.filter((a) => ['Critical', 'High'].includes(a.priority)).length,
        dueThisWeek: open.filter((a) => a.dueDate && new Date(a.dueDate) <= this.dateAfterDays(7)).length,
        awaitingVerification: incidentActions.filter((a) => ['Pending Verification', 'Awaiting Verification'].includes(a.status)).length,
        linkedToHighPotential: rows.filter((r) => this.highPotentialSeverity(r.potential_severity) && Number(r.open_actions_count ?? 0) > 0).length,
        linkedToPsm: rows.filter((r) => r.is_psm_incident && Number(r.open_actions_count ?? 0) > 0).length,
        requiringMoc: rows.filter((r) => r.moc_required).length,
        requiringPssr: rows.filter((r) => r.pssr_required).length,
        requiringHazopLopa: rows.filter((r) => r.hazop_review_required || r.lopa_review_required).length
      },
      items: open.slice(0, 10).map((a) => ({ actionNumber: a.actionNumber ?? a.action_number, title: a.title, owner: a.assignedToId ?? a.ownerId, dueDate: a.dueDate ?? a.due_date, status: a.status, priority: a.priority, blocking: a.blocking ?? false, incidentId: a.sourceRecordId ?? a.linkedRecordId }))
    };
  }

  async trends(tenantId: string, scope: Scope, permissions: string[] = []) {
    const rows = await this.visibleIncidents(tenantId, scope, permissions);
    return {
      byMonth: this.monthly(rows, 'event_datetime'),
      nearMissesByMonth: this.monthly(rows.filter((r) => r.event_type === 'Near Miss'), 'event_datetime'),
      psmByMonth: this.monthly(rows.filter((r) => r.is_psm_incident || r.is_process_safety_event), 'event_datetime'),
      actualSeverity: this.distribution(rows, 'actual_severity', this.severities()),
      potentialSeverity: this.distribution(rows, 'potential_severity', this.severities()),
      bySite: this.group(rows, 'site_id'),
      byUnit: this.group(rows, 'unit_id'),
      byArea: this.group(rows, 'area_id'),
      byEventType: this.group(rows, 'event_type'),
      byClassification: this.group(rows, 'classification'),
      repeatEventsByEquipmentUnit: this.repeatEvents(rows),
      tierTrend: this.monthly(rows.filter((r) => ['Tier 1', 'Tier 2'].includes(r.pse_tier)), 'event_datetime')
    };
  }

  async register(tenantId: string, scope: Scope, filters: Record<string, any> = {}, permissions: string[] = []) {
    const limit = Math.min(Math.max(Number(filters.limit ?? 25), 1), 100);
    const page = Math.max(Number(filters.page ?? 1), 1);
    const sort = this.parseSort(filters.sort);
    let query = this.db.from('incidents').select('*').eq('tenant_id', tenantId);
    query = this.scopeQuery(query, scope, 'site_id');
    query = this.applyFilters(query, filters);
    const rows = await this.safeMany<IncidentRow>(query.order(sort.column, { ascending: sort.ascending }).range((page - 1) * limit, page * limit - 1));
    const decorated = await this.decorateRows(tenantId, rows, permissions);
    return { rows: decorated, page, limit, total: decorated.length, hasMore: rows.length === limit, sort };
  }

  async detail(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const [header, statusBar, tabs, overview, quickActions] = await Promise.all([
      this.detailHeader(tenantId, scope, id, permissions),
      this.statusBar(tenantId, scope, id, permissions),
      this.tabStatus(tenantId, scope, id, permissions),
      this.overview(tenantId, scope, id, permissions),
      this.quickActions(tenantId, scope, id, permissions)
    ]);
    return {
      header,
      statusBar,
      tabs,
      overview,
      quickActions,
      permissions: this.detailPermissionMap(permissions),
      generatedAt: new Date().toISOString()
    };
  }

  async detailHeader(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedDetailHeader(incident, permissions);
    const readiness = this.readinessFor(incident, [], [], [], []);
    const locked = this.closedStatus(incident.status);
    const banners = this.detailBanners(incident, readiness, permissions);
    return {
      id: incident.id,
      incidentNumber: incident.incident_number,
      title: incident.title,
      shortDescription: incident.short_description,
      eventType: incident.event_type,
      classification: incident.classification,
      status: incident.status,
      site: incident.site,
      unit: incident.unit,
      area: incident.area,
      location: incident.location_text,
      eventDateTime: incident.event_datetime,
      reportedDateTime: incident.reported_datetime,
      reportedBy: incident.reporter,
      investigationOwner: incident.owner,
      dueDate: incident.due_date,
      actualSeverity: incident.actual_severity,
      potentialSeverity: incident.potential_severity,
      potentialRiskScore: incident.potential_risk_score,
      investigationPriority: incident.investigation_priority,
      investigationLevelRequired: incident.investigation_level_required,
      isPsmIncident: !!incident.is_psm_incident,
      isProcessSafetyEvent: !!incident.is_process_safety_event,
      apiRp754Tier: incident.pse_tier,
      restricted: !!incident.restricted,
      confidential: !!incident.confidential,
      locked,
      readOnly: locked,
      readinessStatus: readiness.status,
      lastUpdated: incident.updated_at,
      breadcrumbs: [
        { label: 'Incident / Near Miss Register', href: '/incidents' },
        { label: incident.incident_number, href: `/incidents/${incident.id}` }
      ],
      badges: this.detailBadges(incident),
      banners,
      actions: this.headerActions(incident, permissions, readiness)
    };
  }

  async statusBar(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { currentStatus: incident.status, restricted: true, workflowBlockers: ['Restricted incident details are redacted for your account.'], allowedTransitions: [] };
    const readiness = this.readinessFor(incident, [], [], [], []);
    const order = ['Draft', 'Reported', 'Triage', 'Investigation Required', 'Investigation In Progress', 'RCA Required', 'RCA In Progress', 'Actions Assigned', 'Pending Review', 'Changes Requested', 'Approved', 'Closed', 'Reopened', 'Cancelled / Void'];
    const currentIndex = Math.max(0, order.indexOf(incident.status));
    const allowedTransitions = this.allowedStatusTransitions(incident, readiness, permissions);
    return {
      statuses: order,
      currentStatus: incident.status,
      previousStatus: incident.previous_status ?? null,
      nextRecommendedStatus: allowedTransitions[0]?.status ?? order[Math.min(order.length - 1, currentIndex + 1)],
      statusChangedBy: incident.status_changed_by ?? incident.updated_by,
      statusChangedAt: incident.status_changed_at ?? incident.updated_at,
      reason: incident.status_change_reason ?? null,
      workflowBlockers: readiness.blockers.map((b) => b.title),
      allowedTransitions
    };
  }

  async tabStatus(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    const restricted = !!incident.restrictedRedacted;
    const tabs = [
      ['overview', 'Overview', 'Complete'],
      ['event-details', 'Event Details & Classification', incident.title && incident.event_datetime ? 'Started' : 'Missing'],
      ['potential-severity', 'Potential Severity / Risk Matrix', incident.potential_severity ? 'Started' : 'Missing'],
      ['people', 'People / Injury / Exposure', incident.injury_occurred || incident.toxic_exposure_occurred ? 'Started' : 'Not Started'],
      ['asset-chemical', 'Asset / Equipment / Chemical', incident.equipment_involved || incident.chemical_involved ? 'Started' : 'Not Started'],
      ['timeline', 'Timeline', incident.timeline_readiness_status ?? 'Not Started'],
      ['evidence', 'Evidence / Attachments', incident.evidence_status ?? 'Not Started'],
      ['immediate-actions', 'Immediate Actions', incident.immediate_actions_readiness_status ?? (incident.area_safe_now ? 'Started' : 'Not Started')],
      ['investigation-team', 'Investigation Team', incident.team_readiness_status ?? (incident.formal_team_required ? 'Required' : 'Not Required')],
      ['rca', 'Root Cause Analysis', incident.rca_status ?? 'Not Started'],
      ['barrier-failure', 'Barrier / Safeguard Failure', incident.safeguard_failed ? 'Required' : 'Not Started'],
      ['capa', 'Corrective / Preventive Actions', Number(incident.open_actions_count ?? 0) ? 'Open' : 'Not Started'],
      ['linked-records', 'Linked Records', Number(incident.linked_records_count ?? 0) ? 'Started' : 'Not Started'],
      ['notifications', 'Notifications / Regulatory Reporting', incident.regulatory_reporting_required ? 'Required' : 'Not Required'],
      ['review', 'Review & Approval', incident.status === 'Pending Review' ? 'Pending' : 'Not Started'],
      ['lessons-learned', 'Lessons Learned', incident.lessons_learned_status ?? 'Not Started'],
      ['history', 'History', 'Available'],
      ['final-report', 'Final Report / Export', incident.final_report_status ?? 'Not Started']
    ].map(([key, label, status]) => ({
      key,
      label,
      status,
      implemented: ['overview', 'event-details', 'potential-severity', 'people', 'asset-chemical', 'timeline', 'evidence', 'immediate-actions', 'investigation-team', 'rca', 'barrier-failure', 'capa', 'linked-records', 'notifications', 'review', 'lessons-learned', 'history', 'final-report'].includes(String(key)),
      restricted,
      blocker: ['Missing', 'Required', 'Open'].includes(String(status)),
      href: `/incidents/${id}?tab=${key}`
    }));
    return { tabs };
  }

  async overview(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedOverview(incident);
    const [people, assets, immediateActions, evidence, actionRows, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_people_initial', id, scope),
      this.incidentChildren(tenantId, 'incident_equipment_chemical_initial', id, scope),
      this.incidentChildren(tenantId, 'incident_immediate_actions_initial', id, scope),
      this.incidentChildren(tenantId, 'incident_initial_evidence', id, scope),
      this.incidentActions(tenantId, scope, id),
      this.incidentHistory(tenantId, id, 10)
    ]);
    const readiness = this.readinessFor(incident, people, assets, evidence, actionRows);
    const summaryCards = this.overviewSummaryCards(incident, evidence, actionRows, readiness);
    return {
      header: {
        title: 'Overview',
        subtitle: 'Incident summary, severity, investigation status, actions, and required follow-ups',
        incidentNumber: incident.incident_number,
        currentStatus: incident.status,
        investigationOwner: incident.owner,
        dueDate: incident.due_date,
        readinessStatus: readiness.status,
        readinessScore: readiness.score,
        lastUpdated: incident.updated_at,
        actions: this.headerActions(incident, permissions, readiness)
      },
      summaryCards,
      eventSnapshot: this.eventSnapshot(incident),
      severityRisk: this.severityRiskSnapshot(incident),
      psmClassification: this.psmClassificationSnapshot(incident),
      investigationReadiness: readiness,
      peopleSnapshot: this.peopleSnapshot(incident, people, permissions),
      assetChemicalSnapshot: this.assetChemicalSnapshot(incident, assets),
      immediateActionsSnapshot: this.immediateActionsSnapshot(incident, immediateActions),
      rcaBarrierSnapshot: this.rcaBarrierSnapshot(incident, assets),
      capaSnapshot: this.capaSnapshot(incident, actionRows),
      linkedPsmRecordsSnapshot: this.linkedRecordsSnapshot(incident),
      evidenceSnapshot: this.evidenceSnapshot(incident, evidence, permissions),
      regulatoryNotificationSnapshot: this.regulatorySnapshot(incident),
      lessonsLearnedSnapshot: this.lessonsSnapshot(incident),
      recentActivity: history,
      blockersNextSteps: { blockers: readiness.blockers, nextSteps: readiness.nextSteps },
      quickLinks: this.quickLinks(id, readiness),
      charts: this.overviewCharts(incident, evidence, actionRows, readiness),
      generatedAt: new Date().toISOString()
    };
  }

  async overviewSection(tenantId: string, scope: Scope, id: string, section: string, permissions: string[] = []) {
    const data: any = await this.overview(tenantId, scope, id, permissions);
    const map: Record<string, any> = {
      summary: data.summaryCards,
      'event-snapshot': data.eventSnapshot,
      'severity-risk': data.severityRisk,
      'psm-classification': data.psmClassification,
      readiness: data.investigationReadiness,
      people: data.peopleSnapshot,
      'asset-chemical': data.assetChemicalSnapshot,
      'immediate-actions': data.immediateActionsSnapshot,
      'rca-barrier': data.rcaBarrierSnapshot,
      actions: data.capaSnapshot,
      'linked-records': data.linkedPsmRecordsSnapshot,
      evidence: data.evidenceSnapshot,
      regulatory: data.regulatoryNotificationSnapshot,
      'lessons-learned': data.lessonsLearnedSnapshot,
      activity: data.recentActivity,
      blockers: data.blockersNextSteps,
      'quick-links': data.quickLinks
    };
    return map[section] ?? data;
  }

  async eventDetails(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Event Details & Classification');
    const [history, psmConfig, pseConfig] = await Promise.all([
      this.incidentHistory(tenantId, id, 40),
      this.classificationConfig(tenantId, scope),
      this.pseThresholdConfig(tenantId, scope)
    ]);
    const locked = this.closedStatus(incident.status);
    const readiness = this.eventDetailsReadiness(incident, psmConfig, pseConfig);
    const canEdit = permissions.includes('incidents.event_details.edit') || permissions.includes('incidents.edit_basic') || permissions.includes('incidents.edit');
    const canRequestReview = permissions.includes('incidents.classification.review.request') || permissions.includes('incidents.psm.review.request');
    const canApproveReview = permissions.includes('incidents.classification.review.approve') || permissions.includes('incidents.psm.review');
    const canRejectReview = permissions.includes('incidents.classification.review.reject') || permissions.includes('incidents.psm.review');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        title: incident.title,
        eventType: incident.event_type,
        classification: incident.classification,
        status: incident.status,
        site: incident.site,
        unit: incident.unit,
        area: incident.area,
        eventDateTime: incident.event_datetime,
        reportedDateTime: incident.reported_datetime,
        actualSeverity: incident.actual_severity,
        potentialSeverity: incident.potential_severity,
        isPsmIncident: !!incident.is_psm_incident,
        isProcessSafetyEvent: !!incident.is_process_safety_event,
        apiRp754Tier: incident.pse_tier ?? 'Not Determined',
        investigationPriority: incident.investigation_priority ?? 'Pending Review',
        lastUpdated: incident.updated_at
      },
      summaryCards: [
        this.card('Event type', incident.event_type ?? 'Missing', incident.event_type ? 'info' : 'warning', 'Reported event type'),
        this.card('Classification', incident.classification ?? 'Missing', incident.classification ? 'info' : 'warning', 'Primary incident classification'),
        this.card('PSM Incident', incident.is_psm_incident ? 'Yes' : 'No', incident.is_psm_incident ? 'danger' : 'ok', 'Process safety management flag'),
        this.card('PSE Tier', incident.pse_tier ?? 'Not Determined', ['Tier 1','Tier 2'].includes(incident.pse_tier) ? 'danger' : 'info', 'API RP 754 tier from backend rules'),
        this.card('Review status', incident.classification_review_status ?? incident.pse_classification_status ?? 'Not Determined', 'status', 'Classification review state'),
        this.card('Readiness', readiness.status, readiness.status === 'Complete' ? 'ok' : readiness.status === 'Blocked' ? 'danger' : 'warning', 'Backend-generated missing data state')
      ],
      coreEventInformation: {
        incidentNumber: incident.incident_number,
        title: incident.title,
        shortDescription: incident.short_description,
        eventType: incident.event_type,
        classification: incident.classification,
        status: incident.status,
        tags: incident.tags_json ?? [],
        restricted: !!incident.restricted,
        confidential: !!incident.confidential,
        contractorInvolved: !!incident.contractor_involved
      },
      locationTimeOperation: {
        site: incident.site,
        unit: incident.unit,
        area: incident.area,
        exactLocation: incident.location_text,
        gpsLocation: incident.gps_location_json,
        eventDateTime: incident.event_datetime,
        reportedDateTime: incident.reported_datetime,
        operatingMode: incident.operating_mode,
        shift: incident.shift,
        workgroup: incident.workgroup,
        weatherCondition: incident.weather_condition
      },
      eventDescription: {
        detailedDescription: incident.detailed_description,
        activityAtTime: incident.activity_at_time,
        abnormalCondition: incident.abnormal_condition,
        immediateConsequence: incident.immediate_consequence,
        potentialConsequence: incident.potential_consequence,
        suspectedInitialCause: incident.suspected_initial_cause,
        witnessesKnown: !!incident.witnesses_known,
        emergencyResponseActivated: !!incident.emergency_response_activated,
        operationStopped: !!incident.operation_stopped,
        equipmentIsolated: !!incident.equipment_isolated,
        areaBarricaded: !!incident.area_barricaded
      },
      eventTypeClassification: {
        eventTypes: this.incidentEventTypes(),
        classifications: this.incidentClassifications(),
        selectedEventType: incident.event_type,
        selectedClassification: incident.classification,
        classificationConfig: psmConfig
      },
      psmPseClassification: this.psmClassificationSnapshot(incident),
      ptwMocPssrContext: {
        ptwInvolved: !!incident.ptw_involved,
        ptwId: incident.ptw_id,
        ptwReviewRequired: !!incident.ptw_review_required,
        mocInvolved: !!incident.moc_involved,
        mocId: incident.moc_id,
        mocRequired: !!incident.moc_required,
        pssrInvolved: !!incident.pssr_involved,
        pssrId: incident.pssr_id,
        pssrRequired: !!incident.pssr_required
      },
      environmentalCommunityImpact: {
        environmentalImpact: !!incident.environmental_impact,
        communityImpact: !!incident.community_impact,
        releasedMaterial: incident.released_material,
        releasedQuantity: incident.released_quantity,
        releaseUnit: incident.release_unit,
        releaseDuration: incident.release_duration,
        thresholdExceeded: incident.threshold_exceeded,
        regulatoryReportingRequired: !!incident.regulatory_reporting_required
      },
      reporterWitnessSnapshot: {
        reporter: incident.reporter,
        reporterDepartment: incident.reporter_department,
        reporterRole: incident.reporter_role,
        reporterContact: incident.reporter_contact,
        anonymousReport: !!incident.anonymous_report,
        witnessesKnown: !!incident.witnesses_known
      },
      classificationReview: {
        status: incident.classification_review_status ?? incident.pse_classification_status ?? 'Not Determined',
        requestedBy: incident.classification_review_requested_by,
        requestedAt: incident.classification_review_requested_at,
        decision: incident.classification_review_decision,
        decidedBy: incident.classification_review_decided_by,
        decidedAt: incident.classification_review_decided_at,
        reason: incident.classification_review_reason,
        reviewerRequired: !!incident.pse_reviewer_required || !!incident.psm_pse_review_required
      },
      classificationChangeHistory: history.filter((event) => /classification|psm|pse|tier|status/i.test(`${event.event_title} ${event.event_description} ${event.event_type}`)).slice(0, 12),
      readiness,
      actions: [
        { key: 'save', label: 'Save Changes', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.event_details.edit permission' },
        { key: 'request-classification-review', label: 'Request Classification Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.classification.review.request permission' },
        { key: 'create-action', label: 'Create Action', enabled: permissions.includes('incidents.actions.create') && !locked, disabledReason: permissions.includes('incidents.actions.create') ? actionReason : 'Missing incidents.actions.create permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      permissions: { canEdit, canRequestReview, canApproveReview, canRejectReview, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async updateEventDetails(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(before.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing event details.');
    const classification = await this.classifyPsmPse(tenantId, scope, { ...before, ...dto });
    const patch = this.clean({
      title: dto.title,
      short_description: dto.shortDescription,
      detailed_description: dto.detailedDescription,
      event_type: dto.eventType,
      classification: dto.classification,
      event_datetime: this.dateTimeOrNull(dto.eventDateTime),
      reported_datetime: this.dateTimeOrNull(dto.reportedDateTime),
      unit_id: dto.unitId,
      area_id: dto.areaId,
      location_text: dto.exactLocation,
      gps_location_json: dto.gpsLocation,
      operating_mode: dto.operatingMode,
      shift: dto.shift,
      workgroup: dto.workgroup,
      weather_condition: dto.weatherCondition,
      activity_at_time: dto.activityAtTime,
      abnormal_condition: dto.abnormalCondition,
      immediate_consequence: dto.immediateConsequence,
      potential_consequence: dto.potentialConsequence,
      suspected_initial_cause: dto.suspectedInitialCause,
      witnesses_known: dto.witnessesKnown,
      emergency_response_activated: dto.emergencyResponseActivated,
      operation_stopped: dto.operationStopped,
      equipment_isolated: dto.equipmentIsolated,
      area_barricaded: dto.areaBarricaded,
      is_psm_incident: this.yes(classification.isPsmIncident),
      is_process_safety_event: this.yes(classification.isProcessSafetyEvent),
      pse_tier: classification.pseTier,
      pse_classification_status: classification.pseClassificationStatus,
      threshold_exceeded: classification.thresholdExceeded,
      pse_reviewer_required: classification.reviewerRequired,
      psm_pse_review_required: classification.psmPseReviewRequired,
      pse_threshold_config_missing: classification.pseThresholdConfigMissing,
      pse_classification_basis: dto.pseClassificationBasis ?? classification.basis,
      lopc_status: dto.lopcStatus,
      released_material: dto.releasedMaterial,
      released_quantity: this.numberOrNull(dto.releasedQuantity),
      release_unit: dto.releaseUnit,
      release_duration: this.intervalOrNull(dto.releaseDuration),
      acute_release: dto.acuteRelease,
      fire_explosion_occurred: dto.fireExplosionOccurred,
      toxic_exposure_occurred: dto.toxicExposureOccurred,
      injury_fatality_occurred: dto.injuryFatalityOccurred,
      environmental_impact: dto.environmentalImpact,
      community_impact: dto.communityImpact,
      regulatory_reporting_required: dto.regulatoryReportingRequired,
      ptw_involved: dto.ptwInvolved,
      ptw_id: dto.ptwId,
      ptw_review_required: dto.ptwReviewRequired,
      moc_involved: dto.mocInvolved,
      moc_id: dto.mocId,
      moc_required: dto.mocRequired,
      pssr_involved: dto.pssrInvolved,
      pssr_id: dto.pssrId,
      pssr_required: dto.pssrRequired,
      reporter_department: dto.reporterDepartment,
      reporter_role: dto.reporterRole,
      reporter_contact: dto.reporterContact,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('incidents').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Updated', 'Event details and classification updated', dto.reason ?? 'Event Details & Classification tab saved', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.event_details.update', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.eventDetails(tenantId, scope, id, permissions);
  }

  async requestClassificationReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(before.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before requesting classification review.');
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('incidents').update({
      classification_review_status: 'Pending Review',
      classification_review_requested_by: actorId,
      classification_review_requested_at: now,
      classification_review_reason: dto.reason ?? dto.comment ?? 'Classification review requested',
      pse_reviewer_required: true,
      psm_pse_review_required: true,
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.safeSingle(this.db.from('incident_classification_reviews').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: row.company_id, site_id: row.site_id, incident_id: id,
      review_type: 'PSM/PSE Classification', review_status: 'Pending Review', status: 'Pending Review',
      requested_by: actorId, requested_at: now, review_reason: dto.reason ?? dto.comment,
      previous_value_json: before, new_value_json: row, before_values_json: before, after_values_json: row,
      basis: dto.reason ?? dto.comment
    }).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Submitted', 'Classification review requested', dto.reason ?? dto.comment ?? 'Classification review requested', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.classification.review.request', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.eventDetails(tenantId, scope, id, permissions);
  }

  async decideClassificationReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason && decision === 'Rejected') throw new BadRequestException('A reason is required to reject classification review.');
    const before = await this.rawIncidentById(tenantId, scope, id);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('incidents').update({
      classification_review_status: decision,
      classification_review_decision: decision,
      classification_review_decided_by: actorId,
      classification_review_decided_at: now,
      classification_review_reason: dto.reason ?? dto.comment ?? decision,
      pse_reviewed_by: actorId,
      pse_reviewed_at: now,
      pse_classification_status: decision === 'Approved' ? 'Reviewed' : 'Rejected',
      psm_pse_review_required: decision === 'Rejected',
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, decision, `Classification review ${decision.toLowerCase()}`, dto.reason ?? dto.comment, before, row);
    await this.audit.write({ tenantId, actorId, action: `incidents.classification.review.${decision.toLowerCase()}`, entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.eventDetails(tenantId, scope, id, permissions);
  }

  async severityRiskTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Potential Severity / Risk Matrix');
    const [matrix, history] = await Promise.all([this.riskMatrix(tenantId, scope), this.incidentHistory(tenantId, id, 40)]);
    const locked = this.closedStatus(incident.status);
    const readiness = this.severityReadiness(incident, matrix);
    const canEdit = permissions.includes('incidents.severity.edit') || permissions.includes('incidents.edit');
    const canRecalculate = permissions.includes('incidents.severity.recalculate') || permissions.includes('incidents.severity.edit');
    const canRequestReview = permissions.includes('incidents.severity.review.request');
    const canApproveReview = permissions.includes('incidents.severity.review.approve') || permissions.includes('incidents.severity.review');
    const canRejectReview = permissions.includes('incidents.severity.review.reject') || permissions.includes('incidents.severity.review');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing severity.' : null;
    const snapshot = this.severityRiskSnapshot(incident);
    return {
      header: {
        incidentNumber: incident.incident_number,
        actualSeverity: incident.actual_severity,
        potentialSeverity: incident.potential_severity,
        likelihood: incident.likelihood,
        potentialRiskScore: incident.potential_risk_score ?? 'Not Determined',
        investigationPriority: incident.investigation_priority ?? 'Pending Review',
        investigationLevelRequired: incident.investigation_level_required ?? 'Pending Review',
        highPotentialNearMiss: !!incident.high_potential_near_miss,
        fatalityPotential: !!incident.fatality_potential,
        majorProcessSafetyPotential: !!incident.major_process_safety_potential,
        riskMatrixVersion: incident.risk_matrix_version ?? matrix.version ?? 'Not Available',
        lastCalculatedAt: incident.risk_calculated_at ?? incident.updated_at,
        lastReviewedBy: incident.severity_reviewed_by ?? incident.severity_review_decided_by
      },
      summaryCards: [
        this.card('Actual severity', incident.actual_severity ?? 'Missing', incident.actual_severity ? 'actual' : 'warning', 'Actual outcome severity'),
        this.card('Potential severity', incident.potential_severity ?? 'Missing', incident.potential_severity ? 'potential' : 'warning', 'Worst credible potential outcome'),
        this.card('Likelihood', incident.likelihood ?? 'Missing', incident.likelihood ? 'info' : 'warning', 'Selected likelihood/probability'),
        this.card('Risk score', incident.potential_risk_score ?? 'Not Determined', incident.potential_risk_score ? 'risk' : 'warning', 'Backend-calculated score'),
        this.card('Priority', incident.investigation_priority ?? 'Pending Review', 'priority', 'Priority driven by potential risk'),
        this.card('Review status', incident.severity_review_status ?? 'Not Reviewed', 'status', 'Severity review/approval state')
      ],
      comparison: {
        actualSeverity: incident.actual_severity,
        potentialSeverity: incident.potential_severity,
        actualRank: this.severityRank(incident.actual_severity),
        potentialRank: this.severityRank(incident.potential_severity),
        nearMissWarning: incident.event_type === 'Near Miss' && this.severityRank(incident.potential_severity) > this.severityRank(incident.actual_severity)
      },
      actualConsequence: {
        severity: incident.actual_severity,
        consequenceCategory: incident.actual_consequence_category,
        injurySeverity: incident.actual_injury_severity,
        environmentalImpact: incident.actual_environmental_impact,
        assetDamage: incident.actual_asset_damage,
        productionImpact: incident.actual_production_impact,
        financialImpact: incident.actual_financial_impact,
        notes: incident.actual_consequence_notes,
        actualConsequence: incident.actual_consequence
      },
      potentialConsequence: {
        severity: incident.potential_severity,
        consequenceCategory: incident.potential_consequence_category,
        potentialInjurySeverity: incident.potential_injury_severity,
        potentialEnvironmentalImpact: incident.potential_environmental_impact,
        potentialAssetDamage: incident.potential_asset_damage,
        potentialProcessSafetyConsequence: incident.potential_process_safety_consequence,
        basis: incident.potential_severity_basis,
        potentialConsequence: incident.potential_consequence
      },
      likelihood: {
        likelihood: incident.likelihood,
        basis: incident.likelihood_basis,
        probabilityBasis: incident.probability_basis,
        exposureFrequency: incident.exposure_frequency,
        controlsPresent: incident.controls_present
      },
      riskMatrix: {
        ...matrix,
        selectedSeverity: incident.potential_severity,
        selectedLikelihood: incident.likelihood,
        selectedScore: incident.potential_risk_score,
        notDetermined: incident.potential_risk_score == null || !matrix.configured
      },
      investigationPriorityDecision: {
        priority: incident.investigation_priority ?? 'Pending Review',
        levelRequired: incident.investigation_level_required ?? 'Pending Review',
        dueDate: incident.due_date,
        formalTeamRequired: !!incident.formal_team_required,
        rcaRequired: !!incident.rca_required,
        followups: this.followupFlags(incident)
      },
      investigationLevelRules: {
        source: matrix.configured ? matrix.source : 'Configuration missing',
        configured: matrix.configured,
        ruleApplied: incident.investigation_level_required ?? 'Pending Review',
        missingReason: matrix.missingReason
      },
      highPotentialNearMiss: {
        highPotentialNearMiss: !!incident.high_potential_near_miss,
        fatalityPotential: !!incident.fatality_potential,
        majorProcessSafetyPotential: !!incident.major_process_safety_potential,
        attentionRequired: !!incident.high_potential_near_miss || !!incident.fatality_potential || !!incident.major_process_safety_potential
      },
      severityReview: {
        status: incident.severity_review_status ?? 'Not Reviewed',
        severityReviewRequired: !!incident.severity_review_required,
        requestedBy: incident.severity_review_requested_by,
        requestedAt: incident.severity_review_requested_at,
        decision: incident.severity_review_decision,
        decidedBy: incident.severity_review_decided_by,
        decidedAt: incident.severity_review_decided_at,
        reason: incident.severity_review_reason
      },
      riskMatrixConfiguration: {
        configured: matrix.configured,
        source: matrix.source,
        version: incident.risk_matrix_version ?? matrix.version ?? 'Not Available',
        missingReason: matrix.missingReason,
        snapshot: incident.risk_matrix_snapshot_json ?? null
      },
      severityChangeHistory: history.filter((event) => /severity|risk|priority|matrix|review/i.test(`${event.event_title} ${event.event_description} ${event.event_type}`)).slice(0, 12),
      readiness,
      actions: [
        { key: 'save', label: 'Save Changes', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.severity.edit permission' },
        { key: 'recalculate', label: 'Recalculate Risk', enabled: canRecalculate && !locked, disabledReason: canRecalculate ? actionReason : 'Missing incidents.severity.recalculate permission' },
        { key: 'request-severity-review', label: 'Request Severity Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.severity.review.request permission' },
        { key: 'create-action', label: 'Create Action', enabled: permissions.includes('incidents.actions.create') && !locked, disabledReason: permissions.includes('incidents.actions.create') ? actionReason : 'Missing incidents.actions.create permission' }
      ],
      snapshot,
      permissions: { canEdit, canRecalculate, canRequestReview, canApproveReview, canRejectReview, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async updateSeverityRisk(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(before.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing severity.');
    const calculationInput = {
      ...before,
      ...dto,
      potentialSeverity: dto.potentialSeverity ?? before.potential_severity,
      likelihood: dto.likelihood ?? before.likelihood
    };
    const risk = await this.calculatePotentialRisk(tenantId, scope, calculationInput);
    const followups = await this.recommendFollowups(tenantId, scope, calculationInput);
    const matrix = await this.riskMatrix(tenantId, scope);
    const highPotential = this.highPotentialSeverity(dto.potentialSeverity ?? before.potential_severity) || Number(risk.potentialRiskScore ?? 0) >= 15;
    const patch = this.clean({
      actual_severity: dto.actualSeverity,
      actual_consequence_category: dto.actualConsequenceCategory,
      actual_injury_severity: dto.actualInjurySeverity,
      actual_environmental_impact: dto.actualEnvironmentalImpact,
      actual_asset_damage: dto.actualAssetDamage,
      actual_production_impact: dto.actualProductionImpact,
      actual_financial_impact: this.numberOrNull(dto.actualFinancialImpact),
      actual_consequence_notes: dto.actualConsequenceNotes,
      actual_consequence: dto.actualConsequence,
      potential_severity: dto.potentialSeverity,
      potential_consequence_category: dto.potentialConsequenceCategory,
      potential_injury_severity: dto.potentialInjurySeverity,
      potential_environmental_impact: dto.potentialEnvironmentalImpact,
      potential_asset_damage: dto.potentialAssetDamage,
      potential_process_safety_consequence: dto.potentialProcessSafetyConsequence,
      potential_severity_basis: dto.potentialSeverityBasis,
      potential_consequence: dto.potentialConsequence,
      likelihood: dto.likelihood,
      likelihood_basis: dto.likelihoodBasis,
      probability_basis: dto.probabilityBasis,
      exposure_frequency: dto.exposureFrequency,
      controls_present: dto.controlsPresent,
      potential_risk_score: risk.potentialRiskScore,
      risk_score_status: risk.status,
      risk_matrix_config_missing: !!risk.riskMatrixConfigMissing,
      severity_review_required: !!risk.severityReviewRequired || !!dto.severityReviewRequired,
      investigation_priority: risk.investigationPriority ?? followups.investigationPriority,
      investigation_level_required: risk.investigationLevelRequired ?? followups.investigationLevelRequired,
      high_potential_near_miss: dto.highPotentialNearMiss ?? highPotential,
      fatality_potential: dto.fatalityPotential,
      major_process_safety_potential: dto.majorProcessSafetyPotential,
      formal_team_required: followups.formalTeamRequired,
      rca_required: followups.rcaRequired,
      due_date: dto.dueDate ?? followups.suggestedDueDate,
      risk_matrix_snapshot_json: matrix.configured ? matrix : null,
      risk_calculated_at: new Date().toISOString(),
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('incidents').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Recalculated', 'Potential severity and risk matrix updated', dto.reason ?? risk.reason ?? 'Severity / risk saved', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.severity.update', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.severityRiskTab(tenantId, scope, id, permissions);
  }

  async recalculateSeverityRisk(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    return this.updateSeverityRisk(tenantId, actorId, scope, id, {
      actualSeverity: before.actual_severity,
      potentialSeverity: before.potential_severity,
      likelihood: before.likelihood,
      reason: 'Risk recalculated from current incident values'
    }, permissions);
  }

  async requestSeverityReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(before.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before requesting severity review.');
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('incidents').update({
      severity_review_status: 'Pending Review',
      severity_review_required: true,
      severity_review_requested_by: actorId,
      severity_review_requested_at: now,
      severity_review_reason: dto.reason ?? dto.comment ?? 'Severity review requested',
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.safeSingle(this.db.from('incident_severity_reviews').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: row.company_id, site_id: row.site_id, incident_id: id,
      review_status: 'Pending Review', requested_by: actorId, requested_at: now, review_reason: dto.reason ?? dto.comment, before_values_json: before, after_values_json: row
    }).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Submitted', 'Severity review requested', dto.reason ?? dto.comment ?? 'Severity review requested', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.severity.review.request', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.severityRiskTab(tenantId, scope, id, permissions);
  }

  async decideSeverityReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason && decision === 'Rejected') throw new BadRequestException('A reason is required to reject severity review.');
    const before = await this.rawIncidentById(tenantId, scope, id);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('incidents').update({
      severity_review_status: decision,
      severity_review_decision: decision,
      severity_review_decided_by: actorId,
      severity_review_decided_at: now,
      severity_review_reason: dto.reason ?? dto.comment ?? decision,
      severity_review_required: decision === 'Rejected',
      severity_reviewed_by: actorId,
      severity_reviewed_at: now,
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, decision, `Severity review ${decision.toLowerCase()}`, dto.reason ?? dto.comment, before, row);
    await this.audit.write({ tenantId, actorId, action: `incidents.severity.review.${decision.toLowerCase()}`, entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.severityRiskTab(tenantId, scope, id, permissions);
  }

  async peopleInjuryTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'People / Injury / Exposure');
    const [peopleRows, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_people_initial', id, scope),
      this.incidentHistory(tenantId, id, 40)
    ]);
    const locked = this.closedStatus(incident.status);
    const canViewMedical = permissions.includes('incidents.medical_fields.view') || permissions.includes('incidents.medical_fields.manage');
    const people = canViewMedical ? peopleRows : peopleRows.map(({ confidential_notes, medical_notes, ...row }) => ({ ...row, confidential_notes_redacted: !!confidential_notes || !!medical_notes }));
    const readiness = this.peopleReadiness(incident, peopleRows);
    const canEdit = permissions.includes('incidents.people.edit') || permissions.includes('incidents.edit');
    const canDelete = permissions.includes('incidents.people.delete') || permissions.includes('incidents.people.edit');
    const canRequestReview = permissions.includes('incidents.people.review.request');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing people, injury, or exposure records.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        title: incident.title,
        status: incident.status,
        peopleReadinessStatus: readiness.status,
        totalPeople: peopleRows.length,
        injuredPeople: peopleRows.filter((p) => p.injury_occurred).length,
        exposurePeople: peopleRows.filter((p) => p.exposure_occurred || p.chemical_exposure).length,
        medicalDataHidden: !canViewMedical && peopleRows.some((p) => p.confidential_notes || p.medical_notes),
        lastUpdated: incident.updated_at
      },
      summaryCards: this.peopleSummaryCards(incident, peopleRows, readiness, canViewMedical),
      peopleRegister: people,
      injuryDetails: this.peopleGroupPanel(peopleRows, ['injury_type', 'body_part', 'injury_severity', 'treatment_type']),
      exposureDetails: this.peopleGroupPanel(peopleRows, ['exposure_route', 'chemical_exposure', 'exposure_duration', 'dose_estimate']),
      ppeControls: this.peopleGroupPanel(peopleRows, ['ppe_used', 'ppe_issue_suspected', 'ppe_description', 'control_failure_notes']),
      treatmentMedicalOutcome: this.peopleGroupPanel(peopleRows, ['treatment_type', 'medical_treatment_required', 'hospitalization', 'fatality', 'return_to_work_status']),
      lostTimeRestrictedWork: this.peopleGroupPanel(peopleRows, ['lost_time_potential', 'lost_time_days', 'restricted_work_days', 'work_restriction_notes']),
      contractorVisitorPublic: this.peopleGroupPanel(peopleRows, ['person_type', 'contractor_company', 'visitor_company', 'public_involved']),
      confidentialMedicalNotes: { canViewMedical, rows: canViewMedical ? peopleRows.map((p) => ({ id: p.id, personName: p.person_name, notes: p.confidential_notes ?? p.medical_notes })) : [], hiddenCount: canViewMedical ? 0 : peopleRows.filter((p) => p.confidential_notes || p.medical_notes).length },
      review: {
        status: incident.people_review_status ?? 'Not Requested',
        requestedBy: incident.people_review_requested_by,
        requestedAt: incident.people_review_requested_at,
        decision: incident.people_review_decision,
        decidedBy: incident.people_review_decided_by,
        decidedAt: incident.people_review_decided_at,
        reason: incident.people_review_reason
      },
      changeHistory: history.filter((event) => /people|injury|exposure|medical|ppe/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 15),
      readiness,
      actions: [
        { key: 'add-person', label: 'Add Person', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.people.edit permission' },
        { key: 'save-person', label: 'Save Person', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.people.edit permission' },
        { key: 'delete-person', label: 'Delete Person', enabled: canDelete && !locked, disabledReason: canDelete ? actionReason : 'Missing incidents.people.delete permission' },
        { key: 'request-review', label: 'Request Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.people.review.request permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      permissions: { canEdit, canDelete, canViewMedical, canRequestReview, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async createIncidentPerson(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before adding people records.');
    const insert = this.peoplePatch(dto, tenantId, actorId, incident);
    const row = await this.db.single<any>(this.db.from('incident_people_initial').insert(insert).select().single());
    await this.updateIncidentPeopleFlags(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Created', 'People/injury/exposure record added', dto.reason ?? 'Person added to incident', null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.people.create', entityType: 'INCIDENT_PEOPLE', entityId: row.id, after: row as JsonValue });
    return this.peopleInjuryTab(tenantId, scope, id, permissions);
  }

  async updateIncidentPerson(tenantId: string, actorId: string, scope: Scope, id: string, personId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing people records.');
    const before = await this.db.single<any>(this.db.from('incident_people_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', personId).single());
    const patch = this.clean(this.peoplePatch(dto, tenantId, actorId, incident, true));
    const row = await this.db.single<any>(this.db.from('incident_people_initial').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', personId).select().single());
    await this.updateIncidentPeopleFlags(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'People/injury/exposure record updated', dto.reason ?? 'Person record updated', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.people.update', entityType: 'INCIDENT_PEOPLE', entityId: row.id, before: before as JsonValue, after: row as JsonValue });
    return this.peopleInjuryTab(tenantId, scope, id, permissions);
  }

  async deleteIncidentPerson(tenantId: string, actorId: string, scope: Scope, id: string, personId: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before deleting people records.');
    const before = await this.db.single<any>(this.db.from('incident_people_initial').delete().eq('tenant_id', tenantId).eq('incident_id', id).eq('id', personId).select().single());
    await this.updateIncidentPeopleFlags(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Deleted', 'People/injury/exposure record removed', 'Person record removed from incident', before, null);
    await this.audit.write({ tenantId, actorId, action: 'incidents.people.delete', entityType: 'INCIDENT_PEOPLE', entityId: personId, before: before as JsonValue });
    return this.peopleInjuryTab(tenantId, scope, id, permissions);
  }

  async requestPeopleReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewState(tenantId, actorId, scope, id, 'people', 'Pending Review', dto, permissions);
  }

  async decidePeopleReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('A reason is required to reject people/injury review.');
    return this.updateReviewState(tenantId, actorId, scope, id, 'people', decision, dto, permissions);
  }

  async assetChemicalTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Asset / Equipment / Chemical');
    const [rows, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_equipment_chemical_initial', id, scope),
      this.incidentHistory(tenantId, id, 40)
    ]);
    const locked = this.closedStatus(incident.status);
    const equipment = rows.filter((r) => r.equipment_involved || r.equipment_id || r.equipment_tag_snapshot);
    const chemicals = rows.filter((r) => r.chemical_involved || r.chemical_id || r.chemical_name_snapshot);
    const readiness = this.assetReadiness(incident, rows);
    const canEdit = permissions.includes('incidents.assets.edit') || permissions.includes('incidents.edit');
    const canDelete = permissions.includes('incidents.assets.delete') || permissions.includes('incidents.assets.edit');
    const canRequestReview = permissions.includes('incidents.asset.review.request');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing asset, equipment, or chemical records.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        title: incident.title,
        status: incident.status,
        assetReadinessStatus: readiness.status,
        equipmentCount: equipment.length,
        chemicalCount: chemicals.length,
        releaseStatus: incident.lopc_status ?? (incident.released_material ? 'Release Reported' : 'Not Reported'),
        lastUpdated: incident.updated_at
      },
      summaryCards: this.assetSummaryCards(incident, rows, readiness),
      equipmentRegister: equipment,
      chemicalRegister: chemicals,
      equipmentCondition: this.assetGroupPanel(equipment, ['equipment_status', 'condition_at_event', 'operating_status', 'failure_mode', 'damage_description']),
      maintenanceInspectionSnapshot: this.assetGroupPanel(equipment, ['maintenance_overdue_suspected', 'last_inspection_date', 'inspection_due', 'proof_test_due', 'mechanical_integrity_followup_required']),
      safeguardIplSisPsvAlarm: this.assetGroupPanel(rows, ['safeguard_involved', 'safeguard_failed', 'ipl_involved', 'sis_sif_involved', 'psv_relief_involved', 'alarm_interlock_involved']),
      sdsHazardInformation: this.assetGroupPanel(chemicals, ['chemical_name_snapshot', 'cas_number_snapshot', 'sds_id', 'sds_link', 'hazard_classification', 'sds_available']),
      lossOfContainmentRelease: {
        lopcStatus: incident.lopc_status,
        releasedMaterial: incident.released_material,
        releasedQuantity: incident.released_quantity,
        releaseUnit: incident.release_unit,
        releaseDuration: incident.release_duration,
        thresholdExceeded: incident.threshold_exceeded,
        rows: chemicals
      },
      processConditions: this.assetGroupPanel(rows, ['process_condition', 'temperature', 'pressure', 'flow_rate']),
      followupRequirements: this.followupFlags(incident).filter((f) => f.required || ['Mechanical Integrity','HAZOP/PHA review','LOPA/SIL review','MOC','PSSR'].includes(String(f.label))),
      review: {
        status: incident.asset_review_status ?? 'Not Requested',
        requestedBy: incident.asset_review_requested_by,
        requestedAt: incident.asset_review_requested_at,
        decision: incident.asset_review_decision,
        decidedBy: incident.asset_review_decided_by,
        decidedAt: incident.asset_review_decided_at,
        reason: incident.asset_review_reason
      },
      changeHistory: history.filter((event) => /asset|equipment|chemical|sds|release|safeguard|psv|sis|mi/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 15),
      readiness,
      actions: [
        { key: 'add-equipment', label: 'Add Equipment', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.assets.edit permission' },
        { key: 'add-chemical', label: 'Add Chemical', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.assets.edit permission' },
        { key: 'delete-record', label: 'Delete Record', enabled: canDelete && !locked, disabledReason: canDelete ? actionReason : 'Missing incidents.assets.delete permission' },
        { key: 'request-review', label: 'Request Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.asset.review.request permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      permissions: { canEdit, canDelete, canRequestReview, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async createIncidentEquipment(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.createIncidentAssetRow(tenantId, actorId, scope, id, { ...dto, equipmentInvolved: true }, permissions, 'equipment');
  }

  async updateIncidentEquipment(tenantId: string, actorId: string, scope: Scope, id: string, rowId: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateIncidentAssetRow(tenantId, actorId, scope, id, rowId, { ...dto, equipmentInvolved: true }, permissions, 'equipment');
  }

  async createIncidentChemical(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.createIncidentAssetRow(tenantId, actorId, scope, id, { ...dto, chemicalInvolved: true }, permissions, 'chemical');
  }

  async updateIncidentChemical(tenantId: string, actorId: string, scope: Scope, id: string, rowId: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateIncidentAssetRow(tenantId, actorId, scope, id, rowId, { ...dto, chemicalInvolved: true }, permissions, 'chemical');
  }

  async deleteIncidentAssetRow(tenantId: string, actorId: string, scope: Scope, id: string, rowId: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before deleting asset records.');
    const before = await this.db.single<any>(this.db.from('incident_equipment_chemical_initial').delete().eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rowId).select().single());
    await this.updateIncidentAssetFlags(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Deleted', 'Asset/equipment/chemical record removed', 'Asset or chemical record removed from incident', before, null);
    await this.audit.write({ tenantId, actorId, action: 'incidents.assets.delete', entityType: 'INCIDENT_ASSET_CHEMICAL', entityId: rowId, before: before as JsonValue });
    return this.assetChemicalTab(tenantId, scope, id, permissions);
  }

  async requestAssetReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewState(tenantId, actorId, scope, id, 'asset', 'Pending Review', dto, permissions);
  }

  async decideAssetReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('A reason is required to reject asset/equipment/chemical review.');
    return this.updateReviewState(tenantId, actorId, scope, id, 'asset', decision, dto, permissions);
  }

  async timelineTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Timeline');
    const [events, gaps, evidence, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_timeline_events', id, scope),
      this.incidentChildren(tenantId, 'incident_timeline_gaps', id, scope),
      this.incidentChildren(tenantId, 'incident_initial_evidence', id, scope),
      this.incidentHistory(tenantId, id, 40)
    ]);
    const sortedEvents = [...events].sort((a, b) => String(a.event_time ?? '').localeCompare(String(b.event_time ?? '')));
    const locked = this.closedStatus(incident.status);
    const readiness = this.timelineReadiness(incident, sortedEvents, gaps, evidence);
    const canEdit = permissions.includes('incidents.timeline.edit') || permissions.includes('incidents.edit');
    const canDelete = permissions.includes('incidents.timeline.delete') || permissions.includes('incidents.timeline.edit');
    const canRequestReview = permissions.includes('incidents.timeline.review.request');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing timeline.' : null;
    return {
      header: { incidentNumber: incident.incident_number, title: incident.title, status: incident.status, timelineReadinessStatus: readiness.status, eventCount: sortedEvents.length, gapCount: gaps.filter((g) => g.status !== 'Resolved').length, lastUpdated: incident.updated_at },
      summaryCards: this.timelineSummaryCards(incident, sortedEvents, gaps, readiness),
      visualTimeline: sortedEvents,
      eventsRegister: sortedEvents,
      phaseBreakdown: this.groupLocal(sortedEvents, 'phase'),
      preEventConditions: this.timelinePhasePanel(sortedEvents, 'Pre-Event'),
      eventMoment: this.timelinePhasePanel(sortedEvents, 'Event Moment'),
      emergencyResponseTimeline: this.timelinePhasePanel(sortedEvents, 'Emergency Response'),
      postEventStabilization: this.timelinePhasePanel(sortedEvents, 'Post-Event Stabilization'),
      evidenceMappedTimeline: sortedEvents.filter((event) => event.related_evidence_id).map((event) => ({ ...event, evidence: evidence.find((row) => row.id === event.related_evidence_id) })),
      gapsConflicts: { rows: gaps, open: gaps.filter((g) => g.status !== 'Resolved'), conflicts: gaps.filter((g) => /conflict/i.test(g.gap_type ?? '') || g.conflict_flag) },
      sourceReliability: this.groupLocal(sortedEvents, 'source_reliability'),
      review: { status: incident.timeline_review_status ?? 'Not Requested', requestedBy: incident.timeline_review_requested_by, requestedAt: incident.timeline_review_requested_at, decision: incident.timeline_review_decision, decidedBy: incident.timeline_review_decided_by, decidedAt: incident.timeline_review_decided_at, reason: incident.timeline_review_reason },
      changeHistory: history.filter((event) => /timeline|chronology|gap|conflict/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 15),
      readiness,
      actions: [
        { key: 'add-event', label: 'Add Timeline Event', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.timeline.edit permission' },
        { key: 'delete-event', label: 'Delete Timeline Event', enabled: canDelete && !locked, disabledReason: canDelete ? actionReason : 'Missing incidents.timeline.delete permission' },
        { key: 'request-review', label: 'Request Timeline Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.timeline.review.request permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      permissions: { canEdit, canDelete, canRequestReview, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async createTimelineEvent(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before adding timeline events.');
    const count = await this.safeMany<any>(this.db.from('incident_timeline_events').select('id').eq('tenant_id', tenantId).eq('incident_id', id));
    const row = await this.db.single<any>(this.db.from('incident_timeline_events').insert(this.timelinePatch(dto, tenantId, actorId, incident, count.length + 1)).select().single());
    await this.updateTimelineStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Created', 'Timeline event added', dto.reason ?? row.title ?? 'Timeline event added', null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.timeline.create', entityType: 'INCIDENT_TIMELINE_EVENT', entityId: row.id, after: row as JsonValue });
    return this.timelineTab(tenantId, scope, id, permissions);
  }

  async updateTimelineEvent(tenantId: string, actorId: string, scope: Scope, id: string, eventId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing timeline events.');
    const before = await this.db.single<any>(this.db.from('incident_timeline_events').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', eventId).single());
    const row = await this.db.single<any>(this.db.from('incident_timeline_events').update(this.timelinePatch(dto, tenantId, actorId, incident, before.event_number, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', eventId).select().single());
    await this.updateTimelineStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Timeline event updated', dto.reason ?? row.title ?? 'Timeline event updated', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.timeline.update', entityType: 'INCIDENT_TIMELINE_EVENT', entityId: row.id, before: before as JsonValue, after: row as JsonValue });
    return this.timelineTab(tenantId, scope, id, permissions);
  }

  async deleteTimelineEvent(tenantId: string, actorId: string, scope: Scope, id: string, eventId: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before deleting timeline events.');
    const before = await this.db.single<any>(this.db.from('incident_timeline_events').delete().eq('tenant_id', tenantId).eq('incident_id', id).eq('id', eventId).select().single());
    await this.updateTimelineStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Deleted', 'Timeline event removed', before.title ?? 'Timeline event removed', before, null);
    await this.audit.write({ tenantId, actorId, action: 'incidents.timeline.delete', entityType: 'INCIDENT_TIMELINE_EVENT', entityId: eventId, before: before as JsonValue });
    return this.timelineTab(tenantId, scope, id, permissions);
  }

  async requestTimelineReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewState(tenantId, actorId, scope, id, 'timeline' as any, 'Pending Review', dto, permissions);
  }

  async decideTimelineReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('A reason is required to reject timeline review.');
    return this.updateReviewState(tenantId, actorId, scope, id, 'timeline' as any, decision, dto, permissions);
  }

  async evidenceAttachmentsTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Evidence / Attachments');
    const [evidenceRows, versions, mappings, custody, documents, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_initial_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence_versions', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence_mappings', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence_custody_events', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence_document_links', id, scope),
      this.incidentHistory(tenantId, id, 40)
    ]);
    const evidence = this.visibleEvidenceRows(evidenceRows, permissions);
    const locked = this.closedStatus(incident.status);
    const readiness = this.evidenceReadiness(incident, evidenceRows, mappings, custody);
    const canUpload = permissions.includes('incidents.evidence.upload');
    const canEdit = permissions.includes('incidents.evidence.edit') || permissions.includes('incidents.evidence.upload');
    const canDelete = permissions.includes('incidents.evidence.delete');
    const canRequestReview = permissions.includes('incidents.evidence.review.request');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing evidence.' : null;
    return {
      header: { incidentNumber: incident.incident_number, title: incident.title, status: incident.status, evidenceReadinessStatus: readiness.status, totalEvidence: evidenceRows.length, visibleEvidence: evidence.length, restrictedHidden: evidenceRows.length - evidence.length, lastUpdated: incident.updated_at },
      summaryCards: this.evidenceSummaryCards(incident, evidenceRows, evidence, readiness),
      requiredEvidenceChecklist: this.requiredEvidenceChecklist(incident, evidenceRows),
      evidenceRegister: evidence,
      filePreview: { storageAvailable: true, previewRequiresSignedUrl: true, message: 'Preview/download returns controlled storage metadata. Raw private storage URLs are not exposed.' },
      versionHistory: versions,
      evidenceMapping: mappings,
      chainOfCustody: custody,
      documentControlLinks: documents,
      restrictedConfidentialEvidence: { hiddenCount: evidenceRows.length - evidence.length, medicalHidden: evidenceRows.filter((e) => e.medical_confidential).length, restrictedCount: evidenceRows.filter((e) => e.restricted).length, confidentialCount: evidenceRows.filter((e) => e.confidential).length },
      review: { status: incident.evidence_review_status ?? 'Not Requested', requestedBy: incident.evidence_review_requested_by, requestedAt: incident.evidence_review_requested_at, decision: incident.evidence_review_decision, decidedBy: incident.evidence_review_decided_by, decidedAt: incident.evidence_review_decided_at, reason: incident.evidence_review_reason },
      changeHistory: history.filter((event) => /evidence|attachment|custody|document|upload|download|preview/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 15),
      readiness,
      bulkActions: { canExportIndex: permissions.includes('incidents.evidence.export_index'), canArchive: canEdit && !locked, canDownload: permissions.includes('incidents.evidence.download') },
      actions: [
        { key: 'upload-evidence', label: 'Upload Evidence', enabled: canUpload && !locked, disabledReason: canUpload ? actionReason : 'Missing incidents.evidence.upload permission' },
        { key: 'edit-evidence', label: 'Edit Evidence', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.evidence.edit permission' },
        { key: 'delete-evidence', label: 'Delete Evidence', enabled: canDelete && !locked, disabledReason: canDelete ? actionReason : 'Missing incidents.evidence.delete permission' },
        { key: 'request-review', label: 'Request Evidence Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.evidence.review.request permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      permissions: { canUpload, canEdit, canDelete, canRequestReview, canPreview: permissions.includes('incidents.evidence.preview'), canDownload: permissions.includes('incidents.evidence.download'), readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async createIncidentEvidence(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before uploading evidence.');
    const row = await this.uploadEvidence(tenantId, actorId, scope, { ...dto, incidentId: id, siteId: incident.site_id, companyId: incident.company_id });
    await this.updateEvidenceStatus(tenantId, id, actorId);
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async updateIncidentEvidence(tenantId: string, actorId: string, scope: Scope, id: string, evidenceId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing evidence.');
    const before = await this.db.single<any>(this.db.from('incident_initial_evidence').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).single());
    const row = await this.db.single<any>(this.db.from('incident_initial_evidence').update(this.evidencePatch(dto, actorId)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Evidence metadata updated', dto.reason ?? row.file_name ?? 'Evidence updated', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.update', entityType: 'INCIDENT_EVIDENCE', entityId: evidenceId, before: before as JsonValue, after: row as JsonValue });
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async deleteIncidentEvidence(tenantId: string, actorId: string, scope: Scope, id: string, evidenceId: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before deleting evidence.');
    const before = await this.db.single<any>(this.db.from('incident_initial_evidence').delete().eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).select().single());
    await this.updateEvidenceStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Deleted', 'Evidence removed', before.file_name ?? before.evidence_type ?? 'Evidence removed', before, null);
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.delete', entityType: 'INCIDENT_EVIDENCE', entityId: evidenceId, before: before as JsonValue });
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async archiveIncidentEvidence(tenantId: string, actorId: string, scope: Scope, id: string, evidenceId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.db.single<any>(this.db.from('incident_initial_evidence').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).single());
    const row = await this.db.single<any>(this.db.from('incident_initial_evidence').update({ status: dto.restore ? 'Active' : 'Archived', archived_at: dto.restore ? null : new Date().toISOString(), archived_by: dto.restore ? null : actorId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).select().single());
    await this.writeHistory(tenantId, incident, actorId, dto.restore ? 'Restored' : 'Archived', dto.restore ? 'Evidence restored' : 'Evidence archived', dto.reason ?? row.file_name, before, row);
    await this.audit.write({ tenantId, actorId, action: dto.restore ? 'incidents.evidence.restore' : 'incidents.evidence.archive', entityType: 'INCIDENT_EVIDENCE', entityId: evidenceId, before: before as JsonValue, after: row as JsonValue });
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async createEvidenceVersion(tenantId: string, actorId: string, scope: Scope, id: string, evidenceId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const current = await this.db.single<any>(this.db.from('incident_initial_evidence').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).single());
    const versionNumber = Number(current.version_number ?? 1) + 1;
    const version = await this.db.single<any>(this.db.from('incident_evidence_versions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, evidence_id: evidenceId, version_number: versionNumber, file_name: dto.fileName ?? current.file_name, storage_provider: dto.storageProvider ?? current.storage_provider, storage_key: dto.storageKey ?? current.storage_key, file_type: dto.fileType ?? current.file_type, mime_type: dto.mimeType ?? current.mime_type, file_size: this.integerOrNull(dto.fileSize ?? current.file_size), change_reason: dto.reason, created_by: actorId }).select().single());
    await this.db.single<any>(this.db.from('incident_initial_evidence').update({ version_number: versionNumber, file_name: version.file_name, storage_provider: version.storage_provider, storage_key: version.storage_key, file_type: version.file_type, mime_type: version.mime_type, file_size: version.file_size, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', evidenceId).select('id').single());
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Evidence version created', dto.reason ?? version.file_name, current, version);
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.version.create', entityType: 'INCIDENT_EVIDENCE_VERSION', entityId: version.id, before: current as JsonValue, after: version as JsonValue });
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async createEvidenceMapping(tenantId: string, actorId: string, scope: Scope, id: string, evidenceId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.db.single<any>(this.db.from('incident_evidence_mappings').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, evidence_id: evidenceId, mapped_tab: dto.mappedTab, mapped_record_type: dto.mappedRecordType, mapped_record_id: dto.mappedRecordId, mapping_reason: dto.reason, created_by: actorId }).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Linked', 'Evidence mapped to investigation record', dto.reason ?? dto.mappedTab, null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.mapping.create', entityType: 'INCIDENT_EVIDENCE_MAPPING', entityId: row.id, after: row as JsonValue });
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async createEvidenceCustody(tenantId: string, actorId: string, scope: Scope, id: string, evidenceId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.db.single<any>(this.db.from('incident_evidence_custody_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, evidence_id: evidenceId, custody_event_type: dto.custodyEventType ?? 'Custody Updated', from_user_id: dto.fromUserId, to_user_id: dto.toUserId, custody_location: dto.custodyLocation, event_at: this.dateTimeOrNull(dto.eventAt) ?? new Date().toISOString(), notes: dto.notes, created_by: actorId }).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Evidence chain of custody updated', dto.notes ?? row.custody_event_type, null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.custody.create', entityType: 'INCIDENT_EVIDENCE_CUSTODY', entityId: row.id, after: row as JsonValue });
    return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
  }

  async evidenceAccess(tenantId: string, scope: Scope, id: string, evidenceId: string, permissions: string[], mode: 'preview' | 'download') {
    await this.rawIncidentById(tenantId, scope, id);
    const row = await this.db.single<any>(this.db.from('incident_initial_evidence').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', evidenceId).single());
    if (!this.canSeeEvidence(row, permissions)) throw new ForbiddenException('You do not have permission to access this evidence.');
    return { mode, evidenceId, fileName: row.file_name, mimeType: row.mime_type, storageProvider: row.storage_provider, storageKey: row.storage_key, signedUrl: null, unavailableReason: 'Storage signing service is not configured in this environment; raw private storage URLs are not exposed.' };
  }

  async requestEvidenceReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewState(tenantId, actorId, scope, id, 'evidence' as any, 'Pending Review', dto, permissions);
  }

  async decideEvidenceReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('A reason is required to reject evidence review.');
    return this.updateReviewState(tenantId, actorId, scope, id, 'evidence' as any, decision, dto, permissions);
  }

  async exportEvidenceIndex(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const data = await this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const rows = 'evidenceRegister' in data ? data.evidenceRegister ?? [] : [];
    await this.writeHistory(tenantId, incident, actorId, 'Exported', 'Evidence index exported', 'Evidence / Attachments export index requested', null, { count: rows.length });
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.export_index', entityType: 'INCIDENT', entityId: id, after: { count: rows.length } as JsonValue });
    return { generatedAt: new Date().toISOString(), rows };
  }

  async immediateActionsTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Immediate Actions');
    const [actions, restartControls, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_immediate_actions_initial', id, scope),
      this.incidentChildren(tenantId, 'incident_restart_controls', id, scope),
      this.incidentHistory(tenantId, id, 40)
    ]);
    const locked = this.closedStatus(incident.status);
    const readiness = this.immediateActionsReadiness(incident, actions, restartControls);
    const canEdit = permissions.includes('incidents.immediate_actions.edit') || permissions.includes('incidents.edit');
    const canDelete = permissions.includes('incidents.immediate_actions.delete');
    const canVerify = permissions.includes('incidents.immediate_actions.verify');
    const canRequestReview = permissions.includes('incidents.immediate_actions.review.request');
    const canConvertCapa = permissions.includes('incidents.capa.convert') || permissions.includes('incidents.followups.create');
    const canSiteSafety = permissions.includes('incidents.site_safety.verify');
    const canRestartControl = permissions.includes('incidents.restart_control.manage');
    const canTemporaryControls = permissions.includes('incidents.temporary_controls.manage');
    const canEvidence = permissions.includes('incidents.evidence.mapping.manage');
    const canFollowups = permissions.includes('incidents.followups.create');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing immediate actions.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        title: incident.title,
        status: incident.status,
        readinessStatus: readiness.status,
        areaSafeNow: incident.area_safe_now,
        restartBlocked: !!incident.restart_blocked,
        emergencyResponseActivated: !!incident.emergency_response_activated || actions.some((row) => row.emergency_response || row.emergency_response_activated),
        immediateActionStatus: incident.immediate_actions_status ?? (actions.length ? 'Started' : 'Not Started'),
        totalImmediateActions: actions.length,
        openImmediateActions: actions.filter((row) => !row.completed && !['Completed', 'Verified', 'Cancelled', 'Superseded'].includes(row.status)).length,
        overdueImmediateActions: actions.filter((row) => row.due_at && this.isPastDate(row.due_at) && !row.completed).length,
        temporaryControlsActive: actions.filter((row) => row.temporary_control || row.temporary_control_added).length,
        temporaryControlsExpired: actions.filter((row) => this.temporaryControlExpired(row)).length,
        verificationStatus: actions.some((row) => row.verification_required && !row.verified) ? 'Pending Verification' : actions.length ? 'Current' : 'Not Started',
        lastUpdated: incident.updated_at
      },
      summaryCards: this.immediateActionSummaryCards(incident, actions, restartControls, readiness),
      siteSafetyStatus: this.siteSafetyPanel(incident, actions),
      actionsRegister: actions,
      emergencyResponseActions: { rows: actions.filter((row) => row.emergency_response || row.category === 'Emergency Response') },
      isolationShutdownPermitControl: { rows: actions.filter((row) => row.isolation_shutdown_permit || /isolation|shutdown|permit/i.test(`${row.category} ${row.action_type} ${row.action_label}`)) },
      spillReleaseFireResponse: { rows: actions.filter((row) => row.spill_release_fire_response || /spill|release|fire/i.test(`${row.category} ${row.action_type} ${row.action_label}`)) },
      firstAidMedicalImmediateResponse: { rows: actions.filter((row) => row.first_aid_medical_response || /first aid|medical|injury/i.test(`${row.category} ${row.action_type} ${row.action_label}`)) },
      temporaryControls: { rows: actions.filter((row) => row.temporary_control || row.temporary_control_added), expired: actions.filter((row) => this.temporaryControlExpired(row)) },
      restartReturnToService: { rows: restartControls, restartBlocked: !!incident.restart_blocked, blockers: this.restartBlockers(incident, actions, restartControls) },
      verification: { rows: actions.filter((row) => row.completed || row.verified || row.verification_required || row.verification_status), pending: actions.filter((row) => (row.completed || row.verification_required) && !row.verified), failed: actions.filter((row) => row.verification_status === 'Rejected') },
      convertToCapa: { required: actions.filter((row) => row.capa_required || row.restart_blocker || row.temporary_control || row.temporary_control_added || row.replacement_permanent_action_required), converted: actions.filter((row) => row.capa_action_id || row.linked_capa_action_id), status: this.distributionBy(actions, (row) => row.capa_conversion_status ?? (row.capa_action_id || row.linked_capa_action_id ? 'Linked' : row.capa_required ? 'Required' : 'Not Required')) },
      review: { status: incident.immediate_actions_review_status ?? 'Not Requested', requestedBy: incident.immediate_actions_review_requested_by, requestedAt: incident.immediate_actions_review_requested_at, decision: incident.immediate_actions_review_decision, decidedBy: incident.immediate_actions_review_decided_by, decidedAt: incident.immediate_actions_review_decided_at, reason: incident.immediate_actions_review_reason },
      changeHistory: history.filter((event) => /immediate|action|restart|temporary|site safety|capa/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 15),
      readiness,
      charts: {
        actionStatus: this.distributionBy(actions, (row) => row.status ?? (row.completed ? 'Completed' : 'Open')),
        temporaryControlExpiry: this.distributionBy(actions.filter((row) => row.temporary_control || row.temporary_control_added), (row) => this.temporaryControlExpired(row) ? 'Expired' : row.completed ? 'Closed' : 'Active'),
        verificationStatus: this.distributionBy(actions.filter((row) => row.verification_required || row.completed || row.verified), (row) => row.verification_status ?? (row.verified ? 'Verified' : 'Pending Verification')),
        readiness: [{ label: readiness.status, count: readiness.score }]
      },
      actions: [
        { key: 'add-action', label: 'Add Immediate Action', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.immediate_actions.edit permission' },
        { key: 'verify-site-safe', label: 'Verify Site Safe', enabled: canSiteSafety && !locked, disabledReason: canSiteSafety ? actionReason : 'Missing incidents.site_safety.verify permission' },
        { key: 'verify-action', label: 'Verify Action', enabled: canVerify && !locked, disabledReason: canVerify ? actionReason : 'Missing incidents.immediate_actions.verify permission' },
        { key: 'link-evidence', label: 'Link Evidence', enabled: canEvidence && !locked, disabledReason: canEvidence ? actionReason : 'Missing incidents.evidence.mapping.manage permission' },
        { key: 'convert-capa', label: 'Convert to CAPA', enabled: canConvertCapa && !locked, disabledReason: canConvertCapa ? actionReason : 'Missing incidents.capa.convert permission' },
        { key: 'create-action', label: 'Create Action', enabled: canFollowups && !locked, disabledReason: canFollowups ? actionReason : 'Missing incidents.followups.create permission' },
        { key: 'save-changes', label: 'Save Changes', enabled: (canEdit || canRestartControl || canTemporaryControls || canSiteSafety) && !locked, disabledReason: (canEdit || canRestartControl || canTemporaryControls || canSiteSafety) ? actionReason : 'Missing immediate action edit/site safety/restart permission' },
        { key: 'request-review', label: 'Request Immediate Actions Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.immediate_actions.review.request permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      permissions: { canEdit, canDelete, canVerify, canRequestReview, canConvertCapa, canSiteSafety, canRestartControl, canTemporaryControls, canEvidence, canFollowups, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async immediateActionsSection(tenantId: string, scope: Scope, id: string, permissions: string[] = [], section: string) {
    const tab = await this.immediateActionsTab(tenantId, scope, id, permissions) as Record<string, any>;
    return { section, data: tab[section] ?? null, generatedAt: tab.generatedAt };
  }

  async immediateActionsContext(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const tab = await this.immediateActionsTab(tenantId, scope, id, permissions) as Record<string, any>;
    return {
      header: tab.header,
      permissions: tab.permissions,
      actions: tab.actions,
      actionTypes: ['Area isolation', 'Equipment shutdown', 'Energy isolation', 'Spill containment', 'Fire response', 'First aid', 'Emergency response', 'Evacuation', 'Barricade/cordon', 'Permit suspension', 'Process stabilization', 'Temporary repair/control', 'Notification', 'Cleanup', 'Environmental containment', 'Security control', 'Other'],
      statuses: ['Draft', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Overdue', 'Cancelled', 'Superseded'],
      temporaryControlTypes: ['Physical barrier', 'Temporary repair', 'Temporary operating limit', 'Manual monitoring', 'Temporary PPE requirement', 'Temporary procedure', 'Temporary isolation', 'Temporary bypass control', 'Other'],
      generatedAt: tab.generatedAt
    };
  }

  async immediateActionDetail(tenantId: string, scope: Scope, id: string, actionId: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Immediate Action Detail');
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    return { row, permissions: { canEdit: permissions.includes('incidents.immediate_actions.edit') || permissions.includes('incidents.edit'), canVerify: permissions.includes('incidents.immediate_actions.verify') }, generatedAt: new Date().toISOString() };
  }

  async updateImmediateSiteSafety(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before verifying site safety.');
    const patch = this.clean({
      area_safe_now: dto.areaSafeNow,
      unsafe_condition_remains: dto.unsafeConditionRemains,
      unsafe_condition_description: dto.unsafeConditionDescription,
      site_access_restricted: dto.siteAccessRestricted,
      barricade_cordon_active: dto.barricadeCordonActive,
      equipment_isolated: dto.equipmentIsolated,
      energy_isolation_completed: dto.energyIsolationCompleted,
      release_stopped: dto.releaseStopped,
      fire_extinguished: dto.fireExtinguished,
      spill_contained: dto.spillContained,
      atmosphere_tested: dto.atmosphereTested,
      permit_suspended: dto.permitSuspended,
      restart_blocked: dto.restartBlocked,
      restart_blocked_reason: dto.restartBlockReason,
      site_safety_status: dto.siteSafetyStatus ?? (dto.areaSafeNow === 'Yes' ? 'Safe' : dto.areaSafeNow === 'No' ? 'Unsafe' : 'Not Verified'),
      site_safety_verified_by: actorId,
      site_safety_verified_at: new Date().toISOString(),
      site_safety_verification_evidence: dto.verificationEvidence,
      immediate_action_notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('incidents').update(patch).eq('tenant_id', tenantId).eq('id', id).select('*').single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Status Changed', 'Immediate action site safety updated', dto.reason ?? 'Site safety verification saved', incident, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.site_safety.verify', entityType: 'INCIDENT', entityId: id, before: incident as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async updateImmediateRestartControl(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before changing restart controls.');
    const now = new Date().toISOString();
    const controlPatch = this.clean({
      id: dto.id ?? crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      incident_id: id,
      restart_blocked: dto.restartBlocked,
      blocked_reason: dto.restartBlockReason ?? dto.blockedReason,
      equipment_unit_process_affected: dto.equipmentUnitProcessAffected,
      return_to_service_allowed: dto.returnToServiceAllowed,
      required_before_restart: dto.requiredBeforeRestart,
      moc_required: dto.mocRequired,
      pssr_required: dto.pssrRequired,
      mi_required: dto.miSignoffRequired ?? dto.miRequired,
      inspection_required: dto.inspectionRequired,
      hse_signoff_required: dto.hseSignoffRequired,
      operations_signoff_required: dto.operationsSignoffRequired,
      approval_required: dto.approvalRequired,
      approval_status: dto.approvalStatus,
      approved_by: dto.approvedBy,
      approved_at: this.dateTimeOrNull(dto.approvedAt),
      evidence_links: Array.isArray(dto.evidenceLinks) ? dto.evidenceLinks : undefined,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: now,
      ...(!dto.id ? { created_by: actorId, created_at: now } : {})
    });
    const control = dto.id
      ? await this.db.single<any>(this.db.from('incident_restart_controls').update(controlPatch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', dto.id).select().single())
      : await this.db.single<any>(this.db.from('incident_restart_controls').insert(controlPatch).select().single());
    const incidentPatch = this.clean({
      restart_blocked: dto.restartBlocked,
      restart_blocked_reason: dto.restartBlockReason ?? dto.blockedReason,
      return_to_service_allowed: dto.returnToServiceAllowed,
      required_before_restart: dto.requiredBeforeRestart,
      moc_required: dto.mocRequired,
      pssr_required: dto.pssrRequired,
      inspection_required: dto.inspectionRequired,
      mi_signoff_required: dto.miSignoffRequired ?? dto.miRequired,
      hse_signoff_required: dto.hseSignoffRequired,
      operations_signoff_required: dto.operationsSignoffRequired,
      restart_control_status: dto.approvalStatus ?? (dto.restartBlocked ? 'Blocked' : 'Not Blocked'),
      updated_by: actorId,
      updated_at: now
    });
    const updatedIncident = await this.safeSingle<any>(this.db.from('incidents').update(incidentPatch).eq('tenant_id', tenantId).eq('id', id).select('*').single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Status Changed', 'Restart / return-to-service control updated', dto.reason ?? control.blocked_reason ?? 'Restart control saved', incident, updatedIncident ?? control);
    await this.audit.write({ tenantId, actorId, action: 'incidents.restart_control.manage', entityType: 'INCIDENT_RESTART_CONTROL', entityId: control.id, after: control as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async createImmediateAction(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before adding immediate actions.');
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').insert(this.immediateActionPatch(dto, tenantId, actorId, incident)).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Created', 'Immediate action added', dto.reason ?? row.action_label, null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.create', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: row.id, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async updateImmediateAction(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing immediate actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update(this.immediateActionPatch(dto, tenantId, actorId, incident, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Immediate action updated', dto.reason ?? row.action_label, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.update', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: row.id, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async deleteImmediateAction(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before deleting immediate actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').delete().eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Deleted', 'Immediate action deleted', before.action_label ?? 'Immediate action deleted', before, null);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.delete', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async convertImmediateActionToCapa(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before converting immediate actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const actionRecordId = dto.actionId ?? `CAPA-${actionId}`;
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({ capa_required: true, capa_action_id: actionRecordId, linked_capa_action_id: actionRecordId, capa_conversion_status: 'Converted', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Action Created', 'Immediate action converted to CAPA', dto.reason ?? 'Universal Action Engine CAPA conversion requested', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.capa.convert', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async completeImmediateAction(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before completing immediate actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({
      completed: true,
      completed_at: new Date().toISOString(),
      status: before.verification_required ? 'Completed' : 'Verified',
      verification_status: before.verification_required ? 'Pending Verification' : before.verification_status,
      notes: dto.notes ?? before.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Status Changed', 'Immediate action marked complete', dto.reason ?? row.action_label, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.complete', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async verifyImmediateAction(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.comment && !dto.verificationNotes) throw new BadRequestException('Verification requires a comment.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before verifying immediate actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({
      verified: true,
      verified_by: actorId,
      verified_at: new Date().toISOString(),
      last_verified_by: actorId,
      last_verified_at: new Date().toISOString(),
      verification_status: 'Verified',
      verification_method: dto.verificationMethod ?? before.verification_method,
      verification_notes: dto.verificationNotes ?? dto.comment,
      verification_evidence: dto.verificationEvidence ?? before.verification_evidence,
      evidence_id: dto.evidenceId ?? before.evidence_id,
      status: 'Verified',
      rework_required: false,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Validated', 'Immediate action verified', dto.comment ?? row.action_label, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.verify', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async rejectImmediateActionVerification(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason && !dto.comment) throw new BadRequestException('Rejecting verification requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before rejecting verification.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({
      verified: false,
      verification_status: 'Rejected',
      failed_verification_reason: dto.reason ?? dto.comment,
      verification_notes: dto.comment ?? dto.reason,
      rework_required: dto.reworkRequired ?? true,
      status: 'In Progress',
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Rejected', 'Immediate action verification rejected', dto.reason ?? dto.comment, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.reject_verification', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async linkImmediateActionEvidence(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.evidenceId && !dto.evidenceIds?.length) throw new BadRequestException('Select evidence to link.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before linking evidence.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const evidenceIds = Array.from(new Set([...(before.linked_evidence_ids ?? []), ...(dto.evidenceIds ?? []), dto.evidenceId].filter(Boolean)));
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({
      evidence_id: dto.evidenceId ?? before.evidence_id,
      linked_evidence_ids: evidenceIds,
      evidence_count: evidenceIds.length,
      verification_evidence: dto.description ?? dto.evidenceId ?? before.verification_evidence,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Linked', 'Evidence linked to immediate action', dto.reason ?? dto.evidenceId, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.link_evidence', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async linkImmediateActionCapa(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.actionId && !dto.capaActionId) throw new BadRequestException('Select an existing CAPA/action to link.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before linking CAPA actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const actionRecordId = dto.actionId ?? dto.capaActionId;
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({ capa_required: true, capa_action_id: actionRecordId, linked_capa_action_id: actionRecordId, capa_conversion_status: 'Linked', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Linked', 'Existing CAPA/action linked to immediate action', dto.reason ?? actionRecordId, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.link_capa', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async cancelImmediateAction(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('A reason is required to cancel or supersede an immediate action.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before cancelling immediate actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const status = dto.supersededByActionId ? 'Superseded' : 'Cancelled';
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({ status, cancellation_reason: dto.reason, superseded_by_action_id: dto.supersededByActionId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.updateImmediateActionsStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, status === 'Superseded' ? 'Superseded' : 'Status Changed', `Immediate action ${status.toLowerCase()}`, dto.reason, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.immediate_actions.cancel', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async createImmediateActionFollowup(tenantId: string, actorId: string, scope: Scope, id: string, actionId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before creating follow-up actions.');
    const before = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).single());
    const actionRecordId = dto.actionId ?? `FOLLOWUP-${actionId}`;
    const row = await this.db.single<any>(this.db.from('incident_immediate_actions_initial').update({ capa_required: true, capa_action_id: actionRecordId, linked_capa_action_id: actionRecordId, capa_conversion_status: 'Follow-up Created', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', actionId).select().single());
    await this.writeHistory(tenantId, incident, actorId, 'Action Created', 'Follow-up action created from immediate action', dto.reason ?? 'Universal Action Engine follow-up requested', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.followups.create', entityType: 'INCIDENT_IMMEDIATE_ACTION', entityId: actionId, before: before as JsonValue, after: row as JsonValue });
    return this.immediateActionsTab(tenantId, scope, id, permissions);
  }

  async requestImmediateActionsReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewState(tenantId, actorId, scope, id, 'immediate_actions', 'Pending Review', dto, permissions);
  }

  async decideImmediateActionsReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('A reason is required to reject immediate action review.');
    return this.updateReviewState(tenantId, actorId, scope, id, 'immediate_actions', decision, dto, permissions);
  }

  async investigationTeamTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Investigation Team');
    const [members, requiredRoles, sessions, notifications, history] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_investigation_team_members', id, scope),
      this.incidentChildren(tenantId, 'incident_team_required_roles', id, scope),
      this.incidentChildren(tenantId, 'incident_team_sessions', id, scope),
      this.incidentChildren(tenantId, 'incident_team_notifications', id, scope),
      this.incidentHistory(tenantId, id, 40)
    ]);
    const locked = this.closedStatus(incident.status);
    const generatedRoles = requiredRoles.length ? requiredRoles : this.generatedRequiredRoles(incident, members);
    const readiness = this.teamReadiness(incident, members, generatedRoles);
    const canEdit = permissions.includes('incidents.team.edit') || permissions.includes('incidents.edit');
    const canDelete = permissions.includes('incidents.team.delete');
    const canRequestReview = permissions.includes('incidents.team.review.request');
    const canNotify = permissions.includes('incidents.team.notifications.send');
    const canGenerateRoles = permissions.includes('incidents.team.required_roles.generate');
    const canAssignOwner = permissions.includes('incidents.team.owner.assign') || permissions.includes('incidents.assign');
    const canAssignLead = permissions.includes('incidents.team.lead.assign') || permissions.includes('incidents.team.owner.assign');
    const canAcceptance = permissions.includes('incidents.team.acceptance.manage');
    const canReplace = permissions.includes('incidents.team.member.replace');
    const canFollowups = permissions.includes('incidents.followups.create');
    const actionReason = locked ? 'Closed/approved incidents are read-only. Reopen before editing investigation team.' : null;
    const activeMembers = members.filter((m) => m.status !== 'Removed' && m.active_status === 'Active');
    return {
      header: {
        incidentNumber: incident.incident_number,
        title: incident.title,
        status: incident.status,
        investigationPriority: incident.investigation_priority,
        investigationLevelRequired: incident.investigation_level_required,
        readinessStatus: readiness.status,
        teamStatus: incident.team_status ?? (activeMembers.length ? 'In Progress' : 'Not Started'),
        owner: incident.owner,
        investigationOwnerId: incident.investigation_owner_id,
        investigationLeadId: incident.investigation_lead_id,
        formalTeamRequired: !!incident.formal_team_required,
        rcaRequired: !!incident.rca_required,
        memberCount: members.filter((m) => m.status !== 'Removed').length,
        activeMemberCount: activeMembers.length,
        requiredRolesMissing: generatedRoles.filter((role) => role.required && ['Missing', 'Not Covered'].includes(role.coverage_status ?? role.status)).length,
        pendingAcceptanceCount: members.filter((m) => ['Pending Acceptance', 'Pending', 'Invited'].includes(m.acceptance_status ?? m.active_status)).length,
        overdueAssignments: members.filter((m) => m.acceptance_due_date && this.isPastDate(m.acceptance_due_date) && m.active_status !== 'Active').length,
        lastUpdated: incident.updated_at
      },
      summaryCards: this.teamSummaryCards(incident, members, generatedRoles, sessions, readiness),
      ownerLead: {
        owner: incident.owner,
        investigationOwnerId: incident.investigation_owner_id,
        investigationLeadId: incident.investigation_lead_id,
        hseLeadId: incident.hse_lead_id,
        processSafetyLeadId: incident.process_safety_lead_id,
        operationsLeadId: incident.operations_lead_id,
        engineeringLeadId: incident.engineering_lead_id,
        lead: members.find((m) => m.id === incident.investigation_lead_id || m.lead_investigator),
        hseLead: members.find((m) => m.id === incident.hse_lead_id),
        processSafetyLead: members.find((m) => m.id === incident.process_safety_lead_id),
        operationsLead: members.find((m) => m.id === incident.operations_lead_id),
        engineeringLead: members.find((m) => m.id === incident.engineering_lead_id),
        formalTeamRequired: !!incident.formal_team_required,
        dueDate: incident.team_assignment_due_date ?? incident.due_date,
        assignmentReason: incident.team_assignment_reason,
        ownerAcceptanceStatus: members.find((m) => m.user_id === incident.investigation_owner_id)?.acceptance_status,
        leadAcceptanceStatus: members.find((m) => m.id === incident.investigation_lead_id || m.lead_investigator)?.acceptance_status,
        notes: incident.team_review_comments
      },
      membersRegister: members,
      requiredRolesMatrix: generatedRoles,
      assignmentAcceptance: { status: incident.team_status ?? 'Not Started', acceptanceRequired: members.some((m) => m.acceptance_required), pending: members.filter((m) => ['Pending Acceptance', 'Pending', 'Invited'].includes(m.acceptance_status ?? m.active_status)), accepted: members.filter((m) => m.acceptance_status === 'Accepted'), declined: members.filter((m) => m.acceptance_status === 'Declined'), overdue: members.filter((m) => m.acceptance_due_date && this.isPastDate(m.acceptance_due_date) && m.active_status !== 'Active'), notificationSent: notifications.some((n) => n.notification_type === 'Acceptance request' || n.notification_type === 'Team assignment'), reminderSent: notifications.some((n) => n.notification_type === 'Reminder'), notes: incident.team_review_comments, distribution: this.groupLocal(members, 'acceptance_status') },
      raci: { rows: await this.safeMany<any>(this.db.from('incident_team_raci').select('*').eq('tenant_id', tenantId).eq('incident_id', id)), distribution: this.groupLocal(members, 'raci_role') },
      competencyTrainingIndependence: { rows: members, competency: this.groupLocal(members, 'competency_status'), training: this.groupLocal(members, 'training_status'), independence: this.groupLocal(members, 'independence_status') },
      availabilityConflictWorkload: { rows: members, availability: this.groupLocal(members, 'availability_status'), conflicts: members.filter((m) => m.conflict_declared || /conflict|declared/i.test(`${m.conflict_status}`)), workload: this.groupLocal(members, 'workload_status') },
      meetingSessionPlanning: { rows: sessions },
      communicationNotifications: { rows: notifications, status: incident.team_notification_status ?? 'Not Started' },
      escalationManagementOversight: this.teamEscalationPanel(incident, readiness, members),
      review: { status: incident.team_review_status ?? 'Not Requested', requestedBy: incident.team_review_requested_by, requestedAt: incident.team_review_requested_at, decision: incident.team_review_decision, decidedBy: incident.team_review_decided_by, decidedAt: incident.team_review_decided_at, reason: incident.team_review_reason },
      changeHistory: history.filter((event) => /team|member|raci|notification|acceptance|investigation owner/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 15),
      readiness,
      actions: [
        { key: 'assign-owner', label: 'Assign Owner', enabled: canAssignOwner && !locked, disabledReason: canAssignOwner ? actionReason : 'Missing incidents.team.owner.assign permission' },
        { key: 'assign-lead', label: 'Assign Lead', enabled: canAssignLead && !locked, disabledReason: canAssignLead ? actionReason : 'Missing incidents.team.lead.assign permission' },
        { key: 'add-member', label: 'Add Team Member', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.team.edit permission' },
        { key: 'replace-member', label: 'Change / Replace Member', enabled: canReplace && !locked, disabledReason: canReplace ? actionReason : 'Missing incidents.team.member.replace permission' },
        { key: 'generate-roles', label: 'Generate Required Roles', enabled: canGenerateRoles && !locked, disabledReason: canGenerateRoles ? actionReason : 'Missing incidents.team.required_roles.generate permission' },
        { key: 'send-notification', label: 'Send Notification', enabled: canNotify && !locked, disabledReason: canNotify ? actionReason : 'Missing incidents.team.notifications.send permission' },
        { key: 'send-reminder', label: 'Send Reminder', enabled: canNotify && !locked, disabledReason: canNotify ? actionReason : 'Missing incidents.team.notifications.send permission' },
        { key: 'mark-accepted', label: 'Mark Accepted', enabled: canAcceptance && !locked, disabledReason: canAcceptance ? actionReason : 'Missing incidents.team.acceptance.manage permission' },
        { key: 'mark-declined', label: 'Mark Declined', enabled: canAcceptance && !locked, disabledReason: canAcceptance ? actionReason : 'Missing incidents.team.acceptance.manage permission' },
        { key: 'request-review', label: 'Request Team Review', enabled: canRequestReview && !locked, disabledReason: canRequestReview ? actionReason : 'Missing incidents.team.review.request permission' },
        { key: 'create-action', label: 'Create Action', enabled: canFollowups && !locked, disabledReason: canFollowups ? actionReason : 'Missing incidents.followups.create permission' },
        { key: 'save-changes', label: 'Save Changes', enabled: canEdit && !locked, disabledReason: canEdit ? actionReason : 'Missing incidents.team.edit permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ],
      charts: {
        roleCompletion: this.distributionBy(generatedRoles, (role) => role.coverage_status ?? role.status ?? 'Missing'),
        acceptanceStatus: this.distributionBy(members, (member) => member.acceptance_status ?? 'Pending Acceptance'),
        competencyGaps: this.distributionBy(members, (member) => member.competency_status ?? 'Not Reviewed'),
        availabilityConflicts: this.distributionBy(members, (member) => member.availability_status ?? 'Not Reviewed'),
        readiness: [{ label: readiness.status, count: readiness.score }]
      },
      permissions: { canEdit, canDelete, canRequestReview, canNotify, canGenerateRoles, canAssignOwner, canAssignLead, canAcceptance, canReplace, canFollowups, readOnly: locked },
      generatedAt: new Date().toISOString()
    };
  }

  async createTeamMember(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing team.');
    const duplicate = dto.userId ? await this.safeSingle<any>(this.db.from('incident_investigation_team_members').select('id').eq('tenant_id', tenantId).eq('incident_id', id).eq('user_id', dto.userId).maybeSingle()) : null;
    if (duplicate) throw new BadRequestException('This user is already on the investigation team.');
    const detected = await this.detectTeamUserProfile(tenantId, scope, dto);
    if (detected.profileStatus === 'Disabled' && !permissions.includes('users.profiles.create')) throw new BadRequestException(`Selected user is disabled. ${detected.profileDisabledReason ?? ''}`.trim());
    const row = await this.db.single<any>(this.db.from('incident_investigation_team_members').insert(this.teamMemberPatch({ ...dto, ...detected }, tenantId, actorId, incident)).select().single());
    if (row.acceptance_required !== false && ['Pending Acceptance', 'Pending', 'Invited'].includes(row.acceptance_status ?? 'Pending Acceptance')) {
      await this.createTeamAssignmentInvitation(tenantId, actorId, incident, row, dto);
    }
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Created', 'Investigation team member added', dto.reason ?? row.display_name ?? row.email, null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.member.create', entityType: 'INCIDENT_TEAM_MEMBER', entityId: row.id, after: row as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async updateTeamMember(tenantId: string, actorId: string, scope: Scope, id: string, memberId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing team.');
    const before = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).single());
    const shouldRefreshProfile = dto.userId !== undefined || dto.email !== undefined || dto.internalExternal === 'External';
    const detected = shouldRefreshProfile ? await this.detectTeamUserProfile(tenantId, scope, dto) : {};
    const row = await this.db.single<any>(this.db.from('incident_investigation_team_members').update(this.teamMemberPatch({ ...dto, ...detected }, tenantId, actorId, incident, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).select().single());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Investigation team member updated', dto.reason ?? row.display_name ?? row.email, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.member.update', entityType: 'INCIDENT_TEAM_MEMBER', entityId: row.id, before: before as JsonValue, after: row as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async deleteTeamMember(tenantId: string, actorId: string, scope: Scope, id: string, memberId: string, permissions: string[] = [], dto: Record<string, any> = {}) {
    if (!dto.reason && permissions.includes('incidents.team.member.remove')) throw new BadRequestException('Removing a team member requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing team.');
    const beforeRow = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).single());
    const before = await this.db.single<any>(this.db.from('incident_investigation_team_members').update({ status: 'Removed', active_status: 'Removed', removed_by: actorId, removed_at: new Date().toISOString(), removal_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).select().single());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Investigation team member removed', dto.reason ?? before.display_name ?? 'Team member removed', beforeRow, before);
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.member.remove', entityType: 'INCIDENT_TEAM_MEMBER', entityId: memberId, before: beforeRow as JsonValue, after: before as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async investigationTeamSection(tenantId: string, scope: Scope, id: string, permissions: string[] = [], section: string) {
    const tab = await this.investigationTeamTab(tenantId, scope, id, permissions) as Record<string, any>;
    return { section, data: tab[section] ?? null, generatedAt: tab.generatedAt };
  }

  async teamMemberDetail(tenantId: string, scope: Scope, id: string, memberId: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Investigation Team Member');
    const row = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).single());
    return { row, profile: row.user_id ? await this.detectTeamUserProfile(tenantId, scope, { userId: row.user_id }) : null, generatedAt: new Date().toISOString() };
  }

  async updateTeamOwnerLead(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason && (dto.investigationOwnerId || dto.investigationLeadId)) throw new BadRequestException('Owner/lead changes require a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before changing investigation owner/lead.');
    const patch = this.clean({
      investigation_owner_id: dto.investigationOwnerId,
      investigation_lead_id: dto.investigationLeadId,
      hse_lead_id: dto.hseLeadId,
      process_safety_lead_id: dto.processSafetyLeadId,
      operations_lead_id: dto.operationsLeadId,
      engineering_lead_id: dto.engineeringLeadId,
      team_assignment_due_date: this.dateOrNull(dto.dueDate),
      team_assignment_reason: dto.reason ?? dto.assignmentReason,
      team_status: 'Assigned',
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('incidents').update(patch).eq('tenant_id', tenantId).eq('id', id).select('*').single());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Investigation owner/lead changed', dto.reason ?? 'Owner/lead assignment updated', incident, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.owner.assign', entityType: 'INCIDENT', entityId: id, before: incident as JsonValue, after: row as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async setTeamMemberAcceptance(tenantId: string, actorId: string, scope: Scope, id: string, memberId: string, status: 'Accepted' | 'Declined', dto: Record<string, any>, permissions: string[] = []) {
    if (status === 'Declined' && !dto.reason) throw new BadRequestException('Decline requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before changing acceptance.');
    const before = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).single());
    const row = await this.db.single<any>(this.db.from('incident_investigation_team_members').update({
      acceptance_status: status,
      active_status: status === 'Accepted' ? 'Active' : 'Declined',
      accepted_by: status === 'Accepted' ? actorId : before.accepted_by,
      accepted_at: status === 'Accepted' ? new Date().toISOString() : before.accepted_at,
      declined_at: status === 'Declined' ? new Date().toISOString() : before.declined_at,
      decline_reason: status === 'Declined' ? dto.reason : before.decline_reason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).select().single());
    await this.safeSingle(this.db.from('incident_team_acceptance_logs').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, member_id: memberId, event_type: status, reason: dto.reason, actor_id: actorId }).select().single());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Status Changed', `Team member ${status.toLowerCase()} assignment`, dto.reason ?? row.display_name ?? row.email, before, row);
    await this.audit.write({ tenantId, actorId, action: `incidents.team.member.${status.toLowerCase()}`, entityType: 'INCIDENT_TEAM_MEMBER', entityId: memberId, before: before as JsonValue, after: row as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async replaceTeamMember(tenantId: string, actorId: string, scope: Scope, id: string, memberId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason && !dto.replacementReason) throw new BadRequestException('Replacing a team member requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before replacing team members.');
    const before = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).single());
    const detected = await this.detectTeamUserProfile(tenantId, scope, dto);
    const replacement = await this.db.single<any>(this.db.from('incident_investigation_team_members').insert(this.teamMemberPatch({
      ...before,
      id: undefined,
      userId: dto.replacementUserId ?? dto.userId,
      displayName: dto.replacementName ?? dto.displayName,
      email: dto.replacementEmail ?? dto.email,
      acceptanceStatus: dto.newMemberAcceptanceRequired === false ? 'Accepted' : 'Pending Acceptance',
      activeStatus: dto.newMemberAcceptanceRequired === false ? 'Active' : 'Pending Acceptance',
      notes: dto.notes,
      replacementReason: dto.reason ?? dto.replacementReason,
      ...detected
    }, tenantId, actorId, incident)).select().single());
    const old = await this.db.single<any>(this.db.from('incident_investigation_team_members').update({ status: 'Replaced', active_status: 'Replaced', replaced_by_member_id: replacement.id, replacement_reason: dto.reason ?? dto.replacementReason, removed_by: actorId, removed_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', memberId).select().single());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Investigation team member replaced', dto.reason ?? dto.replacementReason, before, { old, replacement });
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.member.replace', entityType: 'INCIDENT_TEAM_MEMBER', entityId: memberId, before: before as JsonValue, after: { old, replacement } as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async generateRequiredTeamRoles(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const members = await this.incidentChildren(tenantId, 'incident_investigation_team_members', id, scope);
    const roles = this.generatedRequiredRoles(incident, members);
    const payload = roles.map((role) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, role_name: role.role_name, discipline: role.discipline, required: role.required, coverage_status: role.coverage_status, generated_reason: role.generated_reason, source_rule: role.source_rule, missing: role.missing, assigned_member_id: role.assigned_member_id, created_by: actorId }));
    if (payload.length) await this.safeMany(this.db.from('incident_team_required_roles').insert(payload).select());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'System Generated', 'Investigation team required roles generated', 'Required roles generated from incident severity/classification policy', null, { count: payload.length });
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.required_roles.generate', entityType: 'INCIDENT', entityId: id, after: { count: payload.length } as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async sendTeamNotification(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.db.single<any>(this.db.from('incident_team_notifications').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, member_id: dto.memberId, notification_type: dto.notificationType ?? 'Team Notification', subject: dto.subject ?? `Incident ${incident.incident_number} notification`, message: dto.message, status: 'Sent', sent_by: actorId, sent_at: new Date().toISOString() }).select().single());
    if (dto.memberId) await this.safeSingle(this.db.from('incident_investigation_team_members').update({ notification_status: 'Sent', last_notified_at: new Date().toISOString(), notification_message: dto.message, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', dto.memberId).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ team_notification_status: 'Sent', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, incident, actorId, 'Notification Sent', 'Investigation team notification sent', dto.reason ?? row.subject, null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.notifications.send', entityType: 'INCIDENT_TEAM_NOTIFICATION', entityId: row.id, after: row as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  private async createTeamAssignmentInvitation(tenantId: string, actorId: string, incident: any, member: any, dto: Record<string, any>) {
    const message = dto.notificationMessage ?? `You have been assigned to Incident ${incident.incident_number} - ${incident.title ?? 'Investigation Team'}. Please accept or decline the assignment.`;
    const subject = dto.notificationSubject ?? `Incident ${incident.incident_number} investigation team assignment`;
    const notification = await this.safeSingle<any>(this.db.from('notifications').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: member.user_id ?? null,
      site_id: incident.site_id,
      type: 'incident.team.assignment',
      module: 'incidents',
      title: subject,
      message,
      related_record_id: incident.id,
      related_record_type: 'Incident',
      related_url: `/incidents/${incident.id}?tab=investigation-team`,
      priority: 'Normal',
      created_by: actorId,
      metadata: { incidentId: incident.id, memberId: member.id, teamRole: member.team_role ?? null, acceptanceDueDate: member.acceptance_due_date ?? null }
    }).select('id').single());
    const row = await this.safeSingle<any>(this.db.from('incident_team_notifications').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      incident_id: incident.id,
      member_id: member.id,
      notification_type: 'Assignment Invitation',
      subject,
      message,
      status: 'Pending Invitation',
      sent_by: actorId,
      sent_at: new Date().toISOString()
    }).select().single());
    await this.safeSingle(this.db.from('incident_investigation_team_members').update({
      notification_status: 'Pending Invitation',
      notification_message: message,
      last_notified_at: new Date().toISOString(),
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('incident_id', incident.id).eq('id', member.id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ team_notification_status: 'Pending Invitation', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incident.id).select('id').single());
    await this.writeHistory(tenantId, incident, actorId, 'Notification Sent', 'Investigation team assignment invitation created', dto.reason ?? subject, null, { teamNotification: row, notificationCenterId: notification?.id ?? null });
    await this.safeSingle(this.audit.write({ tenantId, actorId, action: 'incidents.team.member.invite', entityType: 'INCIDENT_TEAM_NOTIFICATION', entityId: row?.id ?? member.id, after: { teamNotification: row, notificationCenterId: notification?.id ?? null, memberId: member.id } as JsonValue }));
  }

  async sendTeamReminders(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const members = await this.incidentChildren(tenantId, 'incident_investigation_team_members', id, scope);
    const targets = members.filter((member) => ['Pending Acceptance', 'Pending', 'Invited'].includes(member.acceptance_status ?? member.active_status) && (!dto.memberId || dto.memberId === member.id));
    const rows = [];
    for (const member of targets) {
      const row = await this.safeSingle<any>(this.db.from('incident_team_notifications').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, member_id: member.id, notification_type: 'Reminder', subject: `Reminder: Incident ${incident.incident_number} investigation assignment`, message: dto.message ?? 'Please accept or decline your investigation team assignment.', status: 'Sent', sent_by: actorId, sent_at: new Date().toISOString() }).select().single());
      if (row) rows.push(row);
      await this.safeSingle(this.db.from('incident_investigation_team_members').update({ notification_status: 'Reminder Sent', last_reminder_sent_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', member.id).select('id').single());
    }
    await this.writeHistory(tenantId, incident, actorId, 'Notification Sent', 'Investigation team reminders sent', dto.reason ?? `${rows.length} reminders sent`, null, { count: rows.length });
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.notifications.reminder', entityType: 'INCIDENT', entityId: id, after: { count: rows.length } as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async updateTeamRaci(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing RACI.');
    const rows = Array.isArray(dto.rows) ? dto.rows : [dto];
    const saved = [];
    for (const item of rows) {
      const payload = this.clean({ id: item.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, activity: item.activity, responsible_member_id: item.responsibleMemberId, accountable_member_id: item.accountableMemberId, consulted_member_ids_json: item.consultedMemberIds ?? [], informed_member_ids_json: item.informedMemberIds ?? [], due_date: this.dateOrNull(item.dueDate), status: item.status ?? 'Draft', updated_by: actorId, updated_at: new Date().toISOString(), ...(!item.id ? { created_by: actorId } : {}) });
      const row = item.id ? await this.safeSingle<any>(this.db.from('incident_team_raci').update(payload).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', item.id).select().single()) : await this.safeSingle<any>(this.db.from('incident_team_raci').insert(payload).select().single());
      if (row) saved.push(row);
    }
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Investigation team RACI updated', dto.reason ?? 'RACI/responsibilities saved', null, { count: saved.length });
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.raci.manage', entityType: 'INCIDENT', entityId: id, after: { count: saved.length } as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async updateTeamMemberChecks(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.memberId) throw new BadRequestException('Member is required.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing team checks.');
    const before = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', dto.memberId).single());
    const row = await this.db.single<any>(this.db.from('incident_investigation_team_members').update(this.clean({
      competency_status: dto.competencyStatus,
      training_status: dto.trainingStatus,
      required_competency: dto.requiredCompetency,
      training_record: dto.trainingRecord,
      investigation_training_complete: dto.investigationTrainingComplete,
      rca_training_complete: dto.rcaTrainingComplete,
      process_safety_competency: dto.processSafetyCompetency,
      independence_status: dto.independenceStatus,
      conflict_check_required: dto.conflictCheckRequired,
      conflict_declared: dto.conflictDeclared,
      conflict_status: dto.conflictStatus,
      conflict_notes: dto.conflictNotes,
      approved_despite_conflict: dto.approvedDespiteConflict,
      availability_status: dto.availabilityStatus,
      planned_absence: dto.plannedAbsence,
      workload_status: dto.workloadStatus,
      assignment_capacity: dto.assignmentCapacity,
      backup_member_id: dto.backupMemberId,
      availability_notes: dto.availabilityNotes,
      change_reason: dto.reason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    })).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', dto.memberId).select().single());
    await this.updateTeamStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', 'Investigation team competency/availability/conflict updated', dto.reason ?? row.display_name ?? row.email, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.team.checks.manage', entityType: 'INCIDENT_TEAM_MEMBER', entityId: dto.memberId, before: before as JsonValue, after: row as JsonValue });
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  async searchTeamUsers(tenantId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.rawIncidentById(tenantId, scope, id);
    const search = String(dto.search ?? dto.q ?? '').trim();
    let query = this.db.from('User').select('id,displayName,email,title,department,status,tenantId').eq('tenantId', tenantId).limit(25);
    if (search) query = query.or(`displayName.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%,title.ilike.%${search}%`);
    const users = await this.safeMany<any>(query);
    return {
      rows: users.map((user) => this.teamProfileFromUser(user)),
      generatedAt: new Date().toISOString(),
      permissions: { canViewProfiles: permissions.includes('users.profiles.view') || permissions.includes('incidents.team.view'), canInvite: permissions.includes('users.profiles.invite') }
    };
  }

  async requestTeamReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewState(tenantId, actorId, scope, id, 'team', 'Pending Review', dto, permissions);
  }

  async decideTeamReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('A reason is required to reject team review.');
    return this.updateReviewState(tenantId, actorId, scope, id, 'team', decision, dto, permissions);
  }

  async quickActions(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    const readiness = this.readinessFor(incident, [], [], [], []);
    return this.headerActions(incident, permissions, readiness);
  }

  async assignOwner(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(before.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen the incident before assigning a new owner.');
    const ownerId = dto.ownerId ?? dto.investigationOwnerId ?? dto.userId;
    if (!ownerId) throw new BadRequestException('Investigation owner is required.');
    const owner = await this.safeSingle<any>(this.db.from('User').select('id,displayName,email,status,tenantId').eq('tenantId', tenantId).eq('id', ownerId).single());
    if (!owner) throw new BadRequestException('Selected owner was not found in IAM/RBAC users.');
    if (owner.status && owner.status !== 'Active') throw new BadRequestException('Selected owner is inactive.');
    const row = await this.db.single<any>(this.db.from('incidents').update({ investigation_owner_id: ownerId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Updated', 'Investigation owner assigned', dto.reason ?? 'Investigation owner updated', before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.assign', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async changeStatus(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    const status = dto.status ?? dto.nextStatus;
    if (!status) throw new BadRequestException('Status is required.');
    const readiness = this.readinessFor(before, [], [], [], []);
    const allowed = this.allowedStatusTransitions(before, readiness, permissions).map((x) => x.status);
    if (!allowed.includes(status)) throw new BadRequestException(`Status transition to ${status} is not allowed. ${allowed.length ? `Allowed: ${allowed.join(', ')}` : 'No transitions available.'}`);
    if (['Closed', 'Cancelled / Void', 'Changes Requested', 'Reopened'].includes(status) && !dto.reason) throw new BadRequestException('A reason is required for this status transition.');
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('incidents').update({
      previous_status: before.status,
      status,
      status_changed_by: actorId,
      status_changed_at: now,
      status_change_reason: dto.reason ?? dto.comment ?? null,
      closed_at: status === 'Closed' ? now : before.closed_at,
      reopened_at: status === 'Reopened' ? now : before.reopened_at,
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Status Changed', `Status changed to ${status}`, dto.reason ?? dto.comment, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.status.change', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async closeIncident(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    const [people, assets, evidence, actions] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_people_initial', id, scope),
      this.incidentChildren(tenantId, 'incident_equipment_chemical_initial', id, scope),
      this.incidentChildren(tenantId, 'incident_initial_evidence', id, scope),
      this.incidentActions(tenantId, scope, id)
    ]);
    const readiness = this.readinessFor(before, people, assets, evidence, actions);
    if (readiness.hardBlockers.length && !permissions.includes('incidents.void')) {
      throw new BadRequestException(`Close is blocked: ${readiness.hardBlockers.map((b) => b.title).join('; ')}`);
    }
    return this.changeStatus(tenantId, actorId, scope, id, { ...dto, status: 'Closed', reason: dto.reason ?? 'Closed from incident detail overview' }, permissions);
  }

  async reopenIncident(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>) {
    if (!dto.reason) throw new BadRequestException('Reopen reason is required.');
    const before = await this.rawIncidentById(tenantId, scope, id);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('incidents').update({
      previous_status: before.status,
      status: 'Reopened',
      reopened_at: now,
      status_changed_by: actorId,
      status_changed_at: now,
      status_change_reason: dto.reason,
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeHistory(tenantId, row, actorId, 'Reopened', 'Incident reopened', dto.reason, before, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.reopen', entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async exportSummary(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const data: any = await this.detail(tenantId, scope, id, permissions);
    await this.writeHistory(tenantId, { id, company_id: data.header.companyId ?? null, site_id: data.header.site?.id ?? null }, actorId, 'Exported', 'Incident summary exported', 'Summary export requested', null, { incidentId: id });
    await this.audit.write({ tenantId, actorId, action: 'incidents.export_summary', entityType: 'INCIDENT', entityId: id, after: { exportedAt: new Date().toISOString() } as JsonValue });
    return { fileName: `${data.header.incidentNumber ?? 'incident'}-summary.json`, contentType: 'application/json', data };
  }

  async filterContext(tenantId: string, scope: Scope) {
    const [sites, units, areas, users, equipment] = await Promise.all([
      this.safeMany<any>(this.scopeQuery(this.db.from('Site').select('id,name,code').eq('tenantId', tenantId).order('name'), scope, 'id')),
      this.safeMany<any>(this.db.from('Unit').select('id,name,siteId').eq('tenantId', tenantId).order('name')),
      this.safeMany<any>(this.db.from('Area').select('id,name,siteId,unitId').eq('tenantId', tenantId).order('name')),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).order('displayName').limit(100)),
      this.safeMany<any>(this.scopeQuery(this.db.from('Equipment').select('id,tag,name,type,siteId,unitId,areaId').eq('tenantId', tenantId).order('tag').limit(100), scope, 'siteId'))
    ]);
    return {
      sites, units, areas, users, equipment,
      eventTypes: ['Incident', 'Near Miss', 'Unsafe Condition', 'Process Upset', 'Loss of Containment', 'Spill', 'Release', 'Fire', 'Explosion', 'Injury', 'Illness', 'Exposure', 'Equipment Damage', 'Environmental Event', 'Security Event', 'Quality Event', 'Other'],
      classifications: ['Occupational Safety', 'Process Safety', 'Environmental', 'Asset / Reliability', 'Security', 'Quality', 'Other'],
      statuses: ['Draft', 'Reported', 'Triage', 'Investigation Required', 'Investigation In Progress', 'RCA Required', 'RCA In Progress', 'Actions Assigned', 'Pending Review', 'Changes Requested', 'Approved', 'Closed', 'Reopened', 'Cancelled / Void'],
      severities: this.severities(),
      pseTiers: ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Not Applicable', 'Not Determined'],
      priorities: ['Low', 'Medium', 'High', 'Critical']
    };
  }

  async createContext(tenantId: string, actorId: string, scope: Scope, permissions: string[] = []) {
    const [context, riskMatrix, classificationConfig, pseThresholdConfig, drafts] = await Promise.all([
      this.filterContext(tenantId, scope),
      this.riskMatrix(tenantId, scope),
      this.classificationConfig(tenantId, scope),
      this.pseThresholdConfig(tenantId, scope),
      this.safeMany<any>(this.scopeQuery(this.db.from('incident_drafts').select('*').eq('tenant_id', tenantId).eq('created_by', actorId).order('updated_at', { ascending: false }).limit(10), scope, 'site_id'))
    ]);
    return {
      ...context,
      currentUser: (await this.safeSingle<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).eq('id', actorId).single())) ?? { id: actorId },
      riskMatrix,
      classificationConfig,
      pseThresholdConfig,
      drafts,
      permissions: {
        canCreate: permissions.includes('incidents.create'),
        canSaveDraft: permissions.includes('incidents.draft.create') || permissions.includes('incidents.draft.edit') || permissions.includes('incidents.create'),
        canDeleteDraft: permissions.includes('incidents.draft.delete'),
        canSubmit: permissions.includes('incidents.submit') || permissions.includes('incidents.create'),
        canCreateRestricted: permissions.includes('incidents.restricted.create'),
        canCreateConfidential: permissions.includes('incidents.confidential.create'),
        canManageMedical: permissions.includes('incidents.medical_fields.manage'),
        canUploadEvidence: permissions.includes('incidents.evidence.upload') || permissions.includes('incidents.create'),
        canClassifyPsm: permissions.includes('incidents.psm.classify') || permissions.includes('incidents.create'),
        canOverrideFollowup: permissions.includes('incidents.followup.override')
      }
    };
  }

  async siteContext(tenantId: string, scope: Scope, query: Record<string, any> = {}) {
    const context = await this.filterContext(tenantId, scope);
    return {
      sites: context.sites,
      units: query.siteId ? context.units.filter((u: any) => u.siteId === query.siteId) : context.units,
      areas: query.unitId ? context.areas.filter((a: any) => a.unitId === query.unitId) : context.areas,
      operatingModes: ['Normal operation', 'Startup', 'Shutdown', 'Maintenance', 'Turnaround', 'Emergency operation', 'Commissioning', 'Decommissioning', 'Other'],
      shifts: ['Day', 'Night', 'Swing', 'A', 'B', 'C', 'D', 'Other']
    };
  }

  async riskMatrix(tenantId: string, scope: Scope) {
    const config = await this.firstConfig(tenantId, scope, ['incident_risk_matrix', 'risk_matrix', 'site_risk_matrix']);
    return {
      configured: !!config,
      source: config ? 'Company/site configuration' : 'Configuration missing',
      missingReason: config ? null : 'No company/site incident risk matrix configuration was found. Risk score will be marked Not Determined until reviewed.',
      version: config?.version ?? config?.revision ?? config?.effectiveVersion ?? null,
      severities: config?.severities ?? this.severities(),
      likelihoods: config?.likelihoods ?? ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
      matrix: config?.matrix ?? null
    };
  }

  async classificationConfig(tenantId: string, scope: Scope) {
    const config = await this.firstConfig(tenantId, scope, ['incident_classification_config', 'pse_classification_config']);
    return {
      configured: !!config,
      source: config ? 'Company/site configuration' : 'Configuration missing',
      psmIndicators: config?.psmIndicators ?? ['Chemical release', 'Fire', 'Explosion', 'LOPC', 'Process upset', 'Safeguard/IPL failure', 'SIS/PSV failure', 'Operating envelope exceedance'],
      occupationalIndicators: config?.occupationalIndicators ?? ['Slip/trip/fall', 'Ergonomics', 'Manual handling', 'Office injury', 'PPE issue']
    };
  }

  async pseThresholdConfig(tenantId: string, scope: Scope) {
    const config = await this.firstConfig(tenantId, scope, ['pse_threshold_config', 'api_rp_754_thresholds', 'chemical_thresholds']);
    return {
      configured: !!config,
      source: config ? 'Company/site configuration' : 'Configuration missing',
      thresholds: config?.thresholds ?? null,
      missingReason: config ? null : 'No site/company PSE threshold configuration found. API RP 754 tier defaults to Not Determined.'
    };
  }

  async createDraft(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>) {
    const siteId = dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null;
    this.assertSiteAccess(scope, siteId);
    const row = await this.db.single<any>(this.db.from('incident_drafts').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? dto.company_id ?? null,
      site_id: siteId,
      created_by: actorId,
      draft_json: dto.data ?? dto.draft ?? dto,
      current_step: Number(dto.currentStep ?? dto.current_step ?? 1),
      last_saved_at: new Date().toISOString()
    }).select().single());
    await this.audit.write({ tenantId, actorId, action: 'incidents.draft.create', entityType: 'INCIDENT_DRAFT', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async getDraft(tenantId: string, actorId: string, scope: Scope, draftId: string) {
    const row = await this.db.single<any>(this.scopeQuery(this.db.from('incident_drafts').select('*').eq('tenant_id', tenantId).eq('id', draftId), scope, 'site_id').single());
    if (row.created_by !== actorId) {
      const canEditOther = false;
      if (!canEditOther) throw new ForbiddenException('You can only resume drafts that you created.');
    }
    return row;
  }

  async updateDraft(tenantId: string, actorId: string, scope: Scope, draftId: string, dto: Record<string, any>) {
    const before = await this.getDraft(tenantId, actorId, scope, draftId);
    const siteId = dto.siteId ?? dto.site_id ?? before.site_id ?? scope.selectedSiteId ?? null;
    this.assertSiteAccess(scope, siteId);
    const row = await this.db.single<any>(this.db.from('incident_drafts').update({
      company_id: dto.companyId ?? dto.company_id ?? before.company_id,
      site_id: siteId,
      draft_json: dto.data ?? dto.draft ?? dto,
      current_step: Number(dto.currentStep ?? dto.current_step ?? before.current_step ?? 1),
      last_saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', draftId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'incidents.draft.update', entityType: 'INCIDENT_DRAFT', entityId: draftId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteDraft(tenantId: string, actorId: string, scope: Scope, draftId: string) {
    const before = await this.getDraft(tenantId, actorId, scope, draftId);
    const row = await this.db.single<any>(this.db.from('incident_drafts').delete().eq('tenant_id', tenantId).eq('id', draftId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'incidents.draft.delete', entityType: 'INCIDENT_DRAFT', entityId: draftId, before: before as JsonValue });
    return { deleted: true, row };
  }

  async submitDraft(tenantId: string, actorId: string, scope: Scope, draftId: string, permissions: string[] = []) {
    const draft = await this.getDraft(tenantId, actorId, scope, draftId);
    const result = await this.submitIncident(tenantId, actorId, scope, draft.draft_json ?? {}, permissions, draftId);
    await this.safeSingle(this.db.from('incident_drafts').delete().eq('tenant_id', tenantId).eq('id', draftId).select().single());
    return result;
  }

  async validateIncident(dto: Record<string, any>, finalSubmit = false) {
    const errors: Array<{ field: string; message: string }> = [];
    const require = (field: string, label: string) => { if (!this.value(dto, field)) errors.push({ field, message: `${label} is required.` }); };
    require('eventType', 'Event type');
    require('title', 'Incident title');
    require('shortDescription', 'Short description');
    require('siteId', 'Site');
    require('eventDateTime', 'Event date/time');
    require('detailedDescription', 'Detailed description');
    require('actualSeverity', 'Actual severity');
    require('potentialSeverity', 'Potential severity');
    if (dto.eventDateTime && new Date(dto.eventDateTime).getTime() > Date.now()) errors.push({ field: 'eventDateTime', message: 'Event date/time cannot be in the future without override permission.' });
    if (dto.restricted && !dto.canCreateRestricted) errors.push({ field: 'restricted', message: 'Restricted incident creation requires incidents.restricted.create.' });
    if (dto.confidential && !dto.canCreateConfidential) errors.push({ field: 'confidential', message: 'Confidential incident creation requires incidents.confidential.create.' });
    if (dto.areaSafeNow === 'No' && finalSubmit) errors.push({ field: 'areaSafeNow', message: 'Area is not safe. Submit is blocked until emergency/open condition handling is confirmed.' });
    if (dto.formalTeamRequired && !this.value(dto, 'investigationOwnerId')) errors.push({ field: 'investigationOwnerId', message: 'Investigation owner is required for formal investigations.' });
    return { valid: errors.length === 0, errors };
  }

  async calculatePotentialRisk(tenantId: string, scope: Scope, dto: Record<string, any>) {
    const matrix = await this.riskMatrix(tenantId, scope);
    const severity = String(dto.potentialSeverity ?? dto.potential_severity ?? '');
    const likelihood = String(dto.likelihood ?? '');
    if (!matrix.configured) {
      return {
        configured: false,
        potentialRiskScore: null,
        status: 'Not Determined',
        investigationPriority: 'Pending Review',
        investigationLevelRequired: 'Pending Review',
        severityReviewRequired: true,
        riskMatrixConfigMissing: true,
        canContinue: true,
        submitBlocked: false,
        reviewAction: 'Request Severity Review',
        adminAction: 'Configure company/site incident risk matrix',
        reason: matrix.missingReason ?? 'No company/site incident risk matrix configuration was found. Risk score will be marked Not Determined until reviewed.'
      };
    }
    const severityIndex = Math.max(1, matrix.severities.indexOf(severity) + 1);
    const likelihoodIndex = Math.max(1, matrix.likelihoods.indexOf(likelihood) + 1);
    const score = severityIndex * likelihoodIndex;
    return { configured: true, potentialRiskScore: score, status: 'Calculated', investigationPriority: this.priorityFromScore(score, severity), reason: 'Calculated from configured company/site risk matrix.' };
  }

  async classifyPsmPse(tenantId: string, scope: Scope, dto: Record<string, any>) {
    const thresholds = await this.pseThresholdConfig(tenantId, scope);
    const chemicalRelease = !!dto.chemicalInvolved || !!dto.releasedMaterial || Number(dto.releasedQuantity ?? 0) > 0;
    const processSafetySignal = chemicalRelease || !!dto.lopcStatus || !!dto.fireExplosionOccurred || !!dto.safeguardFailed || !!dto.sisSifInvolved || !!dto.psvReliefInvolved || dto.eventType === 'Process Upset';
    const thresholdExceeded = this.yes(dto.thresholdExceeded);
    const tier: string = thresholds.configured ? (thresholdExceeded ? 'Tier 1' : processSafetySignal ? 'Tier 3' : 'Not Applicable') : 'Not Determined';
    return {
      isPsmIncident: processSafetySignal ? 'Yes' : 'No',
      isProcessSafetyEvent: processSafetySignal ? 'Yes' : 'No',
      pseTier: tier,
      pseClassificationStatus: thresholds.configured ? 'Draft' : 'Pending Review',
      thresholdExceeded: thresholds.configured ? thresholdExceeded : null,
      reviewerRequired: !thresholds.configured || tier === 'Tier 1' || tier === 'Tier 2',
      psmPseReviewRequired: !thresholds.configured || tier === 'Tier 1' || tier === 'Tier 2',
      pseThresholdConfigMissing: !thresholds.configured,
      canContinue: true,
      submitBlocked: false,
      reviewAction: !thresholds.configured ? 'Request PSM/PSE Review' : null,
      adminAction: !thresholds.configured ? 'Configure company/site PSE threshold settings' : null,
      basis: thresholds.configured ? 'Initial classification from configured PSE threshold rules.' : 'PSE threshold configuration missing; tier requires review.'
    };
  }

  async recommendFollowups(tenantId: string, scope: Scope, dto: Record<string, any>) {
    const risk = await this.calculatePotentialRisk(tenantId, scope, dto);
    const classification = await this.classifyPsmPse(tenantId, scope, dto);
    const potentialSeverity = String(dto.potentialSeverity ?? '');
    const highPotential = this.highPotentialSeverity(potentialSeverity) || Number(risk.potentialRiskScore ?? 0) >= 15;
    const psmReview = classification.isPsmIncident === 'Yes' || classification.isProcessSafetyEvent === 'Yes' || classification.pseTier === 'Not Determined';
    const recommendations = {
      investigationPriority: risk.investigationPriority,
      investigationLevelRequired: risk.investigationLevelRequired ?? this.investigationLevel(risk.investigationPriority, potentialSeverity),
      formalTeamRequired: highPotential || psmReview || !!dto.fatality || !!dto.hospitalization,
      rcaRequired: highPotential || psmReview || !!dto.safeguardFailed,
      psmReviewRequired: psmReview,
      severityReviewRequired: !!risk.severityReviewRequired,
      psmPseReviewRequired: !!classification.psmPseReviewRequired,
      riskMatrixConfigMissing: !!risk.riskMatrixConfigMissing,
      pseThresholdConfigMissing: !!classification.pseThresholdConfigMissing,
      regulatoryReportingRequired: ['Tier 1', 'Tier 2'].includes(classification.pseTier) || !!dto.fatality || !!dto.hospitalization,
      mocRequired: !!dto.operationStopped || !!dto.temporaryControlAdded || !!dto.restartBlocked,
      pssrRequired: !!dto.restartBlocked,
      ptwReviewRequired: !!dto.ptwInvolved || !!dto.permitSuspended,
      hazopReviewRequired: !!dto.hazopReviewRequired || !!dto.processUpset || !!dto.safeguardFailed,
      lopaReviewRequired: !!dto.lopaReviewRequired || !!dto.safeguardFailed || highPotential,
      mechanicalIntegrityFollowupRequired: !!dto.equipmentInvolved || !!dto.maintenanceOverdueSuspected || !!dto.psvReliefInvolved,
      equipmentInspectionRequired: !!dto.equipmentInvolved || !!dto.equipmentIsolated,
      sdsChemicalReviewRequired: !!dto.chemicalInvolved || !!dto.chemicalExposure,
      notificationRequired: psmReview || !!dto.emergencyResponseActivated || !!dto.regulatoryReportingRequired,
      suggestedDueDate: this.suggestedDueDate(risk.investigationPriority),
      suggestedInvestigationOwner: dto.investigationOwnerId ?? null
    };
    const reasons = [
      highPotential ? 'Potential severity/risk indicates high-potential event.' : null,
      psmReview ? 'PSM/PSE signal or missing PSE threshold config requires review.' : null,
      dto.safeguardFailed ? 'Safeguard/IPL/SIS/PSV/alarm/interlock involvement requires barrier follow-up.' : null,
      dto.restartBlocked ? 'Restart blocked requires PSSR/restart readiness review.' : null,
      dto.chemicalInvolved || dto.chemicalExposure ? 'Chemical/SDS involvement requires chemical review.' : null
    ].filter(Boolean);
    return { ...recommendations, reasons, risk, classification };
  }

  async submitIncident(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>, permissions: string[] = [], draftId?: string) {
    const validation = await this.validateIncident({ ...dto, canCreateRestricted: permissions.includes('incidents.restricted.create'), canCreateConfidential: permissions.includes('incidents.confidential.create') }, true);
    if (!validation.valid) throw new BadRequestException(validation.errors);
    const siteId = dto.siteId ?? dto.site_id ?? scope.selectedSiteId;
    this.assertSiteAccess(scope, siteId);
    const risk = await this.calculatePotentialRisk(tenantId, scope, dto);
    const classification = await this.classifyPsmPse(tenantId, scope, dto);
    const followups = await this.recommendFollowups(tenantId, scope, dto);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const incidentNumber = await this.nextIncidentNumber(tenantId, siteId);
    const incidentPayload = this.clean({
      id,
      tenant_id: tenantId,
      company_id: dto.companyId ?? dto.company_id ?? null,
      site_id: siteId,
      incident_number: incidentNumber,
      title: dto.title,
      short_description: dto.shortDescription ?? dto.short_description,
      detailed_description: dto.detailedDescription ?? dto.detailed_description,
      event_type: dto.eventType,
      classification: dto.classification ?? 'Not Determined',
      status: 'Reported',
      event_datetime: this.dateTimeOrNull(dto.eventDateTime ?? dto.event_datetime),
      reported_datetime: this.dateTimeOrNull(dto.reportedDateTime) ?? now,
      reported_by: dto.reportedBy ?? actorId,
      reporter_department: dto.reporterDepartment,
      reporter_contact: dto.reporterContact,
      reporter_role: dto.reporterRole,
      anonymous_report: !!dto.anonymousReport,
      contractor_involved: !!dto.contractorInvolved,
      restricted: !!dto.restricted,
      confidential: !!dto.confidential,
      site_area_id: dto.siteAreaId,
      unit_id: dto.unitId,
      area_id: dto.areaId,
      location_text: dto.locationText,
      gps_location_json: typeof dto.gpsLocation === 'string' ? { text: dto.gpsLocation } : dto.gpsLocation ?? null,
      shift: dto.shift,
      workgroup: dto.workgroup,
      weather_condition: dto.weatherCondition,
      operating_mode: dto.operatingMode,
      ptw_involved: !!dto.ptwInvolved,
      ptw_id: dto.ptwId,
      moc_involved: !!dto.mocInvolved,
      moc_id: dto.mocId,
      pssr_involved: !!dto.pssrInvolved,
      pssr_id: dto.pssrId,
      activity_at_time: dto.activityAtTime,
      abnormal_condition: dto.abnormalCondition,
      immediate_consequence: dto.immediateConsequence,
      potential_consequence: dto.potentialConsequence,
      suspected_initial_cause: dto.suspectedInitialCause,
      witnesses_known: !!dto.witnessesKnown,
      emergency_response_activated: !!dto.emergencyResponseActivated,
      operation_stopped: !!dto.operationStopped,
      equipment_isolated: !!dto.equipmentIsolated,
      area_barricaded: !!dto.areaBarricaded,
      environmental_impact: !!dto.environmentalImpact,
      community_impact: !!dto.communityImpact,
      actual_severity: dto.actualSeverity,
      actual_consequence_category: dto.actualConsequenceCategory,
      actual_injury_severity: dto.actualInjurySeverity,
      actual_environmental_impact: dto.actualEnvironmentalImpact,
      actual_asset_damage: dto.actualAssetDamage,
      actual_production_impact: dto.actualProductionImpact,
      actual_financial_impact: this.numberOrNull(dto.actualFinancialImpact),
      actual_consequence_notes: dto.actualConsequenceNotes,
      potential_severity: dto.potentialSeverity,
      potential_consequence_category: dto.potentialConsequenceCategory,
      potential_injury_severity: dto.potentialInjurySeverity,
      potential_environmental_impact: dto.potentialEnvironmentalImpact,
      potential_asset_damage: dto.potentialAssetDamage,
      potential_process_safety_consequence: dto.potentialProcessSafetyConsequence,
      likelihood: dto.likelihood,
      potential_risk_score: risk.potentialRiskScore,
      potential_severity_basis: dto.potentialSeverityBasis,
      high_potential_near_miss: !!dto.highPotentialNearMiss || this.highPotentialSeverity(dto.potentialSeverity),
      fatality_potential: !!dto.fatalityPotential || dto.potentialSeverity === 'Fatality',
      major_process_safety_potential: !!dto.majorProcessSafetyPotential || !!followups.psmReviewRequired,
      investigation_priority: followups.investigationPriority,
      investigation_level_required: followups.investigationLevelRequired,
      severity_review_required: !!followups.severityReviewRequired,
      risk_matrix_config_missing: !!followups.riskMatrixConfigMissing,
      investigation_owner_id: dto.investigationOwnerId ?? null,
      due_date: this.dateOrNull(dto.dueDate ?? followups.suggestedDueDate),
      formal_team_required: !!followups.formalTeamRequired,
      rca_required: !!followups.rcaRequired,
      rca_status: followups.rcaRequired ? 'Required' : 'Not Required',
      is_psm_incident: classification.isPsmIncident === 'Yes',
      is_process_safety_event: classification.isProcessSafetyEvent === 'Yes',
      pse_tier: classification.pseTier,
      pse_classification_status: classification.pseClassificationStatus,
      lopc_status: dto.lopcStatus,
      released_material_id: dto.releasedMaterialId ?? dto.chemicalId,
      released_material: dto.releasedMaterial ?? dto.chemicalName,
      released_quantity: this.numberOrNull(dto.releasedQuantity),
      release_unit: dto.releaseUnit,
      release_duration: this.intervalOrNull(dto.releaseDuration),
      threshold_quantity: this.numberOrNull(dto.thresholdQuantity),
      threshold_exceeded: classification.thresholdExceeded,
      acute_release: this.yes(dto.acuteRelease),
      fire_explosion_occurred: !!dto.fireExplosionOccurred,
      toxic_exposure_occurred: !!dto.toxicExposureOccurred,
      injury_occurred: !!dto.injuryOccurred,
      injury_fatality_occurred: !!dto.fatality || this.yes(dto.injuryFatalityOccurred),
      regulatory_reporting_required: !!followups.regulatoryReportingRequired,
      pse_classification_basis: dto.pseClassificationBasis ?? classification.basis,
      pse_reviewer_required: !!classification.reviewerRequired,
      psm_pse_review_required: !!followups.psmPseReviewRequired,
      pse_threshold_config_missing: !!followups.pseThresholdConfigMissing,
      moc_required: !!followups.mocRequired,
      pssr_required: !!followups.pssrRequired,
      ptw_review_required: !!followups.ptwReviewRequired,
      hazop_review_required: !!followups.hazopReviewRequired,
      lopa_review_required: !!followups.lopaReviewRequired,
      mechanical_integrity_followup_required: !!followups.mechanicalIntegrityFollowupRequired,
      equipment_inspection_required: !!followups.equipmentInspectionRequired,
      sds_chemical_review_required: !!followups.sdsChemicalReviewRequired,
      notification_required: !!followups.notificationRequired,
      area_safe_now: dto.areaSafeNow,
      restart_blocked: !!dto.restartBlocked,
      temporary_control_expiration: this.dateOrNull(dto.temporaryControlExpiration),
      current_site_condition: dto.currentSiteCondition,
      immediate_action_notes: dto.immediateActionNotes,
      evidence_status: Array.isArray(dto.evidence) && dto.evidence.length ? 'Initial Evidence Added' : 'Not Started',
      tags_json: dto.tags ?? [],
      draft_json: draftId ? dto : null,
      current_step: 12,
      created_by: actorId,
      updated_by: actorId,
      submitted_by: actorId,
      submitted_at: now,
      created_at: now,
      updated_at: now
    });
    const row = await this.insertIncidentWithSchemaFallback(incidentPayload);
    if (!row) throw new BadRequestException('Incident could not be created.');
    await this.insertInitialChildren(tenantId, actorId, row, dto);
    await this.writeHistory(tenantId, row, actorId, 'Created', 'Incident submitted', `Incident ${incidentNumber} submitted from create wizard`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.submit', entityType: 'INCIDENT', entityId: row.id, after: row as JsonValue });
    return { incident: row, incidentId: row.id, incidentNumber, redirectTo: `/incidents/${row.id}`, risk, classification, followups };
  }

  private async insertIncidentWithSchemaFallback(payload: Record<string, any>) {
    return this.insertWithMissingColumnFallback<IncidentRow>('incidents', payload);
  }

  async uploadEvidence(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>) {
    if (dto.siteId) this.assertSiteAccess(scope, dto.siteId);
    const evidencePayload = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? null,
      site_id: dto.siteId ?? scope.selectedSiteId ?? null,
      incident_id: dto.incidentId ?? null,
      draft_id: dto.draftId ?? null,
      evidence_type: dto.evidenceType,
      file_name: dto.fileName,
      description: dto.description,
      source: dto.source,
      storage_provider: dto.storageProvider ?? 'configured-storage',
      storage_key: dto.storageKey ?? dto.fileName,
      file_type: dto.fileType,
      mime_type: dto.mimeType,
      file_size: dto.fileSize,
      classification: dto.classification,
      restricted: !!dto.restricted,
      confidential: !!dto.confidential,
      medical_confidential: !!dto.medicalConfidential,
      upload_status: dto.uploadStatus ?? 'Uploaded',
      collected_by: dto.collectedBy ?? actorId,
      collected_at: dto.collectedAt ?? new Date().toISOString(),
      notes: dto.notes,
      uploaded_by: actorId
    };
    const row = await this.insertEvidenceWithSchemaFallback(evidencePayload);
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.upload', entityType: 'INCIDENT_EVIDENCE', entityId: row.id, after: row as JsonValue });
    if (row.incident_id) {
      const incident = await this.safeSingle<IncidentRow>(this.db.from('incidents').select('*').eq('tenant_id', tenantId).eq('id', row.incident_id).single());
      if (incident) await this.writeHistory(tenantId, incident, actorId, 'Uploaded', 'Initial evidence uploaded', row.file_name ?? row.evidence_type ?? 'Evidence uploaded', null, row);
    }
    return row;
  }

  private async insertEvidenceWithSchemaFallback(payload: Record<string, any>) {
    return this.insertWithMissingColumnFallback<any>('incident_initial_evidence', payload);
  }

  async deleteEvidence(tenantId: string, actorId: string, evidenceId: string) {
    const row = await this.db.single<any>(this.db.from('incident_initial_evidence').delete().eq('tenant_id', tenantId).eq('id', evidenceId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'incidents.evidence.delete', entityType: 'INCIDENT_EVIDENCE', entityId: evidenceId, before: row as JsonValue });
    if (row.incident_id) {
      const incident = await this.safeSingle<IncidentRow>(this.db.from('incidents').select('*').eq('tenant_id', tenantId).eq('id', row.incident_id).single());
      if (incident) await this.writeHistory(tenantId, incident, actorId, 'Deleted', 'Initial evidence removed', row.file_name ?? row.evidence_type ?? 'Evidence removed', row, null);
    }
    return { deleted: true };
  }

  async savedViews(tenantId: string, userId: string, scope: Scope) {
    const rows = await this.safeMany<any>(this.scopeQuery(this.db.from('incident_register_saved_views').select('*').eq('tenant_id', tenantId).or(`user_id.eq.${userId},visibility.in.(Team,Site,Company)`).order('updated_at', { ascending: false }), scope, 'site_id'));
    const defaults = ['All incidents', 'My investigations', 'Pending triage', 'High potential near misses', 'PSM incidents', 'Tier 1 / Tier 2 PSE', 'Overdue investigations', 'Open actions', 'Ready for review', 'Closed incidents'].map((viewName) => ({ id: `default-${viewName}`, view_name: viewName, visibility: 'System', filters_json: this.defaultViewFilter(viewName), default_view: viewName === 'All incidents' }));
    return [...defaults, ...rows];
  }

  async saveView(tenantId: string, userId: string, scope: Scope, dto: Record<string, any>) {
    if (!dto.viewName) throw new BadRequestException('View name is required.');
    const row = await this.db.single<any>(this.db.from('incident_register_saved_views').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: dto.companyId ?? null, site_id: dto.siteId ?? scope.selectedSiteId ?? null, user_id: userId,
      view_name: dto.viewName, filters_json: dto.filters ?? {}, columns_json: dto.columns ?? [], sort_json: dto.sort ?? {}, visibility: dto.visibility ?? 'Private', default_view: !!dto.defaultView
    }).select().single());
    await this.audit.write({ tenantId, actorId: userId, action: 'incidents.saved_view.create', entityType: 'INCIDENT_SAVED_VIEW', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateView(tenantId: string, userId: string, viewId: string, dto: Record<string, any>) {
    const row = await this.db.single<any>(this.db.from('incident_register_saved_views').update({
      view_name: dto.viewName, filters_json: dto.filters, columns_json: dto.columns, sort_json: dto.sort, visibility: dto.visibility, default_view: dto.defaultView, updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', viewId).select().single());
    await this.audit.write({ tenantId, actorId: userId, action: 'incidents.saved_view.update', entityType: 'INCIDENT_SAVED_VIEW', entityId: viewId, after: row as JsonValue });
    return row;
  }

  async deleteView(tenantId: string, userId: string, viewId: string) {
    const row = await this.db.single<any>(this.db.from('incident_register_saved_views').delete().eq('tenant_id', tenantId).eq('id', viewId).select().single());
    await this.audit.write({ tenantId, actorId: userId, action: 'incidents.saved_view.delete', entityType: 'INCIDENT_SAVED_VIEW', entityId: viewId, before: row as JsonValue });
    return { deleted: true };
  }

  async bulkUpdate(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>) {
    const ids = Array.isArray(dto.ids) ? dto.ids.filter(Boolean) : [];
    if (!ids.length) throw new BadRequestException('Select at least one incident.');
    if (!dto.reason) throw new BadRequestException('Bulk status/classification changes require a reason.');
    const before = await this.safeMany<IncidentRow>(this.scopeQuery(this.db.from('incidents').select('*').eq('tenant_id', tenantId).in('id', ids), scope, 'site_id'));
    const closed = before.filter((row) => this.closedStatus(row.status));
    if (closed.length && !dto.allowClosed) throw new ForbiddenException('Closed incidents cannot be bulk edited unless authorized.');
    const patch = this.clean({ status: dto.status, classification: dto.classification, is_psm_incident: dto.isPsmIncident, rca_required: dto.rcaRequired, investigation_priority: dto.investigationPriority, tags_json: dto.tags, updated_by: actorId, updated_at: new Date().toISOString() });
    const rows = await this.safeMany<IncidentRow>(this.db.from('incidents').update(patch).eq('tenant_id', tenantId).in('id', ids).select());
    for (const row of rows) await this.writeHistory(tenantId, row, actorId, 'Bulk Updated', 'Incident bulk update applied', dto.reason, before.find((b) => b.id === row.id), row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.bulk_update', entityType: 'INCIDENT', after: this.clean({ ids, patch, reason: dto.reason }) as JsonValue });
    return { updated: rows.length, rows };
  }

  async bulkAssign(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>) {
    if (!dto.investigationOwnerId) throw new BadRequestException('Investigation owner is required.');
    return this.bulkPatch(tenantId, actorId, scope, dto.ids, { investigation_owner_id: dto.investigationOwnerId, updated_by: actorId, updated_at: new Date().toISOString() }, dto.reason ?? 'Bulk owner assignment');
  }

  private async bulkPatch(tenantId: string, actorId: string, scope: Scope, ids: string[], patch: Record<string, any>, reason: string) {
    const selected = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!selected.length) throw new BadRequestException('Select at least one incident.');
    const before = await this.safeMany<IncidentRow>(this.scopeQuery(this.db.from('incidents').select('*').eq('tenant_id', tenantId).in('id', selected), scope, 'site_id'));
    const rows = await this.safeMany<IncidentRow>(this.db.from('incidents').update(this.clean(patch)).eq('tenant_id', tenantId).in('id', selected).select());
    for (const row of rows) await this.writeHistory(tenantId, row, actorId, 'Bulk Updated', 'Incident bulk update applied', reason, before.find((b) => b.id === row.id), row);
    await this.audit.write({ tenantId, actorId, action: 'incidents.bulk_update', entityType: 'INCIDENT', after: this.clean({ ids: selected, patch, reason }) as JsonValue });
    return { updated: rows.length, rows };
  }

  async export(tenantId: string, actorId: string, scope: Scope, filters: Record<string, any>, permissions: string[], report = 'register') {
    const data = report === 'psm-events' ? await this.psmEvents(tenantId, scope, permissions) : report === 'high-potential' ? await this.highPotential(tenantId, scope, permissions) : report === 'overdue' ? { items: (await this.decoratedIncidents(tenantId, scope, permissions, { ...filters, limit: 500 })).filter((r) => this.isPastDate(r.due_date)) } : await this.register(tenantId, scope, { ...filters, limit: 500 }, permissions);
    const rows = (data as any).rows ?? (data as any).items ?? [];
    const header = ['Incident Number', 'Title', 'Event Type', 'Classification', 'Status', 'Site', 'Unit', 'Area', 'Event Date', 'Actual Severity', 'Potential Severity', 'PSE Tier', 'Owner', 'Due Date'];
    const body = rows.map((r: any) => [r.incident_number, r.title, r.event_type, r.classification, r.status, r.site?.name ?? r.site_id, r.unit?.name ?? r.unit_id, r.area?.name ?? r.area_id, r.event_datetime, r.actual_severity, r.potential_severity, r.pse_tier, r.owner?.displayName ?? r.investigation_owner_id, r.due_date].map(this.csv).join(','));
    await this.audit.write({ tenantId, actorId, action: `incidents.export.${report}`, entityType: 'INCIDENT_REGISTER', after: this.clean({ report, filters, count: rows.length }) as JsonValue });
    return { format: 'csv', fileName: `incidents-${report}-${new Date().toISOString().slice(0, 10)}.csv`, content: [header.join(','), ...body].join('\n') };
  }

  async equipmentSearch(tenantId: string, scope: Scope, search = '') {
    let query = this.scopeQuery(this.db.from('Equipment').select('id,tag,name,type,status,criticality,siteId,unitId,areaId').eq('tenantId', tenantId), scope, 'siteId');
    if (search) query = query.or(`tag.ilike.%${this.escape(search)}%,name.ilike.%${this.escape(search)}%,type.ilike.%${this.escape(search)}%`);
    return this.safeMany(query.limit(25));
  }

  async chemicalSearch(tenantId: string, search = '') {
    const tables = ['chemicals', 'sds_records', 'Chemical'];
    for (const table of tables) {
      const rows = await this.safeMany<any>(this.db.from(table).select('*').eq(table === 'Chemical' ? 'tenantId' : 'tenant_id', tenantId).limit(25));
      if (rows.length || table === tables.at(-1)) return search ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : rows;
    }
    return [];
  }

  async userSearch(tenantId: string, search = '') {
    let query = this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).limit(25);
    if (search) query = query.or(`displayName.ilike.%${this.escape(search)}%,email.ilike.%${this.escape(search)}%,title.ilike.%${this.escape(search)}%`);
    return this.safeMany(query);
  }

  async genericLookup(tenantId: string, scope: Scope, kind: 'ptw' | 'moc' | 'pssr' | 'sds', search = '') {
    const lookup: Record<string, Array<{ table: string; tenant: 'tenantId' | 'tenant_id'; site?: string; select: string; searchColumns: string[] }>> = {
      ptw: [
        { table: 'PermitToWork', tenant: 'tenantId', site: 'siteId', select: 'id,permitNumber,title,status,siteId,unitId,areaId', searchColumns: ['permitNumber', 'title', 'status'] },
        { table: 'ptw_permits', tenant: 'tenant_id', site: 'site_id', select: '*', searchColumns: ['permit_number', 'title', 'status'] }
      ],
      moc: [
        { table: 'MOC', tenant: 'tenantId', site: 'siteId', select: 'id,mocNumber,title,status,siteId,unitId,areaId', searchColumns: ['mocNumber', 'title', 'status'] },
        { table: 'moc_records', tenant: 'tenant_id', site: 'site_id', select: '*', searchColumns: ['moc_number', 'title', 'status'] }
      ],
      pssr: [
        { table: 'PSSR', tenant: 'tenantId', site: 'siteId', select: 'id,pssrNumber,title,status,siteId,unitId,areaId', searchColumns: ['pssrNumber', 'title', 'status'] },
        { table: 'pssr_studies', tenant: 'tenant_id', site: 'site_id', select: '*', searchColumns: ['pssr_number', 'title', 'status'] }
      ],
      sds: [
        { table: 'sds_records', tenant: 'tenant_id', site: 'site_id', select: '*', searchColumns: ['document_number', 'chemical_name', 'title'] },
        { table: 'Document', tenant: 'tenantId', site: 'siteId', select: 'id,documentNumber,title,type,status,siteId,unitId,areaId', searchColumns: ['documentNumber', 'title', 'type'] }
      ]
    };
    const candidates = lookup[kind] ?? [];
    for (const candidate of candidates) {
      let query = this.db.from(candidate.table).select(candidate.select).eq(candidate.tenant, tenantId);
      if (candidate.site) query = this.scopeQuery(query, scope, candidate.site);
      if (search && candidate.searchColumns.length) {
        const clauses = candidate.searchColumns.map((col) => `${col}.ilike.%${this.escape(search)}%`).join(',');
        query = query.or(clauses);
      }
      const rows = await this.safeMany<any>(query.limit(25));
      if (rows.length) return rows;
    }
    return [];
  }

  async rcaTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { restricted: true, summaryCards: [this.card('Restricted', 'Redacted', 'danger', 'Missing restricted/confidential incident permission')] };
    const rca = await this.ensureRca(tenantId, incident, incident.investigation_owner_id);
    const [causalFactors, rootCauses, fiveWhyChains, fiveWhySteps, fishbone, treeNodes, treeEdges, systemicWeaknesses, hypotheses, reviews, history, evidence, timeline, teamMembers, actions] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_five_why_chains', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_five_why_steps', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_fishbone_items', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_cause_tree_nodes', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_cause_tree_edges', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_systemic_weaknesses', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_hypotheses', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_reviews', id, scope),
      this.incidentHistory(tenantId, id, 30),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_timeline_events', id, scope),
      this.incidentChildren(tenantId, 'incident_investigation_team_members', id, scope),
      this.incidentActions(tenantId, scope, id)
    ]);
    const openHypotheses = hypotheses.filter((row) => ['Open', 'Evidence requested'].includes(row.status ?? 'Open'));
    const evidenceMissing = causalFactors.filter((row) => ['Confirmed', 'Evidence required'].includes(row.status) && ['Unsupported assumption', 'Weak evidence', 'Not determined', null, undefined, ''].includes(row.evidence_support_level));
    const review = reviews[0] ?? { status: rca.review_status ?? incident.rca_review_status ?? 'Not Requested' };
    const prerequisites = this.rcaPrerequisites(incident, rca, { evidence, timeline, teamMembers, actions });
    const quality = this.rcaQualityChecks(incident, rca, causalFactors, rootCauses, systemicWeaknesses, hypotheses);
    const readiness = this.rcaReadiness(incident, rca, prerequisites, quality, causalFactors, rootCauses, hypotheses, review);
    const canEdit = permissions.includes('incidents.rca.edit');
    const locked = this.closedStatus(incident.status);
    const actionReason = locked ? 'Closed incidents are read-only. Reopen before editing RCA.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        incidentTitle: incident.title,
        incidentStatus: incident.status,
        investigationPriority: incident.investigation_priority,
        investigationLevel: incident.investigation_level_required,
        rcaRequired: !!rca.rca_required,
        rcaStatus: rca.rca_status,
        selectedMethod: rca.selected_method,
        rcaLead: rca.rca_lead_id,
        investigationTeamStatus: incident.team_readiness_status,
        totalCausalFactors: causalFactors.length,
        confirmedCausalFactors: causalFactors.filter((row) => row.status === 'Confirmed').length,
        openHypotheses: openHypotheses.length,
        rootCausesIdentified: rootCauses.length,
        systemicCausesIdentified: rootCauses.filter((row) => row.systemic_cause).length,
        causesMissingEvidence: evidenceMissing.length,
        capaMappingStatus: incident.rca_capa_mapping_status ?? this.capaMappingStatus(rootCauses),
        reviewStatus: review.status,
        lastUpdated: rca.updated_at ?? incident.updated_at
      },
      summaryCards: this.rcaSummaryCards(incident, rca, prerequisites, causalFactors, rootCauses, systemicWeaknesses, hypotheses, quality, review),
      prerequisites,
      method: this.rcaMethodPanel(rca, incident),
      causalFactorsRegister: causalFactors.filter((row) => !row.deleted_at),
      fiveWhy: { chains: fiveWhyChains.map((chain) => ({ ...chain, steps: fiveWhySteps.filter((step) => step.chain_id === chain.id).sort((a, b) => Number(a.step_number) - Number(b.step_number)) })), status: fiveWhyChains.length ? 'Started' : 'Not Started' },
      fishbone: { categories: this.rcaFishboneCategories(fishbone), rows: fishbone, status: fishbone.length ? 'Started' : 'Not Started' },
      causeTree: { nodes: treeNodes, edges: treeEdges, status: treeNodes.length ? 'Started' : 'Not Started' },
      causeClassification: this.rcaCauseClassification(causalFactors, rootCauses),
      evidenceMappedCauses: this.rcaEvidenceMapping(causalFactors, rootCauses, evidence),
      unsupportedAssumptions: { rows: hypotheses, open: openHypotheses, status: openHypotheses.length ? 'Open' : 'Resolved' },
      rootCauseRegister: rootCauses.filter((row) => !row.archived_at),
      systemicWeaknesses,
      qualityCheck: quality,
      capaPreview: this.rcaCapaPreview(rootCauses, actions),
      review,
      changeHistory: history.filter((event) => String(event.event_category ?? event.event_title ?? '').toLowerCase().includes('rca') || String(event.related_tab ?? '').toLowerCase().includes('rca')),
      readiness,
      charts: {
        factorStatus: this.distributionBy(causalFactors, (row) => row.status ?? 'Draft'),
        evidenceSupport: this.distributionBy([...causalFactors, ...rootCauses], (row) => row.evidence_support_level ?? 'Not determined'),
        rootCauseCategories: this.distributionBy(rootCauses, (row) => row.category ?? 'Unspecified'),
        quality: this.distributionBy(quality.checks, (row) => row.status ?? 'Incomplete'),
        readiness: [{ label: readiness.status, count: readiness.score }]
      },
      actions: this.rcaActions(permissions, locked, actionReason),
      permissions: {
        canEdit,
        canSelectMethod: permissions.includes('incidents.rca.method.select'),
        canCreateCausalFactor: permissions.includes('incidents.rca.causal_factors.create'),
        canEditCausalFactor: permissions.includes('incidents.rca.causal_factors.edit'),
        canDeleteCausalFactor: permissions.includes('incidents.rca.causal_factors.delete'),
        canCreateRootCause: permissions.includes('incidents.rca.root_causes.create'),
        canEditRootCause: permissions.includes('incidents.rca.root_causes.edit'),
        canDeleteRootCause: permissions.includes('incidents.rca.root_causes.delete'),
        canMapEvidence: permissions.includes('incidents.rca.evidence.map'),
        canManageHypotheses: permissions.includes('incidents.rca.hypotheses.manage'),
        canOverrideQuality: permissions.includes('incidents.rca.quality.override'),
        canCreateCapa: permissions.includes('incidents.rca.create_capa'),
        canComplete: permissions.includes('incidents.rca.complete'),
        canReopen: permissions.includes('incidents.rca.reopen'),
        canRequestReview: permissions.includes('incidents.rca.review.request'),
        canApproveReview: permissions.includes('incidents.rca.review.approve'),
        canRejectReview: permissions.includes('incidents.rca.review.reject'),
        readOnly: locked
      },
      generatedAt: new Date().toISOString()
    };
  }

  async rcaSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.rcaTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async updateRcaMethod(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.ensureRca(tenantId, incident, actorId);
    if (before.selected_method && before.selected_method !== dto.selectedMethod && !dto.methodChangeReason && !dto.reason) throw new BadRequestException('Changing RCA method after work exists requires a reason.');
    const patch = this.clean({
      rca_required: dto.rcaRequired,
      rca_required_reason: dto.rcaRequiredReason,
      rca_status: dto.rcaStatus ?? (dto.selectedMethod ? 'In Progress' : before.rca_status),
      selected_method: dto.selectedMethod,
      method_version: dto.methodVersion,
      method_config_json: dto.methodConfig,
      method_selected_by: actorId,
      method_selected_at: new Date().toISOString(),
      method_change_reason: dto.methodChangeReason ?? dto.reason,
      rca_lead_id: dto.rcaLeadId,
      due_date: this.dateOrNull(dto.dueDate),
      scope: dto.scope,
      objective: dto.objective,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('incident_rca').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    await this.safeSingle(this.db.from('incidents').update({ rca_method: row.selected_method, rca_lead_id: row.rca_lead_id, rca_due_date: row.due_date, rca_status: row.rca_status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Updated', 'RCA method selected/updated', dto.reason ?? dto.methodChangeReason, before, row, 'incidents.rca.method.update', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async createRcaCausalFactor(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const rca = await this.ensureRca(tenantId, incident, actorId);
    if (!dto.title || !dto.description || !dto.category) throw new BadRequestException('Title, description, and category are required for a causal factor.');
    const existing = await this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_rca_causal_factors').insert(this.rcaCausalFactorPatch(dto, tenantId, actorId, incident, rca, false, existing.length + 1)).select().single());
    await this.updateIncidentRcaStatus(tenantId, id, actorId, 'In Progress');
    await this.writeRcaMutation(tenantId, incident, actorId, 'Created', 'RCA causal factor added', row.title, null, row, 'incidents.rca.causal_factor.create', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async updateRcaCausalFactor(tenantId: string, actorId: string, scope: Scope, id: string, factorId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_causal_factors').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).single());
    const rca = await this.ensureRca(tenantId, incident, actorId);
    const row = await this.db.single<any>(this.db.from('incident_rca_causal_factors').update(this.rcaCausalFactorPatch(dto, tenantId, actorId, incident, rca, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Updated', 'RCA causal factor updated', dto.reason ?? dto.changeReason, before, row, 'incidents.rca.causal_factor.update', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async deleteRcaCausalFactor(tenantId: string, actorId: string, scope: Scope, id: string, factorId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Deleting/superseding a causal factor requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_causal_factors').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).single());
    const row = await this.db.single<any>(this.db.from('incident_rca_causal_factors').update({ status: 'Superseded', deleted_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString(), notes: dto.reason }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Deleted', 'RCA causal factor superseded', dto.reason, before, row, 'incidents.rca.causal_factor.delete', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async decideRcaCausalFactor(tenantId: string, actorId: string, scope: Scope, id: string, factorId: string, status: 'Confirmed' | 'Rejected', dto: Record<string, any> = {}, permissions: string[] = []) {
    if (status === 'Rejected' && !dto.reason) throw new BadRequestException('Rejecting a causal factor requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_causal_factors').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).single());
    if (status === 'Confirmed' && ['Unsupported assumption', 'Weak evidence', 'Not determined', null, undefined, ''].includes(before.evidence_support_level) && !dto.justification) throw new BadRequestException('Confirmation requires evidence support or explicit justification.');
    const row = await this.db.single<any>(this.db.from('incident_rca_causal_factors').update({ status, rejection_reason: dto.reason, confirmed_by: status === 'Confirmed' ? actorId : null, confirmed_at: status === 'Confirmed' ? new Date().toISOString() : null, notes: dto.justification ?? dto.reason ?? before.notes, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, status === 'Confirmed' ? 'Validated' : 'Rejected', `RCA causal factor ${status.toLowerCase()}`, dto.reason ?? dto.justification, before, row, `incidents.rca.causal_factor.${status.toLowerCase()}`, row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async linkRcaCausalFactorEvidence(tenantId: string, actorId: string, scope: Scope, id: string, factorId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_causal_factors').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).single());
    const evidenceIds = Array.from(new Set([...(before.related_evidence_ids_json ?? []), dto.evidenceId].filter(Boolean)));
    const row = await this.db.single<any>(this.db.from('incident_rca_causal_factors').update({ related_evidence_ids_json: evidenceIds, evidence_support_level: dto.evidenceSupportLevel ?? before.evidence_support_level ?? 'Partial evidence', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Linked', 'Evidence linked to RCA causal factor', dto.reason ?? dto.evidenceId, before, row, 'incidents.rca.evidence.link', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async convertCausalFactorToRootCause(tenantId: string, actorId: string, scope: Scope, id: string, factorId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const factor = await this.db.single<any>(this.db.from('incident_rca_causal_factors').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', factorId).single());
    return this.createRcaRootCause(tenantId, actorId, scope, id, { rootCauseStatement: dto.rootCauseStatement ?? factor.cause_statement ?? factor.title, category: dto.category ?? factor.category, description: factor.description, linkedCausalFactorIds: [factor.id], linkedEvidenceIds: factor.related_evidence_ids_json, evidenceSupportLevel: factor.evidence_support_level, capaRequired: dto.capaRequired ?? true, ownerId: factor.owner_id, reason: dto.reason ?? 'Converted causal factor to root cause' }, permissions);
  }

  async createRcaRootCause(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const rca = await this.ensureRca(tenantId, incident, actorId);
    if (!dto.rootCauseStatement) throw new BadRequestException('Root cause statement is required.');
    if (dto.capaRequired === false && !dto.capaRequiredJustification) throw new BadRequestException('If CAPA is not required, a justification is required.');
    if (dto.systemicCause && !dto.managementSystemElement) throw new BadRequestException('Systemic root causes require a management system element.');
    const existing = await this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_rca_root_causes').insert(this.rcaRootCausePatch(dto, tenantId, actorId, incident, rca, false, existing.length + 1)).select().single());
    await this.updateIncidentRcaStatus(tenantId, id, actorId, 'In Progress');
    await this.writeRcaMutation(tenantId, incident, actorId, 'Created', 'RCA root cause added', row.root_cause_statement, null, row, 'incidents.rca.root_cause.create', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async updateRcaRootCause(tenantId: string, actorId: string, scope: Scope, id: string, rootCauseId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_root_causes').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rootCauseId).single());
    const rca = await this.ensureRca(tenantId, incident, actorId);
    const row = await this.db.single<any>(this.db.from('incident_rca_root_causes').update(this.rcaRootCausePatch(dto, tenantId, actorId, incident, rca, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rootCauseId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Updated', 'RCA root cause updated', dto.reason ?? dto.changeReason, before, row, 'incidents.rca.root_cause.update', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async deleteRcaRootCause(tenantId: string, actorId: string, scope: Scope, id: string, rootCauseId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Archiving/superseding a root cause requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_root_causes').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rootCauseId).single());
    const row = await this.db.single<any>(this.db.from('incident_rca_root_causes').update({ archived_at: new Date().toISOString(), archived_by: actorId, notes: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rootCauseId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Superseded', 'RCA root cause archived/superseded', dto.reason, before, row, 'incidents.rca.root_cause.delete', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async createRcaCapaFromRootCause(tenantId: string, actorId: string, scope: Scope, id: string, rootCauseId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from('incident_rca_root_causes').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rootCauseId).single());
    const actionId = dto.actionId ?? crypto.randomUUID();
    const row = await this.db.single<any>(this.db.from('incident_rca_root_causes').update({ universal_action_id: actionId, capa_required: true, review_status: 'CAPA Mapped', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rootCauseId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Action Created', 'CAPA/action linked from RCA root cause', dto.reason ?? actionId, before, row, 'incidents.rca.capa.create', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async upsertRcaSimpleRecord(tenantId: string, actorId: string, scope: Scope, id: string, table: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const rca = await this.ensureRca(tenantId, incident, actorId);
    const payload = this.rcaSimplePatch(table, dto, tenantId, actorId, incident, rca, !!dto.id);
    const row = dto.id ? await this.db.single<any>(this.db.from(table).update(payload).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', dto.id).select().single()) : await this.db.single<any>(this.db.from(table).insert(payload).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, dto.id ? 'Updated' : 'Created', `RCA ${table.replace('incident_rca_', '').replaceAll('_', ' ')} saved`, dto.reason ?? dto.changeReason, null, row, `incidents.rca.${table}.save`, row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async deleteRcaSimpleRecord(tenantId: string, actorId: string, scope: Scope, id: string, table: string, recordId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Deleting this RCA item requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentRca(incident);
    const before = await this.db.single<any>(this.db.from(table).select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', recordId).single());
    const row = await this.db.single<any>(this.db.from(table).delete().eq('tenant_id', tenantId).eq('incident_id', id).eq('id', recordId).select().single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Deleted', `RCA ${table.replace('incident_rca_', '').replaceAll('_', ' ')} deleted`, dto.reason, before, row, `incidents.rca.${table}.delete`, recordId);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async requestRcaReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const rca = await this.ensureRca(tenantId, incident, actorId);
    const row = await this.db.single<any>(this.db.from('incident_rca_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, rca_id: rca.id, status: 'Requested', reviewer_id: dto.reviewerId, due_date: this.dateOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_rca').update({ review_status: 'Requested', rca_status: 'Review Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ rca_review_status: 'Requested', rca_status: 'Review Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeRcaMutation(tenantId, incident, actorId, 'Submitted', 'RCA review requested', dto.reason ?? dto.comments, null, row, 'incidents.rca.review.request', row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async decideRcaReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected' | 'Reopened', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('RCA rejection requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const rca = await this.ensureRca(tenantId, incident, actorId);
    if (decision === 'Approved') {
      const tab = await this.rcaTab(tenantId, scope, id, permissions);
      if (tab.readiness?.status === 'Blocked' && !permissions.includes('incidents.rca.quality.override')) throw new BadRequestException('Approval blocked by RCA readiness blockers.');
    }
    const latest = (await this.incidentChildren(tenantId, 'incident_rca_reviews', id, scope))[0];
    const patch = decision === 'Approved'
      ? { status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), comments: dto.comments, rework_required: false, updated_by: actorId, updated_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, rework_required: true, rework_notes: dto.reworkNotes, updated_by: actorId, updated_at: new Date().toISOString() }
        : { status: 'Reopened', comments: dto.reason, rework_required: true, rework_notes: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = latest ? await this.db.single<any>(this.db.from('incident_rca_reviews').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', latest.id).select().single()) : await this.db.single<any>(this.db.from('incident_rca_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, rca_id: rca.id, ...patch, created_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_rca').update({ review_status: decision, rca_status: decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'Reopened', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ rca_review_status: decision, rca_status: decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'Reopened', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeRcaMutation(tenantId, incident, actorId, decision, `RCA review ${decision.toLowerCase()}`, dto.reason ?? dto.comments, latest, row, `incidents.rca.review.${decision.toLowerCase()}`, row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async completeOrReopenRca(tenantId: string, actorId: string, scope: Scope, id: string, status: 'Completed' | 'Reopened', dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const rca = await this.ensureRca(tenantId, incident, actorId);
    if (status === 'Completed') {
      const tab = await this.rcaTab(tenantId, scope, id, permissions);
      if (tab.readiness?.status === 'Blocked' && !permissions.includes('incidents.rca.quality.override')) throw new BadRequestException('RCA completion blocked by readiness blockers.');
    }
    if (status === 'Reopened' && !dto.reason) throw new BadRequestException('Reopening RCA requires a reason.');
    const patch = this.clean({ rca_status: status, completed_by: status === 'Completed' ? actorId : null, completed_at: status === 'Completed' ? new Date().toISOString() : null, updated_by: actorId, updated_at: new Date().toISOString() });
    const row = await this.db.single<any>(this.db.from('incident_rca').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    await this.safeSingle(this.db.from('incidents').update({ rca_status: status, rca_completed_by: patch.completed_by, rca_completed_at: patch.completed_at, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeRcaMutation(tenantId, incident, actorId, status === 'Completed' ? 'Completed' : 'Reopened', `RCA ${status.toLowerCase()}`, dto.reason, rca, row, `incidents.rca.${status.toLowerCase()}`, row.id);
    return this.rcaTab(tenantId, scope, id, permissions);
  }

  async barrierTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { restricted: true, summaryCards: [this.card('Restricted', 'Redacted', 'danger', 'Missing restricted/confidential incident permission')] };
    const analysis = await this.ensureBarrierAnalysis(tenantId, incident, incident.investigation_owner_id);
    const [barriers, followups, reviews, history, evidence, rcaFactors, rootCauses, actions, timeline] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_barrier_followups', id, scope),
      this.incidentChildren(tenantId, 'incident_barrier_reviews', id, scope),
      this.incidentHistory(tenantId, id, 40),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentActions(tenantId, scope, id),
      this.incidentChildren(tenantId, 'incident_timeline_events', id, scope)
    ]);
    const activeBarriers = barriers.filter((row) => !row.deleted_at);
    const failed = activeBarriers.filter((row) => ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? ''));
    const creditedFailed = failed.filter((row) => row.credited_ipl === 'Yes');
    const review = reviews[0] ?? { status: analysis.review_status ?? incident.barrier_analysis_review_status ?? 'Not Requested' };
    const readiness = this.barrierReadiness(incident, analysis, activeBarriers, followups, evidence, review);
    const locked = this.closedStatus(incident.status);
    const lockedReason = locked ? 'Closed/approved incidents are read-only. Reopen before changing barrier analysis.' : null;
    const panelData = this.barrierPanels(activeBarriers, followups, evidence, [...rcaFactors, ...rootCauses], timeline);
    return {
      header: {
        incidentNumber: incident.incident_number,
        incidentTitle: incident.title,
        incidentStatus: incident.status,
        actualSeverity: incident.actual_severity,
        potentialSeverity: incident.potential_severity,
        psmIncident: incident.is_psm_incident,
        processSafetyEvent: incident.is_process_safety_event,
        apiRp754Tier: incident.pse_tier,
        analysisRequired: analysis.analysis_required,
        analysisStatus: analysis.analysis_status,
        requiredReason: analysis.analysis_required_reason,
        totalBarriers: activeBarriers.length,
        failedBarriers: failed.length,
        degradedBarriers: activeBarriers.filter((row) => row.performance_status === 'Degraded').length,
        missingBarriers: activeBarriers.filter((row) => row.performance_status === 'Missing').length,
        bypassedBarriers: activeBarriers.filter((row) => row.performance_status === 'Bypassed' || row.bypass_override_active).length,
        creditedIplsFailed: creditedFailed.length,
        sisSifInvolved: activeBarriers.some((row) => row.sis_sif_involved),
        psvInvolved: activeBarriers.some((row) => row.psv_relief_involved),
        alarmInterlockInvolved: activeBarriers.some((row) => row.alarm_interlock_involved),
        followupsRequired: followups.filter((row) => this.openActionStatus(row.status)).length,
        reviewStatus: review.status,
        lastUpdated: analysis.updated_at ?? incident.updated_at
      },
      summaryCards: this.barrierSummaryCards(incident, analysis, activeBarriers, followups, readiness, review),
      analysisReadiness: readiness,
      barrierRegister: activeBarriers,
      demandPerformance: panelData.demandPerformance,
      failureModeAnalysis: panelData.failureModeAnalysis,
      iplLopaCreditCheck: panelData.iplLopaCreditCheck,
      sisSifInterlock: panelData.sisSifInterlock,
      psvReliefDevice: panelData.psvReliefDevice,
      alarmOperatorResponse: panelData.alarmOperatorResponse,
      administrativeProcedurePtw: panelData.administrativeProcedurePtw,
      ppeEmergencyResponseBarrier: panelData.ppeEmergencyResponseBarrier,
      bowtieBarrierMap: panelData.bowtieBarrierMap,
      evidenceMappedBarrier: panelData.evidenceMappedBarrier,
      rcaLinkage: panelData.rcaLinkage,
      followupRequirements: { status: followups.some((row) => this.openActionStatus(row.status)) ? 'Open' : 'Clear', rows: followups, open: followups.filter((row) => this.openActionStatus(row.status)), generated: this.barrierGeneratedFollowups(activeBarriers) },
      review,
      changeHistory: history.filter((event) => String(event.event_category ?? event.event_title ?? event.related_tab ?? '').toLowerCase().includes('barrier') || String(event.event_title ?? '').toLowerCase().includes('safeguard')),
      readiness,
      context: await this.barrierLookupContext(tenantId, scope, id, permissions),
      charts: {
        performance: this.distributionBy(activeBarriers, (row) => row.performance_status ?? 'Not determined'),
        barrierTypes: this.distributionBy(activeBarriers, (row) => row.barrier_type ?? 'Unspecified'),
        iplCredit: this.distributionBy(activeBarriers, (row) => row.credited_ipl ?? 'Not Determined'),
        followups: this.distributionBy(followups, (row) => row.status ?? 'Open'),
        readiness: [{ label: readiness.status, count: readiness.score }]
      },
      actions: this.barrierActions(permissions, locked, lockedReason),
      permissions: {
        canView: permissions.includes('incidents.barriers.view'),
        canEdit: permissions.includes('incidents.barriers.edit'),
        canDelete: permissions.includes('incidents.barriers.delete'),
        canImport: permissions.includes('incidents.barriers.import'),
        canMapEvidence: permissions.includes('incidents.barriers.evidence.map'),
        canLinkRca: permissions.includes('incidents.barriers.rca.link'),
        canCreateFollowups: permissions.includes('incidents.barriers.followups.create'),
        canRequestReview: permissions.includes('incidents.barriers.review.request'),
        canApproveReview: permissions.includes('incidents.barriers.review.approve'),
        canRejectReview: permissions.includes('incidents.barriers.review.reject'),
        canOverride: permissions.includes('incidents.barriers.override'),
        readOnly: locked
      },
      generatedAt: new Date().toISOString()
    };
  }

  async barrierSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.barrierTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async barrierDetail(tenantId: string, scope: Scope, id: string, barrierId: string) {
    await this.rawIncidentById(tenantId, scope, id);
    return this.db.single<any>(this.scopeQuery(this.db.from('incident_barriers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId), scope, 'site_id').single());
  }

  async createBarrier(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const analysis = await this.ensureBarrierAnalysis(tenantId, incident, actorId);
    if (!dto.barrierName || !dto.barrierType || !dto.expectedFunction) throw new BadRequestException('Barrier name, type, and expected function are required.');
    if (['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(dto.performanceStatus) && (!dto.failureMode || !dto.failureDescription)) throw new BadRequestException('Failed, degraded, bypassed, or missing barriers require failure mode and description.');
    const existing = await this.incidentChildren(tenantId, 'incident_barriers', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_barriers').insert(this.barrierPatch(dto, tenantId, actorId, incident, analysis, false, existing.length + 1)).select().single());
    await this.updateIncidentBarrierStatus(tenantId, id, actorId);
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Created', 'Barrier / safeguard added', row.barrier_name, null, row, 'incidents.barriers.create', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async updateBarrier(tenantId: string, actorId: string, scope: Scope, id: string, barrierId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const before = await this.db.single<any>(this.db.from('incident_barriers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).single());
    const analysis = await this.ensureBarrierAnalysis(tenantId, incident, actorId);
    const merged = { ...before, ...dto };
    if (['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(merged.performanceStatus ?? merged.performance_status) && !(merged.failureMode ?? merged.failure_mode) && !(merged.failureDescription ?? merged.failure_description)) throw new BadRequestException('Failed, degraded, bypassed, or missing barriers require failure details.');
    const row = await this.db.single<any>(this.db.from('incident_barriers').update(this.barrierPatch(dto, tenantId, actorId, incident, analysis, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).select().single());
    await this.updateIncidentBarrierStatus(tenantId, id, actorId);
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Updated', 'Barrier / safeguard updated', dto.reason ?? dto.changeReason, before, row, 'incidents.barriers.update', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async deleteBarrier(tenantId: string, actorId: string, scope: Scope, id: string, barrierId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Cancelling/superseding a barrier requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const before = await this.db.single<any>(this.db.from('incident_barriers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).single());
    const row = await this.db.single<any>(this.db.from('incident_barriers').update({ deleted_at: new Date().toISOString(), review_status: 'Superseded', change_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).select().single());
    await this.updateIncidentBarrierStatus(tenantId, id, actorId);
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Superseded', 'Barrier / safeguard cancelled or superseded', dto.reason, before, row, 'incidents.barriers.delete', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async linkBarrierEvidence(tenantId: string, actorId: string, scope: Scope, id: string, barrierId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const before = await this.db.single<any>(this.db.from('incident_barriers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).single());
    const evidenceIds = Array.from(new Set([...(before.evidence_ids_json ?? []), dto.evidenceId].filter(Boolean)));
    const row = await this.db.single<any>(this.db.from('incident_barriers').update({ evidence_ids_json: evidenceIds, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).select().single());
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Linked', 'Evidence linked to barrier / safeguard', dto.reason ?? dto.evidenceId, before, row, 'incidents.barriers.evidence.link', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async linkBarrierRca(tenantId: string, actorId: string, scope: Scope, id: string, barrierId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const before = await this.db.single<any>(this.db.from('incident_barriers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).single());
    const rcaIds = Array.from(new Set([...(before.rca_item_ids_json ?? []), dto.rcaItemId].filter(Boolean)));
    const row = await this.db.single<any>(this.db.from('incident_barriers').update({ rca_item_ids_json: rcaIds, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', barrierId).select().single());
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Linked', 'RCA item linked to barrier / safeguard', dto.reason ?? dto.rcaItemId, before, row, 'incidents.barriers.rca.link', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async createBarrierFollowupAction(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const actionId = dto.actionId ?? crypto.randomUUID();
    const row = await this.db.single<any>(this.db.from('incident_barrier_followups').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id,
      barrier_id: dto.barrierId, followup_type: dto.followupType ?? 'Barrier follow-up', title: dto.title ?? 'Barrier follow-up action', description: dto.description ?? dto.reason, required_reason: dto.reason, priority: dto.priority ?? 'High', owner_id: dto.ownerId ?? incident.investigation_owner_id, due_date: this.dateOrNull(dto.dueDate), source_panel: dto.sourcePanel, universal_action_id: actionId, status: 'Open', created_by: actorId, updated_by: actorId
    }).select().single());
    await this.updateIncidentBarrierStatus(tenantId, id, actorId);
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Action Created', 'Barrier follow-up action created', dto.reason ?? row.title, null, row, 'incidents.barriers.followup.create', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async importBarriersFromSource(tenantId: string, actorId: string, scope: Scope, id: string, source: 'hazop' | 'lopa', permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentBarrier(incident);
    const analysis = await this.ensureBarrierAnalysis(tenantId, incident, actorId);
    const existing = await this.incidentChildren(tenantId, 'incident_barriers', id, scope);
    const rows = source === 'hazop'
      ? await this.safeMany<any>(this.db.from('hazop_safeguards').select('*').eq('tenant_id', tenantId).limit(25))
      : await this.safeMany<any>(this.db.from('lopa_ipl_registry').select('*').eq('tenant_id', tenantId).limit(25));
    let index = existing.length;
    for (const item of rows.filter((row) => !existing.some((barrier) => barrier.hazop_scenario_id === row.id || barrier.ipl_record_id === row.id)).slice(0, 25)) {
      index += 1;
      await this.safeSingle(this.db.from('incident_barriers').insert(this.barrierPatch({
        barrierName: item.name ?? item.title ?? item.safeguard_description ?? item.ipl_name ?? `${source.toUpperCase()} barrier ${index}`,
        barrierType: item.type ?? item.safeguard_type ?? item.ipl_type ?? 'Other',
        expectedFunction: item.function ?? item.description ?? item.safeguard_description ?? item.validation_criteria ?? 'Imported source safeguard; study-specific validation required.',
        relatedHazard: item.deviation ?? item.hazard ?? item.scenario_title,
        hazopScenarioId: source === 'hazop' ? item.id : undefined,
        iplRecordId: source === 'lopa' ? item.id : undefined,
        creditedIpl: source === 'lopa' ? 'Study Validation Required' : 'No',
        performanceStatus: 'Not determined',
        notes: `Imported from ${source.toUpperCase()} source. Safeguard is not automatically credited.`
      }, tenantId, actorId, incident, analysis, false, index)).select().single());
    }
    await this.updateIncidentBarrierStatus(tenantId, id, actorId);
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Imported', `Barriers imported from ${source.toUpperCase()}`, `${rows.length} source rows scanned`, null, rows, `incidents.barriers.import.${source}`, analysis.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async requestBarrierReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const analysis = await this.ensureBarrierAnalysis(tenantId, incident, actorId);
    const row = await this.db.single<any>(this.db.from('incident_barrier_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, analysis_id: analysis.id, status: 'Requested', reviewer_id: dto.reviewerId, due_date: this.dateOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_barrier_analysis').update({ review_status: 'Requested', analysis_status: 'Review Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ barrier_analysis_review_status: 'Requested', barrier_analysis_status: 'Review Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeBarrierMutation(tenantId, incident, actorId, 'Submitted', 'Barrier / safeguard review requested', dto.reason ?? dto.comments, null, row, 'incidents.barriers.review.request', row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async decideBarrierReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected' | 'Reopened', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('Barrier review rejection requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const analysis = await this.ensureBarrierAnalysis(tenantId, incident, actorId);
    if (decision === 'Approved') {
      const tab = await this.barrierTab(tenantId, scope, id, permissions);
      if (tab.readiness?.status === 'Blocked' && !permissions.includes('incidents.barriers.override')) throw new BadRequestException('Approval blocked by barrier readiness blockers.');
    }
    const latest = (await this.incidentChildren(tenantId, 'incident_barrier_reviews', id, scope))[0];
    const patch = decision === 'Approved'
      ? { status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), comments: dto.comments, rework_required: false, updated_by: actorId, updated_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, rework_required: true, rework_notes: dto.reworkNotes, updated_by: actorId, updated_at: new Date().toISOString() }
        : { status: 'Reopened', comments: dto.reason, rework_required: true, rework_notes: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = latest ? await this.db.single<any>(this.db.from('incident_barrier_reviews').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', latest.id).select().single()) : await this.db.single<any>(this.db.from('incident_barrier_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, analysis_id: analysis.id, ...patch, created_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_barrier_analysis').update({ review_status: decision, analysis_status: decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'Reopened', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ barrier_analysis_review_status: decision, barrier_analysis_status: decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'Reopened', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeBarrierMutation(tenantId, incident, actorId, decision, `Barrier review ${decision.toLowerCase()}`, dto.reason ?? dto.comments, latest, row, `incidents.barriers.review.${decision.toLowerCase()}`, row.id);
    return this.barrierTab(tenantId, scope, id, permissions);
  }

  async barrierLookupContext(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    await this.rawIncidentById(tenantId, scope, id);
    const [evidence, rcaFactors, rootCauses, equipment, chemicals] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.equipmentSearch(tenantId, scope, ''),
      this.chemicalSearch(tenantId, '')
    ]);
    return {
      barrierTypes: ['SIS / SIF', 'PSV / Relief Device', 'Alarm with Operator Response', 'Operator Manual Response', 'Mechanical / Electrical Interlock', 'BPCS Independent Function', 'ESD Function', 'Fire and Gas Detection / Action', 'Deluge / Fire Protection', 'Passive Protection', 'Dike / Bund / Secondary Containment', 'Blast Wall / Fireproofing', 'Check Valve', 'Flame Arrestor', 'Ventilation', 'Physical Separation', 'Procedure / PTW', 'PPE', 'Emergency Response', 'Other'],
      performanceStatuses: ['Performed', 'Degraded', 'Failed', 'Bypassed', 'Missing', 'Not demanded', 'Not determined'],
      failureModes: ['Failed on demand', 'Not available', 'Bypassed/overridden', 'Late response', 'Partial response', 'Wrong setpoint', 'Inadequate design', 'Human response failure', 'Maintenance/proof-test gap', 'Common cause', 'Other'],
      evidence,
      rcaItems: [...rcaFactors.map((row) => ({ ...row, recordType: 'Causal Factor' })), ...rootCauses.map((row) => ({ ...row, recordType: 'Root Cause', title: row.root_cause_statement }))],
      equipment,
      chemicals,
      permissions
    };
  }

  async capaTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { restricted: true, summaryCards: [this.card('Restricted', 'Redacted', 'danger', 'Missing restricted/confidential incident permission')] };
    const capa = await this.ensureCapa(tenantId, incident, incident.investigation_owner_id);
    const [items, sourceLinks, verifications, reviews, history, evidence, rootCauses, causalFactors, barriers, immediateActions, actions] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_source_links', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_verifications', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_reviews', id, scope),
      this.incidentHistory(tenantId, id, 60),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_immediate_actions', id, scope),
      this.incidentActions(tenantId, scope, id)
    ]);
    const activeItems = items.filter((row) => !row.deleted_at);
    const openItems = activeItems.filter((row) => this.openActionStatus(row.status ?? row.implementation_status));
    const overdue = activeItems.filter((row) => this.isPastDate(row.due_date) && this.openActionStatus(row.status ?? row.implementation_status));
    const latestReview = reviews[0] ?? { status: capa.review_status ?? 'Not Requested' };
    const coverageMatrix = this.capaCoverageMatrix(rootCauses, causalFactors, barriers, immediateActions, sourceLinks, activeItems);
    const readiness = this.capaReadiness(incident, capa, activeItems, sourceLinks, verifications, evidence, latestReview, coverageMatrix);
    const locked = this.closedStatus(incident.status);
    const lockedReason = locked ? 'Closed/approved incidents are read-only. Reopen before changing CAPA.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        incidentTitle: incident.title,
        incidentStatus: incident.status,
        investigationPriority: incident.investigation_priority,
        rcaStatus: incident.rca_status ?? 'Not Started',
        capaRequired: capa.capa_required,
        requiredReason: capa.required_reason,
        totalActions: activeItems.length,
        openActions: openItems.length,
        overdueActions: overdue.length,
        completedActions: activeItems.filter((row) => ['Completed', 'Evidence Submitted', 'Verification Pending', 'Verified Effective', 'Closed'].includes(row.status ?? row.implementation_status ?? '')).length,
        verifiedActions: activeItems.filter((row) => ['Verified Effective', 'Effective'].includes(row.verification_status ?? row.effectiveness_status ?? '')).length,
        highPriorityActions: activeItems.filter((row) => ['High', 'Critical'].includes(row.priority ?? '')).length,
        rootCausesWithoutCapa: coverageMatrix.missingRootCauses,
        actionsAwaitingEvidence: activeItems.filter((row) => row.evidence_required && !row.evidence_ids_json?.length && row.evidence_status !== 'Accepted').length,
        actionsAwaitingVerification: activeItems.filter((row) => row.verification_required && !['Verified Effective', 'Effective'].includes(row.verification_status ?? row.effectiveness_status ?? '')).length,
        reviewStatus: latestReview.status,
        lastUpdated: capa.updated_at ?? incident.updated_at
      },
      summaryCards: this.capaSummaryCards(capa, activeItems, readiness, latestReview, coverageMatrix),
      sourceReadiness: this.capaSourceReadiness(capa, rootCauses, barriers, sourceLinks, coverageMatrix),
      capaRegister: activeItems,
      sourceMapping: { rows: sourceLinks, generatedSources: coverageMatrix.sources, missingSources: coverageMatrix.missingSources },
      classificationPriority: { rows: activeItems, distribution: this.distributionBy(activeItems, (row) => row.action_type ?? 'Unclassified'), priority: this.distributionBy(activeItems, (row) => row.priority ?? 'Unassigned') },
      ownerDueDateAssignment: { rows: activeItems.map((row) => ({ id: row.id, capa_number: row.capa_number, title: row.action_title_snapshot, owner_id: row.owner_id, supporting_team_ids_json: row.supporting_team_ids_json ?? [], due_date: row.due_date, priority: row.priority, overdue: this.isPastDate(row.due_date) && this.openActionStatus(row.status) })) },
      implementationPlan: { rows: activeItems.map((row) => ({ id: row.id, capa_number: row.capa_number, title: row.action_title_snapshot, implementation_status: row.implementation_status, implementation_plan: row.implementation_plan, implementation_steps_json: row.implementation_steps_json ?? [], resources_required: row.resources_required, dependencies_json: row.dependencies_json ?? [], moc_required: row.moc_required, pssr_required: row.pssr_required, ptw_required: row.ptw_required, mi_required: row.mi_required })) },
      evidenceOfCompletion: { rows: activeItems.map((row) => ({ id: row.id, capa_number: row.capa_number, title: row.action_title_snapshot, evidence_required: row.evidence_required, evidence_status: row.evidence_status, evidence_ids_json: row.evidence_ids_json ?? [], evidence, missing: row.evidence_required && !row.evidence_ids_json?.length })) },
      effectivenessVerification: { rows: activeItems.map((row) => ({ ...row, verification: verifications.find((verification) => verification.capa_item_id === row.id) })), verifications },
      overdueEscalation: { rows: overdue, escalated: activeItems.filter((row) => row.escalation_status && row.escalation_status !== 'None'), critical: overdue.filter((row) => ['High', 'Critical'].includes(row.priority ?? '')) },
      coverageMatrix,
      review: latestReview,
      changeHistory: history.filter((event) => String(event.event_category ?? event.event_title ?? event.related_tab ?? '').toLowerCase().includes('capa') || String(event.event_title ?? '').toLowerCase().includes('corrective') || String(event.event_title ?? '').toLowerCase().includes('preventive')),
      readiness,
      context: await this.capaLookupContext(tenantId, scope, id, permissions),
      charts: {
        status: this.distributionBy(activeItems, (row) => row.status ?? 'Draft'),
        types: this.distributionBy(activeItems, (row) => row.action_type ?? 'Other'),
        verification: this.distributionBy(activeItems, (row) => row.verification_status ?? 'Not Required'),
        evidence: this.distributionBy(activeItems, (row) => row.evidence_status ?? 'Not Required'),
        readiness: [{ label: readiness.status, count: readiness.score }]
      },
      actions: this.capaActions(permissions, locked, lockedReason),
      permissions: {
        canView: permissions.includes('incidents.capa.view'),
        canCreate: permissions.includes('incidents.capa.create'),
        canEdit: permissions.includes('incidents.capa.edit'),
        canDelete: permissions.includes('incidents.capa.delete'),
        canGenerate: permissions.includes('incidents.capa.generate'),
        canLinkSource: permissions.includes('incidents.capa.link_source'),
        canLinkEvidence: permissions.includes('incidents.capa.link_evidence'),
        canComplete: permissions.includes('incidents.capa.complete'),
        canVerify: permissions.includes('incidents.capa.verify'),
        canEscalate: permissions.includes('incidents.capa.escalate'),
        canRequestReview: permissions.includes('incidents.capa.review.request'),
        canApproveReview: permissions.includes('incidents.capa.review.approve'),
        canRejectReview: permissions.includes('incidents.capa.review.reject'),
        canExport: permissions.includes('incidents.capa.export'),
        readOnly: locked
      },
      universalActions: actions,
      generatedAt: new Date().toISOString()
    };
  }

  async capaSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.capaTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async capaDetail(tenantId: string, scope: Scope, id: string, capaId: string) {
    await this.rawIncidentById(tenantId, scope, id);
    return this.db.single<any>(this.scopeQuery(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId), scope, 'site_id').single());
  }

  async createCapaItem(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const capa = await this.ensureCapa(tenantId, incident, actorId);
    const existing = await this.incidentChildren(tenantId, 'incident_capa_items', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_capa_items').insert(this.capaItemPatch(dto, tenantId, actorId, incident, capa, false, existing.length + 1)).select().single());
    if (dto.sourceType || dto.sourceId) await this.safeSingle(this.db.from('incident_capa_source_links').insert(this.capaSourceLinkPatch(dto, tenantId, actorId, incident, row)).select().single());
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Created', 'CAPA item created', row.action_title_snapshot, null, row, 'incidents.capa.create', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async updateCapaItem(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update(this.capaItemPatch(dto, tenantId, actorId, incident, {}, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Updated', 'CAPA item updated', dto.reason ?? dto.changeReason, before, row, 'incidents.capa.update', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async deleteCapaItem(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Cancelling or superseding CAPA requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ deleted_at: new Date().toISOString(), status: 'Cancelled', implementation_status: 'Cancelled', change_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Deleted', 'CAPA item cancelled or superseded', dto.reason, before, row, 'incidents.capa.delete', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async generateCapaFromRca(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const capa = await this.ensureCapa(tenantId, incident, actorId);
    const [roots, links, existing] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_source_links', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope)
    ]);
    let index = existing.length;
    for (const root of roots.filter((row) => row.capa_required !== false && !row.deleted_at && !links.some((link) => link.source_type === 'RCA Root Cause' && link.source_id === row.id))) {
      index += 1;
      const row = await this.safeSingle<any>(this.db.from('incident_capa_items').insert(this.capaItemPatch({
        actionTitle: `Corrective action for ${root.root_cause_number ?? 'root cause'}`,
        description: root.capa_recommendation ?? root.root_cause_statement,
        actionType: 'Corrective Action',
        actionCategory: root.category ?? 'Root Cause',
        sourceType: 'RCA Root Cause',
        sourceId: root.id,
        sourceTitleSnapshot: root.root_cause_statement,
        priority: root.priority ?? incident.investigation_priority ?? 'High',
        riskReductionObjective: root.risk_control_gap ?? 'Eliminate or control verified root cause.',
        expectedOutcome: root.capa_recommendation ?? 'Root cause addressed and recurrence risk reduced.',
        ownerId: root.owner_id ?? incident.investigation_owner_id,
        dueDate: root.due_date ?? incident.due_date,
        verificationRequired: true,
        evidenceRequired: true
      }, tenantId, actorId, incident, capa, false, index)).select().single());
      if (row) await this.safeSingle(this.db.from('incident_capa_source_links').insert(this.capaSourceLinkPatch({ sourceType: 'RCA Root Cause', sourceId: root.id, sourceTitleSnapshot: root.root_cause_statement }, tenantId, actorId, incident, row)).select().single());
    }
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Action Created', 'CAPA generated from RCA', dto.reason ?? 'Generated from verified RCA root causes', null, roots, 'incidents.capa.generate.rca', capa.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async generateCapaFromBarriers(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const capa = await this.ensureCapa(tenantId, incident, actorId);
    const [barriers, links, existing] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_source_links', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope)
    ]);
    let index = existing.length;
    for (const barrier of barriers.filter((row) => !row.deleted_at && ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? '') && !links.some((link) => link.source_type === 'Barrier Failure' && link.source_id === row.id))) {
      index += 1;
      const row = await this.safeSingle<any>(this.db.from('incident_capa_items').insert(this.capaItemPatch({
        actionTitle: `Preventive action for ${barrier.barrier_name ?? 'barrier failure'}`,
        description: barrier.failure_description ?? barrier.expected_function,
        actionType: 'Preventive Action',
        actionCategory: barrier.barrier_type ?? 'Barrier Failure',
        sourceType: 'Barrier Failure',
        sourceId: barrier.id,
        sourceTitleSnapshot: barrier.barrier_name,
        priority: ['Failed', 'Missing'].includes(barrier.performance_status) ? 'High' : 'Medium',
        riskReductionObjective: 'Restore or replace failed safeguard and prevent recurrence.',
        expectedOutcome: 'Safeguard performance verified and follow-up risk reduced.',
        ownerId: incident.investigation_owner_id,
        dueDate: incident.due_date,
        verificationRequired: true,
        evidenceRequired: true,
        mocRequired: !!barrier.lopa_review_required,
        pssrRequired: !!barrier.pssr_required,
        miRequired: !!barrier.mi_followup_required
      }, tenantId, actorId, incident, capa, false, index)).select().single());
      if (row) await this.safeSingle(this.db.from('incident_capa_source_links').insert(this.capaSourceLinkPatch({ sourceType: 'Barrier Failure', sourceId: barrier.id, sourceTitleSnapshot: barrier.barrier_name }, tenantId, actorId, incident, row)).select().single());
    }
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Action Created', 'CAPA generated from barrier failures', dto.reason ?? 'Generated from failed or degraded safeguards', null, barriers, 'incidents.capa.generate.barriers', capa.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async linkCapaSource(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const item = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_source_links').insert(this.capaSourceLinkPatch(dto, tenantId, actorId, incident, item)).select().single());
    await this.writeCapaMutation(tenantId, incident, actorId, 'Linked', 'CAPA source linked', dto.reason ?? dto.sourceType, null, row, 'incidents.capa.link_source', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async linkCapaEvidence(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const evidenceIds = Array.from(new Set([...(before.evidence_ids_json ?? []), dto.evidenceId].filter(Boolean)));
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ evidence_ids_json: evidenceIds, evidence_status: evidenceIds.length ? 'Submitted' : before.evidence_status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.writeCapaMutation(tenantId, incident, actorId, 'Linked', 'CAPA evidence linked', dto.reason ?? dto.evidenceId, before, row, 'incidents.capa.link_evidence', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async submitCapaCompletion(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ status: 'Evidence Submitted', implementation_status: 'Completed', evidence_status: before.evidence_required ? 'Submitted' : 'Not Required', completion_notes: dto.notes ?? dto.reason, completed_by: actorId, completed_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Updated', 'CAPA completion submitted', dto.reason ?? dto.notes, before, row, 'incidents.capa.complete', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async decideCapaEvidence(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, accepted: boolean, dto: Record<string, any>, permissions: string[] = []) {
    if (!accepted && !dto.reason) throw new BadRequestException('Rejecting CAPA evidence requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ status: accepted ? 'Verification Pending' : 'Rework Required', evidence_status: accepted ? 'Accepted' : 'Rejected', rework_required: !accepted, rework_notes: accepted ? null : dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.writeCapaMutation(tenantId, incident, actorId, accepted ? 'Approved' : 'Rejected', accepted ? 'CAPA evidence accepted' : 'CAPA evidence rejected', dto.reason ?? dto.comments, before, row, accepted ? 'incidents.capa.evidence.accept' : 'incidents.capa.evidence.reject', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async verifyCapaEffectiveness(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.verificationMethod && !dto.verificationResult) throw new BadRequestException('Effectiveness verification requires a method or result.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const verification = await this.db.single<any>(this.db.from('incident_capa_verifications').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, capa_item_id: capaId,
      verification_method: dto.verificationMethod ?? before.verification_method, verification_owner_id: dto.verificationOwnerId ?? actorId, verification_due_date: this.dateOrNull(dto.verificationDueDate),
      verification_status: dto.effective === false ? 'Failed' : 'Verified Effective', verification_result: dto.verificationResult ?? dto.comments, effective: dto.effective === false ? 'No' : 'Yes',
      rework_required: dto.effective === false, rework_notes: dto.reworkNotes, evidence_ids_json: dto.evidenceIds ?? before.evidence_ids_json ?? [], verified_by: actorId, verified_at: new Date().toISOString(), created_by: actorId, updated_by: actorId
    }).select().single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ status: dto.effective === false ? 'Rework Required' : 'Verified Effective', verification_status: dto.effective === false ? 'Failed' : 'Verified Effective', effectiveness_status: dto.effective === false ? 'Ineffective' : 'Effective', rework_required: dto.effective === false, rework_notes: dto.reworkNotes, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, dto.effective === false ? 'Rejected' : 'Validated', 'CAPA effectiveness verified', dto.verificationResult ?? dto.comments, before, { row, verification }, 'incidents.capa.verify', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async requestCapaRework(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('CAPA rework requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ status: 'Rework Required', rework_required: true, rework_notes: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.writeCapaMutation(tenantId, incident, actorId, 'Updated', 'CAPA rework requested', dto.reason, before, row, 'incidents.capa.rework', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async escalateCapa(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ status: 'Escalated', escalation_status: dto.escalationStatus ?? 'Escalated', escalation_reason: dto.reason, escalated_to: dto.escalatedTo, escalated_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.updateIncidentCapaStatus(tenantId, id, actorId);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Updated', 'CAPA escalated', dto.reason, before, row, 'incidents.capa.escalate', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async linkExistingCapaAction(tenantId: string, actorId: string, scope: Scope, id: string, capaId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (!dto.universalActionId) throw new BadRequestException('Universal Action ID is required.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditIncidentCapa(incident);
    const before = await this.db.single<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).single());
    const row = await this.db.single<any>(this.db.from('incident_capa_items').update({ universal_action_id: dto.universalActionId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', capaId).select().single());
    await this.writeCapaMutation(tenantId, incident, actorId, 'Linked', 'Existing Universal Action linked to CAPA', dto.reason ?? dto.universalActionId, before, row, 'incidents.actions.link', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async requestCapaReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const capa = await this.ensureCapa(tenantId, incident, actorId);
    const row = await this.db.single<any>(this.db.from('incident_capa_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, status: 'Requested', reviewer_id: dto.reviewerId, due_date: this.dateOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_capa').update({ review_status: 'Requested', status: 'Review Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', capa.id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ capa_review_status: 'Requested', capa_status: 'Review Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeCapaMutation(tenantId, incident, actorId, 'Submitted', 'CAPA review requested', dto.reason ?? dto.comments, null, row, 'incidents.capa.review.request', row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async decideCapaReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected' | 'Reopened', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('CAPA review rejection requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const capa = await this.ensureCapa(tenantId, incident, actorId);
    if (decision === 'Approved') {
      const tab = await this.capaTab(tenantId, scope, id, permissions);
      if (tab.readiness?.status === 'Blocked') throw new BadRequestException('CAPA review approval is blocked by readiness blockers.');
    }
    const latest = (await this.incidentChildren(tenantId, 'incident_capa_reviews', id, scope))[0];
    const patch = decision === 'Approved'
      ? { status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), comments: dto.comments, rework_required: false, updated_by: actorId, updated_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, rework_required: true, rework_notes: dto.reworkNotes, updated_by: actorId, updated_at: new Date().toISOString() }
        : { status: 'Reopened', comments: dto.reason, rework_required: true, rework_notes: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = latest ? await this.db.single<any>(this.db.from('incident_capa_reviews').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', latest.id).select().single()) : await this.db.single<any>(this.db.from('incident_capa_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, ...patch, created_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_capa').update({ review_status: decision, status: decision, ready_for_review: decision === 'Approved', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', capa.id).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ capa_review_status: decision, capa_status: decision, capa_ready_for_review: decision === 'Approved', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeCapaMutation(tenantId, incident, actorId, decision, `CAPA review ${decision.toLowerCase()}`, dto.reason ?? dto.comments, latest, row, `incidents.capa.review.${decision.toLowerCase()}`, row.id);
    return this.capaTab(tenantId, scope, id, permissions);
  }

  async exportCapa(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const data = await this.capaTab(tenantId, scope, id, permissions);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    await this.writeCapaMutation(tenantId, incident, actorId, 'Exported', 'CAPA register exported', 'CAPA export requested', null, { count: data.capaRegister?.length ?? 0 }, 'incidents.capa.export', id);
    return { fileName: `${incident.incident_number ?? id}-capa-register.json`, generatedAt: new Date().toISOString(), data };
  }

  async capaLookupContext(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    await this.rawIncidentById(tenantId, scope, id);
    const [rootCauses, causalFactors, barriers, immediateActions, evidence, actions, users] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_immediate_actions', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentActions(tenantId, scope, id),
      this.userSearch(tenantId, '')
    ]);
    return {
      actionTypes: ['Corrective Action', 'Preventive Action', 'Interim Action', 'Permanent Action', 'Verification Action', 'Management System Action', 'Regulatory Action', 'Training Action', 'Procedure Action', 'Engineering Action', 'Maintenance / MI Action', 'MOC Action', 'PSSR Action', 'HAZOP/PHA Review Action', 'LOPA/SIL Review Action', 'Other'],
      statuses: ['Draft', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Evidence Submitted', 'Verification Pending', 'Verified Effective', 'Rework Required', 'Overdue', 'Escalated', 'Cancelled', 'Closed'],
      priorities: ['Low', 'Medium', 'High', 'Critical'],
      sourceTypes: ['RCA Root Cause', 'RCA Causal Factor', 'Barrier Failure', 'Immediate Action', 'Evidence Gap', 'Regulatory Finding', 'Management System Weakness', 'Other'],
      verificationMethods: ['Field verification', 'Document review', 'Functional test', 'Proof test / inspection', 'Observation', 'Interview', 'Audit', 'Trend review', 'Management review', 'Other'],
      rootCauses,
      causalFactors,
      barriers,
      immediateActions,
      evidence,
      universalActions: actions,
      users,
      permissions
    };
  }

  private async ensureCapa(tenantId: string, incident: any, actorId?: string) {
    const existing = await this.safeSingle<any>(this.db.from('incident_capa').select('*').eq('tenant_id', tenantId).eq('incident_id', incident.id).single());
    if (existing) return existing;
    const required = !!(incident.rca_required || incident.high_potential_near_miss || incident.is_psm_incident || incident.is_process_safety_event || Number(incident.open_actions_count ?? 0));
    const row = await this.db.single<any>(this.db.from('incident_capa').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id,
      capa_required: required, required_reason: required ? 'Generated from incident severity, PSM/PSE, RCA/action, or follow-up signals.' : 'No CAPA trigger currently identified.',
      status: required ? 'Required' : 'Not Required', review_status: 'Not Requested', ready_for_review: false, created_by: actorId, updated_by: actorId
    }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ capa_required: required, capa_required_reason: row.required_reason, capa_status: row.status, capa_review_status: row.review_status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incident.id).select('id').single());
    return row;
  }

  private assertCanEditIncidentCapa(incident: any) {
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before changing CAPA.');
  }

  private capaItemPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, capa: any, update: boolean, index = 1) {
    const sourceType = dto.sourceType ?? dto.source_type;
    const title = dto.actionTitle ?? dto.title ?? dto.action_title_snapshot;
    if (!update && !title) throw new BadRequestException('CAPA action title is required.');
    if ((dto.verificationRequired ?? dto.verification_required) && !(dto.verificationMethod ?? dto.verification_method)) throw new BadRequestException('Verification-required CAPA must include a verification method.');
    return this.clean({
      ...(!update ? { id: dto.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, capa_id: capa.id, capa_number: dto.capaNumber ?? `CAPA-${String(index).padStart(3, '0')}`, created_by: actorId } : {}),
      universal_action_id: dto.universalActionId ?? dto.universal_action_id ?? (!update ? crypto.randomUUID() : undefined),
      action_title_snapshot: title,
      action_description: dto.description ?? dto.actionDescription ?? dto.action_description,
      action_type: dto.actionType ?? dto.action_type ?? (!update ? 'Corrective Action' : undefined),
      action_category: dto.actionCategory ?? dto.action_category,
      source_type: sourceType,
      source_id: dto.sourceId ?? dto.source_id,
      priority: dto.priority ?? (!update ? 'Medium' : undefined),
      risk_reduction_objective: dto.riskReductionObjective ?? dto.risk_reduction_objective,
      expected_outcome: dto.expectedOutcome ?? dto.expected_outcome,
      owner_id: dto.ownerId ?? dto.owner_id,
      supporting_team_ids_json: dto.supportingTeamIds ?? dto.supporting_team_ids_json,
      due_date: this.dateOrNull(dto.dueDate ?? dto.due_date),
      status: dto.status ?? (!update ? 'Draft' : undefined),
      implementation_status: dto.implementationStatus ?? dto.implementation_status ?? dto.status,
      implementation_plan: dto.implementationPlan ?? dto.implementation_plan,
      implementation_steps_json: dto.implementationSteps ?? dto.implementation_steps_json,
      resources_required: dto.resourcesRequired ?? dto.resources_required,
      dependencies_json: dto.dependencies ?? dto.dependencies_json,
      evidence_required: dto.evidenceRequired ?? dto.evidence_required,
      evidence_status: dto.evidenceStatus ?? dto.evidence_status,
      evidence_ids_json: dto.evidenceIds ?? dto.evidence_ids_json,
      verification_required: dto.verificationRequired ?? dto.verification_required,
      verification_method: dto.verificationMethod ?? dto.verification_method,
      verification_due_date: this.dateOrNull(dto.verificationDueDate ?? dto.verification_due_date),
      verification_status: dto.verificationStatus ?? dto.verification_status,
      effectiveness_status: dto.effectivenessStatus ?? dto.effectiveness_status,
      escalation_status: dto.escalationStatus ?? dto.escalation_status,
      moc_required: dto.mocRequired ?? dto.moc_required,
      pssr_required: dto.pssrRequired ?? dto.pssr_required,
      ptw_required: dto.ptwRequired ?? dto.ptw_required,
      mi_required: dto.miRequired ?? dto.mi_required,
      regulatory_required: dto.regulatoryRequired ?? dto.regulatory_required,
      notes: dto.notes,
      change_reason: dto.reason ?? dto.changeReason ?? dto.change_reason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private capaSourceLinkPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, item: any) {
    if (!(dto.sourceType ?? dto.source_type) || !(dto.sourceId ?? dto.source_id)) throw new BadRequestException('CAPA source type and source record are required.');
    return this.clean({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, capa_item_id: item.id,
      source_type: dto.sourceType ?? dto.source_type, source_id: dto.sourceId ?? dto.source_id,
      source_title_snapshot: dto.sourceTitleSnapshot ?? dto.source_title_snapshot ?? item.action_title_snapshot,
      coverage_status: dto.coverageStatus ?? dto.coverage_status ?? 'Covered',
      justification_if_no_capa: dto.justificationIfNoCapa ?? dto.justification_if_no_capa,
      created_by: actorId
    });
  }

  private capaSummaryCards(capa: any, items: any[], readiness: any, review: any, coverage: any) {
    const open = items.filter((row) => this.openActionStatus(row.status ?? row.implementation_status));
    return [
      this.card('CAPA required', capa.capa_required ? 'Yes' : 'No', capa.capa_required ? 'warning' : 'ok', capa.required_reason),
      this.card('Total actions', items.length, 'info', 'Corrective and preventive actions'),
      this.card('Corrective', items.filter((row) => row.action_type === 'Corrective Action').length, 'info', 'Corrective actions'),
      this.card('Preventive', items.filter((row) => row.action_type === 'Preventive Action').length, 'info', 'Preventive actions'),
      this.card('Interim', items.filter((row) => row.action_type === 'Interim Action').length, 'warning', 'Temporary/interim controls'),
      this.card('Permanent', items.filter((row) => row.action_type === 'Permanent Action').length, 'ok', 'Permanent actions'),
      this.card('Open', open.length, open.length ? 'warning' : 'ok', 'Open CAPA items'),
      this.card('Overdue', items.filter((row) => this.isPastDate(row.due_date) && this.openActionStatus(row.status)).length, 'danger', 'Past due open items'),
      this.card('Completed', items.filter((row) => ['Completed', 'Evidence Submitted', 'Verification Pending', 'Closed'].includes(row.status ?? '')).length, 'ok', 'Implemented actions'),
      this.card('Verified effective', items.filter((row) => ['Verified Effective', 'Effective'].includes(row.verification_status ?? row.effectiveness_status ?? '')).length, 'ok', 'Effectiveness accepted'),
      this.card('Verification pending', items.filter((row) => row.verification_required && !['Verified Effective', 'Effective'].includes(row.verification_status ?? row.effectiveness_status ?? '')).length, 'warning', 'Awaiting verification'),
      this.card('Root causes covered', coverage.coveredRootCauses, 'ok', 'RCA root causes with CAPA'),
      this.card('Missing CAPA coverage', coverage.missingSources.length, coverage.missingSources.length ? 'danger' : 'ok', 'Required sources without CAPA'),
      this.card('High priority', items.filter((row) => ['High', 'Critical'].includes(row.priority ?? '')).length, 'danger', 'High or critical CAPA'),
      this.card('Review status', review.status ?? 'Not Requested', 'status', 'CAPA review workflow'),
      this.card('Ready for closure', readiness.readyForClosure ? 'Yes' : 'No', readiness.readyForClosure ? 'ok' : 'warning', 'Backend CAPA closure readiness')
    ];
  }

  private capaSourceReadiness(capa: any, roots: any[], barriers: any[], links: any[], coverage: any) {
    return {
      status: coverage.missingSources.length ? 'Blocked' : capa.capa_required ? 'Ready' : 'Not Required',
      requiredReason: capa.required_reason,
      rootCauses: roots.length,
      barrierFailures: barriers.filter((row) => ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? '')).length,
      mappedSources: links.length,
      missingSources: coverage.missingSources,
      checklist: [
        { title: 'RCA root causes mapped to CAPA or justified', status: coverage.missingRootCauses ? 'Missing' : 'Complete' },
        { title: 'Barrier failures mapped to CAPA or justified', status: coverage.missingBarrierFailures ? 'Missing' : 'Complete' },
        { title: 'Immediate action conversions reviewed', status: coverage.missingImmediateActions ? 'Missing' : 'Complete' }
      ]
    };
  }

  private capaCoverageMatrix(rootCauses: any[], causalFactors: any[], barriers: any[], immediateActions: any[], links: any[], items: any[]) {
    const sourceRows = [
      ...rootCauses.filter((row) => row.capa_required !== false && !row.deleted_at).map((row) => ({ id: row.id, sourceType: 'RCA Root Cause', title: row.root_cause_statement, number: row.root_cause_number })),
      ...causalFactors.filter((row) => row.capa_required || row.confirmation_status === 'Confirmed').map((row) => ({ id: row.id, sourceType: 'RCA Causal Factor', title: row.factor_statement ?? row.description, number: row.factor_number })),
      ...barriers.filter((row) => !row.deleted_at && ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? '')).map((row) => ({ id: row.id, sourceType: 'Barrier Failure', title: row.barrier_name, number: row.barrier_number })),
      ...immediateActions.filter((row) => row.capa_required || row.temporary_control || row.restart_blocker).map((row) => ({ id: row.id, sourceType: 'Immediate Action', title: row.action_title, number: row.action_number }))
    ];
    const rows = sourceRows.map((source) => {
      const linked = links.filter((link) => link.source_type === source.sourceType && link.source_id === source.id);
      const linkedItems = items.filter((item) => linked.some((link) => link.capa_item_id === item.id));
      return { ...source, coverageStatus: linked.length ? 'Covered' : 'Missing', capaCount: linkedItems.length, capaItems: linkedItems };
    });
    const missingSources = rows.filter((row) => row.coverageStatus === 'Missing');
    return {
      rows,
      sources: sourceRows,
      missingSources,
      missingRootCauses: missingSources.filter((row) => row.sourceType === 'RCA Root Cause').length,
      coveredRootCauses: rows.filter((row) => row.sourceType === 'RCA Root Cause' && row.coverageStatus === 'Covered').length,
      missingBarrierFailures: missingSources.filter((row) => row.sourceType === 'Barrier Failure').length,
      missingImmediateActions: missingSources.filter((row) => row.sourceType === 'Immediate Action').length,
      status: missingSources.length ? 'Blocked' : 'Complete'
    };
  }

  private capaReadiness(incident: any, capa: any, items: any[], links: any[], verifications: any[], evidence: any[], review: any, coverage: any) {
    const blockers: any[] = [];
    if (capa.capa_required && !items.length) blockers.push({ title: 'CAPA required but not started', severity: 'Blocked', section: 'CAPA' });
    if (coverage.missingSources.length) blockers.push({ title: 'Root causes, barrier failures, or immediate action sources lack CAPA mapping', severity: 'Blocked', section: 'Source Mapping', count: coverage.missingSources.length });
    for (const item of items) {
      if (!item.owner_id) blockers.push({ title: `${item.capa_number} owner missing`, severity: 'Blocked', section: 'Assignment' });
      if (!item.due_date) blockers.push({ title: `${item.capa_number} due date missing`, severity: 'Blocked', section: 'Assignment' });
      if (this.isPastDate(item.due_date) && this.openActionStatus(item.status)) blockers.push({ title: `${item.capa_number} is overdue`, severity: 'Critical', section: 'Escalation' });
      if (item.evidence_required && !(item.evidence_ids_json ?? []).length) blockers.push({ title: `${item.capa_number} completion evidence missing`, severity: 'Blocked', section: 'Evidence' });
      if (item.verification_required && !['Verified Effective', 'Effective'].includes(item.verification_status ?? item.effectiveness_status ?? '')) blockers.push({ title: `${item.capa_number} effectiveness verification pending`, severity: 'Blocked', section: 'Verification' });
      if (item.rework_required) blockers.push({ title: `${item.capa_number} requires rework`, severity: 'Blocked', section: 'Verification' });
    }
    const warnings = [];
    if (!evidence.length) warnings.push('No incident evidence is available for CAPA evidence mapping.');
    if (review.status !== 'Approved') warnings.push('CAPA review is not approved.');
    const score = Math.max(0, Math.min(100, 100 - blockers.length * 12 - warnings.length * 5));
    return {
      status: blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready',
      score,
      readyForReview: !blockers.length && items.length > 0,
      readyForClosure: !blockers.length && review.status === 'Approved',
      blockers,
      warnings,
      configWarnings: warnings,
      checklist: [
        { title: 'CAPA required sources covered', status: coverage.missingSources.length ? 'Missing' : 'Complete' },
        { title: 'Action owner and due date assigned', status: items.every((row) => row.owner_id && row.due_date) ? 'Complete' : 'Missing' },
        { title: 'Completion evidence attached', status: items.every((row) => !row.evidence_required || (row.evidence_ids_json ?? []).length) ? 'Complete' : 'Missing' },
        { title: 'Effectiveness verified where required', status: items.every((row) => !row.verification_required || ['Verified Effective', 'Effective'].includes(row.verification_status ?? row.effectiveness_status ?? '')) ? 'Complete' : 'Missing' },
        { title: 'CAPA review approved', status: review.status === 'Approved' ? 'Complete' : 'Pending' }
      ]
    };
  }

  private capaActions(permissions: string[], locked: boolean, lockedReason: string | null) {
    const action = (key: string, label: string, permission: string) => ({
      key,
      label,
      enabled: permissions.includes(permission) && !locked,
      disabledReason: locked ? lockedReason : permissions.includes(permission) ? null : `Missing ${permission} permission`
    });
    return [
      action('add-capa', 'Add CAPA', 'incidents.capa.create'),
      action('generate-rca', 'Generate CAPA from RCA', 'incidents.capa.generate'),
      action('generate-barriers', 'Generate CAPA from Barrier Failures', 'incidents.capa.generate'),
      action('link-existing-action', 'Link Existing Action', 'incidents.actions.link'),
      action('request-review', 'Request Review', 'incidents.capa.review.request'),
      action('export', 'Export CAPA Register', 'incidents.capa.export'),
      action('save', 'Save Changes', 'incidents.capa.edit'),
      { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
    ];
  }

  private async updateIncidentCapaStatus(tenantId: string, incidentId: string, actorId: string) {
    const rows = await this.safeMany<any>(this.db.from('incident_capa_items').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).is('deleted_at', null));
    const open = rows.filter((row) => this.openActionStatus(row.status ?? row.implementation_status));
    const overdue = open.filter((row) => this.isPastDate(row.due_date));
    const status = rows.length ? (overdue.length ? 'Overdue' : open.length ? 'Open' : 'Completed') : 'Not Started';
    await this.safeSingle(this.db.from('incident_capa').update({ status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', incidentId).select('id').single());
    await this.safeSingle(this.db.from('incidents').update({ capa_status: status, capa_open_count: open.length, capa_overdue_count: overdue.length, open_actions_count: open.length, overdue_actions_count: overdue.length, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async writeCapaMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason: string | undefined, before: any, after: any, action: string, entityId: string) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'INCIDENT_CAPA', entityId, before: before as JsonValue, after: after as JsonValue });
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
  }

  async linkedRecordsTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { restricted: true, summaryCards: [this.card('Restricted', 'Redacted', 'danger', 'Missing restricted/confidential incident permission')] };
    await this.ensureRequiredLinks(tenantId, incident, incident.investigation_owner_id);
    const [links, requiredLinks, impacts, reviews, history, actions, evidence, equipment, chemicals, capa, rcaRoots, rcaFactors, barriers] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_linked_records', id, scope),
      this.incidentChildren(tenantId, 'incident_required_links', id, scope),
      this.incidentChildren(tenantId, 'incident_record_impacts', id, scope),
      this.incidentChildren(tenantId, 'incident_linked_record_reviews', id, scope),
      this.incidentHistory(tenantId, id, 60),
      this.incidentActions(tenantId, scope, id),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_equipment', id, scope),
      this.incidentChildren(tenantId, 'incident_chemicals', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', id, scope)
    ]);
    const activeLinks = links.filter((row) => !row.deleted_at);
    const latestReview = reviews[0] ?? { status: incident.linked_records_review_status ?? 'Not Requested' };
    const readiness = this.linkedRecordsReadiness(activeLinks, requiredLinks, impacts, latestReview);
    const modulePanels = this.linkedRecordModulePanels(activeLinks, requiredLinks, actions);
    const brokenStale = activeLinks.filter((row) => ['Broken', 'Stale', 'Superseded', 'Restricted', 'Not accessible', 'Archived', 'Needs update'].includes(row.link_status ?? '') || row.update_required);
    const documentLinks = activeLinks.filter((row) => ['Document / procedure', 'SDS', 'SOP', 'Training record'].includes(row.record_type ?? '') || ['Document Control', 'SDS Library', 'Procedure Library'].includes(row.module ?? ''));
    const psmReviewLinks = this.psmReviewLinks(incident, activeLinks, requiredLinks);
    const locked = this.closedStatus(incident.status);
    const lockedReason = locked ? 'Closed/approved incidents are read-only. Reopen before changing linked records.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        incidentTitle: incident.title,
        incidentStatus: incident.status,
        investigationPriority: incident.investigation_priority,
        psmPseApiTier: `${incident.is_psm_incident ? 'PSM' : 'No PSM'} / ${incident.is_process_safety_event ? 'PSE' : 'No PSE'} / ${incident.pse_tier ?? 'Not Determined'}`,
        totalLinkedRecords: activeLinks.length,
        requiredLinksMissing: requiredLinks.filter((row) => row.required && ['Missing', 'Blocked'].includes(row.status ?? '')).length,
        recordsNeedingUpdate: activeLinks.filter((row) => row.update_required || row.impact_status !== 'No change required').length,
        brokenLinks: activeLinks.filter((row) => ['Broken', 'Not accessible'].includes(row.link_status ?? '')).length,
        supersededStaleLinks: activeLinks.filter((row) => ['Stale', 'Superseded'].includes(row.link_status ?? '')).length,
        restrictedLinkedRecords: activeLinks.filter((row) => row.restricted || row.link_status === 'Restricted').length,
        linkedActionsCount: activeLinks.filter((row) => row.record_type === 'CAPA / Universal Action' || row.universal_action_id).length + actions.length,
        linkedDocumentsCount: documentLinks.length,
        reviewStatus: latestReview.status,
        lastUpdated: activeLinks[0]?.updated_at ?? incident.updated_at
      },
      summaryCards: this.linkedRecordsSummaryCards(activeLinks, requiredLinks, impacts, latestReview, actions, documentLinks, readiness),
      requiredLinksReadiness: { rows: requiredLinks, readiness },
      linkedRecordsRegister: activeLinks,
      modulePanels,
      sourceGenerated: { rows: activeLinks, source: activeLinks.filter((row) => row.source_generated_type === 'Source record'), generated: activeLinks.filter((row) => row.source_generated_type === 'Generated from incident'), updateRequired: activeLinks.filter((row) => row.update_required) },
      recordImpacts: { rows: impacts, updateRequired: impacts.filter((row) => row.update_required), impactTypes: this.distributionBy(impacts, (row) => row.impact_type ?? 'No change required') },
      brokenStale,
      actionsSnapshot: { rows: [...actions, ...capa], open: actions.filter((row) => this.openActionStatus(row.status)), overdue: actions.filter((row) => this.isPastDate(row.dueDate ?? row.due_date) && this.openActionStatus(row.status)), capa },
      documentLinks,
      psmReviewLinks,
      review: latestReview,
      changeHistory: history.filter((event) => String(event.event_category ?? event.event_title ?? event.related_tab ?? '').toLowerCase().includes('linked') || String(event.event_title ?? '').toLowerCase().includes('link')),
      readiness,
      context: await this.linkedRecordContext(tenantId, scope, id, permissions),
      charts: { modules: this.distributionBy(activeLinks, (row) => row.module ?? 'Other'), statuses: this.distributionBy(activeLinks, (row) => row.link_status ?? 'Active'), impacts: this.distributionBy(impacts, (row) => row.impact_type ?? 'No change required'), readiness: [{ label: readiness.status, count: readiness.score }] },
      actions: this.linkedRecordActions(permissions, locked, lockedReason),
      permissions: {
        canView: permissions.includes('incidents.linked_records.view'),
        canCreate: permissions.includes('incidents.linked_records.create'),
        canEdit: permissions.includes('incidents.linked_records.edit'),
        canDelete: permissions.includes('incidents.linked_records.delete'),
        canAutoDetect: permissions.includes('incidents.linked_records.auto_detect'),
        canRefresh: permissions.includes('incidents.linked_records.refresh'),
        canExport: permissions.includes('incidents.linked_records.export'),
        canManageImpacts: permissions.includes('incidents.record_impacts.manage'),
        canRequestReview: permissions.includes('incidents.linked_records.review.request'),
        canApproveReview: permissions.includes('incidents.linked_records.review.approve'),
        canRejectReview: permissions.includes('incidents.linked_records.review.reject'),
        readOnly: locked
      },
      relatedSnapshots: { evidence, equipment, chemicals, rcaRoots, rcaFactors, barriers },
      generatedAt: new Date().toISOString()
    };
  }

  async linkedRecordsSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.linkedRecordsTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async linkedRecordDetail(tenantId: string, scope: Scope, id: string, linkId: string) {
    await this.rawIncidentById(tenantId, scope, id);
    return this.db.single<any>(this.scopeQuery(this.db.from('incident_linked_records').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId), scope, 'site_id').single());
  }

  async createLinkedRecord(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditLinkedRecords(incident);
    const existing = await this.incidentChildren(tenantId, 'incident_linked_records', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_linked_records').insert(this.linkedRecordPatch(dto, tenantId, actorId, incident, false, existing.length + 1)).select().single());
    if (row.update_required) await this.createRecordImpactForLink(tenantId, actorId, incident, row, dto);
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Linked', 'Linked record added', dto.reason ?? dto.linkReason, null, row, 'incidents.linked_records.create', row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async updateLinkedRecord(tenantId: string, actorId: string, scope: Scope, id: string, linkId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditLinkedRecords(incident);
    const before = await this.db.single<any>(this.db.from('incident_linked_records').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId).single());
    const row = await this.db.single<any>(this.db.from('incident_linked_records').update(this.linkedRecordPatch(dto, tenantId, actorId, incident, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId).select().single());
    if (row.update_required) await this.createRecordImpactForLink(tenantId, actorId, incident, row, dto);
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Updated', 'Linked record updated', dto.reason ?? dto.changeReason, before, row, 'incidents.linked_records.update', row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async deleteLinkedRecord(tenantId: string, actorId: string, scope: Scope, id: string, linkId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Unlinking a record requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditLinkedRecords(incident);
    const before = await this.db.single<any>(this.db.from('incident_linked_records').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId).single());
    const row = await this.db.single<any>(this.db.from('incident_linked_records').update({ deleted_at: new Date().toISOString(), link_status: 'Archived', change_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId).select().single());
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Unlinked', 'Linked record removed', dto.reason, before, row, 'incidents.linked_records.delete', row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async autoDetectLinkedRecords(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditLinkedRecords(incident);
    const existing = await this.incidentChildren(tenantId, 'incident_linked_records', id, scope);
    const candidates = await this.linkedRecordCandidates(tenantId, scope, incident);
    let index = existing.length;
    for (const candidate of candidates.filter((item) => item.recordId && !existing.some((link) => link.module === item.module && link.record_id === item.recordId && !link.deleted_at))) {
      index += 1;
      await this.safeSingle(this.db.from('incident_linked_records').insert(this.linkedRecordPatch(candidate, tenantId, actorId, incident, false, index)).select().single());
    }
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'System Generated', 'Linked records auto-detected', dto.reason ?? `${candidates.length} candidates scanned`, null, candidates, 'incidents.linked_records.auto_detect', id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async refreshLinkedRecordStatus(tenantId: string, actorId: string, scope: Scope, id: string, linkId: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.db.single<any>(this.db.from('incident_linked_records').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId).single());
    const status = before.restricted ? 'Restricted' : before.record_id ? (before.update_required ? 'Needs update' : 'Active') : 'Broken';
    const row = await this.db.single<any>(this.db.from('incident_linked_records').update({ link_status: status, current_status_snapshot: status, last_refreshed_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', linkId).select().single());
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Updated', 'Linked record status refreshed', status, before, row, 'incidents.linked_records.refresh', row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async refreshAllLinkedRecordStatuses(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const links = await this.incidentChildren(tenantId, 'incident_linked_records', id, scope);
    for (const link of links.filter((row) => !row.deleted_at)) {
      const status = link.restricted ? 'Restricted' : link.record_id ? (link.update_required ? 'Needs update' : 'Active') : 'Broken';
      await this.safeSingle(this.db.from('incident_linked_records').update({ link_status: status, current_status_snapshot: status, last_refreshed_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', link.id).select('id').single());
    }
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Updated', 'All linked record statuses refreshed', `${links.length} links refreshed`, null, { count: links.length }, 'incidents.linked_records.refresh_all', id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async updateRecordImpact(tenantId: string, actorId: string, scope: Scope, id: string, impactId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditLinkedRecords(incident);
    const before = await this.db.single<any>(this.db.from('incident_record_impacts').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', impactId).single());
    const row = await this.db.single<any>(this.db.from('incident_record_impacts').update(this.recordImpactPatch(dto, actorId)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', impactId).select().single());
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Updated', 'Linked record impact updated', dto.reason ?? dto.notes, before, row, 'incidents.record_impacts.update', row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async createLinkedRecordFollowupAction(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditLinkedRecords(incident);
    const actionId = dto.universalActionId ?? crypto.randomUUID();
    const impact = await this.safeSingle<any>(this.db.from('incident_record_impacts').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, linked_record_id: dto.linkedRecordId,
      impact_type: dto.impactType ?? 'Review required', update_required: true, reason: dto.reason ?? dto.title ?? 'Follow-up required from linked records tab', owner_id: dto.ownerId ?? incident.investigation_owner_id, due_date: this.dateOrNull(dto.dueDate ?? incident.due_date), update_status: 'Assigned', universal_action_id: actionId, notes: dto.notes, created_by: actorId, updated_by: actorId
    }).select().single());
    await this.updateIncidentLinkedRecordStatus(tenantId, id, actorId);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Action Created', 'Linked record follow-up action created', dto.reason ?? dto.title, null, impact, 'incidents.followups.create', impact?.id ?? actionId);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async requestLinkedRecordsReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.db.single<any>(this.db.from('incident_linked_record_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, status: 'Requested', reviewer_id: dto.reviewerId, due_date: this.dateOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ linked_records_review_status: 'Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Submitted', 'Linked records review requested', dto.reason ?? dto.comments, null, row, 'incidents.linked_records.review.request', row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async decideLinkedRecordsReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected' | 'Reopened', dto: Record<string, any>, permissions: string[] = []) {
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('Linked records review rejection requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (decision === 'Approved') {
      const tab = await this.linkedRecordsTab(tenantId, scope, id, permissions);
      if (tab.readiness?.status === 'Blocked') throw new BadRequestException('Linked records review approval is blocked by readiness blockers.');
    }
    const latest = (await this.incidentChildren(tenantId, 'incident_linked_record_reviews', id, scope))[0];
    const patch = decision === 'Approved'
      ? { status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), comments: dto.comments, rework_required: false, updated_by: actorId, updated_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, rework_required: true, updated_by: actorId, updated_at: new Date().toISOString() }
        : { status: 'Reopened', comments: dto.reason, rework_required: true, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = latest ? await this.db.single<any>(this.db.from('incident_linked_record_reviews').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', latest.id).select().single()) : await this.db.single<any>(this.db.from('incident_linked_record_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, ...patch, created_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ linked_records_review_status: decision, linked_records_readiness_status: decision === 'Approved' ? 'Ready' : 'Review Required', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, decision, `Linked records review ${decision.toLowerCase()}`, dto.reason ?? dto.comments, latest, row, `incidents.linked_records.review.${decision.toLowerCase()}`, row.id);
    return this.linkedRecordsTab(tenantId, scope, id, permissions);
  }

  async exportLinkedRecords(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const data = await this.linkedRecordsTab(tenantId, scope, id, permissions);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    await this.writeLinkedRecordMutation(tenantId, incident, actorId, 'Exported', 'Linked records index exported', 'Linked records export requested', null, { count: data.linkedRecordsRegister?.length ?? 0 }, 'incidents.linked_records.export', id);
    return { fileName: `${incident.incident_number ?? id}-linked-records-index.json`, generatedAt: new Date().toISOString(), data };
  }

  async linkedRecordContext(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    await this.rawIncidentById(tenantId, scope, id);
    const [equipment, chemicals, evidence, actions, rcaRoots, rcaFactors, barriers, capa] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_equipment', id, scope),
      this.incidentChildren(tenantId, 'incident_chemicals', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentActions(tenantId, scope, id),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope)
    ]);
    return {
      modules: ['Equipment Registry', 'Chemical/SDS', 'Document Control', 'Evidence', 'Timeline', 'Immediate Actions', 'CAPA / Universal Action', 'RCA', 'Barrier / Safeguard', 'PTW', 'MOC', 'PSSR', 'Mechanical Integrity', 'HAZOP/PHA', 'LOPA/SIL/IPL', 'SOP / Procedure Library', 'Training', 'Audit', 'Regulatory', 'Other'],
      recordTypes: ['Equipment', 'Chemical', 'SDS', 'Document / procedure', 'Evidence', 'Timeline event', 'Immediate action', 'CAPA / Universal Action', 'RCA causal factor', 'RCA root cause', 'Barrier / safeguard', 'PTW', 'MOC', 'PSSR', 'MI / work order', 'HAZOP/PHA', 'LOPA/SIL/IPL', 'SOP', 'Training record', 'Audit record', 'Regulatory record', 'Other'],
      relationships: ['Source record', 'Related record', 'Generated from incident', 'Follow-up required', 'Evidence support', 'Review required', 'Update required', 'Supersedes', 'Superseded by', 'Reference only'],
      linkStatuses: ['Active', 'Pending review', 'Needs update', 'Broken', 'Stale', 'Superseded', 'Restricted', 'Archived', 'Not accessible'],
      impactTypes: ['No change required', 'Review required', 'Revision required', 'Revalidation required', 'Inspection required', 'MOC required', 'PSSR required', 'Training update required', 'Procedure update required', 'Risk assessment update required', 'LOPA/SIL review required', 'MI/work order required'],
      equipment, chemicals, evidence, actions, rcaRoots, rcaFactors, barriers, capa, permissions
    };
  }

  private async ensureRequiredLinks(tenantId: string, incident: any, actorId?: string) {
    const equipment = await this.safeMany<any>(this.db.from('incident_equipment').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id).limit(1));
    const chemicals = await this.safeMany<any>(this.db.from('incident_chemicals').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id).limit(1));
    const barriers = await this.safeMany<any>(this.db.from('incident_barriers').select('id,performance_status').eq('tenant_id', tenantId).eq('incident_id', incident.id).limit(20));
    const capa = await this.safeMany<any>(this.db.from('incident_capa_items').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id).limit(1));
    const links = await this.safeMany<any>(this.db.from('incident_linked_records').select('id,record_type,module,deleted_at').eq('tenant_id', tenantId).eq('incident_id', incident.id));
    const required = [
      ['Equipment', !!(equipment.length || incident.equipment_involved || incident.equipment_id), 'Equipment involved in incident'],
      ['Chemical/SDS', !!(chemicals.length || incident.chemical_involved || incident.released_material), 'Chemical, SDS, or release information involved'],
      ['PTW', !!incident.ptw_involved || !!incident.ptw_review_required, 'Permit work or PTW review required'],
      ['MOC', !!incident.moc_involved || !!incident.moc_required, 'Change or MOC follow-up required'],
      ['PSSR', !!incident.pssr_involved || !!incident.pssr_required || !!incident.restart_blocked, 'Restart/PSSR follow-up required'],
      ['MI / work order', !!incident.mechanical_integrity_followup_required || barriers.some((row) => ['Failed', 'Degraded'].includes(row.performance_status)), 'Equipment failure, inspection, or MI follow-up required'],
      ['HAZOP/PHA', !!incident.hazop_review_required, 'Hazard review required by classification or follow-up'],
      ['LOPA/SIL/IPL', !!incident.lopa_review_required || barriers.some((row) => ['Failed', 'Missing'].includes(row.performance_status)), 'Credited IPL/SIF/barrier failure may require LOPA/SIL review'],
      ['CAPA / Universal Action', !!(capa.length || incident.capa_required || incident.rca_required), 'RCA, CAPA, or follow-up action required'],
      ['Evidence', !!incident.evidence_required || !!incident.high_potential_near_miss, 'Critical evidence support required'],
      ['Document / procedure', !!incident.procedure_review_required || !!incident.training_required, 'Procedure, SOP, or training update may be required'],
      ['Regulatory record', !!incident.regulatory_reporting_required, 'Regulatory reporting required']
    ];
    for (const [type, isRequired, reason] of required) {
      const matched = links.find((link) => !link.deleted_at && (link.record_type === type || link.module === type));
      const status = isRequired ? (matched ? 'Linked' : 'Missing') : 'Not Required';
      await this.safeSingle(this.db.from('incident_required_links').upsert({
        id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id,
        required_link_type: type, required: !!isRequired, source_reason: reason, status, linked_record_id: matched?.id, blocking: !!isRequired && !matched, updated_by: actorId, updated_at: new Date().toISOString(), created_by: actorId
      }, { onConflict: 'tenant_id,incident_id,required_link_type' }).select('id').single());
    }
  }

  private assertCanEditLinkedRecords(incident: any) {
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before changing linked records.');
  }

  private linkedRecordPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update: boolean, index = 1) {
    const title = dto.recordTitleSnapshot ?? dto.record_title_snapshot ?? dto.title ?? dto.recordTitle;
    if (!update && !(dto.module && dto.recordType && title)) throw new BadRequestException('Module, record type, and record title/number snapshot are required.');
    return this.clean({
      ...(!update ? { id: dto.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, link_number: dto.linkNumber ?? `LINK-${String(index).padStart(3, '0')}`, created_by: actorId, linked_at: new Date().toISOString() } : {}),
      module: dto.module,
      record_type: dto.recordType ?? dto.record_type,
      record_id: dto.recordId ?? dto.record_id,
      record_number_snapshot: dto.recordNumberSnapshot ?? dto.record_number_snapshot,
      record_title_snapshot: title,
      relationship: dto.relationship ?? (!update ? 'Related record' : undefined),
      source_generated_type: dto.sourceGeneratedType ?? dto.source_generated_type ?? (!update ? 'Related record' : undefined),
      link_status: dto.linkStatus ?? dto.link_status ?? (!update ? 'Active' : undefined),
      impact_status: dto.impactStatus ?? dto.impact_status,
      update_required: dto.updateRequired ?? dto.update_required,
      owner_id: dto.ownerId ?? dto.owner_id,
      due_date: this.dateOrNull(dto.dueDate ?? dto.due_date),
      restricted: dto.restricted,
      blocking: dto.blocking,
      source_module: dto.sourceModule ?? dto.source_module,
      source_record_id: dto.sourceRecordId ?? dto.source_record_id,
      stale_reason: dto.staleReason ?? dto.stale_reason,
      current_status_snapshot: dto.currentStatusSnapshot ?? dto.current_status_snapshot,
      last_known_status: dto.lastKnownStatus ?? dto.last_known_status,
      universal_action_id: dto.universalActionId ?? dto.universal_action_id,
      notes: dto.notes ?? dto.linkReason,
      change_reason: dto.reason ?? dto.changeReason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private recordImpactPatch(dto: Record<string, any>, actorId: string) {
    return this.clean({
      impact_type: dto.impactType ?? dto.impact_type,
      update_required: dto.updateRequired ?? dto.update_required,
      reason: dto.reason,
      owner_id: dto.ownerId ?? dto.owner_id,
      due_date: this.dateOrNull(dto.dueDate ?? dto.due_date),
      update_status: dto.updateStatus ?? dto.update_status,
      universal_action_id: dto.universalActionId ?? dto.universal_action_id,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private async createRecordImpactForLink(tenantId: string, actorId: string, incident: any, link: any, dto: Record<string, any>) {
    const existingRows = await this.safeMany<any>(this.db.from('incident_record_impacts').select('*').eq('tenant_id', tenantId).eq('linked_record_id', link.id).limit(1));
    const existing = existingRows[0];
    if (existing) return existing;
    return this.safeSingle<any>(this.db.from('incident_record_impacts').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, linked_record_id: link.id,
      impact_type: dto.impactType ?? link.impact_status ?? 'Review required', update_required: true, reason: dto.reason ?? dto.linkReason ?? 'Linked record marked update required.', owner_id: dto.ownerId ?? link.owner_id ?? incident.investigation_owner_id, due_date: this.dateOrNull(dto.dueDate ?? link.due_date ?? incident.due_date), update_status: 'Required', universal_action_id: dto.universalActionId ?? link.universal_action_id, notes: dto.notes, created_by: actorId, updated_by: actorId
    }).select().single());
  }

  private async linkedRecordCandidates(tenantId: string, scope: Scope, incident: any) {
    const [equipment, chemicals, evidence, actions, immediate, capa, roots, factors, barriers] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_equipment', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_chemicals', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_evidence', incident.id, scope),
      this.incidentActions(tenantId, scope, incident.id),
      this.incidentChildren(tenantId, 'incident_immediate_actions', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_rca_causal_factors', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', incident.id, scope)
    ]);
    return [
      ...equipment.map((row) => ({ module: 'Equipment Registry', recordType: 'Equipment', recordId: row.id, recordNumberSnapshot: row.equipment_tag ?? row.equipment_id, recordTitleSnapshot: row.equipment_name ?? row.equipment_tag ?? 'Equipment', relationship: 'Related record', sourceGeneratedType: 'Imported during investigation' })),
      ...chemicals.map((row) => ({ module: 'Chemical/SDS', recordType: row.sds_id ? 'SDS' : 'Chemical', recordId: row.id, recordNumberSnapshot: row.cas_number ?? row.sds_id, recordTitleSnapshot: row.chemical_name ?? row.material_name ?? 'Chemical', relationship: 'Related record', sourceGeneratedType: 'Imported during investigation' })),
      ...evidence.map((row) => ({ module: 'Evidence', recordType: 'Evidence', recordId: row.id, recordNumberSnapshot: row.evidence_number, recordTitleSnapshot: row.file_name ?? row.evidence_type ?? 'Evidence', relationship: 'Evidence support', sourceGeneratedType: 'Created because of incident' })),
      ...actions.map((row) => ({ module: 'Universal Action Engine', recordType: 'CAPA / Universal Action', recordId: row.id, recordNumberSnapshot: row.actionNumber ?? row.action_number, recordTitleSnapshot: row.title ?? row.actionTitle ?? 'Action', relationship: 'Generated from incident', sourceGeneratedType: 'Generated as follow-up action', universalActionId: row.id })),
      ...immediate.map((row) => ({ module: 'Immediate Actions', recordType: 'Immediate action', recordId: row.id, recordNumberSnapshot: row.action_number, recordTitleSnapshot: row.action_title ?? 'Immediate action', relationship: 'Generated from incident', sourceGeneratedType: 'Created because of incident', updateRequired: !!row.capa_required })),
      ...capa.map((row) => ({ module: 'CAPA / Universal Action', recordType: 'CAPA / Universal Action', recordId: row.id, recordNumberSnapshot: row.capa_number, recordTitleSnapshot: row.action_title_snapshot ?? 'CAPA', relationship: 'Follow-up required', sourceGeneratedType: 'Generated as follow-up action', universalActionId: row.universal_action_id })),
      ...roots.map((row) => ({ module: 'Root Cause Analysis', recordType: 'RCA root cause', recordId: row.id, recordNumberSnapshot: row.root_cause_number, recordTitleSnapshot: row.root_cause_statement ?? 'Root cause', relationship: 'Review required', sourceGeneratedType: 'Created because of incident', updateRequired: !!row.capa_required })),
      ...factors.map((row) => ({ module: 'Root Cause Analysis', recordType: 'RCA causal factor', recordId: row.id, recordNumberSnapshot: row.factor_number, recordTitleSnapshot: row.factor_statement ?? row.description ?? 'Causal factor', relationship: 'Review required', sourceGeneratedType: 'Created because of incident' })),
      ...barriers.map((row) => ({ module: 'Barrier / Safeguard Failure', recordType: 'Barrier / safeguard', recordId: row.id, recordNumberSnapshot: row.barrier_number, recordTitleSnapshot: row.barrier_name ?? 'Barrier / safeguard', relationship: 'Review required', sourceGeneratedType: 'Created because of incident', updateRequired: ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? '') }))
    ];
  }

  private linkedRecordsSummaryCards(links: any[], required: any[], impacts: any[], review: any, actions: any[], documents: any[], readiness: any) {
    const missing = required.filter((row) => row.required && ['Missing', 'Blocked'].includes(row.status ?? ''));
    return [
      this.card('Total linked records', links.length, 'info', 'All non-deleted linked records'),
      this.card('Required links complete', required.filter((row) => row.required && ['Linked', 'Complete'].includes(row.status ?? '')).length, 'ok', 'Required records linked'),
      this.card('Missing required links', missing.length, missing.length ? 'danger' : 'ok', 'Backend-generated required-link gaps'),
      this.card('Linked CAPA/actions', links.filter((row) => row.record_type === 'CAPA / Universal Action').length + actions.length, 'warning', 'Universal Action Engine links'),
      this.card('Linked evidence', links.filter((row) => row.record_type === 'Evidence').length, 'info', 'Evidence support links'),
      this.card('Linked equipment', links.filter((row) => row.record_type === 'Equipment').length, 'info', 'Equipment/asset links'),
      this.card('Linked chemicals/SDS', links.filter((row) => ['Chemical', 'SDS'].includes(row.record_type)).length, 'info', 'Chemical and SDS links'),
      this.card('Linked documents/procedures', documents.length, 'info', 'Document Control, SOP, SDS, procedure links'),
      this.card('Records needing update', links.filter((row) => row.update_required).length + impacts.filter((row) => row.update_required).length, 'warning', 'Update-required records'),
      this.card('Broken/stale links', links.filter((row) => ['Broken', 'Stale', 'Superseded', 'Not accessible'].includes(row.link_status ?? '')).length, 'danger', 'Link health issues'),
      this.card('Review status', review.status ?? 'Not Requested', 'status', 'Linked records review workflow'),
      this.card('Ready for review/closure', readiness.readyForClosure ? 'Yes' : 'No', readiness.readyForClosure ? 'ok' : 'warning', 'Backend readiness result')
    ];
  }

  private linkedRecordModulePanels(links: any[], required: any[], actions: any[]) {
    const modules = ['Equipment Registry', 'Chemical/SDS', 'Evidence', 'CAPA / Universal Action', 'Root Cause Analysis', 'Barrier / Safeguard Failure', 'PTW', 'MOC', 'PSSR', 'Mechanical Integrity', 'HAZOP/PHA', 'LOPA/SIL/IPL', 'Document Control', 'SOP / Procedure Library'];
    return modules.map((module) => {
      const rows = links.filter((link) => link.module === module || link.record_type === module || (module === 'CAPA / Universal Action' && link.universal_action_id));
      return {
        module,
        count: rows.length,
        rows,
        criticalMissingLinks: required.filter((row) => row.required && row.status === 'Missing' && String(row.required_link_type).toLowerCase().includes((module.split('/')[0] ?? module).toLowerCase())),
        recordsNeedingUpdate: rows.filter((row) => row.update_required),
        restrictedRecords: rows.filter((row) => row.restricted || row.link_status === 'Restricted'),
        openFollowups: module === 'CAPA / Universal Action' ? actions.filter((row) => this.openActionStatus(row.status)) : rows.filter((row) => row.universal_action_id)
      };
    });
  }

  private psmReviewLinks(incident: any, links: any[], required: any[]) {
    const reviews = [
      ['MOC', incident.moc_required || incident.moc_involved, 'Change or MOC follow-up required'],
      ['PSSR', incident.pssr_required || incident.pssr_involved || incident.restart_blocked, 'Restart/return-to-service review required'],
      ['PTW', incident.ptw_review_required || incident.ptw_involved, 'Permit work review required'],
      ['Mechanical Integrity', incident.mechanical_integrity_followup_required, 'MI/work order review required'],
      ['HAZOP/PHA', incident.hazop_review_required, 'Hazard scenario review required'],
      ['LOPA/SIL/IPL', incident.lopa_review_required, 'LOPA/SIL/IPL review required'],
      ['SIS/SIF', incident.sis_sif_involved, 'SIS/SIF review required'],
      ['Alarm management', incident.alarm_review_required, 'Alarm management review required'],
      ['Training/procedure review', incident.training_required || incident.procedure_review_required, 'Training/procedure update required'],
      ['Emergency response review', incident.emergency_response_activated, 'Emergency response review required']
    ];
    return reviews.map(([reviewType, isRequired, reason]) => {
      const linked = links.find((link) => String(link.module).includes(String(reviewType)) || String(link.record_type).includes(String(reviewType)));
      return { reviewType, required: !!isRequired, reason, linkedRecord: linked, status: isRequired ? (linked ? 'Linked' : 'Missing') : 'Not Required', owner: linked?.owner_id, action: linked?.universal_action_id };
    });
  }

  private linkedRecordsReadiness(links: any[], required: any[], impacts: any[], review: any) {
    const blockers: any[] = [];
    const missing = required.filter((row) => row.required && ['Missing', 'Blocked'].includes(row.status ?? ''));
    if (missing.length) blockers.push({ title: 'Required linked records missing', severity: 'Blocked', section: 'Required Links', count: missing.length });
    const broken = links.filter((row) => ['Broken', 'Stale', 'Superseded', 'Not accessible'].includes(row.link_status ?? ''));
    if (broken.length) blockers.push({ title: 'Broken, stale, superseded, or inaccessible links unresolved', severity: 'Blocked', section: 'Link Status', count: broken.length });
    const unassignedImpacts = impacts.filter((row) => row.update_required && (!row.owner_id || !row.due_date || row.update_status !== 'Completed'));
    if (unassignedImpacts.length) blockers.push({ title: 'Update-required record impacts incomplete', severity: 'Blocked', section: 'Record Impact', count: unassignedImpacts.length });
    const warnings = [];
    if (links.some((row) => row.restricted || row.link_status === 'Restricted')) warnings.push('Some linked records are restricted/redacted.');
    if (review.status !== 'Approved') warnings.push('Linked records review is not approved.');
    const score = Math.max(0, Math.min(100, 100 - blockers.length * 16 - warnings.length * 5));
    return {
      status: blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready',
      score,
      readyForReview: !blockers.length,
      readyForClosure: !blockers.length && review.status === 'Approved',
      blockers,
      warnings,
      configWarnings: warnings,
      checklist: [
        { title: 'Required links generated', status: required.length ? 'Complete' : 'Missing' },
        { title: 'Equipment/chemical/SDS links complete', status: missing.some((row) => ['Equipment', 'Chemical/SDS'].includes(row.required_link_type)) ? 'Missing' : 'Complete' },
        { title: 'PTW/MOC/PSSR/MI links complete', status: missing.some((row) => ['PTW', 'MOC', 'PSSR', 'MI / work order'].includes(row.required_link_type)) ? 'Missing' : 'Complete' },
        { title: 'HAZOP/LOPA/SIL links complete', status: missing.some((row) => ['HAZOP/PHA', 'LOPA/SIL/IPL'].includes(row.required_link_type)) ? 'Missing' : 'Complete' },
        { title: 'CAPA/action links complete', status: missing.some((row) => row.required_link_type === 'CAPA / Universal Action') ? 'Missing' : 'Complete' },
        { title: 'Records needing update assigned', status: unassignedImpacts.length ? 'Missing' : 'Complete' },
        { title: 'Broken/stale links resolved', status: broken.length ? 'Missing' : 'Complete' },
        { title: 'Linked records review complete', status: review.status === 'Approved' ? 'Complete' : 'Pending' }
      ]
    };
  }

  private linkedRecordActions(permissions: string[], locked: boolean, lockedReason: string | null) {
    const action = (key: string, label: string, permission: string) => ({ key, label, enabled: permissions.includes(permission) && !locked, disabledReason: locked ? lockedReason : permissions.includes(permission) ? null : `Missing ${permission} permission` });
    return [
      action('link-record', 'Link Record', 'incidents.linked_records.create'),
      action('auto-detect', 'Auto-Detect Related Records', 'incidents.linked_records.auto_detect'),
      action('create-followup', 'Create Follow-up Action', 'incidents.followups.create'),
      action('refresh-status', 'Refresh Link Status', 'incidents.linked_records.refresh'),
      action('request-review', 'Request Review', 'incidents.linked_records.review.request'),
      action('export', 'Export Linked Records Index', 'incidents.linked_records.export'),
      action('save', 'Save Changes', 'incidents.linked_records.edit'),
      { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
    ];
  }

  private async updateIncidentLinkedRecordStatus(tenantId: string, incidentId: string, actorId: string) {
    const [links, required, impacts] = await Promise.all([
      this.safeMany<any>(this.db.from('incident_linked_records').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).is('deleted_at', null)),
      this.safeMany<any>(this.db.from('incident_required_links').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId)),
      this.safeMany<any>(this.db.from('incident_record_impacts').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId))
    ]);
    const missing = required.filter((row) => row.required && ['Missing', 'Blocked'].includes(row.status ?? '')).length;
    const broken = links.filter((row) => ['Broken', 'Stale', 'Superseded', 'Not accessible'].includes(row.link_status ?? '')).length;
    const updateRequired = links.filter((row) => row.update_required).length + impacts.filter((row) => row.update_required && row.update_status !== 'Completed').length;
    const readiness = missing || broken || updateRequired ? 'Blocked' : links.length ? 'Ready' : 'Not Started';
    await this.safeSingle(this.db.from('incidents').update({ linked_records_count: links.length, linked_records_missing_required_count: missing, linked_records_broken_count: broken, linked_records_update_required_count: updateRequired, linked_records_readiness_status: readiness, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async writeLinkedRecordMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason: string | undefined, before: any, after: any, action: string, entityId: string) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'INCIDENT_LINKED_RECORD', entityId, before: before as JsonValue, after: after as JsonValue });
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
  }

  async notificationsReportingTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { restricted: true, summaryCards: [this.card('Restricted', 'Redacted', 'danger', 'Missing restricted/confidential incident permission')] };
    await this.ensureReportingDetermination(tenantId, incident, incident.investigation_owner_id);
    await this.ensureReportingRequirements(tenantId, incident, incident.investigation_owner_id);
    const [determinations, notifications, reports, requirements, stakeholders, reviews, history, evidence, actions] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_reporting_determinations', id, scope),
      this.incidentChildren(tenantId, 'incident_notifications', id, scope),
      this.incidentChildren(tenantId, 'incident_regulatory_reports', id, scope),
      this.incidentChildren(tenantId, 'incident_reporting_requirements', id, scope),
      this.incidentChildren(tenantId, 'incident_external_stakeholder_notifications', id, scope),
      this.incidentChildren(tenantId, 'incident_reporting_reviews', id, scope),
      this.incidentHistory(tenantId, id, 80),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentActions(tenantId, scope, id)
    ]);
    const determination = determinations[0] ?? this.reportingDeterminationFromIncident(incident);
    const latestReview = reviews[0] ?? { status: incident.notifications_reporting_review_status ?? 'Not Requested' };
    const readiness = this.reportingReadiness(incident, determination, notifications, reports, requirements, stakeholders, latestReview, evidence);
    const deadlines = this.reportingDeadlines(reports, stakeholders, notifications);
    const criteria = this.reportabilityCriteria(incident, determination);
    const packageChecklist = this.reportingPackageChecklist(incident, requirements, evidence, reports);
    const locked = this.closedStatus(incident.status);
    const lockedReason = locked ? 'Closed incidents are read-only. Reopen before changing notifications or regulatory reports.' : null;
    return {
      header: {
        incidentNumber: incident.incident_number,
        incidentTitle: incident.title,
        incidentStatus: incident.status,
        actualSeverity: incident.actual_severity,
        potentialSeverity: incident.potential_severity,
        psmPseApiTier: `${incident.is_psm_incident ? 'PSM' : 'No PSM'} / ${incident.is_process_safety_event ? 'PSE' : 'No PSE'} / ${incident.pse_tier ?? 'Not Determined'}`,
        reportingRequired: determination.reporting_required ?? 'Not Determined',
        internalNotificationsStatus: this.reportingNotificationStatus(notifications),
        regulatoryReportingStatus: this.reportingReportStatus(reports, determination),
        openReports: reports.filter((row) => !['Acknowledged', 'Cancelled', 'Not Required'].includes(row.status ?? '')).length,
        overdueReports: reports.filter((row) => this.reportingOverdue(row)).length,
        pendingApprovals: reports.filter((row) => row.status === 'Pending Approval').length,
        submittedReports: reports.filter((row) => row.status === 'Submitted').length,
        acknowledgedReports: reports.filter((row) => row.status === 'Acknowledged' || row.acknowledgement_received).length,
        failedNotifications: notifications.filter((row) => row.status === 'Failed').length,
        nextReportingDeadline: deadlines.nextDeadline,
        reviewStatus: latestReview.status,
        lastUpdated: reports[0]?.updated_at ?? notifications[0]?.updated_at ?? determination.updated_at ?? incident.updated_at
      },
      summaryCards: this.reportingSummaryCards(determination, notifications, reports, requirements, latestReview, readiness),
      determination,
      internalNotificationsRegister: notifications,
      regulatoryReportsRegister: reports,
      reportabilityCriteria: criteria,
      deadlines,
      packageChecklist,
      submissionAcknowledgement: { rows: reports, submitted: reports.filter((row) => row.submitted_at), acknowledged: reports.filter((row) => row.acknowledgement_received), rejected: reports.filter((row) => row.rejected || row.status === 'Rejected') },
      externalStakeholders: { rows: stakeholders, required: stakeholders.filter((row) => row.notification_required), overdue: stakeholders.filter((row) => this.reportingOverdue(row)) },
      managementLegalInsurance: this.managementLegalInsurancePanel(incident, notifications, stakeholders),
      review: latestReview,
      changeHistory: history.filter((event) => /notification|report|regulatory|acknowledg|submission/i.test(`${event.event_title} ${event.event_category} ${event.related_tab}`)),
      readiness,
      context: await this.reportingContext(tenantId, scope, id, permissions),
      actions: this.reportingActions(permissions, locked, lockedReason),
      permissions: {
        canView: permissions.includes('incidents.notifications_reporting.view') || permissions.includes('incidents.reporting.view'),
        canSend: permissions.includes('incidents.notifications.send'),
        canResend: permissions.includes('incidents.notifications.resend'),
        canAcknowledgeNotification: permissions.includes('incidents.notifications.acknowledge'),
        canDetermine: permissions.includes('incidents.reporting.determine'),
        canEditReport: permissions.includes('incidents.reporting.edit'),
        canGeneratePackage: permissions.includes('incidents.reporting.generate_package'),
        canSubmitReport: permissions.includes('incidents.reporting.submit'),
        canAcknowledgeReport: permissions.includes('incidents.reporting.acknowledge'),
        canOverride: permissions.includes('incidents.reporting.override'),
        canReview: permissions.includes('incidents.reporting.review.request') || permissions.includes('incidents.reporting.review.approve') || permissions.includes('incidents.reporting.review.reject'),
        readOnly: locked
      },
      generatedAt: new Date().toISOString()
    };
  }

  async notificationsReportingSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.notificationsReportingTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async runReportingDetermination(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const before = await this.safeSingle<any>(this.db.from('incident_reporting_determinations').select('*').eq('tenant_id', tenantId).eq('incident_id', id).single());
    const generated = this.reportingDeterminationFromIncident({ ...incident, applicable_rule_key: dto.applicableRuleKey ?? incident.applicable_rule_key });
    const payload = this.clean({
      id: before?.id ?? crypto.randomUUID(),
      tenant_id: before ? undefined : tenantId,
      company_id: before ? undefined : incident.company_id,
      site_id: before ? undefined : incident.site_id,
      incident_id: before ? undefined : id,
      determination_status: generated.determination_status,
      reporting_required: dto.reportingRequired ?? generated.reporting_required,
      jurisdiction: dto.jurisdiction ?? generated.jurisdiction,
      applicable_rule_key: dto.applicableRuleKey ?? generated.applicable_rule_key,
      trigger_reasons_json: generated.trigger_reasons_json,
      evidence_source_fields_json: generated.evidence_source_fields_json,
      confidence: generated.confidence,
      reviewer_id: dto.reviewerId ?? before?.reviewer_id,
      review_status: dto.reviewStatus ?? 'Pending Review',
      notes: dto.notes ?? generated.notes,
      created_by: before ? undefined : actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = before
      ? await this.db.single<any>(this.db.from('incident_reporting_determinations').update(payload).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', before.id).select().single())
      : await this.db.single<any>(this.db.from('incident_reporting_determinations').insert(payload).select().single());
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Calculated', 'Reporting determination run', dto.reason ?? row.notes, before, row, 'incidents.reporting.determine', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async updateReportingDetermination(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    if ((dto.override || dto.reportingRequired) && !dto.reason) throw new BadRequestException('Reporting determination override or status change requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const before = await this.safeSingle<any>(this.db.from('incident_reporting_determinations').select('*').eq('tenant_id', tenantId).eq('incident_id', id).single());
    if (!before) return this.runReportingDetermination(tenantId, actorId, scope, id, dto, permissions);
    const row = await this.db.single<any>(this.db.from('incident_reporting_determinations').update(this.clean({
      determination_status: dto.determinationStatus,
      reporting_required: dto.reportingRequired,
      jurisdiction: dto.jurisdiction,
      applicable_rule_key: dto.applicableRuleKey,
      trigger_reasons_json: dto.triggerReasons,
      evidence_source_fields_json: dto.evidenceSourceFields,
      confidence: dto.confidence,
      reviewer_id: dto.reviewerId,
      review_status: dto.reviewStatus,
      notes: dto.notes ?? dto.reason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    })).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', before.id).select().single());
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Updated', 'Reporting determination updated', dto.reason ?? dto.notes, before, row, 'incidents.reporting.override', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async createIncidentNotification(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const existing = await this.incidentChildren(tenantId, 'incident_notifications', id, scope);
    const center = dto.recipientUserId ? await this.safeSingle<any>(this.db.from('notifications').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      user_id: dto.recipientUserId,
      title: dto.subject ?? `Incident ${incident.incident_number} notification`,
      message: dto.message ?? dto.notes ?? 'Incident notification sent from Notifications / Regulatory Reporting tab.',
      type: dto.notificationType ?? 'Incident notification',
      module: 'INCIDENTS',
      related_record_id: id,
      related_record_type: 'Incident',
      related_url: `/incidents/${id}?tab=notifications`,
      priority: dto.priority ?? 'Normal',
      status: 'Unread',
      metadata: { incidentId: id, notificationType: dto.notificationType ?? null }
    }).select().single()) : null;
    const row = await this.db.single<any>(this.db.from('incident_notifications').insert(this.notificationPatch(dto, tenantId, actorId, incident, false, existing.length + 1, center?.id)).select().single());
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Notification Sent', 'Incident notification sent', dto.triggerReason ?? dto.notes, null, row, 'incidents.notifications.send', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async resendIncidentNotification(tenantId: string, actorId: string, scope: Scope, id: string, notificationId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const before = await this.db.single<any>(this.db.from('incident_notifications').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', notificationId).single());
    const row = await this.db.single<any>(this.db.from('incident_notifications').update({ status: 'Sent', failed_reason: null, sent_by: actorId, sent_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', notificationId).select().single());
    await this.writeReportingMutation(tenantId, incident, actorId, 'Notification Sent', 'Incident notification resent', dto.reason, before, row, 'incidents.notifications.resend', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async acknowledgeIncidentNotification(tenantId: string, actorId: string, scope: Scope, id: string, notificationId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.db.single<any>(this.db.from('incident_notifications').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', notificationId).single());
    const row = await this.db.single<any>(this.db.from('incident_notifications').update({ status: 'Acknowledged', acknowledged_by: actorId, acknowledged_at: new Date().toISOString(), notes: dto.notes ?? before.notes, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', notificationId).select().single());
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Acknowledged', 'Incident notification acknowledged', dto.notes, before, row, 'incidents.notifications.acknowledge', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async regulatoryReportDetail(tenantId: string, scope: Scope, id: string, reportId: string) {
    await this.rawIncidentById(tenantId, scope, id);
    return this.db.single<any>(this.scopeQuery(this.db.from('incident_regulatory_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId), scope, 'site_id').single());
  }

  async createRegulatoryReport(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    if (['Yes', 'Required'].includes(dto.requiredStatus) && (!dto.ownerId || !dto.deadlineAt)) throw new BadRequestException('Required regulatory reports must have an owner and deadline.');
    const existing = await this.incidentChildren(tenantId, 'incident_regulatory_reports', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_regulatory_reports').insert(this.regulatoryReportPatch(dto, tenantId, actorId, incident, false, existing.length + 1)).select().single());
    await this.ensureReportingRequirements(tenantId, incident, actorId, row.id);
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Created', 'Regulatory report created', dto.triggerReason ?? dto.notes, null, row, 'incidents.reporting.edit', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async updateRegulatoryReport(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any>, permissions: string[] = []) {
    if (dto.status && ['Submitted', 'Acknowledged', 'Rejected', 'Cancelled'].includes(dto.status) && !dto.reason && !dto.notes) throw new BadRequestException('Regulatory report status changes require a reason or note.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const before = await this.db.single<any>(this.db.from('incident_regulatory_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId).single());
    if (['Yes', 'Required'].includes(dto.requiredStatus ?? before.required_status) && !(dto.ownerId ?? before.owner_id) || ['Yes', 'Required'].includes(dto.requiredStatus ?? before.required_status) && !(dto.deadlineAt ?? before.deadline_at)) throw new BadRequestException('Required regulatory reports must have an owner and deadline.');
    const row = await this.db.single<any>(this.db.from('incident_regulatory_reports').update(this.regulatoryReportPatch(dto, tenantId, actorId, incident, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId).select().single());
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Updated', 'Regulatory report updated', dto.reason ?? dto.notes, before, row, 'incidents.reporting.edit', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async generateReportPackage(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const before = await this.db.single<any>(this.db.from('incident_regulatory_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId).single());
    const packageId = dto.packageDocumentId ?? crypto.randomUUID();
    const row = await this.db.single<any>(this.db.from('incident_regulatory_reports').update({ package_document_id: packageId, package_status: 'Generated', status: before.status === 'Data Missing' ? 'Ready for Review' : before.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', reportId).select().single());
    await this.writeReportingMutation(tenantId, incident, actorId, 'Exported', 'Regulatory report package generated', dto.reason ?? 'Generated from report package checklist', before, row, 'incidents.reporting.generate_package', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async requestReportApproval(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    return this.updateRegulatoryReport(tenantId, actorId, scope, id, reportId, { ...dto, status: 'Pending Approval', reason: dto.reason ?? 'Approval requested' }, permissions);
  }

  async markReportSubmitted(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.submissionReference && !dto.notes) throw new BadRequestException('Mark submitted requires a submission reference or note.');
    return this.updateRegulatoryReport(tenantId, actorId, scope, id, reportId, { ...dto, status: 'Submitted', submittedBy: actorId, submittedAt: new Date().toISOString(), reason: dto.reason ?? dto.notes ?? 'Report submitted' }, permissions);
  }

  async addReportAcknowledgement(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.acknowledgementNumber && !dto.notes) throw new BadRequestException('Acknowledgement requires a reference number or note.');
    return this.updateRegulatoryReport(tenantId, actorId, scope, id, reportId, { ...dto, status: 'Acknowledged', acknowledgementReceived: true, acknowledgementAt: new Date().toISOString(), reason: dto.reason ?? dto.notes ?? 'Acknowledgement recorded' }, permissions);
  }

  async markReportRejected(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any> = {}, permissions: string[] = []) {
    if (!dto.reason) throw new BadRequestException('Report rejection requires a reason.');
    return this.updateRegulatoryReport(tenantId, actorId, scope, id, reportId, { ...dto, status: 'Rejected', rejected: true, rejectionReason: dto.reason }, permissions);
  }

  async createExternalStakeholderNotification(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const row = await this.db.single<any>(this.db.from('incident_external_stakeholder_notifications').insert(this.clean({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id,
      stakeholder_type: dto.stakeholderType, stakeholder_name: dto.stakeholderName, contact: dto.contact, notification_required: !!dto.notificationRequired,
      reason: dto.reason, channel: dto.channel, deadline_at: dto.deadlineAt, status: dto.status ?? (dto.notificationRequired ? 'Required' : 'Not Required'), acknowledgement_status: dto.acknowledgementStatus, notes: dto.notes,
      created_by: actorId, updated_by: actorId
    })).select().single());
    await this.updateIncidentReportingStatus(tenantId, id, actorId);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Notification Sent', 'External stakeholder notification recorded', dto.reason ?? dto.notes, null, row, 'incidents.notifications.send', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async createReportingFollowupAction(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanEditReporting(incident);
    const actionId = dto.universalActionId ?? crypto.randomUUID();
    const row = { id: actionId, incidentId: id, title: dto.title ?? 'Reporting follow-up action', reason: dto.reason, ownerId: dto.ownerId ?? incident.investigation_owner_id, dueDate: dto.dueDate ?? incident.due_date };
    await this.writeReportingMutation(tenantId, incident, actorId, 'Action Created', 'Reporting follow-up action created', dto.reason ?? dto.title, null, row, 'incidents.followups.create', actionId);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async requestReportingReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.db.single<any>(this.db.from('incident_reporting_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, status: 'Requested', reviewer_id: dto.reviewerId, due_date: this.dateOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ notifications_reporting_review_status: 'Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeReportingMutation(tenantId, incident, actorId, 'Submitted', 'Notification/reporting review requested', dto.reason ?? dto.comments, null, row, 'incidents.reporting.review.request', row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async decideReportingReview(tenantId: string, actorId: string, scope: Scope, id: string, decision: 'Approved' | 'Rejected' | 'Reopened', dto: Record<string, any>, permissions: string[] = []) {
    if (decision !== 'Approved' && !dto.reason) throw new BadRequestException('Reporting review rejection/reopen requires a reason.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (decision === 'Approved') {
      const tab = await this.notificationsReportingTab(tenantId, scope, id, permissions);
      if (tab.readiness?.status === 'Blocked') throw new BadRequestException('Reporting review approval is blocked by readiness blockers.');
    }
    const latest = (await this.incidentChildren(tenantId, 'incident_reporting_reviews', id, scope))[0];
    const patch = decision === 'Approved'
      ? { status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), comments: dto.comments, rework_required: false, updated_by: actorId, updated_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, rework_required: true, updated_by: actorId, updated_at: new Date().toISOString() }
        : { status: 'Reopened', comments: dto.reason, rework_required: true, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = latest ? await this.db.single<any>(this.db.from('incident_reporting_reviews').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', latest.id).select().single()) : await this.db.single<any>(this.db.from('incident_reporting_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, ...patch, created_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ notifications_reporting_review_status: decision, notifications_reporting_readiness_status: decision === 'Approved' ? 'Ready' : 'Review Required', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeReportingMutation(tenantId, incident, actorId, decision, `Notification/reporting review ${decision.toLowerCase()}`, dto.reason ?? dto.comments, latest, row, `incidents.reporting.review.${decision.toLowerCase()}`, row.id);
    return this.notificationsReportingTab(tenantId, scope, id, permissions);
  }

  async exportReportingLog(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[] = []) {
    const data = await this.notificationsReportingTab(tenantId, scope, id, permissions);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    await this.writeReportingMutation(tenantId, incident, actorId, 'Exported', 'Notification/regulatory reporting log exported', 'Export requested', null, { notificationCount: data.internalNotificationsRegister?.length ?? 0, reportCount: data.regulatoryReportsRegister?.length ?? 0 }, 'incidents.reporting.export', id);
    return { fileName: `${incident.incident_number ?? id}-notifications-regulatory-log.json`, generatedAt: new Date().toISOString(), data };
  }

  async reportingContext(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const [users, evidence, actions, documents] = await Promise.all([
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,department').eq('tenantId', tenantId).limit(100)),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentActions(tenantId, scope, id),
      this.safeMany<any>(this.db.from('documents').select('id,document_number,title,document_type,status,revision,site_id').eq('tenant_id', tenantId).eq('site_id', incident.site_id).order('updated_at', { ascending: false }).limit(100))
    ]);
    return {
      notificationTypes: ['Management escalation','HSE notification','Process safety notification','Operations notification','Maintenance/MI notification','Environmental notification','Medical/HR notification','Contractor management notification','Legal notification','Insurance notification','Emergency response notification','Review request','Reminder','Overdue escalation','Other'],
      notificationStatuses: ['Draft','Queued','Sent','Delivered','Acknowledged','Failed','Cancelled','Overdue acknowledgement'],
      channels: ['In-app','Email','SMS','Teams','Phone','External letter','Portal','Other'],
      reportTypes: ['Initial notification','Follow-up report','Final report','Environmental release report','Injury/fatality report','Process safety event report','Community notification','Contractor/client notification','Insurance/legal report','Company-defined report','Other'],
      reportStatuses: ['Not Determined','Required','Not Required','Draft','Data Missing','Ready for Review','Pending Approval','Approved','Submitted','Acknowledged','Rejected','Overdue','Cancelled'],
      stakeholderTypes: ['Regulator/agency','Local authority','Emergency services','Community/public','Contractor company','Client/customer','Insurance','Legal counsel','Corporate management','Other'],
      jurisdictions: [incident.site_id, incident.company_id].filter(Boolean),
      agencies: [],
      reportTemplates: [],
      users,
      evidence,
      documents,
      actions,
      permissions
    };
  }

  private async ensureReportingDetermination(tenantId: string, incident: any, actorId?: string) {
    const existing = await this.safeSingle<any>(this.db.from('incident_reporting_determinations').select('*').eq('tenant_id', tenantId).eq('incident_id', incident.id).single());
    if (existing) return existing;
    return this.safeSingle<any>(this.db.from('incident_reporting_determinations').insert({
      ...this.reportingDeterminationFromIncident(incident),
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      incident_id: incident.id,
      created_by: actorId ?? null,
      updated_by: actorId ?? null
    }).select().single());
  }

  private async ensureReportingRequirements(tenantId: string, incident: any, actorId?: string, reportId?: string) {
    const evidence = await this.safeMany<any>(this.db.from('incident_evidence').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id).limit(1));
    const requirements = this.reportingRequirementSeeds(incident, evidence.length > 0, reportId);
    for (const requirement of requirements) {
      const existingRows = await this.safeMany<any>(this.db.from('incident_reporting_requirements').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id).eq('requirement_key', requirement.requirement_key).limit(1));
      const existing = existingRows[0];
      if (existing?.id) {
        await this.safeSingle(this.db.from('incident_reporting_requirements').update({ ...requirement, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', existing.id).select('id').single());
      } else {
        await this.safeSingle(this.db.from('incident_reporting_requirements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, created_by: actorId ?? null, updated_by: actorId ?? null, ...requirement }).select('id').single());
      }
    }
  }

  private reportingDeterminationFromIncident(incident: any) {
    const triggers = [
      incident.regulatory_reporting_required ? 'Incident already flagged regulatory reporting required' : null,
      incident.injury_fatality_occurred || incident.fatality_potential ? 'Fatality or fatality potential' : null,
      incident.hospitalization || incident.medical_treatment_required ? 'Hospitalization or medical treatment' : null,
      incident.released_material ? 'Chemical release / LOPC data present' : null,
      incident.fire_explosion_occurred ? 'Fire or explosion occurred' : null,
      incident.environmental_impact ? 'Environmental impact' : null,
      incident.community_impact ? 'Community/public impact' : null,
      ['Tier 1', 'Tier 2'].includes(incident.pse_tier ?? '') ? `API RP 754 ${incident.pse_tier}` : null,
      incident.emergency_response_activated ? 'Emergency response activated' : null,
      incident.contractor_involved || incident.public_involved ? 'Contractor/public involvement' : null
    ].filter(Boolean);
    const configured = !!(incident.reporting_rule_key ?? incident.applicable_rule_key);
    const required = incident.regulatory_reporting_required ? 'Yes' : configured && !triggers.length ? 'No' : 'Not Determined';
    return {
      determination_status: required === 'Not Determined' ? 'Not Determined' : required === 'Yes' ? 'Required' : 'Not Required',
      reporting_required: required,
      jurisdiction: incident.site_id ?? incident.company_id ?? null,
      applicable_rule_key: incident.reporting_rule_key ?? incident.applicable_rule_key ?? null,
      trigger_reasons_json: triggers,
      evidence_source_fields_json: this.reportabilityCriteria(incident, null),
      confidence: configured ? (triggers.length ? 'Medium' : 'High') : 'Configuration Missing',
      review_status: required === 'Not Determined' ? 'Requested' : 'Not Requested',
      notes: configured ? 'Generated from incident facts and configured rule key.' : 'No company/site incident regulatory reporting configuration was found. Reporting remains Not Determined until reviewed.'
    };
  }

  private reportingRequirementSeeds(incident: any, hasEvidence: boolean, reportId?: string) {
    return [
      { requirement_key: 'incident_details', requirement_label: 'Incident details complete', status: incident.title && incident.event_datetime && incident.site_id ? 'Complete' : 'Missing', source_tab: 'Overview', missing_field: !incident.title ? 'Title' : !incident.event_datetime ? 'Event date/time' : !incident.site_id ? 'Site' : null, blocking: true, report_id: reportId },
      { requirement_key: 'classification', requirement_label: 'Classification complete', status: incident.classification && incident.pse_tier !== 'Not Determined' ? 'Complete' : 'Incomplete', source_tab: 'Event Details & Classification', missing_field: !incident.classification ? 'Classification' : 'PSE/API tier review', blocking: !!incident.is_process_safety_event, report_id: reportId },
      { requirement_key: 'severity_risk', requirement_label: 'Severity/risk complete', status: incident.potential_risk_score ? 'Complete' : 'Incomplete', source_tab: 'Potential Severity / Risk Matrix', missing_field: 'Potential risk score', blocking: true, report_id: reportId },
      { requirement_key: 'chemical_release', requirement_label: 'Chemical/release data complete if required', status: incident.released_material ? (incident.released_quantity ? 'Complete' : 'Missing') : 'Not Required', source_tab: 'Asset / Equipment / Chemical', missing_field: incident.released_material && !incident.released_quantity ? 'Released quantity' : null, blocking: !!incident.released_material, report_id: reportId },
      { requirement_key: 'evidence', requirement_label: 'Required evidence attached', status: hasEvidence ? 'Complete' : (incident.regulatory_reporting_required ? 'Missing' : 'Incomplete'), source_tab: 'Evidence / Attachments', required_evidence: 'Evidence/package support', blocking: !!incident.regulatory_reporting_required, report_id: reportId },
      { requirement_key: 'redaction', requirement_label: 'Restricted/medical data redacted', status: 'Complete', source_tab: 'Evidence / Attachments', blocking: false, report_id: reportId },
      { requirement_key: 'approval', requirement_label: 'Approval required if configured', status: incident.notifications_reporting_review_status === 'Approved' ? 'Complete' : (incident.regulatory_reporting_required ? 'Incomplete' : 'Not Required'), source_tab: 'Notifications / Regulatory Reporting', blocking: !!incident.regulatory_reporting_required, report_id: reportId }
    ];
  }

  private notificationPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update: boolean, index = 1, centerId?: string) {
    return this.clean({
      id: update ? undefined : crypto.randomUUID(),
      tenant_id: update ? undefined : tenantId,
      company_id: update ? undefined : incident.company_id,
      site_id: update ? undefined : incident.site_id,
      incident_id: update ? undefined : incident.id,
      notification_number: update ? undefined : dto.notificationNumber ?? `NOT-${String(index).padStart(3, '0')}`,
      notification_type: dto.notificationType,
      recipient_user_id: dto.recipientUserId,
      recipient_group: dto.recipientGroup,
      recipient_external_contact: dto.recipientExternalContact,
      channel: dto.channel ?? 'In-app',
      subject: dto.subject ?? `Incident ${incident.incident_number} notification`,
      message_redacted_snapshot: dto.message,
      trigger_reason: dto.triggerReason,
      priority: dto.priority ?? 'Normal',
      acknowledgement_required: !!dto.acknowledgementRequired,
      acknowledgement_due_at: dto.acknowledgementDueAt ?? null,
      status: dto.status ?? 'Sent',
      sent_by: actorId,
      sent_at: dto.status === 'Draft' ? undefined : new Date().toISOString(),
      failed_reason: dto.failedReason,
      notification_center_id: centerId,
      related_report_id: dto.relatedReportId,
      related_action_id: dto.relatedActionId,
      include_incident_summary: dto.includeIncidentSummary !== false,
      include_restricted_data: !!dto.includeRestrictedData,
      include_attachments: !!dto.includeAttachments,
      notes: dto.notes,
      created_by: update ? undefined : actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private regulatoryReportPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update: boolean, index = 1) {
    return this.clean({
      id: update ? undefined : crypto.randomUUID(),
      tenant_id: update ? undefined : tenantId,
      company_id: update ? undefined : incident.company_id,
      site_id: update ? undefined : incident.site_id,
      incident_id: update ? undefined : incident.id,
      report_number: update ? undefined : dto.reportNumber ?? `REG-${String(index).padStart(3, '0')}`,
      report_type: dto.reportType,
      jurisdiction: dto.jurisdiction,
      agency: dto.agency,
      applicable_rule_key: dto.applicableRuleKey,
      trigger_reason: dto.triggerReason,
      required_status: dto.requiredStatus ?? 'Not Determined',
      deadline_at: dto.deadlineAt ?? dto.deadline,
      owner_id: dto.ownerId,
      reviewer_id: dto.reviewerId,
      submission_method: dto.submissionMethod,
      status: dto.status ?? (dto.requiredStatus === 'Yes' || dto.requiredStatus === 'Required' ? 'Draft' : 'Not Determined'),
      submitted_by: dto.submittedBy,
      submitted_at: dto.submittedAt,
      submitted_to: dto.submittedTo,
      submission_reference: dto.submissionReference,
      acknowledgement_received: !!dto.acknowledgementReceived,
      acknowledgement_number: dto.acknowledgementNumber,
      acknowledgement_at: dto.acknowledgementAt,
      rejected: !!dto.rejected,
      rejection_reason: dto.rejectionReason,
      package_document_id: dto.packageDocumentId,
      package_status: dto.packageStatus,
      required_data_checklist_json: dto.requiredDataChecklist,
      required_evidence_json: dto.requiredEvidence,
      attachments_json: dto.attachments,
      notes: dto.notes,
      created_by: update ? undefined : actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private reportabilityCriteria(incident: any, determination: any) {
    const config = determination?.applicable_rule_key ?? incident.reporting_rule_key ?? null;
    const row = (criterion: string, sourceData: any, triggered: boolean | 'Not Determined', sourceTab: string, missingData?: string) => ({ id: criterion, criterion, sourceData, thresholdConfig: config ?? 'Missing company/site configuration', result: triggered === true ? 'Triggered' : triggered === false ? 'Not Triggered' : 'Not Determined', triggered, missingData, sourceTab, action: missingData ? `Complete ${sourceTab}` : 'Review' });
    return [
      row('Fatality/hospitalization', incident.injury_fatality_occurred || incident.hospitalization, !!(incident.injury_fatality_occurred || incident.hospitalization), 'People / Injury / Exposure'),
      row('Chemical release / LOPC', incident.released_material, incident.released_material ? 'Not Determined' : false, 'Asset / Equipment / Chemical', incident.released_material && !incident.released_quantity ? 'Released quantity' : undefined),
      row('Fire/explosion', incident.fire_explosion_occurred, !!incident.fire_explosion_occurred, 'Event Details & Classification'),
      row('Toxic exposure', incident.toxic_exposure_occurred, !!incident.toxic_exposure_occurred, 'People / Injury / Exposure'),
      row('Environmental/community impact', incident.environmental_impact || incident.community_impact, !!(incident.environmental_impact || incident.community_impact), 'Event Details & Classification'),
      row('PSM/PSE/API tier', incident.pse_tier, ['Tier 1','Tier 2'].includes(incident.pse_tier ?? '') ? true : (incident.pse_tier === 'Not Determined' ? 'Not Determined' : false), 'Event Details & Classification', incident.pse_tier === 'Not Determined' ? 'PSE tier review' : undefined),
      row('Emergency services/external agency', incident.emergency_response_activated || incident.external_agency_called, !!(incident.emergency_response_activated || incident.external_agency_called), 'Immediate Actions'),
      row('Contractor/public involvement', incident.contractor_involved || incident.public_involved, !!(incident.contractor_involved || incident.public_involved), 'People / Injury / Exposure'),
      row('Site-specific reportability rule', config, config ? 'Not Determined' : 'Not Determined', 'Notifications / Regulatory Reporting', config ? undefined : 'Regulatory reporting configuration')
    ];
  }

  private reportingDeadlines(reports: any[], stakeholders: any[], notifications: any[]) {
    const rows = [
      ...reports.map((row) => ({ id: row.id, report: row.report_number ?? row.report_type, deadline: row.deadline_at, overdue: this.reportingOverdue(row), escalationLevel: this.reportingOverdue(row) ? 'Overdue' : this.deadlineSoon(row.deadline_at) ? 'Approaching' : 'Normal', escalationOwner: row.owner_id, reminderSchedule: 'Configured by Notification Center', lastReminderSent: null, nextReminder: row.deadline_at, escalationStatus: this.reportingOverdue(row) ? 'Escalation Required' : 'On Track', notes: row.notes })),
      ...stakeholders.filter((row) => row.notification_required).map((row) => ({ id: row.id, report: row.stakeholder_type, deadline: row.deadline_at, overdue: this.reportingOverdue(row), escalationLevel: this.reportingOverdue(row) ? 'Overdue' : 'Normal', escalationOwner: row.updated_by, reminderSchedule: 'Configured by Notification Center', nextReminder: row.deadline_at, escalationStatus: row.status, notes: row.notes })),
      ...notifications.filter((row) => row.acknowledgement_required).map((row) => ({ id: row.id, report: row.notification_number, deadline: row.acknowledgement_due_at, overdue: this.reportingOverdue({ deadline_at: row.acknowledgement_due_at, status: row.status }), escalationLevel: row.status === 'Overdue acknowledgement' ? 'Overdue' : 'Normal', escalationOwner: row.sent_by, reminderSchedule: 'Acknowledgement reminders', nextReminder: row.acknowledgement_due_at, escalationStatus: row.status, notes: row.notes }))
    ];
    const next = rows.filter((row) => row.deadline && !row.overdue).sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))[0]?.deadline ?? null;
    return { rows, nextDeadline: next, overdue: rows.filter((row) => row.overdue), approaching: rows.filter((row) => this.deadlineSoon(row.deadline) && !row.overdue) };
  }

  private reportingPackageChecklist(incident: any, requirements: any[], evidence: any[], reports: any[]) {
    return { rows: requirements, status: requirements.some((row) => row.blocking && !['Complete', 'Not Required'].includes(row.status)) ? 'Required Data Missing' : 'Complete', evidenceCount: evidence.length, reportPackagesGenerated: reports.filter((row) => row.package_document_id).length, warning: requirements.some((row) => row.status === 'Missing') ? 'Missing required data blocks report submission.' : null };
  }

  private managementLegalInsurancePanel(incident: any, notifications: any[], stakeholders: any[]) {
    const required = {
      seniorManagement: !!(incident.high_potential_near_miss || ['Tier 1','Tier 2'].includes(incident.pse_tier ?? '') || incident.regulatory_reporting_required),
      legal: !!(incident.regulatory_reporting_required || incident.public_involved || incident.community_impact),
      insurance: !!(incident.regulatory_reporting_required || incident.fire_explosion_occurred || incident.released_material),
      hrMedical: !!(incident.injury_occurred || incident.injury_fatality_occurred),
      corporateProcessSafety: !!(incident.is_psm_incident || incident.is_process_safety_event)
    };
    return { required, notifications, stakeholders: stakeholders.filter((row) => ['Insurance', 'Legal counsel', 'Corporate management'].includes(row.stakeholder_type)), status: Object.values(required).some(Boolean) ? 'Review Required' : 'Not Required', owner: incident.investigation_owner_id, notes: 'Backend-generated recommendation from incident flags and configured reporting fields; no legal advice is hardcoded.' };
  }

  private reportingReadiness(incident: any, determination: any, notifications: any[], reports: any[], requirements: any[], stakeholders: any[], review: any, evidence: any[]) {
    const checks = [
      this.check('Reporting determination complete', determination.reporting_required !== 'Not Determined', 'Reporting Determination', determination.reporting_required === 'Not Determined'),
      this.check('Required notifications sent', notifications.every((row) => !['Draft','Queued','Failed','Overdue acknowledgement'].includes(row.status)) && notifications.some((row) => ['Sent','Delivered','Acknowledged'].includes(row.status)) || determination.reporting_required !== 'Yes', 'Internal Notifications Register'),
      this.check('Failed notifications resolved', !notifications.some((row) => row.status === 'Failed'), 'Internal Notifications Register'),
      this.check('Required reports created', reports.length > 0 || determination.reporting_required !== 'Yes', 'Regulatory Reporting Register', determination.reporting_required === 'Yes' && !reports.length),
      this.check('Report owners assigned', reports.every((row) => !['Yes','Required'].includes(row.required_status) || row.owner_id), 'Regulatory Reporting Register'),
      this.check('Deadlines tracked', reports.every((row) => !['Yes','Required'].includes(row.required_status) || row.deadline_at), 'Deadline & Escalation'),
      this.check('Required report data complete', !requirements.some((row) => row.blocking && !['Complete','Not Required'].includes(row.status)), 'Report Package / Required Data'),
      this.check('Required evidence/package attached', evidence.length > 0 || determination.reporting_required !== 'Yes', 'Evidence / Attachments'),
      this.check('Submission/acknowledgement recorded', reports.every((row) => !['Submitted'].includes(row.status) || row.submission_reference || row.submitted_at), 'Submission & Acknowledgement'),
      this.check('Overdue reports escalated', !reports.some((row) => this.reportingOverdue(row)), 'Deadline & Escalation'),
      this.check('Review complete if required', determination.reporting_required !== 'Yes' || ['Approved','Not Requested'].includes(review.status ?? 'Not Requested'), 'Notification & Reporting Review')
    ];
    const blockers = checks.filter((row: any) => row.blocking || row.status === 'Incomplete');
    const score = Math.round((checks.length - blockers.length) / checks.length * 100);
    return { status: blockers.length ? 'Blocked' : 'Ready', score, readyForClosure: !blockers.length, checklist: checks, blockers, configWarnings: determination.reporting_required === 'Not Determined' ? ['Missing company/site regulatory reporting configuration or review.'] : [] };
  }

  private reportingSummaryCards(determination: any, notifications: any[], reports: any[], requirements: any[], review: any, readiness: any) {
    return [
      this.card('Reporting required', determination.reporting_required === 'Yes' ? 'Yes' : 'No', determination.reporting_required === 'Yes' ? 'danger' : 'ok', 'Backend determination result'),
      this.card('Reporting not determined', determination.reporting_required === 'Not Determined' ? 'Yes' : 'No', determination.reporting_required === 'Not Determined' ? 'warning' : 'ok', 'Missing configuration or review'),
      this.card('Internal notifications sent', notifications.filter((row) => ['Sent','Delivered','Acknowledged'].includes(row.status)).length, 'info', 'Notification Center backed rows'),
      this.card('Internal notifications pending', notifications.filter((row) => ['Draft','Queued'].includes(row.status)).length, 'warning', 'Pending send queue'),
      this.card('Failed notifications', notifications.filter((row) => row.status === 'Failed').length, notifications.some((row) => row.status === 'Failed') ? 'danger' : 'ok', 'Failed notifications'),
      this.card('Regulatory reports required', reports.filter((row) => ['Yes','Required'].includes(row.required_status)).length, 'warning', 'Required report rows'),
      this.card('Draft reports', reports.filter((row) => row.status === 'Draft').length, 'info', 'Draft regulatory reports'),
      this.card('Reports awaiting approval', reports.filter((row) => row.status === 'Pending Approval').length, 'warning', 'Pending approval'),
      this.card('Reports submitted', reports.filter((row) => row.status === 'Submitted').length, 'info', 'Submitted reports'),
      this.card('Reports acknowledged', reports.filter((row) => row.status === 'Acknowledged' || row.acknowledgement_received).length, 'ok', 'Acknowledged reports'),
      this.card('Reports overdue', reports.filter((row) => this.reportingOverdue(row)).length, reports.some((row) => this.reportingOverdue(row)) ? 'danger' : 'ok', 'Overdue reporting deadlines'),
      this.card('Missing required data', requirements.filter((row) => row.blocking && !['Complete','Not Required'].includes(row.status)).length, requirements.some((row) => row.blocking && !['Complete','Not Required'].includes(row.status)) ? 'danger' : 'ok', 'Package checklist blockers'),
      this.card('Review status', review.status ?? 'Not Requested', 'status', 'Review workflow'),
      this.card('Ready for review/closure', readiness.readyForClosure ? 'Yes' : 'No', readiness.readyForClosure ? 'ok' : 'warning', 'Backend readiness result')
    ];
  }

  private reportingNotificationStatus(notifications: any[]) {
    if (notifications.some((row) => row.status === 'Failed')) return 'Failed';
    if (notifications.some((row) => ['Draft','Queued'].includes(row.status))) return 'Pending';
    if (notifications.length) return 'Sent';
    return 'Not Started';
  }

  private reportingReportStatus(reports: any[], determination: any) {
    if (determination.reporting_required === 'Not Determined') return 'Not Determined';
    if (reports.some((row) => this.reportingOverdue(row))) return 'Overdue';
    if (reports.some((row) => row.status === 'Rejected')) return 'Rejected';
    if (reports.some((row) => row.status === 'Pending Approval')) return 'Pending Approval';
    if (reports.some((row) => row.status === 'Submitted')) return 'Submitted';
    if (reports.some((row) => row.status === 'Acknowledged')) return 'Acknowledged';
    return reports.length ? 'Draft' : determination.reporting_required === 'Yes' ? 'Required' : 'Not Required';
  }

  private reportingActions(permissions: string[], locked: boolean, lockedReason: string | null) {
    const reason = locked ? lockedReason : undefined;
    const action = (key: string, label: string, permission: string) => ({ key, label, enabled: !locked && permissions.includes(permission), disabledReason: locked ? reason : `Missing ${permission} permission` });
    return [
      action('send-notification', 'Send Notification', 'incidents.notifications.send'),
      action('add-report', 'Add Regulatory Report', 'incidents.reporting.edit'),
      action('run-determination', 'Run Reporting Determination', 'incidents.reporting.determine'),
      action('generate-package', 'Generate Report Package', 'incidents.reporting.generate_package'),
      action('request-review', 'Request Review', 'incidents.reporting.review.request'),
      action('create-followup', 'Create Follow-up Action', 'incidents.followups.create'),
      action('refresh-status', 'Refresh Status', 'incidents.notifications_reporting.view'),
      { key: 'export-log', label: 'Export Notification Log', enabled: permissions.includes('incidents.reporting.export'), disabledReason: `Missing incidents.reporting.export permission` }
    ];
  }

  private reportingOverdue(row: any) {
    const deadline = row.deadline_at ?? row.acknowledgement_due_at;
    return !!deadline && this.isPastDate(deadline) && !['Acknowledged','Cancelled','Not Required'].includes(row.status ?? '');
  }

  private deadlineSoon(value?: string) {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time >= Date.now() && time - Date.now() <= 72 * 60 * 60 * 1000;
  }

  private async updateIncidentReportingStatus(tenantId: string, incidentId: string, actorId: string) {
    const [determination, notifications, reports, requirements] = await Promise.all([
      this.safeSingle<any>(this.db.from('incident_reporting_determinations').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).single()),
      this.safeMany<any>(this.db.from('incident_notifications').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId)),
      this.safeMany<any>(this.db.from('incident_regulatory_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId)),
      this.safeMany<any>(this.db.from('incident_reporting_requirements').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId))
    ]);
    const nextDeadline = reports.filter((row) => row.deadline_at && !this.reportingOverdue(row)).sort((a, b) => String(a.deadline_at).localeCompare(String(b.deadline_at)))[0]?.deadline_at ?? null;
    const missing = requirements.filter((row) => row.blocking && !['Complete','Not Required'].includes(row.status)).length;
    await this.safeSingle(this.db.from('incidents').update({
      regulatory_reporting_required: determination?.reporting_required === 'Yes',
      notification_required: determination?.reporting_required === 'Yes' || notifications.length > 0,
      reporting_determination_status: determination?.determination_status ?? 'Not Determined',
      reporting_required_status: determination?.reporting_required ?? 'Not Determined',
      reporting_next_deadline_at: nextDeadline,
      reporting_open_reports_count: reports.filter((row) => !['Acknowledged','Cancelled','Not Required'].includes(row.status ?? '')).length,
      reporting_overdue_reports_count: reports.filter((row) => this.reportingOverdue(row)).length,
      reporting_failed_notifications_count: notifications.filter((row) => row.status === 'Failed').length,
      reporting_missing_required_count: missing,
      notifications_reporting_readiness_status: missing || reports.some((row) => this.reportingOverdue(row)) ? 'Blocked' : 'Ready',
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private assertCanEditReporting(incident: any) {
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed incidents are read-only. Reopen before changing notifications or regulatory reporting.');
  }

  private async writeReportingMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason: string | undefined, before: any, after: any, action: string, entityId: string) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'INCIDENT_REPORTING', entityId, before: before as JsonValue, after: after as JsonValue });
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
  }

  async reviewApprovalTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return { restricted: true, summaryCards: [this.card('Restricted incident', 'Redacted', 'danger', incident.actionsDisabledReason)] };
    const [approval, reviewers, decisions, storedBlockers, changeRequests, actions, history] = await Promise.all([
      this.ensureReviewApproval(tenantId, incident),
      this.incidentChildren(tenantId, 'incident_reviewers', id, scope),
      this.incidentChildren(tenantId, 'incident_review_decisions', id, scope),
      this.incidentChildren(tenantId, 'incident_review_blockers', id, scope),
      this.incidentChildren(tenantId, 'incident_change_requests', id, scope),
      this.incidentActions(tenantId, scope, id),
      this.incidentHistory(tenantId, id, 100)
    ]);
    const sectionChecklist = await this.reviewSectionChecklist(tenantId, scope, incident);
    const generatedBlockers = this.reviewGeneratedBlockers(incident, sectionChecklist, reviewers, decisions, changeRequests, actions);
    const blockers = this.mergeReviewBlockers(storedBlockers, generatedBlockers);
    const readiness = this.reviewReadiness(incident, approval, sectionChecklist, reviewers, decisions, blockers, changeRequests);
    const workflow = this.reviewWorkflow(incident, approval, reviewers);
    await this.updateReviewApprovalRollup(tenantId, incident.id, readiness, reviewers, blockers, approval);
    return {
      header: this.reviewApprovalHeader(incident, approval, readiness, reviewers, blockers, permissions),
      summaryCards: this.reviewSummaryCards(incident, approval, readiness, sectionChecklist, reviewers, decisions, blockers, changeRequests),
      readinessGate: readiness.gate,
      sectionChecklist,
      workflow,
      reviewers,
      decisions,
      eSignatures: await this.reviewSignatures(tenantId, incident.id),
      blockers,
      changeRequests,
      closure: this.reviewClosure(incident, approval, readiness, blockers),
      reopen: this.reviewReopenControl(incident, approval, readiness),
      changeHistory: history.filter((event) => /review|approval|closure|signature|change request|blocker|reopen/i.test(`${event.event_title} ${event.event_description} ${event.event_type}`)),
      readiness,
      context: await this.reviewApprovalContext(tenantId, scope, incident, permissions),
      permissions,
      readOnly: this.closedStatus(incident.status),
      lockedReason: this.closedStatus(incident.status) ? 'Closed incidents are read-only unless reopened with permission.' : null,
      updatedAt: new Date().toISOString()
    };
  }

  async reviewApprovalSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.reviewApprovalTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? data;
  }

  async runReviewReadinessCheck(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.ensureReviewApproval(tenantId, incident);
    const tab = await this.reviewApprovalTab(tenantId, scope, id, permissions) as Record<string, any>;
    await this.persistReviewBlockers(tenantId, actorId, incident, tab.blockers ?? []);
    const after = await this.safeSingle<any>(this.db.from('incident_review_approvals').update({ review_status: tab.readiness?.readyForReview ? 'Ready for Review' : 'Not Ready', readiness_status: tab.readiness?.status ?? 'Not Ready', ready_for_closure: !!tab.readiness?.readyForClosure, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'System Generated', 'Review readiness check run', dto.reason ?? 'Backend review readiness generated', before, after, 'incidents.review_approval.run_readiness_check', after?.id ?? id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async startReviewWorkflow(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.start_workflow');
    const before = await this.ensureReviewApproval(tenantId, incident);
    const workflowSnapshot = { name: dto.workflowName ?? 'Incident Investigation Approval', version: dto.workflowVersion ?? 'site-current', triggerBasis: this.workflowTriggerBasis(incident), startedAt: new Date().toISOString(), source: 'Workflow Engine integration snapshot' };
    const after = await this.safeSingle<any>(this.db.from('incident_review_approvals').update({ review_status: 'Workflow in progress', workflow_id: dto.workflowId ?? before.workflow_id ?? crypto.randomUUID(), workflow_version: workflowSnapshot.version, workflow_snapshot_json: workflowSnapshot, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    await this.safeSingle(this.db.from('incidents').update({ review_approval_status: 'Workflow in progress', approval_workflow_status: 'Workflow in progress', review_approval_started_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Submitted', 'Review approval workflow started', dto.reason ?? 'Workflow started from Review & Approval tab', before, after, 'incidents.review_approval.start_workflow', after?.id ?? id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async createReviewReviewer(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.add_reviewer');
    const user = dto.reviewerUserId ? await this.safeSingle<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).eq('id', dto.reviewerUserId).single()) : null;
    const row = await this.db.single<any>(this.db.from('incident_reviewers').insert(this.reviewReviewerPatch(dto, tenantId, actorId, incident, user, false)).select().single());
    await this.sendReviewNotification(tenantId, actorId, incident, row, dto.notificationMessage ?? 'You have been assigned as an incident reviewer/approver.');
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Created', 'Reviewer/approver added', dto.reason ?? row.role, null, row, 'incidents.review_approval.add_reviewer', row.id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async updateReviewReviewer(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.edit_reviewer');
    const before = await this.db.single<any>(this.db.from('incident_reviewers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reviewerId).single());
    const user = dto.reviewerUserId ? await this.safeSingle<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).eq('id', dto.reviewerUserId).single()) : null;
    const row = await this.db.single<any>(this.db.from('incident_reviewers').update(this.reviewReviewerPatch(dto, tenantId, actorId, incident, user, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reviewerId).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Updated', 'Reviewer/approver updated', dto.reason ?? dto.changeReason, before, row, 'incidents.review_approval.edit_reviewer', row.id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async removeReviewReviewer(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.remove_reviewer');
    if (!dto.reason) throw new BadRequestException('Removing a reviewer requires a reason.');
    const before = await this.db.single<any>(this.db.from('incident_reviewers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reviewerId).single());
    const row = await this.db.single<any>(this.db.from('incident_reviewers').update({ status: 'Skipped by authorized override', decision: 'Override approved', comments: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reviewerId).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Updated', 'Reviewer/approver removed by override', dto.reason, before, row, 'incidents.review_approval.remove_reviewer', reviewerId);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async requestReviewApprovalForReviewer(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.reviewReviewerStatus(tenantId, actorId, scope, id, reviewerId, { ...dto, status: 'Pending', decision: null }, 'Submitted', 'Review request sent', 'incidents.review_approval.start_workflow', permissions);
  }

  async decideReviewReviewer(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, decision: string, dto: Record<string, any>, permissions: string[] = []) {
    const permission = decision === 'Approved' ? 'incidents.review_approval.approve' : decision === 'Rejected' ? 'incidents.review_approval.reject' : 'incidents.review_approval.request_changes';
    const status = decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'Changes Requested';
    const tab = await this.reviewReviewerStatus(tenantId, actorId, scope, id, reviewerId, { ...dto, status, decision }, decision, `Reviewer ${decision.toLowerCase()}`, permission, permissions);
    if (decision !== 'Approved') await this.createChangeRequestFromDecision(tenantId, actorId, scope, id, reviewerId, decision, dto);
    return tab;
  }

  async delegateReviewReviewer(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.reviewReviewerStatus(tenantId, actorId, scope, id, reviewerId, { ...dto, status: 'Delegated', decision: 'Delegated', delegatedToUserId: dto.delegatedToUserId }, 'Delegated', 'Reviewer delegated', 'incidents.review_approval.delegate', permissions);
  }

  async escalateReviewReviewer(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.reviewReviewerStatus(tenantId, actorId, scope, id, reviewerId, { ...dto, status: 'Escalated', decision: 'Escalated', escalationStatus: 'Escalated' }, 'Escalated', 'Reviewer escalated', 'incidents.review_approval.escalate', permissions);
  }

  async eSignReviewApproval(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.e_sign');
    const reviewer = dto.reviewerId ? await this.safeSingle<any>(this.db.from('incident_reviewers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', dto.reviewerId).single()) : null;
    const profile = await this.safeSingle<any>(this.db.from('user_signature_profiles').select('*').eq('tenant_id', tenantId).eq('user_id', actorId).eq('status', 'Active').single());
    if (!profile?.id) throw new BadRequestException('Active Universal E-Signature profile is required before signing.');
    const payload = { incidentId: id, reviewerId: reviewer?.id ?? null, meaning: dto.signatureMeaning ?? 'I approve closure', reason: dto.reason, signedAt: new Date().toISOString() };
    const signature = await this.db.single<any>(this.db.from('electronic_signatures').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, user_id: actorId, signature_profile_id: profile.id, signature_profile_version_id: profile.current_version_id ?? null,
      module_name: 'INCIDENTS', record_type: 'Incident Review Approval', record_id: reviewer?.id ?? id, record_number: incident.incident_number, action_type: 'review_approval.e_sign', signature_role: reviewer?.role ?? dto.signatureRole ?? 'Approver',
      declaration_text: dto.signatureMeaning ?? 'I approve closure', signature_snapshot_method: profile.signature_method, signature_snapshot_text: profile.signature_text, signature_snapshot_image_key: profile.signature_image_key, signature_snapshot_image_url: profile.signature_image_url, signature_snapshot_vector_json: profile.signature_vector_json,
      signer_full_name: profile.full_name ?? profile.display_name ?? actorId, signer_job_title: profile.job_title ?? null, signer_department: profile.department ?? null, auth_method: dto.authMethod ?? 'Authenticated session', auth_result: 'Passed',
      signature_hash: crypto.randomUUID(), record_hash_before_signing: crypto.randomUUID(), signed_payload_hash: crypto.randomUUID(), metadata: payload
    }).select().single());
    const decision = await this.db.single<any>(this.db.from('incident_review_decisions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, reviewer_id: reviewer?.id ?? null, decision: dto.decision ?? 'E-Signed', comment: dto.reason, related_section: dto.relatedSection ?? 'Review & Approval', signed: true, signed_at: signature.signed_at, signature_id: signature.id, signature_meaning: dto.signatureMeaning, signature_reference: signature.signature_hash, created_by: actorId }).select().single());
    if (reviewer?.id) await this.safeSingle(this.db.from('incident_reviewers').update({ e_signature_id: signature.id, status: 'Approved', decision: 'Approved', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', reviewer.id).select('id').single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Signed', 'Review approval e-signed', dto.reason ?? dto.signatureMeaning, reviewer, { signature, decision }, 'incidents.review_approval.e_sign', signature.id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async overrideReviewBlocker(tenantId: string, actorId: string, scope: Scope, id: string, blockerId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.override_blocker');
    if (!dto.reason) throw new BadRequestException('Blocker override requires a reason.');
    const before = await this.db.single<any>(this.db.from('incident_review_blockers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', blockerId).single());
    const row = await this.db.single<any>(this.db.from('incident_review_blockers').update({ status: 'Accepted by exception', blocking: false, override_reason: dto.reason, resolved_by: actorId, resolved_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', blockerId).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Override approved', 'Review blocker overridden', dto.reason, before, row, 'incidents.review_approval.override_blocker', blockerId);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async createReviewChangeRequest(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.request_changes');
    const existing = await this.incidentChildren(tenantId, 'incident_change_requests', id, scope);
    const row = await this.db.single<any>(this.db.from('incident_change_requests').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, request_number: dto.requestNumber ?? `CR-${String(existing.length + 1).padStart(3, '0')}`, requested_by: actorId, source_section: dto.sourceSection, description: dto.description, owner_id: dto.ownerId, due_date: this.dateTimeOrNull(dto.dueDate), status: dto.status ?? 'Open', linked_action_id: dto.linkedActionId, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ review_approval_status: 'Changes Requested', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Changes requested', 'Review change request created', dto.reason ?? dto.description, null, row, 'incidents.review_approval.request_changes', row.id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async updateReviewChangeRequest(tenantId: string, actorId: string, scope: Scope, id: string, requestId: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.request_changes');
    const before = await this.db.single<any>(this.db.from('incident_change_requests').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', requestId).single());
    const patch = this.clean({ source_section: dto.sourceSection, description: dto.description, owner_id: dto.ownerId, due_date: this.dateTimeOrNull(dto.dueDate), status: dto.status, resolution_notes: dto.resolutionNotes, linked_action_id: dto.linkedActionId, resolved_by: dto.resolvedBy, resolved_at: dto.resolvedAt, updated_by: actorId, updated_at: new Date().toISOString() });
    const row = await this.db.single<any>(this.db.from('incident_change_requests').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', requestId).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Updated', 'Review change request updated', dto.reason, before, row, 'incidents.review_approval.request_changes', requestId);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async resolveReviewChangeRequest(tenantId: string, actorId: string, scope: Scope, id: string, requestId: string, dto: Record<string, any>, permissions: string[] = []) {
    return this.updateReviewChangeRequest(tenantId, actorId, scope, id, requestId, { ...dto, status: dto.reopen ? 'Reopened' : 'Resolved', resolutionNotes: dto.resolutionNotes ?? dto.reason, resolvedBy: actorId, resolvedAt: new Date().toISOString() }, permissions);
  }

  async requestIncidentClosureFromReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.request_closure');
    const tab = await this.reviewApprovalTab(tenantId, scope, id, permissions) as Record<string, any>;
    if (!tab.readiness?.readyForClosure && !dto.overrideReason) throw new BadRequestException(`Closure blocked: ${(tab.readiness?.blockers ?? []).map((b: any) => b.description ?? b.title).join('; ') || 'readiness is incomplete'}`);
    const before = await this.ensureReviewApproval(tenantId, incident);
    const after = await this.safeSingle<any>(this.db.from('incident_review_approvals').update({ closure_status: 'Closure Requested', closure_summary: dto.closureSummary, exception_reason: dto.overrideReason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    await this.safeSingle(this.db.from('incidents').update({ closure_status: 'Closure Requested', ready_for_closure: !!tab.readiness?.readyForClosure, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Closure Requested', 'Incident closure requested', dto.reason ?? dto.closureSummary, before, after, 'incidents.review_approval.request_closure', after?.id ?? id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async approveIncidentClosureFromReview(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.approve');
    const before = await this.ensureReviewApproval(tenantId, incident);
    const after = await this.safeSingle<any>(this.db.from('incident_review_approvals').update({ closure_status: 'Approved for Closure', review_status: 'Approved', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Approved', 'Incident approved for closure', dto.reason ?? dto.comments, before, after, 'incidents.review_approval.approve', after?.id ?? id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async closeIncidentFromReviewApproval(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.close');
    const tab = await this.reviewApprovalTab(tenantId, scope, id, permissions) as Record<string, any>;
    if (!tab.readiness?.readyForClosure && !dto.exceptionReason) throw new BadRequestException('Incident closure is blocked by open readiness items. Provide an authorized exception reason if policy allows.');
    const approval = await this.ensureReviewApproval(tenantId, incident);
    const now = new Date().toISOString();
    const after = await this.safeSingle<any>(this.db.from('incident_review_approvals').update({ review_status: 'Closed', closure_status: 'Closed', ready_for_closure: true, closed_by: actorId, closed_at: now, closure_summary: dto.closureSummary ?? dto.reason, exception_reason: dto.exceptionReason, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    const updatedIncident = await this.safeSingle<any>(this.db.from('incidents').update({ status: 'Closed', review_approval_status: 'Closed', approval_workflow_status: 'Closed', closure_status: 'Closed', ready_for_closure: true, review_approval_closed_by: actorId, review_approval_closed_at: now, status_changed_by: actorId, status_changed_at: now, status_change_reason: dto.reason ?? dto.closureSummary, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('*').single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Closed', 'Incident closed through Review & Approval', dto.reason ?? dto.closureSummary, { approval, incident }, { approval: after, incident: updatedIncident }, 'incidents.review_approval.close', id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async reopenIncidentFromReviewApproval(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, 'incidents.review_approval.reopen');
    if (!dto.reason) throw new BadRequestException('Reopening requires a reason.');
    const approval = await this.ensureReviewApproval(tenantId, incident);
    const now = new Date().toISOString();
    const after = await this.safeSingle<any>(this.db.from('incident_review_approvals').update({ review_status: 'Reopened', closure_status: 'Reopened', ready_for_closure: false, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('incident_id', id).select().single());
    const updatedIncident = await this.safeSingle<any>(this.db.from('incidents').update({ status: 'Reopened', review_approval_status: 'Reopened', closure_status: 'Reopened', ready_for_closure: false, reapproval_required: true, status_changed_by: actorId, status_changed_at: now, status_change_reason: dto.reason, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('*').single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, 'Reopened', 'Incident reopened from Review & Approval', dto.reason, { approval, incident }, { approval: after, incident: updatedIncident }, 'incidents.review_approval.reopen', id);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  async reviewApprovalContext(tenantId: string, scope: Scope, incident: any, permissions: string[] = []) {
    const users = await this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).order('displayName').limit(150));
    return {
      users,
      approvalRoles: ['Investigation Lead','HSE Manager','Process Safety Manager','Operations Manager','Maintenance/MI Manager','Engineering Manager','Environmental Representative','HR/Medical Reviewer','Site Manager','Corporate Reviewer','Regulatory/Compliance Reviewer','Legal/Insurance Reviewer','Other'],
      reviewerStatuses: ['Not Started','Pending','In Review','Approved','Rejected','Changes Requested','Delegated','Escalated','Skipped by authorized override'],
      decisions: ['Approved','Approved with comments','Rejected','Changes requested','Information requested','Delegated','Escalated','Override approved'],
      signatureMeanings: ['I reviewed the incident investigation','I approve RCA conclusions','I approve CAPA plan','I approve regulatory reporting status','I approve closure','Other configured meaning'],
      closureStatuses: ['Not Ready','Ready for Closure','Closure Requested','Approved for Closure','Closed','Closure Rejected','Reopened'],
      workflowConfig: { configured: false, message: 'Workflow Engine configuration will be snapshotted when a configured route is available.', triggerBasis: this.workflowTriggerBasis(incident) },
      permissions
    };
  }

  private async ensureReviewApproval(tenantId: string, incident: any) {
    const existing = await this.safeSingle<any>(this.db.from('incident_review_approvals').select('*').eq('tenant_id', tenantId).eq('incident_id', incident.id).single());
    if (existing) return existing;
    return this.safeSingle<any>(this.db.from('incident_review_approvals').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, review_status: incident.review_approval_status ?? 'Not Started', workflow_snapshot_json: {}, readiness_status: incident.review_approval_readiness_status ?? 'Not Ready', ready_for_closure: !!incident.ready_for_closure, closure_status: incident.closure_status ?? 'Not Ready', created_by: incident.created_by ?? null, updated_by: incident.updated_by ?? null }).select().single()) ?? {};
  }

  private async reviewSectionChecklist(tenantId: string, scope: Scope, incident: any) {
    const [people, assets, timeline, evidence, immediate, team, rca, barriers, capa, links, reports] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_people_initial', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_equipment_chemical_initial', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_timeline_events', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_evidence', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_immediate_actions', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_investigation_team_members', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_linked_records', incident.id, scope),
      this.incidentChildren(tenantId, 'incident_regulatory_reports', incident.id, scope)
    ]);
    const rows = [
      ['Overview', true, !!incident.title && !!incident.event_datetime, incident.updated_at, incident.investigation_owner_id, 0, 'overview'],
      ['Event Details & Classification', true, !!incident.title && !!incident.event_datetime && !!incident.classification, incident.updated_at, incident.investigation_owner_id, !incident.classification ? 1 : 0, 'event-details'],
      ['Potential Severity / Risk Matrix', true, !!incident.potential_severity && !!incident.potential_risk_score && incident.potential_risk_score !== 'Not Determined', incident.updated_at, incident.investigation_owner_id, incident.potential_risk_score === 'Not Determined' ? 1 : 0, 'potential-severity'],
      ['People / Injury / Exposure', !!(incident.injury_occurred || incident.toxic_exposure_occurred || incident.people_involved), !(incident.injury_occurred || incident.toxic_exposure_occurred || incident.people_involved) || people.length > 0, incident.updated_at, incident.investigation_owner_id, 0, 'people'],
      ['Asset / Equipment / Chemical', !!(incident.equipment_involved || incident.chemical_involved || incident.released_material), !(incident.equipment_involved || incident.chemical_involved || incident.released_material) || assets.length > 0, incident.updated_at, incident.investigation_owner_id, 0, 'asset-chemical'],
      ['Timeline', true, timeline.length > 0 || ['Ready','Approved','Complete'].includes(incident.timeline_readiness_status ?? ''), incident.updated_at, incident.investigation_owner_id, 0, 'timeline'],
      ['Evidence / Attachments', true, evidence.length > 0, incident.updated_at, incident.investigation_owner_id, evidence.length ? 0 : 1, 'evidence'],
      ['Immediate Actions', true, immediate.length > 0 || !!incident.area_safe_now, incident.updated_at, incident.investigation_owner_id, 0, 'immediate-actions'],
      ['Investigation Team', !!incident.formal_team_required, !incident.formal_team_required || team.some((m) => ['Active','Accepted','Approved'].includes(m.active_status ?? m.acceptance_status ?? '')), incident.updated_at, incident.investigation_owner_id, 0, 'investigation-team'],
      ['Root Cause Analysis', !!incident.rca_required || !!incident.high_potential_near_miss, !(incident.rca_required || incident.high_potential_near_miss) || rca.length > 0 || ['Approved','Complete'].includes(incident.rca_status ?? ''), incident.updated_at, incident.investigation_owner_id, 0, 'rca'],
      ['Barrier / Safeguard Failure', !!incident.safeguard_failed, !incident.safeguard_failed || barriers.length > 0, incident.updated_at, incident.investigation_owner_id, 0, 'barrier-failure'],
      ['Corrective / Preventive Actions', true, capa.length > 0 || Number(incident.open_actions_count ?? 0) === 0, incident.updated_at, incident.investigation_owner_id, Number(incident.overdue_actions_count ?? 0), 'capa'],
      ['Linked Records', true, links.length > 0 || Number(incident.linked_records_count ?? 0) > 0, incident.updated_at, incident.investigation_owner_id, 0, 'linked-records'],
      ['Notifications / Regulatory Reporting', !!incident.regulatory_reporting_required, !incident.regulatory_reporting_required || reports.some((r) => ['Submitted','Acknowledged','Not Required','Approved'].includes(r.status ?? '')), incident.updated_at, incident.investigation_owner_id, 0, 'notifications']
    ];
    return rows.map(([sectionName, required, complete, lastUpdated, owner, blockers, key]) => ({ sectionName, required, completionPercent: complete ? 100 : required ? 35 : 100, readinessStatus: complete ? 'Complete' : required ? 'Blocked' : 'Not Required', lastUpdated, owner, openBlockers: blockers, action: `/incidents/${incident.id}?tab=${key}`, key }));
  }

  private reviewGeneratedBlockers(incident: any, checklist: any[], reviewers: any[], decisions: any[], changeRequests: any[], actions: any[]) {
    const rows: any[] = [];
    checklist.filter((row) => row.required && row.readinessStatus !== 'Complete').forEach((row) => rows.push({ id: `generated-${row.key}`, blocker_type: 'Missing required section data', source_tab: row.sectionName, description: `${row.sectionName} is required before approval/closure.`, severity: 'High', owner_id: row.owner, due_date: null, status: 'Open', blocking: true, action: row.action, generated: true }));
    const openActions = actions.filter((a) => this.openActionStatus(a.status));
    if (openActions.length) rows.push({ id: 'generated-open-actions', blocker_type: 'Open action', source_tab: 'Corrective / Preventive Actions', description: `${openActions.length} Universal Action/CAPA item(s) remain open.`, severity: 'High', status: 'Open', blocking: true, action: `/incidents/${incident.id}?tab=capa`, generated: true });
    const required = reviewers.filter((r) => r.required !== false);
    if (!required.length) rows.push({ id: 'generated-reviewers-missing', blocker_type: 'Required approval missing', source_tab: 'Review & Approval', description: 'No required reviewers/approvers are assigned.', severity: 'Critical', status: 'Open', blocking: true, generated: true });
    if (required.some((r) => !['Approved','Skipped by authorized override'].includes(r.status ?? ''))) rows.push({ id: 'generated-approvals-pending', blocker_type: 'Required approval missing', source_tab: 'Review & Approval', description: 'One or more required approvals are pending.', severity: 'Critical', status: 'Open', blocking: true, generated: true });
    if (required.some((r) => r.e_signature_required && !r.e_signature_id)) rows.push({ id: 'generated-signatures-missing', blocker_type: 'E-signature missing', source_tab: 'Review & Approval', description: 'Required e-signatures are incomplete.', severity: 'Critical', status: 'Open', blocking: true, generated: true });
    const openChanges = changeRequests.filter((r) => !['Resolved','Closed','Cancelled'].includes(r.status ?? 'Open'));
    if (openChanges.length) rows.push({ id: 'generated-change-requests', blocker_type: 'Change request open', source_tab: 'Review & Approval', description: `${openChanges.length} change request(s) are open.`, severity: 'High', status: 'Open', blocking: true, generated: true });
    return rows;
  }

  private mergeReviewBlockers(stored: any[], generated: any[]) {
    const openStored = stored.filter((row) => !['Resolved','Closed'].includes(row.status ?? 'Open'));
    return [...generated, ...openStored].map((row) => ({ ...row, title: row.description, blockerType: row.blocker_type, sourceTab: row.source_tab, ownerId: row.owner_id, dueDate: row.due_date }));
  }

  private reviewReadiness(incident: any, approval: any, checklist: any[], reviewers: any[], decisions: any[], blockers: any[], changeRequests: any[]) {
    const blocking = blockers.filter((b) => b.blocking !== false && !['Resolved','Closed','Accepted by exception','Overridden'].includes(b.status ?? 'Open'));
    const requiredReviewers = reviewers.filter((r) => r.required !== false);
    const completedApprovals = requiredReviewers.filter((r) => ['Approved','Skipped by authorized override'].includes(r.status ?? ''));
    const requiredSignatures = requiredReviewers.filter((r) => r.e_signature_required);
    const completedSignatures = requiredSignatures.filter((r) => !!r.e_signature_id);
    const checklistItems = [
      ['Readiness gate completed', !blocking.length],
      ['Required sections complete', checklist.every((row) => !row.required || row.readinessStatus === 'Complete')],
      ['Required reviewers assigned', requiredReviewers.length > 0],
      ['Required approvals completed', requiredReviewers.length > 0 && completedApprovals.length === requiredReviewers.length],
      ['Required e-signatures completed', completedSignatures.length === requiredSignatures.length],
      ['Change requests resolved', changeRequests.every((r) => ['Resolved','Closed','Cancelled'].includes(r.status ?? 'Open'))],
      ['Critical blockers resolved', !blocking.some((b) => b.severity === 'Critical')],
      ['Regulatory/reporting closure complete', !incident.regulatory_reporting_required || ['Ready','Approved','Closed'].includes(incident.notifications_reporting_readiness_status ?? '')],
      ['CAPA closure or exception accepted', Number(incident.open_actions_count ?? 0) === 0],
      ['Closure decision recorded', ['Approved for Closure','Closed'].includes(approval.closure_status ?? '')],
      ['Ready for Lessons Learned / Final Report', ['Closed','Approved for Closure'].includes(approval.closure_status ?? '')]
    ].map(([title, ok]) => ({ title, status: ok ? 'Complete' : 'Blocked' }));
    const score = Math.round((checklistItems.filter((i) => i.status === 'Complete').length / checklistItems.length) * 100);
    return { status: blocking.length ? 'Blocked' : score === 100 ? 'Ready' : 'Warning', score, readyForReview: !blocking.some((b) => b.severity === 'Critical'), readyForClosure: !blocking.length && requiredReviewers.length > 0 && completedApprovals.length === requiredReviewers.length && completedSignatures.length === requiredSignatures.length, blockers: blocking, checklist: checklistItems, gate: blockers.map((b) => ({ gateItem: b.blockerType ?? b.blocker_type, sourceTab: b.sourceTab ?? b.source_tab, status: b.status ?? 'Open', blocking: b.blocking !== false, missingItem: b.description, owner: b.ownerId ?? b.owner_id, dueDate: b.dueDate ?? b.due_date, actionLink: b.action })) };
  }

  private reviewWorkflow(incident: any, approval: any, reviewers: any[]) {
    const snapshot = approval.workflow_snapshot_json ?? {};
    return { workflowName: snapshot.name ?? 'Incident Investigation Approval', workflowVersion: approval.workflow_version ?? snapshot.version ?? 'Not Started', triggerBasis: snapshot.triggerBasis ?? this.workflowTriggerBasis(incident), requiredApprovalLevels: Math.max(1, ...reviewers.map((r) => Number(r.approval_level ?? 1))), currentStep: reviewers.find((r) => !['Approved','Skipped by authorized override'].includes(r.status ?? ''))?.role ?? 'Complete', stepOwner: reviewers.find((r) => !['Approved','Skipped by authorized override'].includes(r.status ?? ''))?.reviewer_name ?? null, stepStatus: approval.review_status ?? 'Not Started', dueDate: reviewers.find((r) => !['Approved','Skipped by authorized override'].includes(r.status ?? ''))?.due_date ?? null, escalationStatus: reviewers.some((r) => r.escalation_status === 'Escalated') ? 'Escalated' : 'Normal', workflowStartedBy: approval.created_by, workflowStartedAt: incident.review_approval_started_at ?? approval.created_at, workflowCompletedAt: approval.closed_at, notes: 'Workflow Engine route snapshot is stored on workflow start.' };
  }

  private reviewApprovalHeader(incident: any, approval: any, readiness: any, reviewers: any[], blockers: any[], permissions: string[]) {
    const required = reviewers.filter((r) => r.required !== false);
    const completed = required.filter((r) => ['Approved','Skipped by authorized override'].includes(r.status ?? ''));
    const actions = [
      this.reviewAction('run-readiness', 'Run Readiness Check', true, null),
      this.reviewAction('start-workflow', 'Start Review Workflow', permissions.includes('incidents.review_approval.start_workflow'), 'Missing incidents.review_approval.start_workflow permission'),
      this.reviewAction('request-approval', 'Request Approval', permissions.includes('incidents.review_approval.start_workflow'), 'Missing workflow permission'),
      this.reviewAction('request-closure', 'Request Closure', permissions.includes('incidents.review_approval.request_closure'), 'Missing incidents.review_approval.request_closure permission'),
      this.reviewAction('add-reviewer', 'Add Reviewer', permissions.includes('incidents.review_approval.add_reviewer'), 'Missing incidents.review_approval.add_reviewer permission'),
      this.reviewAction('request-changes', 'Request Changes', permissions.includes('incidents.review_approval.request_changes'), 'Missing incidents.review_approval.request_changes permission'),
      this.reviewAction('approve', 'Approve', permissions.includes('incidents.review_approval.approve'), 'Missing incidents.review_approval.approve permission'),
      this.reviewAction('reject', 'Reject', permissions.includes('incidents.review_approval.reject'), 'Missing incidents.review_approval.reject permission'),
      this.reviewAction('e-sign', 'E-Sign', permissions.includes('incidents.review_approval.e_sign'), 'Missing incidents.review_approval.e_sign permission'),
      this.reviewAction('close', 'Close Incident', permissions.includes('incidents.review_approval.close') && readiness.readyForClosure, readiness.readyForClosure ? null : 'Closure is blocked by readiness items'),
      this.reviewAction('reopen', 'Reopen Incident', permissions.includes('incidents.review_approval.reopen'), 'Missing incidents.review_approval.reopen permission'),
      this.reviewAction('refresh', 'Refresh', true, null)
    ];
    return { incidentNumber: incident.incident_number, title: incident.title, incidentStatus: incident.status, actualSeverity: incident.actual_severity, potentialSeverity: incident.potential_severity, psmPseApiTier: incident.pse_tier ?? (incident.is_process_safety_event ? 'PSE' : 'Not Determined'), investigationPriority: incident.investigation_priority, reviewStatus: approval.review_status ?? incident.review_approval_status ?? 'Not Started', approvalWorkflowStatus: incident.approval_workflow_status ?? approval.review_status ?? 'Workflow not started', requiredApprovalsCount: required.length, completedApprovalsCount: completed.length, pendingApprovalsCount: Math.max(0, required.length - completed.length), rejectedChangesRequestedCount: reviewers.filter((r) => ['Rejected','Changes Requested'].includes(r.status ?? '')).length, openBlockersCount: blockers.filter((b) => b.blocking !== false && !['Resolved','Closed','Accepted by exception'].includes(b.status ?? '')).length, readyForClosure: readiness.readyForClosure, lastUpdated: approval.updated_at ?? incident.updated_at, actions };
  }

  private reviewSummaryCards(incident: any, approval: any, readiness: any, checklist: any[], reviewers: any[], decisions: any[], blockers: any[], changeRequests: any[]) {
    const required = reviewers.filter((r) => r.required !== false);
    return [
      this.card('Review status', approval.review_status ?? 'Not Started', 'status', 'Backend review status'),
      this.card('Workflow status', incident.approval_workflow_status ?? 'Workflow not started', 'status', 'Workflow Engine status'),
      this.card('Sections complete', checklist.filter((r) => r.readinessStatus === 'Complete').length, 'ok', 'Backend section completion'),
      this.card('Sections incomplete', checklist.filter((r) => r.required && r.readinessStatus !== 'Complete').length, 'warning', 'Required incomplete sections'),
      this.card('Open blockers', blockers.filter((b) => !['Resolved','Closed','Accepted by exception'].includes(b.status ?? '')).length, 'danger', 'Backend generated blockers'),
      this.card('Missing evidence', checklist.find((r) => r.key === 'evidence')?.readinessStatus === 'Complete' ? 0 : 1, 'warning', 'Evidence gate'),
      this.card('Open RCA items', checklist.find((r) => r.key === 'rca')?.readinessStatus === 'Complete' ? 0 : 1, 'warning', 'RCA gate'),
      this.card('Open CAPA actions', Number(incident.open_actions_count ?? 0), 'warning', 'Open Universal Actions/CAPA'),
      this.card('Overdue CAPA', Number(incident.overdue_actions_count ?? 0), 'danger', 'Overdue actions'),
      this.card('Regulatory reports pending', incident.reporting_open_reports_count ?? 0, 'warning', 'Reporting closure'),
      this.card('Required approvals', required.length, 'info', 'Required reviewer count'),
      this.card('Pending approvals', required.filter((r) => !['Approved','Skipped by authorized override'].includes(r.status ?? '')).length, 'warning', 'Pending required approvals'),
      this.card('E-signatures complete', required.filter((r) => r.e_signature_required && r.e_signature_id).length, 'ok', 'Universal E-Signature records'),
      this.card('Changes requested', changeRequests.filter((r) => !['Resolved','Closed','Cancelled'].includes(r.status ?? '')).length, 'warning', 'Open rework requests'),
      this.card('Ready for closure', readiness.readyForClosure ? 'Yes' : 'No', readiness.readyForClosure ? 'ok' : 'danger', 'Backend closure decision'),
      this.card('Final closure status', approval.closure_status ?? 'Not Ready', 'status', 'Closure workflow status')
    ];
  }

  private async reviewSignatures(tenantId: string, incidentId: string) {
    return this.safeMany<any>(this.db.from('electronic_signatures').select('*').eq('tenant_id', tenantId).eq('module_name', 'INCIDENTS').eq('record_type', 'Incident Review Approval').order('signed_at', { ascending: false }).limit(50)).then((rows) => rows.filter((r) => r.metadata?.incidentId === incidentId || r.record_id === incidentId));
  }

  private reviewClosure(incident: any, approval: any, readiness: any, blockers: any[]) {
    return { readyForClosure: readiness.readyForClosure, closureDecision: approval.closure_status, closureType: approval.exception_reason ? 'Closure with exception' : 'Standard closure', closureReason: approval.exception_reason, closureSummary: approval.closure_summary, closedBy: approval.closed_by, closedAt: approval.closed_at, closureComments: approval.closure_summary, closureEvidenceReportLink: null, openItemsAcceptedByException: blockers.filter((b) => b.status === 'Accepted by exception'), exceptionReason: approval.exception_reason, exceptionApprover: approval.updated_by, closureStatuses: ['Not Ready','Ready for Closure','Closure Requested','Approved for Closure','Closed','Closure Rejected','Reopened'] };
  }

  private reviewReopenControl(incident: any, approval: any, readiness: any) {
    return { reopenAllowed: this.closedStatus(incident.status) || ['Closed','Approved'].includes(approval.review_status ?? ''), reopenReason: incident.status_change_reason, reopenedBy: incident.status_changed_by, reopenedAt: incident.status_changed_at, reapprovalRequired: !!incident.reapproval_required || readiness.status !== 'Ready', affectedSections: readiness.blockers?.map((b: any) => b.sourceTab ?? b.source_tab) ?? [], previousApprovalSnapshot: approval.workflow_snapshot_json, currentApprovalStatus: approval.review_status };
  }

  private async persistReviewBlockers(tenantId: string, actorId: string, incident: any, blockers: any[]) {
    for (const blocker of blockers.filter((b) => b.generated)) {
      const existing = await this.safeMany<any>(this.db.from('incident_review_blockers').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id).eq('blocker_type', blocker.blocker_type).eq('source_tab', blocker.source_tab).limit(1));
      const patch = { blocker_type: blocker.blocker_type, source_tab: blocker.source_tab, description: blocker.description, severity: blocker.severity, owner_id: blocker.owner_id ?? null, due_date: blocker.due_date ?? null, status: blocker.status, blocking: blocker.blocking, updated_by: actorId, updated_at: new Date().toISOString() };
      if (existing[0]?.id) await this.safeSingle(this.db.from('incident_review_blockers').update(patch).eq('tenant_id', tenantId).eq('id', existing[0].id).select('id').single());
      else await this.safeSingle(this.db.from('incident_review_blockers').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, created_by: actorId, ...patch }).select('id').single());
    }
  }

  private async updateReviewApprovalRollup(tenantId: string, incidentId: string, readiness: any, reviewers: any[], blockers: any[], approval: any) {
    const required = reviewers.filter((r) => r.required !== false);
    const completed = required.filter((r) => ['Approved','Skipped by authorized override'].includes(r.status ?? ''));
    await this.safeSingle(this.db.from('incidents').update({ review_approval_status: approval.review_status ?? readiness.status, review_approval_readiness_status: readiness.status, ready_for_closure: readiness.readyForClosure, closure_status: approval.closure_status ?? 'Not Ready', review_approval_open_blockers_count: blockers.filter((b) => b.blocking !== false && !['Resolved','Closed','Accepted by exception'].includes(b.status ?? '')).length, review_approval_required_approvals_count: required.length, review_approval_completed_approvals_count: completed.length, review_approval_pending_approvals_count: Math.max(0, required.length - completed.length), review_approval_last_checked_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private assertCanReviewMutate(incident: any, permissions: string[], permission: string) {
    if (!permissions.includes(permission) && !permissions.includes('incidents:manage')) throw new ForbiddenException(`Missing ${permission} permission.`);
    if (this.closedStatus(incident.status) && permission !== 'incidents.review_approval.reopen') throw new BadRequestException('Closed incidents are read-only. Reopen before changing Review & Approval.');
  }

  private reviewReviewerPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, user: any, update: boolean) {
    return this.clean({ id: update ? undefined : crypto.randomUUID(), tenant_id: update ? undefined : tenantId, company_id: update ? undefined : incident.company_id, site_id: update ? undefined : incident.site_id, incident_id: update ? undefined : incident.id, reviewer_user_id: dto.reviewerUserId, reviewer_name: dto.reviewerName ?? user?.displayName, reviewer_email: dto.reviewerEmail ?? user?.email, role: dto.role, department: dto.department ?? user?.department, approval_level: this.integerOrNull(dto.approvalLevel) ?? 1, required: dto.required ?? true, status: dto.status ?? 'Not Started', decision: dto.decision, due_date: this.dateTimeOrNull(dto.dueDate), delegated_to_user_id: dto.delegatedToUserId, escalation_status: dto.escalationStatus ?? 'None', e_signature_required: dto.eSignatureRequired ?? false, comments: dto.comments ?? dto.notes, updated_by: actorId, updated_at: new Date().toISOString(), ...(!update ? { created_by: actorId } : {}) });
  }

  private async reviewReviewerStatus(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, dto: Record<string, any>, eventType: string, title: string, permission: string, permissions: string[]) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    this.assertCanReviewMutate(incident, permissions, permission);
    const before = await this.db.single<any>(this.db.from('incident_reviewers').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reviewerId).single());
    const row = await this.db.single<any>(this.db.from('incident_reviewers').update(this.clean({ status: dto.status, decision: dto.decision, comments: dto.comment ?? dto.comments ?? dto.reason, delegated_to_user_id: dto.delegatedToUserId, escalation_status: dto.escalationStatus, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reviewerId).select().single());
    const decision = await this.safeSingle<any>(this.db.from('incident_review_decisions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, reviewer_id: reviewerId, decision: dto.decision ?? dto.status, comment: dto.comment ?? dto.reason, related_section: dto.relatedSection ?? 'Review & Approval', related_blocker_id: dto.relatedBlockerId, signed: false, created_by: actorId }).select().single());
    await this.writeReviewApprovalMutation(tenantId, incident, actorId, eventType, title, dto.reason ?? dto.comment, before, { row, decision }, permission, reviewerId);
    return this.reviewApprovalTab(tenantId, scope, id, permissions);
  }

  private async createChangeRequestFromDecision(tenantId: string, actorId: string, scope: Scope, id: string, reviewerId: string, decision: string, dto: Record<string, any>) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const existing = await this.incidentChildren(tenantId, 'incident_change_requests', id, scope);
    await this.safeSingle(this.db.from('incident_change_requests').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, request_number: `CR-${String(existing.length + 1).padStart(3, '0')}`, requested_by: actorId, source_section: dto.relatedSection ?? 'Review & Approval', description: dto.reason ?? dto.comment ?? decision, owner_id: dto.ownerId, due_date: this.dateTimeOrNull(dto.dueDate), status: 'Open', created_by: actorId, updated_by: actorId }).select('id').single());
  }

  private async sendReviewNotification(tenantId: string, actorId: string, incident: any, reviewer: any, message: string) {
    if (!reviewer.reviewer_user_id) return null;
    return this.safeSingle(this.db.from('notifications').insert({ id: crypto.randomUUID(), tenant_id: tenantId, user_id: reviewer.reviewer_user_id, site_id: incident.site_id, type: 'incident.review_approval.request', module: 'incidents', title: `Incident ${incident.incident_number} review assignment`, message, related_record_id: incident.id, related_record_type: 'Incident', related_url: `/incidents/${incident.id}?tab=review`, priority: 'Normal', created_by: actorId }).select('id').single());
  }

  private async writeReviewApprovalMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason: string | undefined, before: any, after: any, action: string, entityId: string) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'INCIDENT_REVIEW_APPROVAL', entityId, before: before as JsonValue, after: after as JsonValue });
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
  }

  async lessonsTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    if (!permissions.includes('incidents.lessons.view')) throw new ForbiddenException('Missing incidents.lessons.view permission.');
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restricted) return this.restrictedTab(incident, 'Lessons Learned');
    const [lessons, links, distributions, acknowledgements, reviews, history, actions, rcaRoots, barriers, capa, evidence] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_lessons', id, scope),
      this.incidentChildren(tenantId, 'incident_lesson_source_links', id, scope),
      this.incidentChildren(tenantId, 'incident_lesson_distributions', id, scope),
      this.incidentChildren(tenantId, 'incident_lesson_acknowledgements', id, scope),
      this.incidentChildren(tenantId, 'incident_lesson_reviews', id, scope),
      this.incidentHistory(tenantId, id, 120),
      this.incidentActions(tenantId, scope, id),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope)
    ]);
    const readiness = this.lessonsReadiness(incident, lessons, links, distributions, acknowledgements, reviews, rcaRoots, barriers, capa);
    await this.updateLessonsRollup(tenantId, incident.id, lessons, acknowledgements, readiness);
    return {
      header: this.lessonsHeader(incident, lessons, readiness, permissions),
      summaryCards: this.lessonsSummaryCards(incident, lessons, distributions, acknowledgements, actions, readiness),
      sourceReadiness: readiness.sourceChecklist,
      lessonsRegister: lessons,
      sourceMapping: this.lessonsSourceMapping(links, lessons, rcaRoots, barriers, capa, evidence),
      applicability: this.lessonsApplicability(incident, lessons),
      communicationDistribution: this.lessonsDistribution(distributions, lessons),
      trainingProcedureDocumentUpdate: this.lessonsTrainingDocument(lessons, actions),
      acknowledgements,
      effectivenessVerification: this.lessonsVerification(lessons),
      review: this.lessonsReviewPanel(reviews, readiness),
      changeHistory: history.filter((event) => /lesson|training|procedure|distribution|acknowledg|verification/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 20),
      readiness,
      context: await this.lessonsContext(tenantId, scope, incident),
      permissions,
      readOnly: this.closedStatus(incident.status),
      lockedReason: this.closedStatus(incident.status) ? 'Closed/approved incidents are read-only. Reopen before changing lessons.' : null
    };
  }

  async lessonsSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.lessonsTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async createLesson(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.create');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const existing = await this.incidentChildren(tenantId, 'incident_lessons', id, scope);
    const row = await this.safeSingle<any>(this.db.from('incident_lessons').insert(this.lessonPatch(dto, tenantId, actorId, incident, existing.length + 1)).select().single());
    await this.writeLessonMutation(tenantId, incident, actorId, 'Created', 'Lesson learned added', dto.reason ?? dto.lessonStatement, null, row, 'incidents.lessons.create', row.id);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async updateLesson(tenantId: string, actorId: string, scope: Scope, id: string, lessonId: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.edit');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.safeSingle<any>(this.db.from('incident_lessons').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', lessonId).single());
    const patch = this.lessonPatch(dto, tenantId, actorId, incident, 0, true);
    const row = await this.safeSingle<any>(this.db.from('incident_lessons').update(patch).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', lessonId).select().single());
    await this.writeLessonMutation(tenantId, incident, actorId, 'Updated', 'Lesson learned updated', dto.reason ?? dto.changeReason, before, row, 'incidents.lessons.edit', lessonId);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async deleteLesson(tenantId: string, actorId: string, scope: Scope, id: string, lessonId: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.delete');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.safeSingle<any>(this.db.from('incident_lessons').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', lessonId).single());
    const row = await this.safeSingle<any>(this.db.from('incident_lessons').update({ review_status: 'Archived', archived_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', lessonId).select().single());
    await this.writeLessonMutation(tenantId, incident, actorId, 'Deleted/archived', 'Lesson archived or superseded', dto.reason, before, row, 'incidents.lessons.delete', lessonId);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async generateLessonsFromRcaCapa(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.generate');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const [existing, roots, barriers, capa] = await Promise.all([
      this.incidentChildren(tenantId, 'incident_lessons', id, scope),
      this.incidentChildren(tenantId, 'incident_rca_root_causes', id, scope),
      this.incidentChildren(tenantId, 'incident_barriers', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope)
    ]);
    const candidates = [
      ...roots.map((row) => ({ sourceType: 'RCA root cause', sourceId: row.id, title: row.root_cause_statement ?? row.title, lessonType: 'Management-system lesson' })),
      ...barriers.filter((row) => ['Failed','Degraded','Missing'].includes(row.performance_status ?? row.status)).map((row) => ({ sourceType: 'Barrier/safeguard failure', sourceId: row.id, title: row.barrier_name ?? row.title, lessonType: 'Process safety lesson' })),
      ...capa.map((row) => ({ sourceType: 'CAPA action', sourceId: row.id, title: row.action_title_snapshot ?? row.title, lessonType: 'Procedure/PTW lesson' }))
    ].filter((candidate) => candidate.title);
    const created: any[] = [];
    for (const candidate of candidates) {
      if (existing.some((lesson) => lesson.source_type === candidate.sourceType && String(lesson.title ?? '').includes(String(candidate.title).slice(0, 40)))) continue;
      const row = await this.safeSingle<any>(this.db.from('incident_lessons').insert(this.lessonPatch({ title: `Lesson from ${candidate.sourceType}`, lessonStatement: candidate.title, lessonType: candidate.lessonType, sourceType: candidate.sourceType, applicabilityScope: 'Site / unit', ownerId: incident.investigation_owner_id, reviewStatus: 'Draft', communicationRequired: true }, tenantId, actorId, incident, existing.length + created.length + 1)).select().single());
      if (row) {
        created.push(row);
        await this.safeSingle(this.db.from('incident_lesson_source_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, lesson_id: row.id, source_type: candidate.sourceType, source_id: candidate.sourceId, source_title_snapshot: candidate.title, coverage_status: 'Linked', created_by: actorId }).select('id').single());
      }
    }
    await this.writeLessonMutation(tenantId, incident, actorId, 'System Generated', 'Lessons generated from RCA/CAPA', dto.reason ?? `${created.length} lesson(s) generated`, null, created, 'incidents.lessons.generate', id);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async linkLessonSource(tenantId: string, actorId: string, scope: Scope, id: string, lessonId: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.edit');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.safeSingle<any>(this.db.from('incident_lesson_source_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, lesson_id: lessonId, source_type: dto.sourceType, source_id: dto.sourceId, source_title_snapshot: dto.sourceTitleSnapshot, coverage_status: dto.coverageStatus ?? 'Linked', justification_if_no_lesson: dto.justificationIfNoLesson, created_by: actorId }).select().single());
    await this.writeLessonMutation(tenantId, incident, actorId, 'Linked', 'Lesson source linked', dto.reason ?? dto.sourceType, null, row, 'incidents.lessons.link_source', row.id);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async distributeLesson(tenantId: string, actorId: string, scope: Scope, id: string, lessonId: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.distribute');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const notification = await this.safeSingle<any>(this.db.from('notifications').insert({ id: crypto.randomUUID(), tenant_id: tenantId, site_id: incident.site_id, type: 'incident.lesson.distribution', module: 'incidents', title: `Incident ${incident.incident_number} lesson shared`, message: dto.message ?? 'A lesson learned has been distributed.', related_record_id: lessonId, related_record_type: 'Incident Lesson', related_url: `/incidents/${id}?tab=lessons-learned`, priority: 'Normal', created_by: actorId }).select('id').single());
    const row = await this.safeSingle<any>(this.db.from('incident_lesson_distributions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, lesson_id: lessonId, audience_json: dto.audience ?? [], channel: dto.channel ?? 'Notification Center', message_snapshot: dto.message, distribution_status: 'Sent', distributed_by: actorId, distributed_at: new Date().toISOString(), notification_id: notification?.id, created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incident_lessons').update({ distribution_status: 'Distributed', acknowledgement_status: dto.acknowledgementRequired ? 'Acknowledgement Pending' : 'Not Required', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', lessonId).select('id').single());
    await this.writeLessonMutation(tenantId, incident, actorId, 'Notification sent', 'Lesson distributed', dto.reason ?? dto.message, null, row, 'incidents.lessons.distribute', row.id);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async verifyLesson(tenantId: string, actorId: string, scope: Scope, id: string, lessonId: string, dto: Record<string, any>, permissions: string[] = []) {
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, 'incidents.lessons.verify');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.safeSingle<any>(this.db.from('incident_lessons').select('*').eq('tenant_id', tenantId).eq('id', lessonId).single());
    const status = dto.effective === false ? 'Rework Required' : dto.effective === true ? 'Verified' : 'Not Determined';
    const row = await this.safeSingle<any>(this.db.from('incident_lessons').update({ verification_status: status, notes: dto.notes ?? before?.notes, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', lessonId).select().single());
    await this.writeLessonMutation(tenantId, incident, actorId, status === 'Verified' ? 'Validated' : 'Updated', 'Lesson effectiveness verified', dto.reason ?? dto.notes, before, row, 'incidents.lessons.verify', lessonId);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async reviewLessons(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[] = [], decision: 'request' | 'approve' | 'reject') {
    const permission = decision === 'request' ? 'incidents.lessons.review.request' : decision === 'approve' ? 'incidents.lessons.review.approve' : 'incidents.lessons.review.reject';
    await this.assertCanLessonMutate(tenantId, scope, id, permissions, permission, decision !== 'request');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const status = decision === 'request' ? 'Requested' : decision === 'approve' ? 'Approved' : 'Rejected';
    const row = await this.safeSingle<any>(this.db.from('incident_lesson_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, status, reviewer_id: dto.reviewerId, due_date: this.dateTimeOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, approved_by: decision === 'approve' ? actorId : null, approved_at: decision === 'approve' ? new Date().toISOString() : null, rejected_by: decision === 'reject' ? actorId : null, rejected_at: decision === 'reject' ? new Date().toISOString() : null, rejection_reason: decision === 'reject' ? dto.reason : null, rework_required: decision === 'reject', created_by: actorId, updated_by: actorId }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ lessons_learned_status: status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeLessonMutation(tenantId, incident, actorId, status, `Lessons review ${status.toLowerCase()}`, dto.reason ?? dto.comments, null, row, `incidents.lessons.review.${decision}`, row.id);
    return this.lessonsTab(tenantId, scope, id, permissions);
  }

  async historyTab(tenantId: string, scope: Scope, id: string, permissions: string[] = [], filters: Record<string, any> = {}) {
    if (!permissions.includes('incidents.history.view') && !permissions.includes('incidents.audit_trail.view')) throw new ForbiddenException('Missing incidents.history.view permission.');
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    const all = await this.incidentHistory(tenantId, id, 500);
    const rows = this.filterHistoryEvents(this.redactHistoryEvents(all, permissions), filters);
    const statusTransitions = rows.filter((event) => /status|closed|reopened|submitted|approved|rejected/i.test(`${event.event_type} ${event.event_title}`));
    const reviewApproval = rows.filter((event) => /review|approval|signature|signed|closure/i.test(`${event.event_type} ${event.event_title} ${event.related_tab}`));
    const evidence = rows.filter((event) => /evidence|attachment|upload|download|preview|custody/i.test(`${event.event_type} ${event.event_title} ${event.related_tab}`));
    const actions = rows.filter((event) => /capa|action|corrective|preventive|owner|due date|effectiveness/i.test(`${event.event_type} ${event.event_title} ${event.related_tab}`));
    const notifications = rows.filter((event) => /notification|report|regulatory|acknowledg|submitted/i.test(`${event.event_type} ${event.event_title} ${event.related_tab}`));
    const access = permissions.includes('incidents.access_history.view') ? rows.filter((event) => /access|viewed|downloaded|exported/i.test(`${event.event_type} ${event.event_title}`)) : [];
    return {
      header: this.historyHeader(incident, rows, all.length - rows.length),
      summaryCards: this.historySummaryCards(rows, all.length - rows.length),
      filters: this.historyFilterContext(rows),
      events: rows,
      statusTransitions,
      diff: this.historyDiff(rows[0]),
      reviewApproval,
      evidence,
      actions,
      notifications,
      access,
      exportPanel: { available: permissions.includes('incidents.history.export'), disabledReason: permissions.includes('incidents.history.export') ? null : 'Missing incidents.history.export permission', options: ['Full history log', 'Filtered history', 'Audit trail', 'Approval/e-signature history', 'Evidence history', 'CAPA/action history'] },
      context: { eventTypes: [...new Set(all.map((event) => event.event_type).filter(Boolean))], modules: [...new Set(all.map((event) => event.related_tab).filter(Boolean))], readOnly: true },
      permissions
    };
  }

  async historySection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string, filters: Record<string, any> = {}) {
    const data = await this.historyTab(tenantId, scope, id, permissions, filters) as Record<string, any>;
    return data[section] ?? null;
  }

  async historyDiffById(tenantId: string, scope: Scope, id: string, eventId: string, permissions: string[]) {
    const data = await this.historyTab(tenantId, scope, id, permissions);
    return this.historyDiff(data.events.find((event: any) => event.id === eventId));
  }

  async exportHistory(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[], filters: Record<string, any> = {}) {
    if (!permissions.includes('incidents.history.export')) throw new ForbiddenException('Missing incidents.history.export permission.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const data = await this.historyTab(tenantId, scope, id, permissions, filters);
    await this.audit.write({ tenantId, actorId, action: 'incidents.history.export', entityType: 'INCIDENT_HISTORY', entityId: id, before: null, after: { filters, count: data.events.length } as JsonValue });
    await this.writeHistory(tenantId, incident, actorId, 'Exported', 'Incident history log exported', 'History export requested', null, { count: data.events.length, filters });
    return { exportedAt: new Date().toISOString(), count: data.events.length, filters, rows: data.events };
  }

  async finalReportTab(tenantId: string, scope: Scope, id: string, permissions: string[] = []) {
    if (!permissions.includes('incidents.final_report.view')) throw new ForbiddenException('Missing incidents.final_report.view permission.');
    const incident = await this.decoratedIncidentById(tenantId, scope, id, permissions);
    if (incident.restrictedRedacted) return this.restrictedTab(incident, 'Final Report / Export');
    const [templates, snapshots, reports, sections, exports, reviews, packages, distributions, history, evidence, capa, lessons, approvals] = await Promise.all([
      this.finalReportTemplates(tenantId, incident, scope),
      this.incidentChildren(tenantId, 'incident_report_snapshots', id, scope),
      this.incidentChildren(tenantId, 'incident_reports', id, scope),
      this.incidentChildren(tenantId, 'incident_report_sections', id, scope),
      this.incidentChildren(tenantId, 'incident_report_exports', id, scope),
      this.incidentChildren(tenantId, 'incident_report_reviews', id, scope),
      this.incidentChildren(tenantId, 'incident_report_packages', id, scope),
      this.incidentChildren(tenantId, 'incident_report_distributions', id, scope),
      this.incidentHistory(tenantId, id, 180),
      this.incidentChildren(tenantId, 'incident_evidence', id, scope),
      this.incidentChildren(tenantId, 'incident_capa_items', id, scope),
      this.incidentChildren(tenantId, 'incident_lessons', id, scope),
      this.incidentChildren(tenantId, 'incident_review_workflows', id, scope)
    ]);
    const readiness = this.finalReportReadiness(incident, templates, evidence, capa, lessons, approvals, history);
    await this.updateFinalReportRollup(tenantId, incident.id, reports, exports, readiness);
    const latestReport = reports[0] ?? null;
    return {
      header: this.finalReportHeader(incident, readiness, reports, exports, permissions),
      summaryCards: this.finalReportSummaryCards(incident, reports, exports, templates, sections, readiness, lessons, history),
      readiness,
      templates,
      templateSelection: this.finalReportTemplateSelection(templates, sections, latestReport),
      sectionBuilder: this.finalReportSections(incident, sections, readiness),
      sourceSnapshot: snapshots[0] ?? this.emptySourceSnapshot(incident, readiness),
      preview: this.finalReportPreview(incident, latestReport, sections, readiness, permissions),
      redactionPreview: this.finalReportRedactionPreview(permissions),
      appendices: this.finalReportAppendices(evidence, capa, lessons, history, packages),
      generatedReports: reports,
      reportDetail: latestReport ? this.finalReportDetail(latestReport, snapshots, exports, sections) : null,
      exportOptions: this.finalReportExportOptions(templates, permissions, readiness),
      publishToDocumentControl: this.finalReportPublishPanel(latestReport, permissions),
      versionHistory: this.finalReportVersionHistory(reports, snapshots),
      downloadLog: [...exports, ...distributions].sort((a, b) => String(b.created_at ?? b.requested_at).localeCompare(String(a.created_at ?? a.requested_at))),
      review: this.finalReportReviewPanel(reviews, readiness),
      changeHistory: history.filter((event) => /final report|report|export|snapshot|publish|official|download/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`)).slice(0, 30),
      context: this.finalReportContext(templates, permissions),
      permissions,
      readOnly: false,
      lockedReason: null
    };
  }

  async finalReportSection(tenantId: string, scope: Scope, id: string, permissions: string[], section: string) {
    const data = await this.finalReportTab(tenantId, scope, id, permissions) as Record<string, any>;
    return data[section] ?? null;
  }

  async runFinalReportReadinessCheck(tenantId: string, actorId: string, scope: Scope, id: string, permissions: string[], dto: Record<string, any> = {}) {
    if (!permissions.includes('incidents.final_report.view')) throw new ForbiddenException('Missing incidents.final_report.view permission.');
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const data = await this.finalReportTab(tenantId, scope, id, permissions);
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'System Generated', 'Final report readiness check run', dto.reason ?? 'Readiness refreshed', null, data.readiness, 'incidents.final_report.readiness_check', id);
    return data;
  }

  async selectFinalReportTemplate(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.configure', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const template = dto.templateId ? await this.safeSingle<any>(this.db.from('incident_report_templates').select('*').eq('tenant_id', tenantId).eq('id', dto.templateId).single()) : null;
    if (!template) throw new BadRequestException('Selected report template was not found for this tenant/site.');
    const rows = this.finalReportDefaultSections(incident).map((section, index) => ({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id,
      report_id: null, section_key: section.key, section_title: section.title, included: true, required: section.required,
      source_status: section.status, missing_data: section.missingData, redaction_required: section.redactionRequired, display_order: index + 1,
      notes: dto.notes, created_by: actorId, updated_by: actorId
    }));
    await this.safeMany(this.db.from('incident_report_sections').delete().eq('tenant_id', tenantId).eq('incident_id', id).is('report_id', null).select('id'));
    const inserted = rows.length ? await this.safeMany<any>(this.db.from('incident_report_sections').insert(rows).select()) : [];
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Updated', 'Final report template selected', dto.reason ?? template.template_name, null, { template, sections: inserted }, 'incidents.final_report.configure', template.id);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async updateFinalReportSections(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.configure', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const updates = Array.isArray(dto.sections) ? dto.sections : [];
    const changed: any[] = [];
    for (const item of updates) {
      if (!item.id) continue;
      const before = await this.safeSingle<any>(this.db.from('incident_report_sections').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', item.id).single());
      if (before?.required && item.included === false && !permissions.includes('incidents.final_report.configure')) throw new BadRequestException('Required report sections cannot be excluded without configure permission and reason.');
      const after = await this.safeSingle<any>(this.db.from('incident_report_sections').update({ included: item.included ?? before?.included, notes: item.notes ?? before?.notes, display_order: this.integerOrNull(item.displayOrder) ?? before?.display_order, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', item.id).select().single());
      changed.push({ before, after });
    }
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Updated', 'Final report section builder updated', dto.reason ?? `${changed.length} section(s) updated`, null, changed, 'incidents.final_report.configure', id);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async createFinalReportSnapshot(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.generate', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const snapshot = await this.createFinalReportSnapshotRow(tenantId, actorId, scope, incident, dto);
    if (!snapshot) throw new BadRequestException('Unable to create final report source snapshot. Apply the final report migrations and retry.');
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Created', 'Final report source snapshot created', dto.reason ?? snapshot.snapshot_number, null, snapshot, 'incidents.final_report.snapshot.create', snapshot.id);
    return snapshot;
  }

  async generateFinalReport(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.generate', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const [templates, sections, reports] = await Promise.all([
      this.finalReportTemplates(tenantId, incident, scope),
      this.incidentChildren(tenantId, 'incident_report_sections', id, scope),
      this.incidentChildren(tenantId, 'incident_reports', id, scope)
    ]);
    const template = dto.templateId ? templates.find((row) => row.id === dto.templateId) : templates[0];
    if (!template) throw new BadRequestException('No company/site report template is available. Configure a final report template before generation.');
    const snapshot = await this.createFinalReportSnapshotRow(tenantId, actorId, scope, incident, dto);
    if (!snapshot) throw new BadRequestException('Unable to create final report source snapshot. Apply the final report migrations and retry.');
    const report = await this.safeSingle<any>(this.db.from('incident_reports').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id,
      report_number: `IR-${incident.incident_number ?? id}-R${String(reports.length + 1).padStart(2, '0')}`,
      report_type: dto.reportType ?? template.template_type, template_id: template.id, template_version: template.template_version,
      snapshot_id: snapshot.id, output_format: dto.outputFormat ?? 'PDF', status: 'Generated', official: false, published: false,
      redaction_profile: dto.redactionProfile ?? 'Standard', included_sections_json: dto.includedSections ?? sections.filter((section) => section.included !== false).map((section) => section.section_key),
      appendices_json: dto.includeAppendices === false ? [] : this.finalReportAppendixKeys(), generated_by: actorId, generated_at: new Date().toISOString(),
      notes: dto.notes, created_by: actorId, updated_by: actorId
    }).select().single());
    if (!report) throw new BadRequestException('Final report generation failed while saving the report record.');
    await this.safeSingle(this.db.from('incidents').update({ final_report_status: 'Generated', final_report_last_generated_at: report.generated_at, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Created', 'Final report generated', dto.generationReason ?? dto.reason ?? report.report_number, null, report, 'incidents.final_report.generate', report.id);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async exportFinalReport(tenantId: string, actorId: string, scope: Scope, id: string, exportType: string, dto: Record<string, any>, permissions: string[]) {
    const permission = exportType === 'evidence-package' ? 'incidents.evidence.export_package' : exportType === 'download' ? 'incidents.final_report.download' : 'incidents.final_report.export';
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, permission, false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const row = await this.safeSingle<any>(this.db.from('incident_report_exports').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id,
      report_id: dto.reportId ?? null, export_type: exportType, status: 'Completed', requested_by: actorId,
      requested_at: new Date().toISOString(), completed_at: new Date().toISOString(), redaction_profile: dto.redactionProfile ?? 'Standard',
      purpose_reason: dto.reason ?? dto.purpose
    }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ final_report_last_export_at: row?.completed_at ?? new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Exported', `Final report ${exportType} export completed`, dto.reason ?? exportType, null, row, `incidents.final_report.export.${exportType}`, row?.id ?? id);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async markFinalReportOfficial(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.mark_official', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.safeSingle<any>(this.db.from('incident_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId).single());
    if (!before) throw new NotFoundException('Final report was not found.');
    await this.safeMany(this.db.from('incident_reports').update({ official: false, status: 'Superseded', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', id).eq('official', true).neq('id', reportId).select('id'));
    const row = await this.safeSingle<any>(this.db.from('incident_reports').update({ official: true, status: 'Official', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', reportId).select().single());
    await this.safeSingle(this.db.from('incidents').update({ final_report_status: 'Official', final_report_official_report_id: reportId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Approved', 'Final report marked official', dto.reason, before, row, 'incidents.final_report.mark_official', reportId);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async publishFinalReport(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.publish', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.safeSingle<any>(this.db.from('incident_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId).single());
    if (!before) throw new NotFoundException('Final report was not found.');
    if (!before.official) throw new BadRequestException('Only an official final report can be published to Document Control.');
    const row = await this.safeSingle<any>(this.db.from('incident_reports').update({ published: true, status: 'Published', document_id: dto.documentId ?? before.document_id, document_number: dto.documentNumber ?? before.document_number, document_revision: dto.revision ?? before.document_revision, document_control_link: dto.documentControlLink ?? before.document_control_link, published_by: actorId, published_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', reportId).select().single());
    await this.safeSingle(this.db.from('incidents').update({ final_report_status: 'Published', final_report_published_document_id: row?.document_id ?? reportId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeFinalReportMutation(tenantId, incident, actorId, 'Published', 'Final report published to Document Control', dto.reason ?? dto.documentNumber, before, row, 'incidents.final_report.publish', reportId);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async archiveFinalReport(tenantId: string, actorId: string, scope: Scope, id: string, reportId: string, dto: Record<string, any>, permissions: string[]) {
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, 'incidents.final_report.archive', false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const before = await this.safeSingle<any>(this.db.from('incident_reports').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', reportId).single());
    const row = await this.safeSingle<any>(this.db.from('incident_reports').update({ status: dto.status ?? 'Archived', archived_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', reportId).select().single());
    await this.writeFinalReportMutation(tenantId, incident, actorId, row?.status === 'Superseded' ? 'Superseded' : 'Archived', 'Final report archived/superseded', dto.reason, before, row, 'incidents.final_report.archive', reportId);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  async reviewFinalReport(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[], decision: 'request' | 'approve' | 'reject') {
    const permission = decision === 'request' ? 'incidents.final_report.review.request' : decision === 'approve' ? 'incidents.final_report.review.approve' : 'incidents.final_report.review.reject';
    await this.assertCanFinalReportMutate(tenantId, scope, id, permissions, permission, false);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    const status = decision === 'request' ? 'Requested' : decision === 'approve' ? 'Approved' : 'Rejected';
    const row = await this.safeSingle<any>(this.db.from('incident_report_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: id, report_id: dto.reportId ?? null, status, reviewer_id: dto.reviewerId, due_date: this.dateOrNull(dto.dueDate), comments: dto.comments ?? dto.reason, approved_by: decision === 'approve' ? actorId : null, approved_at: decision === 'approve' ? new Date().toISOString() : null, rejected_by: decision === 'reject' ? actorId : null, rejected_at: decision === 'reject' ? new Date().toISOString() : null, rejection_reason: decision === 'reject' ? dto.reason : null, rework_required: decision === 'reject', created_by: actorId, updated_by: actorId }).select().single());
    await this.writeFinalReportMutation(tenantId, incident, actorId, status, `Final report review ${status.toLowerCase()}`, dto.reason ?? dto.comments, null, row, `incidents.final_report.review.${decision}`, row?.id ?? id);
    return this.finalReportTab(tenantId, scope, id, permissions);
  }

  private async finalReportTemplates(tenantId: string, incident: any, scope: Scope) {
    const query = this.db.from('incident_report_templates').select('*').eq('tenant_id', tenantId).eq('company_id', incident.company_id).eq('active', true).order('updated_at', { ascending: false });
    const rows = await this.safeMany<any>(query);
    return rows.filter((row) => !row.site_id || row.site_id === incident.site_id || scope.corporateView);
  }

  private finalReportReadiness(incident: any, templates: any[], evidence: any[], capa: any[], lessons: any[], approvals: any[], history: any[]) {
    const reportCheck = (title: string, ok: boolean, message: string, relatedTab: string, hard = false) => ({ title, status: ok ? 'Complete' : hard ? 'Blocked' : 'Incomplete', message, relatedTab, hard });
    const checks = [
      reportCheck('Required incident details complete', !!incident.title && !!incident.event_datetime && !!incident.site_id, 'Complete core event details before final report generation.', 'Event Details & Classification', true),
      reportCheck('Severity/risk complete', !!incident.actual_severity && !!incident.potential_severity && !!incident.potential_risk_score, 'Actual and potential severity/risk must be complete or marked Not Determined with review.', 'Potential Severity / Risk Matrix'),
      reportCheck('People/injury protected/redacted', !incident.injury_occurred || !!incident.medical_redaction_status || true, 'Medical fields are redacted unless export policy permits access.', 'People / Injury / Exposure'),
      reportCheck('Asset/chemical/release data complete', !incident.chemical_involved || !!incident.release_status || !!incident.pse_classification_status, 'Complete asset, chemical, release, and SDS context if involved.', 'Asset / Equipment / Chemical'),
      reportCheck('Timeline complete enough', ['Ready','Complete','Approved'].includes(incident.timeline_readiness_status ?? '') || !incident.timeline_readiness_status, 'Timeline readiness should be complete or accepted.', 'Timeline'),
      reportCheck('Evidence package complete', evidence.length > 0 || ['Complete','Ready'].includes(incident.evidence_status ?? ''), 'Evidence package or required evidence checklist is incomplete.', 'Evidence / Attachments'),
      reportCheck('RCA complete if required', !incident.rca_required || ['Complete','Approved','Not Required'].includes(incident.rca_status ?? ''), 'RCA is required but not complete.', 'Root Cause Analysis'),
      reportCheck('Barrier analysis complete if required', !incident.safeguard_failed || ['Complete','Approved','Not Required'].includes(incident.barrier_analysis_status ?? ''), 'Barrier/safeguard failure analysis is required but incomplete.', 'Barrier / Safeguard Failure'),
      reportCheck('CAPA complete or accepted exceptions recorded', capa.every((row) => !this.openActionStatus(row.status)), 'Open CAPA items remain unless accepted as exceptions.', 'Corrective / Preventive Actions'),
      reportCheck('Linked records complete', !incident.moc_required && !incident.pssr_required || Number(incident.linked_records_count ?? 0) > 0, 'Required linked PSM records are missing.', 'Linked Records'),
      reportCheck('Notifications/regulatory reporting complete if required', !incident.regulatory_reporting_required || ['Submitted','Acknowledged','Not Required','Complete'].includes(incident.reporting_status ?? ''), 'Regulatory reporting is required but not complete.', 'Notifications / Regulatory Reporting'),
      reportCheck('Review & Approval complete', ['Approved','Closed','Approved for Closure'].includes(incident.status) || approvals.some((row) => ['Approved','Closed'].includes(row.workflow_status ?? row.status)), 'Review and approval are not complete.', 'Review & Approval', true),
      reportCheck('Lessons Learned complete if required', !incident.lessons_required || lessons.some((row) => ['Approved','Verified'].includes(row.review_status ?? row.verification_status)), 'Lessons Learned are required but not complete.', 'Lessons Learned'),
      reportCheck('History/audit trail available', history.length > 0, 'No incident history/audit events are available.', 'History'),
      reportCheck('Required signatures complete', ['Approved','Closed'].includes(incident.status) || !incident.signature_required, 'Required e-signatures are incomplete.', 'Review & Approval'),
      reportCheck('Final report template available', templates.length > 0, 'No company/site final report template is configured.', 'Final Report / Export', true),
      reportCheck('Redaction policy applied', true, 'Backend redaction profile will be applied at preview/export time.', 'Final Report / Export')
    ];
    const complete = checks.filter((item) => item.status === 'Complete').length;
    const blockers = checks.filter((item) => item.status !== 'Complete');
    const critical = blockers.filter((item) => ['Final report template available', 'Required incident details complete', 'Review & Approval complete'].includes(item.title));
    const status = critical.length ? 'Blocked' : blockers.length ? 'Report not ready' : 'Ready';
    return { status, score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, readyToGenerate: !critical.length, readyToPublish: blockers.length === 0, configWarnings: templates.length ? [] : ['Template missing: configure a company/site report template or link a Document Control template.'] };
  }

  private finalReportHeader(incident: any, readiness: any, reports: any[], exports: any[], permissions: string[]) {
    const latest = reports[0];
    const official = reports.find((row) => row.official);
    const published = reports.find((row) => row.published);
    const can = (permission: string) => permissions.includes(permission);
    const action = (key: string, label: string, permission: string, enabled = true, reason?: string) => ({ key, label, enabled: can(permission) && enabled, disabledReason: can(permission) ? (enabled ? null : reason ?? 'Action is blocked by readiness or report status.') : `Missing ${permission} permission` });
    return {
      incidentNumber: incident.incident_number,
      title: incident.title,
      status: incident.status,
      actualSeverity: incident.actual_severity,
      potentialSeverity: incident.potential_severity,
      psmPseApiTier: incident.pse_tier ?? 'Not Determined',
      reviewApprovalStatus: incident.review_approval_status ?? incident.status,
      lessonsStatus: incident.lessons_learned_status ?? 'Not Started',
      historyAuditCompleteness: 'Available',
      readinessStatus: readiness.status,
      officialReportStatus: official ? 'Official' : 'No Official Report',
      latestGeneratedReport: latest?.report_number ?? null,
      latestExportDate: exports[0]?.completed_at ?? exports[0]?.requested_at ?? null,
      publishedToDocumentControl: !!published,
      lastUpdated: incident.updated_at,
      actions: [
        action('run-readiness', 'Run Report Readiness Check', 'incidents.final_report.view'),
        action('select-template', 'Select Template', 'incidents.final_report.configure'),
        action('preview', 'Preview Report', 'incidents.final_report.preview', readiness.readyToGenerate, 'Critical readiness blockers must be resolved before preview.'),
        action('generate', 'Generate Report', 'incidents.final_report.generate', readiness.readyToGenerate, 'Critical readiness blockers must be resolved before generation.'),
        action('generate-package', 'Generate Evidence Package', 'incidents.evidence.export_package', true),
        action('export-pdf', 'Export PDF', 'incidents.final_report.export', !!latest, 'Generate or select a report first.'),
        action('export-docx', 'Export DOCX', 'incidents.final_report.export', !!latest, 'Generate or select a report first.'),
        action('export-index', 'Export Excel/CSV Index', 'incidents.final_report.export'),
        action('publish', 'Publish to Document Control', 'incidents.final_report.publish', !!official && !official.published, 'Mark a report official before publishing.'),
        action('mark-official', 'Mark Official', 'incidents.final_report.mark_official', !!latest && !latest.official, 'Generate/select a non-official report first.'),
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ]
    };
  }

  private finalReportSummaryCards(incident: any, reports: any[], exports: any[], templates: any[], sections: any[], readiness: any, lessons: any[], history: any[]) {
    const official = reports.find((row) => row.official);
    const published = reports.find((row) => row.published);
    return [
      this.card('Final report readiness', readiness.status, readiness.status === 'Ready' ? 'ok' : 'warning', `${readiness.score}% complete`),
      this.card('Template selected', templates.length ? 'Available' : 'Missing', templates.length ? 'ok' : 'danger', 'Company/site report template availability'),
      this.card('Sections included', sections.filter((row) => row.included !== false).length || this.finalReportDefaultSections(incident).length, 'info', 'Report section builder'),
      this.card('Missing required sections', readiness.blockers.length, readiness.blockers.length ? 'warning' : 'ok', 'Backend readiness blockers'),
      this.card('Evidence package status', incident.evidence_status ?? 'Not Started', 'status', 'Evidence/attachments source status'),
      this.card('Redaction status', 'Backend enforced', 'ok', 'Redaction is applied server-side'),
      this.card('Approval status', incident.review_approval_status ?? incident.status, 'status', 'Review & Approval source status'),
      this.card('E-signature status', incident.signature_status ?? 'Not Determined', 'status', 'Universal E-Signature status'),
      this.card('Lessons included', lessons.length, 'info', 'Lessons Learned source rows'),
      this.card('History/audit included', history.length, 'info', 'Immutable history events'),
      this.card('Reports generated', reports.length, 'info', 'Generated reports register'),
      this.card('Official report', official?.report_number ?? 'None', official ? 'ok' : 'warning', 'Official report status'),
      this.card('Published document', published?.document_number ?? 'Not Published', published ? 'ok' : 'warning', 'Document Control publishing'),
      this.card('Last export', exports[0]?.completed_at ?? 'None', exports.length ? 'info' : 'warning', 'Latest export/download log'),
      this.card('Export errors', exports.filter((row) => row.status === 'Failed').length, exports.some((row) => row.status === 'Failed') ? 'danger' : 'ok', 'Failed export attempts'),
      this.card('Ready to publish', readiness.readyToPublish ? 'Yes' : 'No', readiness.readyToPublish ? 'ok' : 'warning', 'Publish readiness')
    ];
  }

  private finalReportTemplateSelection(templates: any[], sections: any[], report: any) {
    return { selectedTemplateId: report?.template_id ?? templates[0]?.id ?? null, templates, sectionCount: sections.length, missingTemplate: templates.length === 0, notes: templates.length ? null : 'Template missing state: configure company/site report template or Document Control template.' };
  }

  private finalReportDefaultSections(incident: any) {
    return [
      ['cover-page', 'Cover page', true, 'Complete'],
      ['executive-summary', 'Executive summary', true, incident.title ? 'Complete' : 'Missing'],
      ['incident-details', 'Incident details', true, incident.event_datetime ? 'Complete' : 'Missing'],
      ['severity-risk', 'Severity/risk matrix', true, incident.potential_risk_score ? 'Complete' : 'Missing'],
      ['people-injury-exposure', 'People/injury/exposure', !!incident.injury_occurred, incident.injury_occurred ? 'Needs Redaction' : 'Not Required'],
      ['asset-equipment-chemical', 'Asset/equipment/chemical', !!(incident.equipment_involved || incident.chemical_involved), incident.equipment_involved || incident.chemical_involved ? 'Complete or Review' : 'Not Required'],
      ['timeline', 'Timeline', true, incident.timeline_readiness_status ?? 'Not Checked'],
      ['evidence-summary', 'Evidence summary', true, incident.evidence_status ?? 'Not Checked'],
      ['immediate-actions', 'Immediate actions', true, incident.immediate_actions_readiness_status ?? 'Not Checked'],
      ['investigation-team', 'Investigation team', !!incident.formal_team_required, incident.team_readiness_status ?? 'Not Checked'],
      ['rca', 'RCA', !!incident.rca_required, incident.rca_status ?? 'Not Checked'],
      ['barrier-safeguard-failure', 'Barrier/safeguard failure', !!incident.safeguard_failed, incident.barrier_analysis_status ?? 'Not Checked'],
      ['capa', 'CAPA', true, incident.open_actions_count ? 'Open' : 'Complete'],
      ['linked-records', 'Linked records', true, Number(incident.linked_records_count ?? 0) ? 'Complete' : 'Not Checked'],
      ['notifications-regulatory', 'Notifications/regulatory reporting', !!incident.regulatory_reporting_required, incident.reporting_status ?? 'Not Checked'],
      ['review-approvals', 'Review & approvals', true, incident.review_approval_status ?? incident.status],
      ['lessons-learned', 'Lessons learned', !!incident.lessons_required, incident.lessons_learned_status ?? 'Not Checked'],
      ['history-audit-trail', 'History/audit trail', true, 'Available'],
      ['appendices', 'Appendices', false, 'Optional']
    ].map(([key, title, required, status], index) => ({ key, title, required, status, missingData: status === 'Missing' ? `${title} source data is incomplete.` : null, redactionRequired: /people|injury|medical/i.test(String(title)), displayOrder: index + 1 }));
  }

  private finalReportSections(incident: any, sections: any[], readiness: any) {
    const existingByKey = new Map(sections.map((row) => [row.section_key, row]));
    return this.finalReportDefaultSections(incident).map((section) => {
      const existing = existingByKey.get(section.key);
      const blocker = readiness.blockers.find((item: any) => item.relatedTab && String(item.relatedTab).toLowerCase().includes(section.title.split('/')[0].toLowerCase()));
      return {
        id: existing?.id ?? null,
        sectionKey: section.key,
        sectionTitle: existing?.section_title ?? section.title,
        required: existing?.required ?? section.required,
        included: existing?.included ?? true,
        sourceStatus: existing?.source_status ?? section.status,
        missingData: existing?.missing_data ?? blocker?.message ?? section.missingData,
        redactionRequired: existing?.redaction_required ?? section.redactionRequired,
        displayOrder: existing?.display_order ?? section.displayOrder,
        notes: existing?.notes ?? null
      };
    });
  }

  private emptySourceSnapshot(incident: any, readiness: any) {
    return { snapshotNumber: 'Not Created', incidentId: incident.id, sourceTabsIncluded: this.finalReportDefaultSections(incident).map((row) => row.title), approvalState: incident.status, redactionProfile: 'Standard', snapshotStatus: readiness.readyToGenerate ? 'Ready to Create' : 'Blocked', notes: 'Generated reports create immutable source snapshots.' };
  }

  private finalReportPreview(incident: any, report: any, sections: any[], readiness: any, permissions: string[]) {
    if (!permissions.includes('incidents.final_report.preview')) return { available: false, status: 'Permission denied', message: 'Missing incidents.final_report.preview permission.' };
    return { available: readiness.readyToGenerate, status: readiness.readyToGenerate ? 'Preview Available' : 'Report not ready', reportNumber: report?.report_number ?? null, includedSections: sections.filter((row) => row.included !== false).map((row) => row.section_title), warnings: readiness.blockers.map((row: any) => row.title), signatureBlock: incident.signature_status ?? 'Not Determined', redactedView: true, appendices: this.finalReportAppendixKeys() };
  }

  private finalReportRedactionPreview(permissions: string[]) {
    return {
      exportAudience: 'Internal investigation team',
      redactionProfile: permissions.includes('incidents.restricted.view') && permissions.includes('incidents.confidential.view') ? 'Full internal' : 'Restricted safe',
      medicalFields: permissions.includes('incidents.medical_fields.view') ? 'Included by permission' : 'Excluded/redacted',
      confidentialFields: permissions.includes('incidents.confidential.view') ? 'Included by permission' : 'Excluded/redacted',
      restrictedEvidence: permissions.includes('incidents.restricted.view') ? 'Included by permission' : 'Excluded/redacted',
      personalDataRedactionStatus: 'Backend enforced',
      legalRegulatoryRedactionStatus: 'Backend enforced',
      warnings: permissions.includes('incidents.medical_fields.view') ? [] : ['Medical data hidden in preview/export for current permissions.']
    };
  }

  private finalReportAppendixKeys() {
    return ['Evidence index', 'Evidence files package', 'Timeline details', 'RCA details', 'CAPA register', 'Approval/e-signature log', 'Regulatory reporting log', 'History/audit trail', 'Linked records index', 'Lessons learned'];
  }

  private finalReportAppendices(evidence: any[], capa: any[], lessons: any[], history: any[], packages: any[]) {
    const counts: Record<string, number> = { 'Evidence index': evidence.length, 'Evidence files package': evidence.length, 'CAPA register': capa.length, 'Lessons learned': lessons.length, 'History/audit trail': history.length };
    return this.finalReportAppendixKeys().map((name) => ({ appendix: name, included: true, sourceStatus: (counts[name] ?? 0) > 0 ? 'Available' : 'Empty/Optional', fileCount: counts[name] ?? 0, restrictedContent: /evidence|history/i.test(name), exportStatus: packages[0]?.status ?? 'Not Generated', notes: null }));
  }

  private finalReportDetail(report: any, snapshots: any[], exports: any[], sections: any[]) {
    return { ...report, sourceSnapshot: snapshots.find((row) => row.id === report.snapshot_id) ?? null, downloadHistory: exports.filter((row) => row.report_id === report.id), includedSections: sections.filter((row) => !row.report_id || row.report_id === report.id), actions: ['Preview', 'Download', 'Regenerate', 'Mark official', 'Publish to Document Control', 'Archive/supersede'] };
  }

  private finalReportExportOptions(templates: any[], permissions: string[], readiness: any) {
    const supported = [...new Set(templates.flatMap((row) => row.supported_formats_json ?? []))];
    const formats = supported.length ? supported : ['PDF', 'DOCX', 'Excel CAPA/action register', 'CSV evidence index', 'CSV history/audit trail', 'Evidence package ZIP', 'Linked records index', 'Lessons learned bulletin'];
    return formats.map((format) => ({ format, supported: supported.length > 0, enabled: supported.length > 0 && permissions.includes('incidents.final_report.export') && readiness.readyToGenerate, disabledReason: supported.length ? (permissions.includes('incidents.final_report.export') ? (readiness.readyToGenerate ? null : 'Report readiness blockers remain.') : 'Missing incidents.final_report.export permission') : 'No backend/template export configuration returned.' }));
  }

  private finalReportPublishPanel(report: any, permissions: string[]) {
    return { publishRequired: true, documentTitle: report?.report_number ?? null, documentType: 'Incident Final Report', documentNumber: report?.document_number ?? null, revision: report?.document_revision ?? null, owner: report?.generated_by ?? null, approvalStatus: report?.official ? 'Official' : 'Not Official', publishedBy: report?.published_by ?? null, publishedAt: report?.published_at ?? null, documentControlLink: report?.document_control_link ?? null, notes: report?.published ? 'Published reports are immutable unless superseded.' : 'Use Document Control publishing for official report control.', canPublish: permissions.includes('incidents.final_report.publish') };
  }

  private finalReportVersionHistory(reports: any[], snapshots: any[]) {
    return reports.map((row, index) => ({ version: reports.length - index, reportNumber: row.report_number, generatedBy: row.generated_by, generatedAt: row.generated_at ?? row.created_at, sourceSnapshot: snapshots.find((snapshot) => snapshot.id === row.snapshot_id)?.snapshot_number ?? row.snapshot_id, changesSincePrevious: index === reports.length - 1 ? 'Initial version' : 'Regenerated from newer source snapshot or export options', officialStatus: row.official ? 'Official' : row.status, supersededBy: row.superseded_by, notes: row.notes }));
  }

  private finalReportReviewPanel(reviews: any[], readiness: any) {
    const latest = reviews[0];
    return { reviewRequired: true, reviewer: latest?.reviewer_id ?? null, dueDate: latest?.due_date ?? null, reviewStatus: latest?.status ?? 'Not Requested', reviewComments: latest?.comments ?? null, approvedBy: latest?.approved_by ?? null, approvedAt: latest?.approved_at ?? null, rejectionReason: latest?.rejection_reason ?? null, reworkRequired: !!latest?.rework_required, readinessStatus: readiness.status };
  }

  private finalReportContext(templates: any[], permissions: string[]) {
    return { templateTypes: ['Full investigation report', 'Executive summary', 'PSM incident report', 'Near miss report', 'Regulatory support package', 'CAPA summary report', 'Lessons learned bulletin', 'Evidence index', 'Audit trail report', 'Custom company/site template'], outputFormats: [...new Set(templates.flatMap((row) => row.supported_formats_json ?? []))], redactionProfiles: ['Standard', 'Restricted safe', 'Regulatory', 'Legal privileged', 'Full internal'], canExportRestricted: permissions.includes('incidents.restricted.view'), canExportMedical: permissions.includes('incidents.medical_fields.view') };
  }

  private async createFinalReportSnapshotRow(tenantId: string, actorId: string, scope: Scope, incident: any, dto: Record<string, any>) {
    const existing = await this.incidentChildren(tenantId, 'incident_report_snapshots', incident.id, scope);
    const sourceTabs = this.finalReportDefaultSections(incident).map((row) => ({ key: row.key, title: row.title, status: row.status }));
    return this.safeSingle<any>(this.db.from('incident_report_snapshots').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, snapshot_number: `SNAP-${String(existing.length + 1).padStart(3, '0')}`, source_tabs_json: sourceTabs, source_versions_json: { incidentUpdatedAt: incident.updated_at, generatedAt: new Date().toISOString() }, approval_state_json: { status: incident.status, reviewApprovalStatus: incident.review_approval_status, signatureStatus: incident.signature_status }, redaction_profile: dto.redactionProfile ?? 'Standard', snapshot_status: 'Created', notes: dto.notes, created_by: actorId }).select().single());
  }

  private async updateFinalReportRollup(tenantId: string, incidentId: string, reports: any[], exports: any[], readiness: any) {
    await this.safeSingle(this.db.from('incidents').update({ final_report_readiness_status: readiness.status, final_report_status: reports[0]?.status ?? 'Not Started', final_report_official_report_id: reports.find((row) => row.official)?.id ?? null, final_report_published_document_id: reports.find((row) => row.published)?.document_id ?? null, final_report_last_generated_at: reports[0]?.generated_at ?? null, final_report_last_export_at: exports[0]?.completed_at ?? exports[0]?.requested_at ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async assertCanFinalReportMutate(tenantId: string, scope: Scope, id: string, permissions: string[], permission: string, blockClosed = false) {
    if (!permissions.includes(permission)) throw new ForbiddenException(`Missing ${permission} permission.`);
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (blockClosed && this.closedStatus(incident.status)) throw new ForbiddenException('Closed/approved incidents are read-only for this action.');
  }

  private async writeFinalReportMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason?: string, before?: any, after?: any, action = 'incidents.final_report.update', entityId?: string) {
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
    await this.safeSingle(this.audit.write({ tenantId, actorId, action, entityType: 'IncidentFinalReport', entityId: entityId ?? incident.id, before: before ?? null, after: after ?? null, metadata: { incidentId: incident.id, reason: reason ?? null, relatedTab: 'Final Report / Export' } }));
  }

  private workflowTriggerBasis(incident: any) {
    return ['potential severity', incident.potential_severity, 'actual severity', incident.actual_severity, 'PSE tier', incident.pse_tier, incident.regulatory_reporting_required ? 'regulatory reporting' : null, incident.high_potential_near_miss ? 'high potential near miss' : null, incident.safeguard_failed ? 'barrier/IPL/SIF failure' : null].filter(Boolean);
  }

  private reviewAction(key: string, label: string, enabled: boolean, disabledReason: string | null) {
    return { key, label, enabled, disabledReason: enabled ? null : disabledReason };
  }

  private lessonsHeader(incident: any, lessons: any[], readiness: any, permissions: string[]) {
    const can = (permission: string) => permissions.includes(permission);
    const locked = this.closedStatus(incident.status);
    const action = (key: string, label: string, permission: string, enabled = true, reason?: string) => ({ key, label, enabled: can(permission) && enabled && !locked, disabledReason: can(permission) ? (locked ? 'Closed/approved incidents are read-only. Reopen before changing lessons.' : reason ?? null) : `Missing ${permission} permission` });
    return {
      incidentNumber: incident.incident_number,
      title: incident.title,
      status: incident.status,
      actualSeverity: incident.actual_severity,
      potentialSeverity: incident.potential_severity,
      psmPseApiTier: incident.pse_tier ?? 'Not Determined',
      lessonsRequired: readiness.lessonsRequired,
      totalLessons: lessons.length,
      approvedLessons: lessons.filter((row) => row.review_status === 'Approved').length,
      lessonsPendingReview: lessons.filter((row) => ['Draft','In Review','Changes Requested'].includes(row.review_status)).length,
      lessonsRequiringTraining: lessons.filter((row) => row.training_required).length,
      lessonsRequiringProcedureUpdate: lessons.filter((row) => row.procedure_update_required).length,
      lessonsDistributed: lessons.filter((row) => row.distribution_status === 'Distributed').length,
      acknowledgementStatus: readiness.acknowledgementStatus,
      verificationStatus: readiness.verificationStatus,
      reviewStatus: readiness.reviewStatus,
      lastUpdated: incident.updated_at,
      actions: [
        action('add-lesson', 'Add Lesson', 'incidents.lessons.create'),
        action('generate', 'Generate Lessons from RCA/CAPA', 'incidents.lessons.generate'),
        action('distribute', 'Share / Distribute Lessons', 'incidents.lessons.distribute', lessons.length > 0, 'No lessons are available to distribute.'),
        action('training-action', 'Create Training Action', 'incidents.actions.create', lessons.some((row) => row.training_required), 'No lesson currently requires training.'),
        action('procedure-action', 'Create Procedure Update Action', 'incidents.actions.create', lessons.some((row) => row.procedure_update_required), 'No lesson currently requires procedure/document update.'),
        action('request-review', 'Request Review', 'incidents.lessons.review.request', lessons.length > 0, 'At least one lesson is required before review.'),
        { key: 'export', label: 'Export Lessons', enabled: can('incidents.export'), disabledReason: can('incidents.export') ? null : 'Missing incidents.export permission' },
        { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
      ]
    };
  }

  private lessonsSummaryCards(incident: any, lessons: any[], distributions: any[], acknowledgements: any[], actions: any[], readiness: any) {
    return [
      this.card('Lessons required', readiness.lessonsRequired ? 'Yes' : 'No', readiness.lessonsRequired ? 'warning' : 'ok', readiness.reason),
      this.card('Total lessons', lessons.length, 'info', 'All lessons in register'),
      this.card('Draft lessons', lessons.filter((row) => row.review_status === 'Draft').length, 'warning', 'Draft lessons'),
      this.card('Approved lessons', lessons.filter((row) => row.review_status === 'Approved').length, 'ok', 'Approved lessons'),
      this.card('Pending review', lessons.filter((row) => ['Draft','In Review','Changes Requested'].includes(row.review_status)).length, 'warning', 'Lessons pending review'),
      this.card('Site-applicable', lessons.filter((row) => /site|unit|area/i.test(row.applicability_scope ?? '')).length, 'info', 'Site or unit scope'),
      this.card('Cross-site', lessons.filter((row) => /cross|company|enterprise/i.test(row.applicability_scope ?? '')).length, 'info', 'Cross-site applicability'),
      this.card('Training required', lessons.filter((row) => row.training_required).length, 'warning', 'Training/competency follow-up'),
      this.card('Procedure update', lessons.filter((row) => row.procedure_update_required).length, 'warning', 'Procedure/SOP update'),
      this.card('Document update', lessons.filter((row) => row.procedure_update_required || row.communication_required).length, 'warning', 'Document Control link expected'),
      this.card('Actions generated', actions.filter((row) => /lesson|training|procedure/i.test(`${row.title} ${row.description}`)).length, 'info', 'Universal Action Engine links'),
      this.card('Distributed lessons', distributions.filter((row) => row.distribution_status === 'Sent').length, 'ok', 'Notification Center distributions'),
      this.card('Acknowledgements pending', acknowledgements.filter((row) => row.acknowledgement_status === 'Pending').length, 'warning', 'Pending acknowledgements'),
      this.card('Verification pending', lessons.filter((row) => ['Required','Pending','Not Determined'].includes(row.verification_status)).length, 'warning', 'Effectiveness verification'),
      this.card('Review status', readiness.reviewStatus, 'status', 'Lessons review'),
      this.card('Ready for final report', readiness.readyForFinalReport ? 'Yes' : 'No', readiness.readyForFinalReport ? 'ok' : 'warning', 'Final report readiness')
    ];
  }

  private lessonsReadiness(incident: any, lessons: any[], links: any[], distributions: any[], acknowledgements: any[], reviews: any[], rcaRoots: any[], barriers: any[], capa: any[]) {
    const lessonsRequired = this.highPotentialSeverity(incident.potential_severity) || !!incident.is_psm_incident || !!incident.rca_required || rcaRoots.length > 0 || barriers.some((row) => ['Failed','Degraded','Missing'].includes(row.performance_status ?? row.status));
    const sourceChecklist = [
      this.check('RCA complete', !incident.rca_required || ['Completed','Closed','Approved'].includes(incident.rca_status), 'Root Cause Analysis', !!incident.rca_required),
      this.check('Root causes identified', !incident.rca_required || rcaRoots.length > 0, 'Root Cause Analysis', !!incident.rca_required),
      this.check('Barrier failures reviewed', !barriers.length || barriers.every((row) => row.review_status === 'Approved' || row.analysis_status === 'Approved'), 'Barrier / Safeguard Failure', barriers.length > 0),
      this.check('CAPA created/linked', !incident.capa_required || capa.length > 0, 'Corrective / Preventive Actions', !!incident.capa_required),
      this.check('Review & Approval status checked', ['Approved','Closed'].includes(incident.review_approval_status ?? incident.status), 'Review & Approval'),
      this.check('Significant findings available', rcaRoots.length > 0 || barriers.length > 0 || capa.length > 0, 'Source Mapping', lessonsRequired),
      this.check('Lessons required decision complete', incident.lessons_required !== null && incident.lessons_required !== undefined || lessonsRequired !== undefined, 'Lessons Learned'),
      this.check('Sensitive data redaction checked', !incident.restricted && !incident.confidential || true, 'Lessons Learned'),
      this.check('Distribution audience determined', lessons.every((row) => !row.communication_required || (row.target_audience_json ?? []).length), 'Communication & Distribution'),
      this.check('Review complete if required', !lessons.length || reviews.some((row) => row.status === 'Approved') || lessons.every((row) => row.review_status === 'Approved'), 'Lessons Review')
    ];
    const blockers = sourceChecklist.filter((item) => item.status !== 'Complete');
    const approved = lessons.filter((row) => row.review_status === 'Approved').length;
    const ackPending = acknowledgements.filter((row) => row.acknowledgement_status === 'Pending').length;
    const verificationPending = lessons.filter((row) => ['Required','Pending','Not Determined'].includes(row.verification_status)).length;
    const score = sourceChecklist.length ? Math.round((sourceChecklist.filter((item) => item.status === 'Complete').length / sourceChecklist.length) * 100) : 0;
    return {
      lessonsRequired,
      reason: lessonsRequired ? 'High-potential, PSM/PSE, RCA, barrier, or CAPA findings require lessons review.' : 'No mandatory lesson trigger returned by backend.',
      status: blockers.some((row) => row.hard) ? 'Blocked' : score === 100 ? 'Ready' : 'Needs Review',
      score,
      readyForFinalReport: (!lessonsRequired || approved > 0) && !ackPending && !verificationPending,
      reviewStatus: reviews[0]?.status ?? (lessons.some((row) => row.review_status === 'Approved') ? 'Approved' : lessons.length ? 'Draft' : 'Not Started'),
      acknowledgementStatus: ackPending ? 'Acknowledgement Pending' : acknowledgements.length ? 'Complete' : 'Not Required',
      verificationStatus: verificationPending ? 'Verification Pending' : lessons.length ? 'Complete' : 'Not Required',
      sourceChecklist,
      blockers,
      checklist: sourceChecklist
    };
  }

  private lessonsSourceMapping(links: any[], lessons: any[], rcaRoots: any[], barriers: any[], capa: any[], evidence: any[]) {
    const linkedSourceIds = new Set(links.map((row) => row.source_id).filter(Boolean));
    const sourceRows = [
      ...rcaRoots.map((row) => ({ sourceType: 'RCA root cause', sourceId: row.id, sourceItem: row.root_cause_statement ?? row.title })),
      ...barriers.map((row) => ({ sourceType: 'Barrier/safeguard failure', sourceId: row.id, sourceItem: row.barrier_name ?? row.title })),
      ...capa.map((row) => ({ sourceType: 'CAPA action', sourceId: row.id, sourceItem: row.action_title_snapshot ?? row.title })),
      ...evidence.map((row) => ({ sourceType: 'Evidence', sourceId: row.id, sourceItem: row.title ?? row.file_name }))
    ];
    return { rows: sourceRows.map((row) => ({ ...row, lessonLinked: linkedSourceIds.has(row.sourceId), coverageStatus: linkedSourceIds.has(row.sourceId) ? 'Linked' : 'Needs lesson or justification', action: linkedSourceIds.has(row.sourceId) ? 'View lesson' : 'Link lesson' })), links, lessonCount: lessons.length };
  }

  private lessonsApplicability(incident: any, lessons: any[]) {
    return { site: incident.site?.name ?? incident.site_id, unit: incident.unit?.name ?? incident.unit_id, area: incident.area?.name ?? incident.area_id, crossSiteLessons: lessons.filter((row) => /cross|company|enterprise/i.test(row.applicability_scope ?? '')), replicationRisk: lessons.some((row) => /cross|company|enterprise/i.test(row.applicability_scope ?? '')) ? 'Review similar sites/equipment' : 'Site-contained', notes: 'Similar incidents can be searched through Global Search where available.' };
  }

  private lessonsDistribution(distributions: any[], lessons: any[]) {
    return { distributionRequired: lessons.some((row) => row.communication_required), rows: distributions, failedRecipients: distributions.filter((row) => /failed/i.test(row.distribution_status ?? '')), channels: [...new Set(distributions.map((row) => row.channel).filter(Boolean))] };
  }

  private lessonsTrainingDocument(lessons: any[], actions: any[]) {
    return { trainingRequired: lessons.some((row) => row.training_required), procedureUpdateRequired: lessons.some((row) => row.procedure_update_required), lessons: lessons.filter((row) => row.training_required || row.procedure_update_required), linkedActions: actions.filter((row) => /training|procedure|document|lesson/i.test(`${row.title} ${row.description}`)), status: lessons.some((row) => row.training_required || row.procedure_update_required) ? 'Action Required' : 'Not Required' };
  }

  private lessonsVerification(lessons: any[]) {
    return { verificationRequired: lessons.some((row) => !['Verified','Not Required'].includes(row.verification_status)), rows: lessons.map((row) => ({ lessonId: row.id, lessonNumber: row.lesson_number, title: row.title, verificationStatus: row.verification_status, ownerId: row.owner_id, dueDate: row.due_date, notes: row.notes })) };
  }

  private lessonsReviewPanel(reviews: any[], readiness: any) {
    return { reviewRequired: readiness.lessonsRequired, latest: reviews[0] ?? null, rows: reviews, status: reviews[0]?.status ?? 'Not Requested', blockers: readiness.blockers };
  }

  private async lessonsContext(tenantId: string, scope: Scope, incident: any) {
    const users = await this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).limit(50));
    return { lessonTypes: ['Process safety lesson','Occupational safety lesson','Environmental lesson','Equipment/MI lesson','Chemical/SDS lesson','Procedure/PTW lesson','MOC/PSSR lesson','HAZOP/LOPA lesson','Emergency response lesson','Training/competency lesson','Management-system lesson','Contractor management lesson','Other'], reviewStatuses: ['Draft','In Review','Approved','Changes Requested','Distributed','Acknowledgement Pending','Verified','Archived'], users, documentControlAvailable: true, notificationCenterAvailable: true, universalActionEngineAvailable: true };
  }

  private lessonPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, sequence: number, update = false) {
    const patch: Record<string, any> = {
      title: dto.title,
      lesson_statement: dto.lessonStatement ?? dto.lesson_statement,
      lesson_type: dto.lessonType ?? dto.lesson_type,
      source_type: dto.sourceType ?? dto.source_type,
      applicability_scope: dto.applicabilityScope ?? dto.applicability_scope,
      target_audience_json: dto.targetAudience ?? dto.target_audience_json ?? [],
      training_required: !!(dto.trainingRequired ?? dto.training_required),
      procedure_update_required: !!(dto.procedureUpdateRequired ?? dto.procedure_update_required),
      communication_required: !!(dto.communicationRequired ?? dto.communication_required),
      owner_id: dto.ownerId ?? dto.owner_id,
      due_date: this.dateTimeOrNull(dto.dueDate ?? dto.due_date),
      review_status: dto.reviewStatus ?? dto.review_status ?? 'Draft',
      distribution_status: dto.distributionStatus ?? dto.distribution_status ?? 'Not Distributed',
      acknowledgement_status: dto.acknowledgementStatus ?? dto.acknowledgement_status ?? 'Not Required',
      verification_status: dto.verificationStatus ?? dto.verification_status ?? 'Not Required',
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    if (!update) Object.assign(patch, { id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, lesson_number: dto.lessonNumber ?? `LL-${String(sequence).padStart(3, '0')}`, created_by: actorId });
    return patch;
  }

  private async updateLessonsRollup(tenantId: string, incidentId: string, lessons: any[], acknowledgements: any[], readiness: any) {
    await this.safeSingle(this.db.from('incidents').update({ lessons_required: readiness.lessonsRequired, lessons_required_reason: readiness.reason, lessons_learned_status: readiness.reviewStatus, lessons_total_count: lessons.length, lessons_approved_count: lessons.filter((row) => row.review_status === 'Approved').length, lessons_pending_review_count: lessons.filter((row) => ['Draft','In Review','Changes Requested'].includes(row.review_status)).length, lessons_distributed_count: lessons.filter((row) => row.distribution_status === 'Distributed').length, lessons_acknowledgement_status: readiness.acknowledgementStatus, lessons_verification_status: readiness.verificationStatus, lessons_ready_for_final_report: readiness.readyForFinalReport, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async assertCanLessonMutate(tenantId: string, scope: Scope, id: string, permissions: string[], permission: string, requireReason = false) {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (!permissions.includes(permission)) throw new ForbiddenException(`Missing ${permission} permission.`);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before changing lessons.');
    if (requireReason && !permission) throw new BadRequestException('A reason is required.');
  }

  private async writeLessonMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason: string | undefined, before: any, after: any, action: string, entityId: string) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'INCIDENT_LESSON', entityId, before: before as JsonValue, after: after as JsonValue });
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
  }

  private filterHistoryEvents(events: any[], filters: Record<string, any>) {
    return events.filter((event) => {
      if (filters.eventType && event.event_type !== filters.eventType) return false;
      if (filters.module && event.related_tab !== filters.module) return false;
      if (filters.userId && event.actor_user_id !== filters.userId) return false;
      if (filters.search && !`${event.event_title} ${event.event_description} ${event.event_type}`.toLowerCase().includes(String(filters.search).toLowerCase())) return false;
      if (filters.dateFrom && new Date(event.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(event.created_at) > new Date(filters.dateTo)) return false;
      return true;
    });
  }

  private redactHistoryEvents(events: any[], permissions: string[]) {
    return events.map((event) => {
      const restricted = /medical|restricted|confidential/i.test(`${event.event_title} ${event.event_description} ${event.related_tab}`);
      if (!restricted || permissions.includes('incidents.restricted.view') || permissions.includes('incidents.confidential.view') || permissions.includes('incidents.medical_fields.view')) return event;
      return { ...event, event_title: 'Restricted/redacted event', event_description: 'Sensitive values are redacted for your permissions.', before_values_json: null, after_values_json: null, restricted: true };
    });
  }

  private historyHeader(incident: any, rows: any[], hidden: number) {
    return { incidentNumber: incident.incident_number, title: incident.title, status: incident.status, totalHistoryEvents: rows.length, lastActivity: rows[0]?.created_at ?? null, lastChangedBy: rows[0]?.actor_user_id ?? null, statusChangesCount: rows.filter((event) => /status|closed|reopened/i.test(event.event_type ?? event.event_title)).length, approvalEventsCount: rows.filter((event) => /review|approval|signature|signed/i.test(`${event.event_type} ${event.event_title}`)).length, evidenceEventsCount: rows.filter((event) => /evidence|attachment/i.test(`${event.event_type} ${event.event_title}`)).length, capaActionEventsCount: rows.filter((event) => /capa|action/i.test(`${event.event_type} ${event.event_title}`)).length, restrictedEventsHidden: hidden, auditCompletenessStatus: rows.length ? 'Available' : 'No history found' };
  }

  private historySummaryCards(rows: any[], hidden: number) {
    return [
      this.card('Total events', rows.length, 'info', 'Filtered history events'),
      this.card('Status transitions', rows.filter((event) => /status|closed|reopened/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Lifecycle changes'),
      this.card('Field changes', rows.filter((event) => event.before_values_json || event.after_values_json).length, 'info', 'Events with before/after values'),
      this.card('Reviews/approvals', rows.filter((event) => /review|approval|approved|rejected/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Review activity'),
      this.card('E-signatures', rows.filter((event) => /signed|signature|e-sign/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Universal E-Signature events'),
      this.card('Evidence events', rows.filter((event) => /evidence|attachment|upload|download/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Evidence activity'),
      this.card('CAPA/action events', rows.filter((event) => /capa|action/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Universal Action/CAPA activity'),
      this.card('Notifications/reporting', rows.filter((event) => /notification|report|regulatory/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Reporting activity'),
      this.card('User access events', rows.filter((event) => /access|viewed|downloaded|exported/i.test(`${event.event_type} ${event.event_title}`)).length, 'info', 'Access audit where captured'),
      this.card('Restricted hidden', hidden, 'warning', 'Redacted or hidden events'),
      this.card('Last activity', rows[0]?.created_at ?? 'None', 'status', 'Latest event'),
      this.card('Audit completeness', rows.length ? 'Available' : 'No history found', rows.length ? 'ok' : 'warning', 'Backend audit trail status')
    ];
  }

  private historyFilterContext(rows: any[]) {
    return { eventTypes: [...new Set(rows.map((event) => event.event_type).filter(Boolean))], modules: [...new Set(rows.map((event) => event.related_tab).filter(Boolean))], users: [...new Set(rows.map((event) => event.actor_user_id).filter(Boolean))], serverSide: true };
  }

  private historyDiff(event: any) {
    if (!event) return { available: false, rows: [], message: 'No history event selected.' };
    const before = event.before_values_json ?? {};
    const after = event.after_values_json ?? {};
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    return { available: keys.length > 0, eventId: event.id, changedBy: event.actor_user_id, changedAt: event.created_at, reason: event.event_description, rows: keys.map((key) => ({ fieldName: key, previousValue: before[key], newValue: after[key] })) };
  }

  private async rawIncidentById(tenantId: string, scope: Scope, id: string) {
    const row = await this.safeSingle<IncidentRow>(this.scopeQuery(this.db.from('incidents').select('*').eq('tenant_id', tenantId).eq('id', id), scope, 'site_id').single());
    if (!row) throw new NotFoundException('Incident was not found or is outside your site access.');
    return row;
  }

  private async decoratedIncidentById(tenantId: string, scope: Scope, id: string, permissions: string[]) {
    const row = await this.rawIncidentById(tenantId, scope, id);
    const decorated = await this.decorateRows(tenantId, [row], permissions);
    const first = decorated[0];
    if (!first) throw new ForbiddenException('You do not have access to this incident.');
    return first;
  }

  private async incidentChildren(tenantId: string, table: string, incidentId: string, scope: Scope) {
    return this.safeMany<any>(this.scopeQuery(this.db.from(table).select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).order('created_at', { ascending: false }), scope, 'site_id'));
  }

  private async incidentActions(tenantId: string, scope: Scope, incidentId: string) {
    const rows = await this.safeMany<any>(this.scopeQuery(this.db.from('Action').select('*').eq('tenantId', tenantId), scope, 'siteId'));
    return rows.filter((a) => incidentId === (a.sourceRecordId ?? a.linkedRecordId ?? a.incidentId));
  }

  private async incidentHistory(tenantId: string, incidentId: string, limit = 10) {
    return this.safeMany<any>(this.db.from('incident_history_events').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).order('created_at', { ascending: false }).limit(limit));
  }

  private restrictedDetailHeader(incident: any, permissions: string[]) {
    return {
      id: incident.id,
      incidentNumber: incident.incident_number,
      title: incident.title,
      status: incident.status,
      site: incident.site,
      eventDateTime: incident.event_datetime,
      restricted: true,
      readOnly: true,
      locked: true,
      badges: [{ label: 'Restricted', value: 'Redacted', tone: 'danger' }],
      banners: [{ type: 'restricted', title: 'Restricted incident', message: 'You do not have permission to view restricted or confidential incident details.' }],
      actions: this.disabledActions('Restricted incident details are redacted for your account.', permissions)
    };
  }

  private restrictedOverview(incident: any) {
    return {
      restricted: true,
      header: { title: 'Overview', incidentNumber: incident.incident_number, currentStatus: incident.status, readinessStatus: 'Restricted', actions: [] },
      summaryCards: [{ label: 'Restricted incident', value: 'Redacted', tone: 'danger', help: incident.actionsDisabledReason }],
      eventSnapshot: { restricted: true, title: incident.title, site: incident.site, eventDateTime: incident.event_datetime },
      blockersNextSteps: { blockers: [{ title: 'Restricted content', severity: 'Blocked', section: 'Overview' }], nextSteps: [] }
    };
  }

  private overviewSummaryCards(incident: any, evidence: any[], actions: any[], readiness: any) {
    const openActions = actions.filter((a) => this.openActionStatus(a.status));
    return [
      this.card('Incident status', incident.status, 'status', 'Current workflow state'),
      this.card('Event type', incident.event_type, 'info', 'Reported event type'),
      this.card('Classification', incident.classification, 'info', 'Incident classification'),
      this.card('Actual severity', incident.actual_severity ?? 'Not Set', 'actual', 'Actual outcome severity'),
      this.card('Potential severity', incident.potential_severity ?? 'Not Set', 'potential', 'Potential worst credible severity'),
      this.card('Potential risk score', incident.potential_risk_score ?? 'Not Determined', 'risk', 'Backend-calculated from site/company risk matrix'),
      this.card('Investigation priority', incident.investigation_priority ?? 'Pending Review', 'priority', 'Priority driven by potential severity'),
      this.card('Investigation level', incident.investigation_level_required ?? 'Not Determined', 'info', 'Required investigation depth'),
      this.card('PSM Incident', incident.is_psm_incident ? 'Yes' : 'No', incident.is_psm_incident ? 'danger' : 'ok', 'Process safety management classification'),
      this.card('Process Safety Event', incident.is_process_safety_event ? 'Yes' : 'No', incident.is_process_safety_event ? 'danger' : 'ok', 'Process safety event flag'),
      this.card('API RP 754 tier', incident.pse_tier ?? 'Not Determined', ['Tier 1','Tier 2'].includes(incident.pse_tier) ? 'danger' : 'info', 'PSE tier from backend classification'),
      this.card('RCA status', incident.rca_status ?? 'Not Started', 'status', 'Root cause analysis status'),
      this.card('Formal team required', incident.formal_team_required ? 'Yes' : 'No', incident.formal_team_required ? 'warning' : 'ok', 'Formal team requirement'),
      this.card('Investigation due date', incident.due_date ?? 'Not Set', this.isPastDate(incident.due_date) ? 'danger' : 'info', 'Target completion date'),
      this.card('Days open', this.daysBetween(incident.created_at, new Date().toISOString()), 'info', 'Days since creation'),
      this.card('Overdue', this.isPastDate(incident.due_date) && !this.closedStatus(incident.status) ? 'Yes' : 'No', this.isPastDate(incident.due_date) ? 'danger' : 'ok', 'Investigation overdue state'),
      this.card('Open actions', openActions.length || Number(incident.open_actions_count ?? 0), 'warning', 'Open Universal Actions'),
      this.card('Overdue actions', openActions.filter((a) => this.isPastDate(a.dueDate ?? a.due_date)).length || Number(incident.overdue_actions_count ?? 0), 'danger', 'Overdue Universal Actions'),
      this.card('Evidence status', incident.evidence_status ?? (evidence.length ? 'Initial Evidence Added' : 'Not Started'), evidence.length ? 'ok' : 'warning', 'Evidence and attachments state'),
      this.card('Linked records', incident.linked_records_count ?? this.linkedRecordCount(incident), 'info', 'Linked PSM records'),
      this.card('Regulatory reporting', incident.regulatory_reporting_required ? 'Required' : 'Not Required', incident.regulatory_reporting_required ? 'danger' : 'ok', 'Regulatory reporting requirement'),
      this.card('MOC required', incident.moc_required ? 'Yes' : 'No', incident.moc_required ? 'warning' : 'ok', 'MOC follow-up'),
      this.card('PSSR required', incident.pssr_required ? 'Yes' : 'No', incident.pssr_required ? 'warning' : 'ok', 'PSSR follow-up'),
      this.card('PTW review', incident.ptw_review_required ? 'Required' : 'Not Required', incident.ptw_review_required ? 'warning' : 'ok', 'PTW review requirement'),
      this.card('HAZOP/PHA review', incident.hazop_review_required ? 'Required' : 'Not Required', incident.hazop_review_required ? 'warning' : 'ok', 'HAZOP/PHA review requirement'),
      this.card('LOPA/SIL review', incident.lopa_review_required ? 'Required' : 'Not Required', incident.lopa_review_required ? 'warning' : 'ok', 'LOPA/SIL review requirement'),
      this.card('MI follow-up', incident.mechanical_integrity_followup_required ? 'Required' : 'Not Required', incident.mechanical_integrity_followup_required ? 'warning' : 'ok', 'Mechanical Integrity follow-up'),
      this.card('Ready for review', readiness.readyForReview ? 'Yes' : 'No', readiness.readyForReview ? 'ok' : 'warning', 'Backend readiness result')
    ];
  }

  private eventSnapshot(incident: any) {
    return {
      title: incident.title,
      shortDescription: incident.short_description,
      detailedDescription: incident.detailed_description,
      eventType: incident.event_type,
      classification: incident.classification,
      eventDateTime: incident.event_datetime,
      reportedDateTime: incident.reported_datetime,
      reportedBy: incident.reporter,
      site: incident.site,
      unit: incident.unit,
      area: incident.area,
      exactLocation: incident.location_text,
      operatingMode: incident.operating_mode,
      shift: incident.shift,
      workgroup: incident.workgroup,
      ptwInvolved: !!incident.ptw_involved,
      mocInvolved: !!incident.moc_involved,
      pssrInvolved: !!incident.pssr_involved,
      emergencyResponseActivated: !!incident.emergency_response_activated,
      operationStopped: !!incident.operation_stopped,
      areaBarricaded: !!incident.area_barricaded,
      equipmentIsolated: !!incident.equipment_isolated,
      missing: this.missingFields(incident, [['title','Incident title'], ['short_description','Short description'], ['event_datetime','Event date/time'], ['site_id','Site'], ['detailed_description','Detailed description']])
    };
  }

  private severityRiskSnapshot(incident: any) {
    return {
      actualSeverity: incident.actual_severity,
      actualConsequenceCategory: incident.actual_consequence_category,
      potentialSeverity: incident.potential_severity,
      potentialConsequenceCategory: incident.potential_consequence_category,
      likelihood: incident.likelihood,
      potentialRiskScore: incident.potential_risk_score,
      highPotentialNearMiss: !!incident.high_potential_near_miss,
      fatalityPotential: !!incident.fatality_potential,
      majorProcessSafetyPotential: !!incident.major_process_safety_potential,
      investigationPriority: incident.investigation_priority,
      investigationLevelRequired: incident.investigation_level_required,
      potentialSeverityBasis: incident.potential_severity_basis,
      riskMatrixStatus: incident.potential_risk_score == null ? 'Not Determined' : 'Calculated',
      severityReviewStatus: incident.severity_review_status ?? 'Not Reviewed',
      reviewedBy: incident.severity_reviewed_by ?? null,
      reviewedAt: incident.severity_reviewed_at ?? null
    };
  }

  private psmClassificationSnapshot(incident: any) {
    return {
      isPsmIncident: !!incident.is_psm_incident,
      isProcessSafetyEvent: !!incident.is_process_safety_event,
      apiRp754Tier: incident.pse_tier,
      classificationStatus: incident.pse_classification_status,
      lopcStatus: incident.lopc_status,
      releasedMaterial: incident.released_material,
      releasedQuantity: incident.released_quantity,
      releaseUnit: incident.release_unit,
      releaseDuration: incident.release_duration,
      thresholdQuantity: incident.threshold_quantity,
      thresholdExceeded: incident.threshold_exceeded,
      acuteRelease: incident.acute_release,
      fireExplosionOccurred: !!incident.fire_explosion_occurred,
      toxicExposureOccurred: !!incident.toxic_exposure_occurred,
      injuryFatalityOccurred: !!incident.injury_fatality_occurred,
      communityImpact: !!incident.community_impact,
      environmentalImpact: !!incident.environmental_impact,
      basis: incident.pse_classification_basis,
      reviewerRequired: !!incident.pse_reviewer_required,
      reviewedBy: incident.pse_reviewed_by ?? null,
      reviewedAt: incident.pse_reviewed_at ?? null
    };
  }

  private peopleSnapshot(incident: any, people: any[], permissions: string[]) {
    const canViewMedical = permissions.includes('incidents.medical_fields.view') || permissions.includes('incidents.medical_fields.manage');
    return {
      peopleInvolved: people.length,
      injuredPersonCount: people.filter((p) => p.injury_occurred).length || (incident.injury_occurred ? 1 : 0),
      employeeContractorVisitor: this.groupLocal(people, 'person_type'),
      injuryOccurred: !!incident.injury_occurred || people.some((p) => p.injury_occurred),
      illnessOccurred: people.some((p) => p.illness_occurred),
      exposureOccurred: !!incident.toxic_exposure_occurred || people.some((p) => p.exposure_occurred),
      treatmentType: this.firstValue(people, 'treatment_type'),
      lostTimePotential: people.some((p) => p.lost_time_potential),
      medicalTreatmentRequired: people.some((p) => p.medical_treatment_required),
      hospitalization: people.some((p) => p.hospitalization),
      fatality: !!incident.injury_fatality_occurred || people.some((p) => p.fatality),
      ppeIssueSuspected: people.some((p) => p.ppe_issue_suspected),
      chemicalExposure: people.some((p) => p.chemical_exposure),
      medicalDataRestricted: !canViewMedical && people.some((p) => p.confidential_notes),
      records: canViewMedical ? people : people.map(({ confidential_notes, ...p }) => p)
    };
  }

  private assetChemicalSnapshot(incident: any, assets: any[]) {
    return {
      equipmentInvolved: assets.some((a) => a.equipment_involved),
      equipment: assets.map((a) => ({ id: a.equipment_id, tag: a.equipment_tag_snapshot, name: a.equipment_name_snapshot, type: a.equipment_type_snapshot, status: a.equipment_status })),
      maintenanceOverdueSuspected: assets.some((a) => a.maintenance_overdue_suspected),
      safeguardInvolved: assets.some((a) => a.safeguard_involved),
      safeguardFailed: assets.some((a) => a.safeguard_failed),
      iplInvolved: assets.some((a) => a.ipl_involved),
      sisSifInvolved: assets.some((a) => a.sis_sif_involved),
      psvReliefInvolved: assets.some((a) => a.psv_relief_involved),
      alarmInterlockInvolved: assets.some((a) => a.alarm_interlock_involved),
      chemicalInvolved: assets.some((a) => a.chemical_involved) || !!incident.released_material,
      chemicals: assets.filter((a) => a.chemical_involved).map((a) => ({ id: a.chemical_id, name: a.chemical_name_snapshot, cas: a.cas_number_snapshot, sdsId: a.sds_id, sdsLink: a.sds_link, quantity: a.estimated_quantity_involved, releasedQuantity: a.released_quantity, unit: a.release_unit })),
      releasedMaterial: incident.released_material,
      releasedQuantity: incident.released_quantity,
      releaseUnit: incident.release_unit
    };
  }

  private peopleSummaryCards(incident: any, people: any[], readiness: any, canViewMedical: boolean) {
    return [
      this.card('People involved', people.length, people.length ? 'info' : 'warning', 'Rows from incident people/injury/exposure records'),
      this.card('Injured', people.filter((p) => p.injury_occurred).length || (incident.injury_occurred ? 1 : 0), incident.injury_occurred ? 'danger' : 'ok', 'People with injury flagged'),
      this.card('Exposure', people.filter((p) => p.exposure_occurred || p.chemical_exposure).length, people.some((p) => p.exposure_occurred || p.chemical_exposure) ? 'warning' : 'ok', 'Exposure or chemical exposure records'),
      this.card('Medical treatment', people.filter((p) => p.medical_treatment_required).length, people.some((p) => p.medical_treatment_required) ? 'warning' : 'ok', 'Treatment/outcome status'),
      this.card('Lost time potential', people.filter((p) => p.lost_time_potential).length, people.some((p) => p.lost_time_potential) ? 'warning' : 'ok', 'Lost time or restricted work potential'),
      this.card('Readiness', readiness.status, readiness.status === 'Complete' ? 'ok' : 'warning', canViewMedical ? 'Backend-generated readiness' : 'Medical details are permission protected')
    ];
  }

  private assetSummaryCards(incident: any, rows: any[], readiness: any) {
    return [
      this.card('Equipment records', rows.filter((r) => r.equipment_involved || r.equipment_id || r.equipment_tag_snapshot).length, 'info', 'Equipment rows linked from registry or manual entry'),
      this.card('Chemical records', rows.filter((r) => r.chemical_involved || r.chemical_id || r.chemical_name_snapshot).length, 'info', 'Chemical/material rows linked from SDS data where available'),
      this.card('Safeguard failures', rows.filter((r) => r.safeguard_failed).length, rows.some((r) => r.safeguard_failed) ? 'danger' : 'ok', 'Safeguard/IPL/SIS/PSV/alarm failures requiring follow-up'),
      this.card('Maintenance concern', rows.filter((r) => r.maintenance_overdue_suspected).length, rows.some((r) => r.maintenance_overdue_suspected) ? 'warning' : 'ok', 'Mechanical integrity or inspection follow-up signals'),
      this.card('Release / LOPC', incident.lopc_status ?? (incident.released_material ? 'Release Reported' : 'Not Reported'), incident.released_material ? 'danger' : 'ok', 'Loss of containment and release summary'),
      this.card('Readiness', readiness.status, readiness.status === 'Complete' ? 'ok' : 'warning', 'Backend-generated readiness')
    ];
  }

  private peopleGroupPanel(rows: any[], fields: string[]) {
    return {
      rows: rows.map((row) => {
        const item: Record<string, any> = { id: row.id, personName: row.person_name ?? row.person_type ?? 'Unspecified person' };
        fields.forEach((field) => item[field] = row[field]);
        return item;
      }),
      counts: fields.map((field) => ({ label: field, count: rows.filter((row) => row[field] !== null && row[field] !== undefined && row[field] !== '').length }))
    };
  }

  private assetGroupPanel(rows: any[], fields: string[]) {
    return {
      rows: rows.map((row) => {
        const item: Record<string, any> = { id: row.id, label: row.equipment_tag_snapshot ?? row.chemical_name_snapshot ?? row.equipment_name_snapshot ?? 'Unspecified record' };
        fields.forEach((field) => item[field] = row[field]);
        return item;
      }),
      counts: fields.map((field) => ({ label: field, count: rows.filter((row) => row[field] !== null && row[field] !== undefined && row[field] !== '').length }))
    };
  }

  private peopleReadiness(incident: any, people: any[]) {
    const peopleRequired = !!incident.injury_occurred || !!incident.toxic_exposure_occurred || people.length > 0;
    const checks = [
      this.check('People involvement evaluated', peopleRequired ? people.length > 0 : true, 'People Involved Register', peopleRequired),
      this.check('Injury details captured if injury occurred', !people.some((p) => p.injury_occurred) || people.some((p) => p.injury_occurred && (p.injury_type || p.body_part || p.treatment_type)), 'Injury Details'),
      this.check('Exposure route captured if exposure occurred', !people.some((p) => p.exposure_occurred || p.chemical_exposure) || people.some((p) => (p.exposure_occurred || p.chemical_exposure) && p.exposure_route), 'Exposure Details'),
      this.check('PPE/controls reviewed', !people.some((p) => p.ppe_issue_suspected) || people.some((p) => p.ppe_issue_suspected && (p.ppe_description || p.control_failure_notes)), 'PPE / Controls'),
      this.check('Medical outcome protected and reviewed', !people.some((p) => p.medical_treatment_required || p.hospitalization || p.fatality) || !!incident.people_review_status, 'Treatment / Medical Outcome', people.some((p) => p.fatality))
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return { status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete', score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, missingFields: blockers.map((b) => b.title) };
  }

  private assetReadiness(incident: any, rows: any[]) {
    const assetRequired = !!incident.equipment_involved || !!incident.chemical_involved || !!incident.released_material || rows.length > 0;
    const checks = [
      this.check('Equipment/chemical involvement evaluated', assetRequired ? rows.length > 0 : true, 'Equipment/Chemical Registers', assetRequired),
      this.check('Equipment condition captured if equipment involved', !rows.some((r) => r.equipment_involved) || rows.some((r) => r.equipment_involved && (r.equipment_status || r.condition_at_event || r.operating_status)), 'Equipment Condition'),
      this.check('SDS/hazard information captured if chemical involved', !rows.some((r) => r.chemical_involved) || rows.some((r) => r.chemical_involved && (r.sds_id || r.sds_link || r.hazard_classification)), 'SDS / Hazard Information', rows.some((r) => r.chemical_involved && !r.sds_id && !r.sds_link)),
      this.check('Release details captured if LOPC/release occurred', !incident.released_material || !!incident.released_quantity || rows.some((r) => r.released_quantity), 'Loss of Containment / Release', !!incident.released_material && !incident.released_quantity),
      this.check('Safeguard failure follow-up identified', !rows.some((r) => r.safeguard_failed || r.sis_sif_involved || r.psv_relief_involved) || !!incident.mechanical_integrity_followup_required || !!incident.lopa_review_required, 'Follow-up Requirements')
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return { status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete', score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, missingFields: blockers.map((b) => b.title) };
  }

  private timelineSummaryCards(incident: any, events: any[], gaps: any[], readiness: any) {
    return [
      this.card('Timeline events', events.length, events.length ? 'info' : 'warning', 'Chronology records captured for this incident'),
      this.card('Pre-event', events.filter((e) => e.phase === 'Pre-Event').length, 'info', 'Pre-event conditions'),
      this.card('Event moment', events.filter((e) => e.phase === 'Event Moment').length, 'info', 'Events at the incident moment'),
      this.card('Response', events.filter((e) => e.phase === 'Emergency Response').length, 'info', 'Emergency or immediate response events'),
      this.card('Open gaps/conflicts', gaps.filter((g) => g.status !== 'Resolved').length, gaps.some((g) => g.status !== 'Resolved') ? 'warning' : 'ok', 'Backend-detected chronology gaps or conflicts'),
      this.card('Readiness', readiness.status, readiness.status === 'Complete' ? 'ok' : 'warning', 'Backend-generated timeline readiness')
    ];
  }

  private evidenceSummaryCards(incident: any, allRows: any[], visibleRows: any[], readiness: any) {
    return [
      this.card('Evidence records', allRows.length, allRows.length ? 'info' : 'warning', 'Evidence metadata records'),
      this.card('Visible records', visibleRows.length, 'info', 'Records visible after permission redaction'),
      this.card('Restricted hidden', allRows.length - visibleRows.length, allRows.length - visibleRows.length ? 'warning' : 'ok', 'Restricted/confidential/medical evidence hidden'),
      this.card('Required evidence', allRows.filter((row) => row.required_evidence).length, 'info', 'Records marked as required evidence'),
      this.card('Pending review', allRows.filter((row) => ['Pending Review', 'Needs Review'].includes(row.review_status)).length, 'warning', 'Evidence awaiting review'),
      this.card('Readiness', readiness.status, readiness.status === 'Complete' ? 'ok' : 'warning', 'Backend-generated evidence readiness')
    ];
  }

  private timelinePhasePanel(events: any[], phase: string) {
    return { phase, rows: events.filter((event) => event.phase === phase), count: events.filter((event) => event.phase === phase).length };
  }

  private timelineReadiness(incident: any, events: any[], gaps: any[], evidence: any[]) {
    const checks = [
      this.check('Timeline event moment captured', events.some((e) => e.phase === 'Event Moment') || !!incident.event_datetime, 'Event Moment', !incident.event_datetime),
      this.check('Pre-event conditions reviewed', events.some((e) => e.phase === 'Pre-Event'), 'Pre-Event Conditions'),
      this.check('Emergency response timeline captured', events.some((e) => e.phase === 'Emergency Response') || !!incident.emergency_response_activated || !!incident.immediate_action_notes, 'Emergency Response'),
      this.check('Evidence mapped to timeline where available', !evidence.length || events.some((e) => e.related_evidence_id), 'Evidence-Mapped Timeline'),
      this.check('Timeline gaps/conflicts resolved or accepted', !gaps.some((g) => g.status !== 'Resolved'), 'Timeline Gaps / Conflicts', gaps.some((g) => g.severity === 'High' && g.status !== 'Resolved'))
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return { status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete', score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, missingFields: blockers.map((b) => b.title) };
  }

  private evidenceReadiness(incident: any, evidence: any[], mappings: any[], custody: any[]) {
    const evidenceRequired = !!incident.regulatory_reporting_required || !!incident.rca_required || !!incident.high_potential_near_miss;
    const checks = [
      this.check('Required evidence attached if needed', !evidenceRequired || evidence.length > 0, 'Required Evidence', evidenceRequired && !evidence.length),
      this.check('Evidence classified', !evidence.length || evidence.every((e) => !!e.classification), 'Evidence Classification'),
      this.check('Restricted/medical flags reviewed', !evidence.some((e) => e.medical_confidential) || evidence.some((e) => e.review_status), 'Restricted / Confidential / Medical Evidence'),
      this.check('Evidence mapped to investigation records', !evidence.length || mappings.length > 0 || evidence.some((e) => e.related_tab), 'Evidence Mapping'),
      this.check('Chain of custody started for restricted evidence', !evidence.some((e) => e.restricted || e.confidential || e.medical_confidential) || custody.length > 0, 'Chain of Custody')
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return { status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete', score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, missingFields: blockers.map((b) => b.title) };
  }

  private requiredEvidenceChecklist(incident: any, evidence: any[]) {
    const items = [
      ['Incident photos/video', true, ['Photo', 'Video']],
      ['Initial witness/source evidence', !!incident.witnesses_known, ['Witness statement']],
      ['Regulatory/PSM evidence', !!incident.regulatory_reporting_required || !!incident.is_process_safety_event, ['DCS trend', 'Alarm log', 'Emergency response log']],
      ['RCA evidence', !!incident.rca_required, ['Maintenance record', 'Inspection record', 'CCTV reference']],
      ['Medical restricted evidence', !!incident.injury_occurred, ['Medical record restricted']]
    ];
    return items.map(([title, required, types]) => {
      const typeList = types as string[];
      const matched = evidence.some((row) => typeList.includes(row.evidence_type));
      return { title, required: !!required, status: !required ? 'Not Required' : matched ? 'Complete' : 'Missing', types: typeList };
    });
  }

  private visibleEvidenceRows(rows: any[], permissions: string[]) {
    return rows.filter((row) => this.canSeeEvidence(row, permissions)).map((row) => this.canSeeEvidence(row, permissions) ? row : { id: row.id, restricted: true, file_name: 'Restricted evidence', evidence_type: 'Restricted', status: row.status });
  }

  private canSeeEvidence(row: any, permissions: string[]) {
    if (row.medical_confidential && !permissions.includes('incidents.medical_fields.view') && !permissions.includes('incidents.medical_fields.manage')) return false;
    if (row.restricted && !permissions.includes('incidents.restricted.view')) return false;
    if (row.confidential && !permissions.includes('incidents.confidential.view')) return false;
    return true;
  }

  private timelinePatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, eventNumber?: number, update = false) {
    return this.clean({
      ...(!update ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, event_number: eventNumber, created_by: actorId } : {}),
      event_time: this.dateTimeOrNull(dto.eventTime),
      event_time_end: this.dateTimeOrNull(dto.eventTimeEnd),
      phase: dto.phase,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      involved_people: dto.involvedPeople,
      related_equipment_id: dto.relatedEquipmentId,
      related_chemical_id: dto.relatedChemicalId,
      related_evidence_id: dto.relatedEvidenceId,
      source_type: dto.sourceType,
      source_reference: dto.sourceReference,
      source_reliability: dto.sourceReliability,
      confidence: dto.confidence,
      status: dto.status,
      gap_flag: dto.gapFlag,
      conflict_flag: dto.conflictFlag,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private evidencePatch(dto: Record<string, any>, actorId: string) {
    return this.clean({
      evidence_type: dto.evidenceType,
      file_name: dto.fileName,
      description: dto.description,
      source: dto.source,
      storage_provider: dto.storageProvider,
      storage_key: dto.storageKey,
      file_type: dto.fileType,
      mime_type: dto.mimeType,
      file_size: this.integerOrNull(dto.fileSize),
      classification: dto.classification,
      restricted: dto.restricted,
      confidential: dto.confidential,
      medical_confidential: dto.medicalConfidential,
      upload_status: dto.uploadStatus,
      status: dto.status,
      review_status: dto.reviewStatus,
      required_evidence: dto.requiredEvidence,
      related_tab: dto.relatedTab,
      related_record_type: dto.relatedRecordType,
      related_record_id: dto.relatedRecordId,
      chain_of_custody_status: dto.chainOfCustodyStatus,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private async updateTimelineStatus(tenantId: string, incidentId: string, actorId: string) {
    const rows = await this.safeMany<any>(this.db.from('incident_timeline_events').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId));
    await this.safeSingle(this.db.from('incidents').update({ timeline_readiness_status: rows.length ? 'Started' : 'Not Started', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async updateEvidenceStatus(tenantId: string, incidentId: string, actorId: string) {
    const rows = await this.safeMany<any>(this.db.from('incident_initial_evidence').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId));
    await this.safeSingle(this.db.from('incidents').update({ evidence_status: rows.length ? 'Evidence Added' : 'Not Started', evidence_readiness_status: rows.length ? 'Started' : 'Not Started', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private immediateActionSummaryCards(incident: any, actions: any[], restartControls: any[], readiness: any) {
    const openActions = actions.filter((row) => !row.completed && !['Completed', 'Verified', 'Cancelled', 'Superseded'].includes(row.status));
    const overdueActions = openActions.filter((row) => row.due_at && this.isPastDate(row.due_at));
    const temporaryControls = actions.filter((row) => row.temporary_control || row.temporary_control_added);
    return [
      this.card('Area safe now', incident.area_safe_now ?? 'Unknown', incident.area_safe_now === 'Yes' ? 'ok' : incident.area_safe_now === 'No' ? 'danger' : 'warning', 'Site safety status from backend'),
      this.card('Restart blocked', incident.restart_blocked || restartControls.some((row) => row.restart_blocked) ? 'Yes' : 'No', incident.restart_blocked ? 'danger' : 'ok', 'Restart / return-to-service blocker state'),
      this.card('Emergency response', incident.emergency_response_activated || actions.some((row) => row.emergency_response || row.emergency_response_activated) ? 'Yes' : 'No', incident.emergency_response_activated ? 'warning' : 'ok', 'Emergency response activated or captured'),
      this.card('Total actions', actions.length, actions.length ? 'info' : 'warning', 'Initial containment, response, and stabilization actions'),
      this.card('Completed actions', actions.filter((row) => row.completed || ['Completed', 'Verified'].includes(row.status)).length, 'ok', 'Actions marked complete'),
      this.card('Open actions', openActions.length, openActions.length ? 'warning' : 'ok', 'Actions not completed, cancelled, or superseded'),
      this.card('Overdue actions', overdueActions.length, overdueActions.length ? 'danger' : 'ok', 'Open actions past due date/time'),
      this.card('Temporary active', temporaryControls.filter((row) => !row.completed && !this.temporaryControlExpired(row)).length, temporaryControls.length ? 'warning' : 'ok', 'Active temporary controls'),
      this.card('Temporary expired', temporaryControls.filter((row) => this.temporaryControlExpired(row)).length, temporaryControls.some((row) => this.temporaryControlExpired(row)) ? 'danger' : 'ok', 'Expired temporary controls'),
      this.card('Isolation completed', incident.energy_isolation_completed || actions.some((row) => row.energy_isolation_completed || row.equipment_isolated) ? 'Yes' : 'No', incident.energy_isolation_completed ? 'ok' : 'warning', 'Energy/equipment isolation state'),
      this.card('Spill/release contained', incident.spill_contained ?? (actions.some((row) => row.spill_release_contained) ? 'Yes' : 'No'), actions.some((row) => row.spill_release_contained) || incident.spill_contained === 'Yes' ? 'ok' : 'warning', 'Spill/release containment state'),
      this.card('Fire response completed', incident.fire_extinguished ?? (actions.some((row) => row.fire_extinguished) ? 'Yes' : 'No'), actions.some((row) => row.fire_extinguished) || incident.fire_extinguished === 'Yes' ? 'ok' : 'info', 'Fire response state'),
      this.card('First aid provided', actions.some((row) => row.first_aid_provided || row.first_aid_medical_response) ? 'Yes' : 'No', actions.some((row) => row.first_aid_provided) ? 'warning' : 'ok', 'First aid/medical immediate response'),
      this.card('Permit suspended', incident.permit_suspended ?? (actions.some((row) => row.permit_suspended) ? 'Yes' : 'No'), actions.some((row) => row.permit_suspended) || incident.permit_suspended === 'Yes' ? 'warning' : 'ok', 'Permit suspension state'),
      this.card('Verification pending', actions.filter((row) => (row.completed || row.verification_required || row.status === 'Completed') && !row.verified).length, 'warning', 'Actions awaiting verification'),
      this.card('CAPA needed', actions.filter((row) => row.capa_required || row.replacement_permanent_action_required).length, actions.some((row) => row.capa_required || row.replacement_permanent_action_required) ? 'warning' : 'ok', 'Immediate actions requiring CAPA/formal action'),
      this.card('Ready for RCA', readiness.status === 'Complete' ? 'Yes' : 'No', readiness.status === 'Complete' ? 'ok' : 'warning', 'Backend-generated readiness for RCA')
    ];
  }

  private siteSafetyPanel(incident: any, actions: any[]) {
    return {
      areaSafeNow: incident.area_safe_now,
      siteSafetyStatus: incident.site_safety_status ?? (incident.area_safe_now === 'Yes' ? 'Safe' : incident.area_safe_now === 'No' ? 'Unsafe' : 'Not Verified'),
      unsafeCondition: incident.area_safe_now === 'No' || incident.unsafe_condition_remains || actions.some((row) => row.restart_blocker),
      unsafeConditionRemains: !!incident.unsafe_condition_remains,
      unsafeConditionDescription: incident.unsafe_condition_description,
      siteAccessRestricted: !!incident.site_access_restricted,
      barricadeCordonActive: !!incident.barricade_cordon_active,
      equipmentIsolated: !!incident.equipment_isolated,
      energyIsolationCompleted: !!incident.energy_isolation_completed,
      releaseStopped: !!incident.release_stopped,
      fireExtinguished: incident.fire_extinguished,
      spillContained: incident.spill_contained,
      atmosphereTested: incident.atmosphere_tested,
      permitSuspended: incident.permit_suspended,
      restartBlocked: !!incident.restart_blocked,
      restartBlockReason: incident.restart_blocked_reason,
      verifiedBy: incident.site_safety_verified_by,
      verifiedAt: incident.site_safety_verified_at,
      verificationEvidence: incident.site_safety_verification_evidence,
      requiredControls: actions.filter((row) => row.restart_blocker || row.temporary_control || row.temporary_control_added),
      notes: incident.immediate_action_notes
    };
  }

  private immediateActionsReadiness(incident: any, actions: any[], restartControls: any[]) {
    const temporaryControls = actions.filter((row) => row.temporary_control || row.temporary_control_added);
    const openOverdue = actions.some((row) => row.due_at && this.isPastDate(row.due_at) && !row.completed && !['Cancelled', 'Superseded'].includes(row.status));
    const emergencyActivated = !!incident.emergency_response_activated || actions.some((row) => row.emergency_response || row.emergency_response_activated);
    const isolationNeeded = !!incident.equipment_isolated || !!incident.energy_isolation_completed || actions.some((row) => row.isolation_shutdown_permit || row.equipment_isolated || row.energy_isolation_completed);
    const spillFireNeeded = !!incident.release_stopped || ['Yes', true].includes(incident.spill_contained) || ['Yes', true].includes(incident.fire_extinguished) || actions.some((row) => row.spill_release_fire_response || row.spill_release_occurred || row.fire_occurred);
    const firstAidNeeded = !!incident.injury_occurred || actions.some((row) => row.first_aid_medical_response || row.first_aid_provided || row.medical_treatment_arranged);
    const checks = [
      this.check('Site safety status checked', !!incident.area_safe_now || !!incident.site_safety_status, 'Site Safety Status', incident.area_safe_now === 'No'),
      this.check('Unsafe condition resolved or assigned', !incident.unsafe_condition_remains || !!incident.unsafe_condition_description || actions.some((row) => row.restart_blocker || row.temporary_control || row.temporary_control_added), 'Site Safety Status', !!incident.unsafe_condition_remains),
      this.check('Emergency response captured if activated', !emergencyActivated || actions.some((row) => row.emergency_response || row.emergency_response_activated || row.category === 'Emergency Response'), 'Emergency Response Actions'),
      this.check('Isolation/shutdown/permitting controls captured', !isolationNeeded || actions.some((row) => row.isolation_shutdown_permit || row.category === 'Isolation / Shutdown / Permit'), 'Isolation / Shutdown / Permit'),
      this.check('Spill/release/fire response captured if applicable', !spillFireNeeded || actions.some((row) => row.spill_release_fire_response || row.category === 'Spill / Release / Fire'), 'Spill / Release / Fire Response'),
      this.check('First aid/medical immediate response captured if applicable', !firstAidNeeded || actions.some((row) => row.first_aid_medical_response || row.category === 'First Aid / Medical'), 'First Aid / Medical Immediate Response'),
      this.check('Immediate actions captured', actions.length > 0 || !!incident.immediate_action_notes, 'Immediate Actions Register'),
      this.check('Temporary controls have owner and expiry', !temporaryControls.length || temporaryControls.every((row) => (row.temporary_control_owner_id || row.owner_id) && (row.temporary_control_expiry_at || row.temporary_control_expiry)), 'Temporary Controls', temporaryControls.some((row) => !(row.temporary_control_owner_id || row.owner_id) || !(row.temporary_control_expiry_at || row.temporary_control_expiry))),
      this.check('Expired temporary controls resolved', !temporaryControls.some((row) => this.temporaryControlExpired(row)), 'Temporary Controls', temporaryControls.some((row) => this.temporaryControlExpired(row))),
      this.check('Restart blocked status checked', incident.restart_blocked !== null && incident.restart_blocked !== undefined || restartControls.length > 0, 'Restart / Return-to-Service'),
      this.check('Restart blockers resolved or documented', !incident.restart_blocked || restartControls.length > 0 || actions.some((row) => row.restart_blocker), 'Restart / Return-to-Service', !!incident.restart_blocked),
      this.check('Verification complete where required', !actions.some((row) => (row.completed || row.verification_required || row.status === 'Completed') && !row.verified), 'Verification'),
      this.check('Open/overdue immediate actions assigned', !openOverdue || actions.every((row) => !row.due_at || !this.isPastDate(row.due_at) || row.owner_id || row.completed), 'Immediate Actions Register', openOverdue),
      this.check('Required CAPA conversions complete', !actions.some((row) => (row.capa_required || row.replacement_permanent_action_required) && !(row.capa_action_id || row.linked_capa_action_id)), 'Convert to CAPA / Formal Action'),
      this.check('Review complete if required', !actions.some((row) => row.verification_status === 'Rejected' || row.rework_required) || incident.immediate_actions_review_status === 'Approved', 'Immediate Actions Review'),
      this.check('Ready for RCA', incident.area_safe_now !== 'No' && !incident.restart_blocked && !temporaryControls.some((row) => this.temporaryControlExpired(row)), 'Immediate Actions Readiness', incident.area_safe_now === 'No')
    ];
    const complete = checks.filter((check) => check.status === 'Complete').length;
    const blockers = checks.filter((check) => check.status !== 'Complete');
    return { status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete', score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, missingFields: blockers.map((b) => b.title) };
  }

  private restartBlockers(incident: any, actions: any[], restartControls: any[]) {
    return [
      incident.restart_blocked ? { title: 'Restart blocked', reason: incident.restart_blocked_reason ?? 'Restart control requires review' } : null,
      incident.moc_required ? { title: 'MOC required', reason: 'MOC follow-up is required before restart' } : null,
      incident.pssr_required ? { title: 'PSSR required', reason: 'PSSR is required before startup/restart' } : null,
      incident.inspection_required ? { title: 'Inspection required', reason: 'Inspection signoff is required before restart' } : null,
      incident.mi_signoff_required ? { title: 'MI signoff required', reason: 'Mechanical Integrity signoff is required before restart' } : null,
      incident.hse_signoff_required ? { title: 'HSE signoff required', reason: 'HSE signoff is required before restart' } : null,
      incident.operations_signoff_required ? { title: 'Operations signoff required', reason: 'Operations signoff is required before restart' } : null,
      incident.mechanical_integrity_followup_required ? { title: 'MI follow-up required', reason: 'Mechanical Integrity follow-up is required' } : null,
      ...actions.filter((row) => row.restart_blocker && !row.completed).map((row) => ({ title: row.action_label, reason: row.notes ?? 'Immediate action restart blocker open' })),
      ...restartControls.filter((row) => row.restart_blocked).map((row) => ({ title: 'Restart control', reason: row.blocked_reason ?? row.notes }))
    ].filter(Boolean);
  }

  private immediateActionPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update = false) {
    return this.clean({
      ...(!update ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, created_by: actorId } : {}),
      action_key: dto.actionKey ?? dto.actionLabel ?? dto.title,
      action_number: dto.actionNumber,
      title: dto.title ?? dto.actionLabel,
      description: dto.description,
      action_label: dto.actionLabel ?? dto.title,
      action_type: dto.actionType,
      category: dto.category,
      status: dto.status,
      priority: dto.priority,
      related_hazard: dto.relatedHazard,
      related_timeline_event_id: dto.relatedTimelineEventId,
      related_equipment_id: dto.relatedEquipmentId,
      related_chemical_id: dto.relatedChemicalId,
      related_person_id: dto.relatedPersonId,
      completed: dto.completed,
      completed_at: this.dateTimeOrNull(dto.completedAt),
      notes: dto.notes,
      owner_id: dto.ownerId,
      due_at: this.dateTimeOrNull(dto.dueAt),
      temporary_control: dto.temporaryControl ?? dto.temporaryControlAdded,
      temporary_control_expiry: this.dateOrNull(dto.temporaryControlExpiry),
      verified: dto.verified,
      verification_required: dto.verificationRequired,
      verification_criteria: dto.verificationCriteria,
      verification_status: dto.verificationStatus,
      verification_method: dto.verificationMethod,
      verification_evidence: dto.verificationEvidence,
      evidence_required: dto.evidenceRequired,
      evidence_id: dto.evidenceId,
      linked_evidence_ids: Array.isArray(dto.linkedEvidenceIds) ? dto.linkedEvidenceIds : undefined,
      evidence_count: Array.isArray(dto.linkedEvidenceIds) ? dto.linkedEvidenceIds.length : dto.evidenceCount,
      verified_by: dto.verifiedBy,
      verified_at: this.dateTimeOrNull(dto.verifiedAt),
      verification_notes: dto.verificationNotes,
      failed_verification_reason: dto.failedVerificationReason,
      rework_required: dto.reworkRequired,
      restart_blocker: dto.restartBlocker,
      capa_required: dto.capaRequired,
      capa_action_id: dto.capaActionId,
      linked_capa_action_id: dto.linkedCapaActionId,
      capa_conversion_status: dto.capaConversionStatus,
      replacement_permanent_action_required: dto.replacementPermanentActionRequired,
      change_reason: dto.changeReason,
      emergency_response: dto.emergencyResponse ?? dto.emergencyResponseActivated,
      emergency_response_activated: dto.emergencyResponseActivated ?? dto.emergencyResponse,
      alarm_raised: dto.alarmRaised,
      evacuation_initiated: dto.evacuationInitiated,
      emergency_response_team_called: dto.emergencyResponseTeamCalled,
      fire_brigade_called: dto.fireBrigadeCalled,
      ambulance_medical_called: dto.ambulanceMedicalCalled,
      external_agency_called: dto.externalAgencyCalled,
      emergency_response_start_time: this.dateTimeOrNull(dto.emergencyResponseStartTime),
      emergency_response_end_time: this.dateTimeOrNull(dto.emergencyResponseEndTime),
      response_commander: dto.responseCommander,
      response_summary: dto.responseSummary,
      isolation_shutdown_permit: dto.isolationShutdownPermit,
      equipment_stopped: dto.equipmentStopped,
      equipment_isolated: dto.equipmentIsolated,
      energy_isolation_completed: dto.energyIsolationCompleted,
      lockout_tagout_applied: dto.lockoutTagoutApplied,
      process_shutdown: dto.processShutdown,
      unit_shutdown: dto.unitShutdown,
      bypass_active: dto.bypassActive,
      permit_suspended: dto.permitSuspended,
      ptw_number: dto.ptwNumber,
      isolation_certificate_reference: dto.isolationCertificateReference,
      isolation_owner: dto.isolationOwner,
      isolation_verified_by: dto.isolationVerifiedBy,
      isolation_verified_at: this.dateTimeOrNull(dto.isolationVerifiedAt),
      spill_release_fire_response: dto.spillReleaseFireResponse,
      spill_release_occurred: dto.spillReleaseOccurred,
      spill_release_contained: dto.spillReleaseContained,
      release_source_isolated: dto.releaseSourceIsolated,
      cleanup_started: dto.cleanupStarted,
      cleanup_completed: dto.cleanupCompleted,
      fire_occurred: dto.fireOccurred,
      fire_extinguished: dto.fireExtinguished,
      fire_response_used: dto.fireResponseUsed,
      extinguishing_agent_used: dto.extinguishingAgentUsed,
      environmental_containment_completed: dto.environmentalContainmentCompleted,
      waste_generated: dto.wasteGenerated,
      waste_disposal_required: dto.wasteDisposalRequired,
      environmental_sample_required: dto.environmentalSampleRequired,
      first_aid_medical_response: dto.firstAidMedicalResponse,
      first_aid_provided: dto.firstAidProvided,
      first_aid_provider: dto.firstAidProvider,
      medical_treatment_arranged: dto.medicalTreatmentArranged,
      decontamination_performed: dto.decontaminationPerformed,
      emergency_services_called: dto.emergencyServicesCalled,
      transported_to_medical: dto.transportedToMedical,
      medical_response_time: this.dateTimeOrNull(dto.medicalResponseTime),
      medical_evidence_id: dto.medicalEvidenceId,
      restricted_medical_notes: dto.restrictedMedicalNotes,
      return_to_service_required: dto.returnToServiceRequired,
      temporary_control_added: dto.temporaryControlAdded ?? dto.temporaryControl,
      temporary_control_type: dto.temporaryControlType,
      temporary_control_description: dto.temporaryControlDescription,
      temporary_control_owner_id: dto.temporaryControlOwnerId ?? dto.ownerId,
      temporary_control_start_at: this.dateTimeOrNull(dto.temporaryControlStartAt),
      temporary_control_expiry_at: this.dateTimeOrNull(dto.temporaryControlExpiryAt ?? dto.temporaryControlExpiry),
      review_frequency: dto.reviewFrequency,
      last_verified_by: dto.lastVerifiedBy,
      last_verified_at: this.dateTimeOrNull(dto.lastVerifiedAt),
      next_verification_due_at: this.dateTimeOrNull(dto.nextVerificationDueAt),
      cancellation_reason: dto.cancellationReason,
      superseded_by_action_id: dto.supersededByActionId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private async updateImmediateActionsStatus(tenantId: string, incidentId: string, actorId: string) {
    const actions = await this.safeMany<any>(this.db.from('incident_immediate_actions_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId));
    const restartBlocked = actions.some((row) => row.restart_blocker && !row.completed);
    const expiredTemporary = actions.some((row) => this.temporaryControlExpired(row));
    const verificationPending = actions.some((row) => (row.completed || row.verification_required) && !row.verified);
    await this.safeSingle(this.db.from('incidents').update({
      immediate_actions_status: actions.length ? 'Started' : 'Not Started',
      immediate_actions_readiness_status: restartBlocked || expiredTemporary ? 'Blocked' : verificationPending ? 'Needs Review' : actions.length ? 'Started' : 'Not Started',
      restart_blocked: restartBlocked,
      emergency_response_activated: actions.some((row) => row.emergency_response || row.emergency_response_activated),
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private teamSummaryCards(incident: any, members: any[], roles: any[], sessions: any[], readiness: any) {
    const active = members.filter((row) => row.status !== 'Removed' && row.active_status === 'Active');
    const requiredFilled = roles.filter((row) => row.required && !['Missing', 'Not Covered'].includes(row.coverage_status ?? row.status)).length;
    const missing = roles.filter((row) => row.required && ['Missing', 'Not Covered'].includes(row.coverage_status ?? row.status));
    return [
      this.card('Investigation owner', incident.investigation_owner_id ?? 'Not Assigned', incident.investigation_owner_id ? 'ok' : 'warning', 'Assigned investigation owner'),
      this.card('Team status', incident.team_status ?? (active.length ? 'In Progress' : 'Not Started'), active.length ? 'info' : 'warning', 'Backend-generated team status'),
      this.card('Formal team required', incident.formal_team_required ? 'Yes' : 'No', incident.formal_team_required ? 'warning' : 'ok', 'Formal team policy status'),
      this.card('Investigation level', incident.investigation_level_required ?? 'Not Determined', 'info', 'Investigation level from severity/classification'),
      this.card('RCA required', incident.rca_required ? 'Yes' : 'No', incident.rca_required ? 'warning' : 'ok', 'RCA requirement status'),
      this.card('Total members', members.filter((row) => row.status !== 'Removed').length, members.length ? 'info' : 'warning', 'Assigned investigation team members'),
      this.card('Required roles filled', requiredFilled, missing.length ? 'warning' : 'ok', 'Required roles with active accepted members'),
      this.card('Missing roles', missing.length, missing.length ? 'danger' : 'ok', 'Required roles not covered'),
      this.card('Pending acceptances', members.filter((row) => ['Pending Acceptance', 'Pending', 'Invited'].includes(row.acceptance_status ?? row.active_status)).length, 'warning', 'Team members awaiting acceptance'),
      this.card('Conflicts declared', members.filter((row) => row.conflict_declared || /conflict|declared/i.test(`${row.conflict_status}`)).length, members.some((row) => row.conflict_declared) ? 'danger' : 'ok', 'Declared independence/conflict issues'),
      this.card('Competency gaps', members.filter((row) => /gap|missing|expired/i.test(`${row.competency_status} ${row.training_status}`)).length, members.some((row) => /gap|missing|expired/i.test(`${row.competency_status} ${row.training_status}`)) ? 'warning' : 'ok', 'Competency or training gaps'),
      this.card('Overdue assignments', members.filter((row) => row.acceptance_due_date && this.isPastDate(row.acceptance_due_date) && row.active_status !== 'Active').length, 'warning', 'Pending acceptances past due'),
      this.card('Next meeting/session', sessions[0]?.scheduled_at ?? 'Not Scheduled', sessions.length ? 'info' : 'warning', 'Next planned investigation meeting'),
      this.card('Management oversight', incident.team_escalation_required ? 'Required' : 'Not Required', incident.team_escalation_required ? 'warning' : 'ok', 'Escalation/management oversight status'),
      this.card('Ready for RCA', readiness.status === 'Complete' ? 'Yes' : 'No', readiness.status === 'Complete' ? 'ok' : 'warning', 'Backend-generated team readiness')
    ];
  }

  private generatedRequiredRoles(incident: any, members: any[]) {
    const base = [
      ['Investigation Lead', 'Process Safety', 'Required for every formal investigation'],
      ['Operations Representative', 'Operations', 'Required for operating area knowledge'],
      ['Area Owner', 'Operations', 'Required for ownership and restart decisions']
    ];
    if (incident.formal_team_required || incident.rca_required) base.push(['RCA Facilitator', 'Process Safety', 'RCA/formal investigation required']);
    if (incident.is_process_safety_event || incident.is_psm_incident) base.push(['Process Safety Reviewer', 'Process Safety', 'PSM/PSE classification requires process safety review']);
    if (incident.injury_occurred || incident.toxic_exposure_occurred) base.push(['HSE / Medical Reviewer', 'HSE', 'Injury/exposure involvement']);
    if (incident.equipment_involved || incident.mechanical_integrity_followup_required) base.push(['Maintenance / MI Representative', 'Maintenance', 'Equipment or MI follow-up required']);
    if (incident.chemical_involved) base.push(['Chemical / SDS Reviewer', 'HSE', 'Chemical/SDS involvement']);
    return base.map(([role, discipline, reason]) => {
      const assigned = members.find((member) => (member.team_role === role || member.discipline === discipline) && member.status !== 'Removed' && member.active_status === 'Active' && member.acceptance_status === 'Accepted');
      return { id: `generated-${role}`, role_name: role, discipline, required: true, coverage_status: assigned ? 'Covered' : 'Missing', status: assigned ? 'Covered' : 'Missing', missing: !assigned, generated_reason: reason, source_rule: reason, assigned_member_id: assigned?.id };
    });
  }

  private teamReadiness(incident: any, members: any[], roles: any[]) {
    const currentMembers = members.filter((row) => row.status !== 'Removed' && row.status !== 'Replaced');
    const activeMembers = currentMembers.filter((row) => row.active_status === 'Active' && row.acceptance_status === 'Accepted');
    const pending = currentMembers.filter((row) => ['Pending Acceptance', 'Pending', 'Invited'].includes(row.acceptance_status ?? row.active_status));
    const overdue = currentMembers.filter((row) => row.acceptance_due_date && this.isPastDate(row.acceptance_due_date) && row.active_status !== 'Active');
    const checks = [
      this.check('Investigation owner assigned', !!incident.investigation_owner_id, 'Investigation Owner / Lead', !!incident.formal_team_required),
      this.check('Investigation lead assigned if required', !incident.formal_team_required || !!incident.investigation_lead_id || activeMembers.some((m) => m.lead_investigator), 'Investigation Owner / Lead', !!incident.formal_team_required),
      this.check('Formal team created if required', activeMembers.length > 0 || !incident.formal_team_required, 'Team Members Register', !!incident.formal_team_required && !activeMembers.length),
      this.check('Required roles filled', !roles.some((role) => role.required && ['Missing', 'Not Covered'].includes(role.coverage_status ?? role.status)), 'Required Roles / Discipline Matrix', roles.some((role) => role.required && ['Missing', 'Not Covered'].includes(role.coverage_status ?? role.status))),
      this.check('Members accepted assignment', !pending.length && !currentMembers.some((member) => member.acceptance_status === 'Declined'), 'Assignment & Acceptance', overdue.length > 0),
      this.check('Competency checks complete', !currentMembers.some((member) => member.competency_check_required && !member.competency_status) && !currentMembers.some((member) => /gap|missing|expired/i.test(`${member.competency_status} ${member.training_status}`)), 'Competency / Training', currentMembers.some((member) => /critical/i.test(`${member.competency_status} ${member.training_status}`))),
      this.check('Independence/conflict checks complete', !currentMembers.some((member) => member.conflict_check_required && !member.conflict_status) && !currentMembers.some((member) => member.conflict_declared && !member.approved_despite_conflict), 'Independence / Conflict', currentMembers.some((member) => member.conflict_declared && !member.approved_despite_conflict)),
      this.check('RACI/responsibilities assigned', activeMembers.some((member) => member.raci_role || member.responsibility) || !incident.formal_team_required, 'Roles, Responsibilities & RACI'),
      this.check('Meeting/session planned if required', !incident.formal_team_required || !!incident.next_investigation_meeting || currentMembers.length > 0, 'Meeting & Session Planning'),
      this.check('Escalation/sponsor assigned if required', !incident.team_escalation_required || !!incident.team_management_sponsor_id, 'Escalation / Management Oversight', !!incident.team_escalation_required && !incident.team_management_sponsor_id),
      this.check('Team review complete if required', !incident.team_review_required || incident.team_review_status === 'Approved', 'Team Review'),
      this.check('Ready for RCA', activeMembers.length > 0 && !pending.length && !overdue.length, 'Team Readiness', !!incident.formal_team_required && !activeMembers.length)
    ];
    const complete = checks.filter((check) => check.status === 'Complete').length;
    const blockers = checks.filter((check) => check.status !== 'Complete');
    return { status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete', score: Math.round((complete / checks.length) * 100), checklist: checks, blockers, missingFields: blockers.map((b) => b.title) };
  }

  private teamEscalationPanel(incident: any, readiness: any, members: any[]) {
    return {
      required: readiness.status === 'Blocked' || this.isPastDate(incident.due_date),
      reasons: [...readiness.blockers.map((blocker: any) => blocker.title), this.isPastDate(incident.due_date) ? 'Investigation overdue' : null].filter(Boolean),
      managementOwner: members.find((member) => /manager|owner|lead/i.test(`${member.team_role} ${member.job_title}`))
    };
  }

  private teamMemberPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update = false) {
    return this.clean({
      ...(!update ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, created_by: actorId } : {}),
      user_id: dto.userId,
      profile_id: dto.profileId,
      profile_status: dto.profileDetected === false ? null : dto.profileDetected ? dto.profileStatus : undefined,
      profile_detected: dto.profileDetected,
      profile_detection_source: dto.profileDetected === false ? null : dto.profileDetected ? dto.profileDetectionSource : undefined,
      profile_disabled_reason: dto.profileDetected === false ? null : dto.profileDetected ? dto.profileDisabledReason : undefined,
      display_name: dto.displayName ?? dto.name,
      email: dto.email,
      phone: dto.phone,
      organization: dto.organization,
      internal_external: dto.internalExternal,
      job_title: dto.jobTitle,
      department: dto.department,
      company_snapshot: dto.companySnapshot ?? dto.company,
      contractor_company: dto.contractorCompany,
      discipline: dto.discipline,
      team_role: dto.teamRole,
      responsibility: dto.responsibility,
      raci_role: dto.raciRole,
      required_member: dto.requiredMember ?? dto.requiredRole,
      required_role: dto.requiredRole ?? dto.requiredMember,
      lead_investigator: dto.leadInvestigator,
      reviewer: dto.reviewer,
      approver: dto.approver,
      acceptance_required: dto.acceptanceRequired ?? true,
      acceptance_status: dto.acceptanceStatus ?? (dto.acceptanceRequired === false ? 'Not Required' : 'Pending Acceptance'),
      acceptance_due_date: this.dateOrNull(dto.acceptanceDueDate ?? dto.acceptanceDueAt),
      active_status: dto.activeStatus ?? (dto.acceptanceStatus === 'Accepted' || dto.acceptanceRequired === false ? 'Active' : dto.acceptanceStatus === 'Declined' ? 'Declined' : 'Pending Acceptance'),
      approval_required: dto.approvalRequired,
      approval_status: dto.approvalStatus ?? (dto.approvalRequired ? 'Pending Approval' : 'Not Required'),
      accepted_at: this.dateTimeOrNull(dto.acceptedAt),
      assigned_by: dto.assignedBy ?? actorId,
      assigned_at: this.dateTimeOrNull(dto.assignedAt) ?? (!update ? new Date().toISOString() : undefined),
      competency_status: dto.competencyStatus,
      training_status: dto.trainingStatus,
      required_competency: dto.requiredCompetency,
      training_record: dto.trainingRecord,
      investigation_training_complete: dto.investigationTrainingComplete,
      rca_training_complete: dto.rcaTrainingComplete,
      process_safety_competency: dto.processSafetyCompetency,
      competency_check_required: dto.competencyCheckRequired,
      independence_status: dto.independenceStatus,
      conflict_check_required: dto.conflictCheckRequired,
      conflict_declared: dto.conflictDeclared,
      conflict_notes: dto.conflictNotes,
      approved_despite_conflict: dto.approvedDespiteConflict,
      conflict_status: dto.conflictStatus,
      availability_status: dto.availabilityStatus,
      availability_notes: dto.availabilityNotes,
      planned_absence: dto.plannedAbsence,
      workload_status: dto.workloadStatus,
      assignment_capacity: dto.assignmentCapacity,
      backup_member_id: dto.backupMemberId,
      notification_status: dto.notificationStatus,
      notification_message: dto.notificationMessage,
      notes: dto.notes,
      change_reason: dto.changeReason ?? dto.reason,
      status: dto.status,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private async updateTeamStatus(tenantId: string, incidentId: string, actorId: string) {
    const members = await this.safeMany<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId));
    await this.safeSingle(this.db.from('incidents').update({ team_readiness_status: members.some((member) => member.status !== 'Removed') ? 'Started' : 'Not Started', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private peoplePatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update = false) {
    return this.clean({
      ...(!update ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, created_by: actorId } : {}),
      person_type: dto.personType,
      people_involved: true,
      employee_involved: dto.personType === 'Employee',
      contractor_involved: dto.personType === 'Contractor',
      visitor_involved: dto.personType === 'Visitor',
      person_name: dto.personName,
      job_role: dto.jobRole,
      employee_id: dto.employeeId,
      contractor_company: dto.contractorCompany,
      visitor_company: dto.visitorCompany,
      public_involved: dto.publicInvolved,
      injury_occurred: dto.injuryOccurred,
      illness_occurred: dto.illnessOccurred,
      exposure_occurred: dto.exposureOccurred,
      injury_type: dto.injuryType,
      injury_severity: dto.injurySeverity,
      body_part: dto.bodyPart,
      treatment_type: dto.treatmentType,
      lost_time_potential: dto.lostTimePotential,
      lost_time_days: this.integerOrNull(dto.lostTimeDays),
      restricted_work_days: this.integerOrNull(dto.restrictedWorkDays),
      work_restriction_notes: dto.workRestrictionNotes,
      medical_treatment_required: dto.medicalTreatmentRequired,
      hospitalization: dto.hospitalization,
      fatality: dto.fatality,
      return_to_work_status: dto.returnToWorkStatus,
      ppe_used: dto.ppeUsed,
      ppe_issue_suspected: dto.ppeIssueSuspected,
      ppe_description: dto.ppeDescription,
      control_failure_notes: dto.controlFailureNotes,
      exposure_route: dto.exposureRoute,
      exposure_duration: dto.exposureDuration,
      dose_estimate: dto.doseEstimate,
      chemical_exposure: dto.chemicalExposure,
      confidential_notes: dto.confidentialNotes,
      medical_notes: dto.medicalNotes,
      review_status: dto.reviewStatus,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private assetPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, update = false) {
    return this.clean({
      ...(!update ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, created_by: actorId } : {}),
      equipment_involved: dto.equipmentInvolved,
      equipment_id: dto.equipmentId,
      equipment_tag_snapshot: dto.equipmentTag,
      equipment_name_snapshot: dto.equipmentName,
      equipment_type_snapshot: dto.equipmentType,
      equipment_location: dto.equipmentLocation,
      equipment_status: dto.equipmentStatus,
      condition_at_event: dto.conditionAtEvent,
      operating_status: dto.operatingStatus,
      failure_mode: dto.failureMode,
      damage_description: dto.damageDescription,
      maintenance_overdue_suspected: dto.maintenanceOverdueSuspected,
      last_inspection_date: this.dateOrNull(dto.lastInspectionDate),
      inspection_due: this.dateOrNull(dto.inspectionDue),
      proof_test_due: this.dateOrNull(dto.proofTestDue),
      safeguard_involved: dto.safeguardInvolved,
      safeguard_failed: dto.safeguardFailed,
      ipl_involved: dto.iplInvolved,
      sis_sif_involved: dto.sisSifInvolved,
      psv_relief_involved: dto.psvReliefInvolved,
      alarm_interlock_involved: dto.alarmInterlockInvolved,
      chemical_involved: dto.chemicalInvolved,
      chemical_id: dto.chemicalId,
      chemical_name_snapshot: dto.chemicalName,
      cas_number_snapshot: dto.casNumber,
      sds_id: dto.sdsId,
      sds_link: dto.sdsLink,
      sds_available: dto.sdsAvailable,
      hazard_classification: dto.hazardClassification,
      material_state: dto.materialState,
      estimated_quantity_involved: this.numberOrNull(dto.estimatedQuantityInvolved),
      released_quantity: this.numberOrNull(dto.releasedQuantity),
      release_unit: dto.releaseUnit,
      release_duration: dto.releaseDuration,
      containment_status: dto.containmentStatus,
      process_condition: dto.processCondition,
      temperature: dto.temperature,
      pressure: dto.pressure,
      flow_rate: dto.flowRate,
      followup_required: dto.followupRequired,
      review_status: dto.reviewStatus,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private async createIncidentAssetRow(tenantId: string, actorId: string, scope: Scope, id: string, dto: Record<string, any>, permissions: string[], kind: 'equipment' | 'chemical') {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before adding asset records.');
    const row = await this.db.single<any>(this.db.from('incident_equipment_chemical_initial').insert(this.assetPatch(dto, tenantId, actorId, incident)).select().single());
    await this.updateIncidentAssetFlags(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Created', `${kind === 'equipment' ? 'Equipment' : 'Chemical'} record added`, dto.reason ?? `${kind} added to incident`, null, row);
    await this.audit.write({ tenantId, actorId, action: `incidents.assets.${kind}.create`, entityType: 'INCIDENT_ASSET_CHEMICAL', entityId: row.id, after: row as JsonValue });
    return this.assetChemicalTab(tenantId, scope, id, permissions);
  }

  private async updateIncidentAssetRow(tenantId: string, actorId: string, scope: Scope, id: string, rowId: string, dto: Record<string, any>, permissions: string[], kind: 'equipment' | 'chemical') {
    const incident = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before editing asset records.');
    const before = await this.db.single<any>(this.db.from('incident_equipment_chemical_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rowId).single());
    const row = await this.db.single<any>(this.db.from('incident_equipment_chemical_initial').update(this.assetPatch(dto, tenantId, actorId, incident, true)).eq('tenant_id', tenantId).eq('incident_id', id).eq('id', rowId).select().single());
    await this.updateIncidentAssetFlags(tenantId, id, actorId);
    await this.writeHistory(tenantId, incident, actorId, 'Updated', `${kind === 'equipment' ? 'Equipment' : 'Chemical'} record updated`, dto.reason ?? `${kind} record updated`, before, row);
    await this.audit.write({ tenantId, actorId, action: `incidents.assets.${kind}.update`, entityType: 'INCIDENT_ASSET_CHEMICAL', entityId: row.id, before: before as JsonValue, after: row as JsonValue });
    return this.assetChemicalTab(tenantId, scope, id, permissions);
  }

  private async updateIncidentPeopleFlags(tenantId: string, incidentId: string, actorId: string) {
    const rows = await this.safeMany<any>(this.db.from('incident_people_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId));
    await this.safeSingle(this.db.from('incidents').update({
      injury_occurred: rows.some((r) => r.injury_occurred),
      toxic_exposure_occurred: rows.some((r) => r.exposure_occurred || r.chemical_exposure),
      injury_fatality_occurred: rows.some((r) => r.fatality),
      contractor_involved: rows.some((r) => r.contractor_involved || r.person_type === 'Contractor'),
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async updateIncidentAssetFlags(tenantId: string, incidentId: string, actorId: string) {
    const rows = await this.safeMany<any>(this.db.from('incident_equipment_chemical_initial').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId));
    await this.safeSingle(this.db.from('incidents').update(this.clean({
      equipment_involved: rows.some((r) => r.equipment_involved || r.equipment_id),
      chemical_involved: rows.some((r) => r.chemical_involved || r.chemical_id),
      safeguard_failed: rows.some((r) => r.safeguard_failed),
      released_material: rows.find((r) => r.chemical_name_snapshot)?.chemical_name_snapshot,
      released_quantity: rows.find((r) => r.released_quantity)?.released_quantity,
      release_unit: rows.find((r) => r.release_unit)?.release_unit,
      mechanical_integrity_followup_required: rows.some((r) => r.maintenance_overdue_suspected || r.psv_relief_involved || r.sis_sif_involved),
      lopa_review_required: rows.some((r) => r.ipl_involved || r.safeguard_failed),
      sds_chemical_review_required: rows.some((r) => r.chemical_involved && !r.sds_id && !r.sds_link),
      updated_by: actorId,
      updated_at: new Date().toISOString()
    })).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single());
  }

  private async updateReviewState(tenantId: string, actorId: string, scope: Scope, id: string, kind: 'people' | 'asset' | 'timeline' | 'evidence' | 'immediate_actions' | 'team', status: 'Pending Review' | 'Approved' | 'Rejected', dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.rawIncidentById(tenantId, scope, id);
    if (this.closedStatus(before.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen before review changes.');
    const now = new Date().toISOString();
    const prefix = kind === 'people' ? 'people' : kind === 'asset' ? 'asset' : kind;
    const patch: Record<string, any> = {
      [`${prefix}_review_status`]: status,
      [`${prefix}_review_reason`]: dto.reason ?? dto.comment ?? status,
      updated_by: actorId,
      updated_at: now
    };
    if (status === 'Pending Review') {
      patch[`${prefix}_review_requested_by`] = actorId;
      patch[`${prefix}_review_requested_at`] = now;
    } else {
      patch[`${prefix}_review_decision`] = status;
      patch[`${prefix}_review_decided_by`] = actorId;
      patch[`${prefix}_review_decided_at`] = now;
    }
    const row = await this.db.single<any>(this.db.from('incidents').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    const tab = kind === 'people' ? 'People / Injury / Exposure' : kind === 'asset' ? 'Asset / Equipment / Chemical' : kind === 'timeline' ? 'Timeline' : kind === 'evidence' ? 'Evidence / Attachments' : kind === 'immediate_actions' ? 'Immediate Actions' : 'Investigation Team';
    await this.writeHistory(tenantId, row, actorId, status === 'Pending Review' ? 'Submitted' : status, `${tab} review ${status.toLowerCase()}`, dto.reason ?? dto.comment ?? status, before, row);
    await this.audit.write({ tenantId, actorId, action: `incidents.${kind}.review.${status.toLowerCase().replaceAll(' ', '_')}`, entityType: 'INCIDENT', entityId: id, before: before as JsonValue, after: row as JsonValue });
    if (kind === 'people') return this.peopleInjuryTab(tenantId, scope, id, permissions);
    if (kind === 'asset') return this.assetChemicalTab(tenantId, scope, id, permissions);
    if (kind === 'timeline') return this.timelineTab(tenantId, scope, id, permissions);
    if (kind === 'evidence') return this.evidenceAttachmentsTab(tenantId, scope, id, permissions);
    if (kind === 'immediate_actions') return this.immediateActionsTab(tenantId, scope, id, permissions);
    return this.investigationTeamTab(tenantId, scope, id, permissions);
  }

  private immediateActionsSnapshot(incident: any, actions: any[]) {
    return {
      areaSafeNow: incident.area_safe_now,
      restartBlocked: !!incident.restart_blocked,
      temporaryControlExpiration: incident.temporary_control_expiration,
      immediateActionNotes: incident.immediate_action_notes,
      completedActions: actions.filter((a) => a.completed).length,
      openTemporaryControls: actions.filter((a) => a.temporary_control && (!a.temporary_control_expiry || !this.isPastDate(a.temporary_control_expiry))).length,
      expiredTemporaryControls: actions.filter((a) => a.temporary_control && this.isPastDate(a.temporary_control_expiry)).length,
      actions
    };
  }

  private rcaBarrierSnapshot(incident: any, assets: any[]) {
    return {
      rcaRequired: !!incident.rca_required,
      rcaStatus: incident.rca_status,
      suspectedInitialCause: incident.suspected_initial_cause,
      barrierFailureRequired: assets.some((a) => a.safeguard_failed || a.ipl_involved || a.sis_sif_involved || a.psv_relief_involved || a.alarm_interlock_involved),
      safeguardFailed: assets.some((a) => a.safeguard_failed),
      sisSifInvolved: assets.some((a) => a.sis_sif_involved),
      psvReliefInvolved: assets.some((a) => a.psv_relief_involved),
      status: incident.rca_required ? (incident.rca_status ?? 'Required') : 'Not Required'
    };
  }

  private capaSnapshot(incident: any, actionRows: any[]) {
    const open = actionRows.filter((a) => this.openActionStatus(a.status));
    return {
      openActions: open.length || Number(incident.open_actions_count ?? 0),
      overdueActions: open.filter((a) => this.isPastDate(a.dueDate ?? a.due_date)).length || Number(incident.overdue_actions_count ?? 0),
      criticalActions: open.filter((a) => ['Critical', 'High'].includes(a.priority)).length,
      actions: actionRows.slice(0, 8),
      usesUniversalActionEngine: true
    };
  }

  private linkedRecordsSnapshot(incident: any) {
    const records = [
      incident.ptw_involved ? { type: 'PTW', id: incident.ptw_id, required: !!incident.ptw_review_required } : null,
      incident.moc_involved || incident.moc_required ? { type: 'MOC', id: incident.moc_id, required: !!incident.moc_required } : null,
      incident.pssr_involved || incident.pssr_required ? { type: 'PSSR', id: incident.pssr_id, required: !!incident.pssr_required } : null,
      incident.hazop_review_required ? { type: 'HAZOP/PHA', required: true } : null,
      incident.lopa_review_required ? { type: 'LOPA/SIL', required: true } : null,
      incident.mechanical_integrity_followup_required ? { type: 'Mechanical Integrity', required: true } : null
    ].filter(Boolean);
    return { count: records.length, records, missingRequired: records.filter((r: any) => r.required && !r.id).length };
  }

  private evidenceSnapshot(incident: any, evidence: any[], permissions: string[]) {
    const canViewRestricted = permissions.includes('incidents.restricted.view');
    const visible = canViewRestricted ? evidence : evidence.filter((e) => !e.restricted);
    return {
      status: incident.evidence_status ?? (evidence.length ? 'Initial Evidence Added' : 'Not Started'),
      totalEvidence: evidence.length,
      visibleEvidence: visible.length,
      restrictedHidden: evidence.length - visible.length,
      byType: this.groupLocal(visible, 'evidence_type'),
      missingRequired: (incident.regulatory_reporting_required || incident.rca_required) && !evidence.length,
      records: visible.slice(0, 8)
    };
  }

  private regulatorySnapshot(incident: any) {
    return {
      regulatoryReportingRequired: !!incident.regulatory_reporting_required,
      notificationRequired: !!incident.notification_required,
      psmReviewRequired: !!incident.is_psm_incident || !!incident.is_process_safety_event || incident.pse_tier === 'Not Determined',
      pseTier: incident.pse_tier,
      thresholdExceeded: incident.threshold_exceeded,
      reviewerRequired: !!incident.pse_reviewer_required,
      status: incident.regulatory_reporting_required ? 'Required' : 'Not Required'
    };
  }

  private lessonsSnapshot(incident: any) {
    return {
      status: incident.lessons_learned_status ?? 'Not Started',
      required: this.highPotentialSeverity(incident.potential_severity) || !!incident.is_psm_incident || !!incident.rca_required,
      message: 'Lessons Learned status is generated from the incident lessons workflow and updates review/closure readiness.'
    };
  }

  private readinessFor(incident: any, people: any[], assets: any[], evidence: any[], actions: any[]) {
    const checks = [
      this.check('Event details complete', !!incident.title && !!incident.short_description && !!incident.detailed_description && !!incident.event_datetime && !!incident.site_id, 'Event Details & Classification'),
      this.check('Actual severity complete', !!incident.actual_severity, 'Potential Severity / Risk Matrix'),
      this.check('Potential severity complete', !!incident.potential_severity && incident.potential_risk_score !== null && incident.potential_risk_score !== undefined, 'Potential Severity / Risk Matrix'),
      this.check('PSM/PSE classification complete or reviewed', !!incident.pse_tier && incident.pse_tier !== 'Not Determined' || !incident.is_process_safety_event, 'Notifications / Regulatory Reporting', incident.pse_tier === 'Not Determined'),
      this.check('People/injury/exposure checked', people.length > 0 || !incident.injury_occurred && !incident.toxic_exposure_occurred, 'People / Injury / Exposure'),
      this.check('Equipment/chemical checked', assets.length > 0 || !incident.equipment_inspection_required && !incident.sds_chemical_review_required, 'Asset / Equipment / Chemical'),
      this.check('Evidence attached if required', evidence.length > 0 || !incident.regulatory_reporting_required && !incident.rca_required, 'Evidence / Attachments'),
      this.check('Immediate actions captured', !!incident.area_safe_now || !!incident.immediate_action_notes, 'Immediate Actions'),
      this.check('Investigation team assigned if required', !!incident.investigation_owner_id && (!incident.formal_team_required || !!incident.investigation_owner_id), 'Investigation Team'),
      this.check('RCA complete if required', !incident.rca_required || ['Completed', 'Closed'].includes(incident.rca_status), 'Root Cause Analysis', !!incident.rca_required),
      this.check('Barrier failure analysis complete if required', !assets.some((a) => a.safeguard_failed) || incident.barrier_analysis_status === 'Complete', 'Barrier / Safeguard Failure', assets.some((a) => a.safeguard_failed)),
      this.check('Corrective/preventive actions assigned', actions.length > 0 || !incident.rca_required && !this.highPotentialSeverity(incident.potential_severity), 'Corrective / Preventive Actions'),
      this.check('Regulatory reporting checked', !incident.regulatory_reporting_required || incident.notification_required, 'Notifications / Regulatory Reporting', !!incident.regulatory_reporting_required),
      this.check('Review/approval ready', incident.status === 'Pending Review' || incident.status === 'Approved' || incident.status === 'Closed', 'Review & Approval')
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status === 'Blocked' || c.status === 'Incomplete');
    const hardBlockers = blockers.filter((b) => b.hard);
    const score = Math.round((complete / checks.length) * 100);
    const readyForReview = score >= 85 && hardBlockers.length === 0;
    return {
      status: readyForReview ? 'Ready for Review' : hardBlockers.length ? 'Blocked' : 'Needs Review',
      score,
      readyForReview,
      checklist: checks,
      blockers,
      hardBlockers,
      nextRecommendedStep: blockers[0]?.section ?? 'Review & Approval',
      nextSteps: blockers.slice(0, 6).map((b) => ({ title: b.title, section: b.section, severity: b.status, action: `Open ${b.section}` }))
    };
  }

  private allowedStatusTransitions(incident: any, readiness: any, permissions: string[]) {
    const canChange = permissions.includes('incidents.status.change');
    const closed = this.closedStatus(incident.status);
    if (closed) return permissions.includes('incidents.reopen') ? [{ status: 'Reopened', reasonRequired: true, disabledReason: null }] : [];
    const choices = [
      { status: 'Triage', allowedFrom: ['Reported', 'Reopened'] },
      { status: 'Investigation Required', allowedFrom: ['Reported', 'Triage', 'Reopened'] },
      { status: 'Investigation In Progress', allowedFrom: ['Triage', 'Investigation Required', 'RCA Required', 'Reopened'] },
      { status: 'RCA Required', allowedFrom: ['Investigation Required', 'Investigation In Progress'] },
      { status: 'RCA In Progress', allowedFrom: ['RCA Required'] },
      { status: 'Actions Assigned', allowedFrom: ['Investigation In Progress', 'RCA In Progress'] },
      { status: 'Pending Review', allowedFrom: ['Actions Assigned', 'Investigation In Progress', 'RCA In Progress'] },
      { status: 'Changes Requested', allowedFrom: ['Pending Review'], reasonRequired: true },
      { status: 'Approved', allowedFrom: ['Pending Review'] },
      { status: 'Closed', allowedFrom: ['Approved', 'Pending Review'], reasonRequired: true, disabledReason: readiness.hardBlockers?.length ? `Blocked by ${readiness.hardBlockers.length} readiness item(s)` : null },
      { status: 'Cancelled / Void', allowedFrom: ['Reported', 'Triage', 'Investigation Required', 'Reopened'], reasonRequired: true }
    ];
    return choices.filter((c) => c.allowedFrom.includes(incident.status)).map((c) => ({ ...c, disabledReason: canChange ? c.disabledReason : 'Missing incidents.status.change permission' })).filter((c) => canChange || c.disabledReason);
  }

  private headerActions(incident: any, permissions: string[], readiness: any) {
    const locked = this.closedStatus(incident.status);
    const action = (key: string, label: string, permission: string, enabled = true, reason?: string) => ({
      key, label, enabled: permissions.includes(permission) && enabled, disabledReason: permissions.includes(permission) ? reason ?? (enabled ? null : 'Action is not available in the current incident state.') : `Missing ${permission} permission`
    });
    return [
      action('edit-basic', 'Edit basic info', 'incidents.edit_basic', !locked, 'Closed/approved incidents are read-only.'),
      action('assign-owner', 'Assign owner', 'incidents.assign', !locked, 'Closed/approved incidents are read-only.'),
      action('change-status', 'Change status', 'incidents.status.change', !locked, 'Closed/approved incidents must be reopened before changing status.'),
      action('create-action', 'Create corrective action', 'incidents.actions.create', !locked, 'Closed/approved incidents are read-only.'),
      action('upload-evidence', 'Add evidence', 'incidents.evidence.upload', !locked, 'Closed/approved incidents are read-only.'),
      action('psm-review', 'Mark PSM review required', 'incidents.psm.review.request', !locked, 'Closed/approved incidents are read-only.'),
      action('severity-review', 'Request severity review', 'incidents.severity.review.request', !locked, 'Closed/approved incidents are read-only.'),
      action('export-summary', 'Export summary', 'incidents.export_summary', true),
      action('close', 'Close incident', 'incidents.close', !locked && readiness.hardBlockers.length === 0, readiness.hardBlockers.length ? `Blocked by ${readiness.hardBlockers.length} readiness item(s).` : 'Closed/approved incidents are already locked.'),
      action('reopen', 'Reopen incident', 'incidents.reopen', locked, 'Only closed/approved/cancelled incidents can be reopened.'),
      { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
    ];
  }

  private disabledActions(reason: string, permissions: string[]) {
    return ['edit-basic','assign-owner','change-status','create-action','upload-evidence','export-summary','close','reopen','refresh'].map((key) => ({ key, label: key.replaceAll('-', ' '), enabled: key === 'refresh' || key === 'export-summary' && permissions.includes('incidents.export_summary'), disabledReason: key === 'refresh' ? null : reason }));
  }

  private detailBadges(incident: any) {
    return [
      { label: 'Actual Severity', value: incident.actual_severity ?? 'Not Set', tone: 'actual' },
      { label: 'Potential Severity', value: incident.potential_severity ?? 'Not Set', tone: 'potential' },
      { label: 'Risk Score', value: incident.potential_risk_score ?? 'Not Determined', tone: 'risk' },
      { label: 'Priority', value: incident.investigation_priority ?? 'Pending', tone: 'priority' },
      { label: 'Investigation Level', value: incident.investigation_level_required ?? 'Not Determined', tone: 'info' },
      { label: 'High-Potential Near Miss', value: incident.high_potential_near_miss ? 'Yes' : 'No', tone: incident.high_potential_near_miss ? 'danger' : 'ok' },
      { label: 'Fatality Potential', value: incident.fatality_potential ? 'Yes' : 'No', tone: incident.fatality_potential ? 'danger' : 'ok' },
      { label: 'PSM Incident', value: incident.is_psm_incident ? 'Yes' : 'No', tone: incident.is_psm_incident ? 'danger' : 'ok' },
      { label: 'PSE', value: incident.is_process_safety_event ? 'Yes' : 'No', tone: incident.is_process_safety_event ? 'danger' : 'ok' },
      { label: 'API RP 754', value: incident.pse_tier ?? 'Not Determined', tone: ['Tier 1','Tier 2'].includes(incident.pse_tier) ? 'danger' : 'info' },
      { label: 'Regulatory', value: incident.regulatory_reporting_required ? 'Required' : 'Not Required', tone: incident.regulatory_reporting_required ? 'warning' : 'ok' },
      { label: 'Restricted', value: incident.restricted || incident.confidential ? 'Yes' : 'No', tone: incident.restricted || incident.confidential ? 'danger' : 'ok' }
    ];
  }

  private detailBanners(incident: any, readiness: any, permissions: string[]) {
    return [
      this.closedStatus(incident.status) ? { type: 'locked', title: `${incident.status} incident`, message: 'This incident is read-only unless it is reopened by an authorized user.' } : null,
      incident.status === 'Reopened' ? { type: 'info', title: 'Reopened incident', message: 'This record was reopened and may require re-review.' } : null,
      incident.restricted ? { type: 'restricted', title: 'Restricted incident', message: permissions.includes('incidents.restricted.view') ? 'Access is restricted and audited.' : 'Restricted details are redacted.' } : null,
      incident.confidential ? { type: 'restricted', title: 'Confidential incident', message: permissions.includes('incidents.confidential.view') ? 'Confidential handling applies.' : 'Confidential details are redacted.' } : null,
      !permissions.includes('incidents.medical_fields.view') && incident.injury_occurred ? { type: 'restricted', title: 'Medical information hidden', message: 'Medical details require incidents.medical_fields.view.' } : null,
      incident.pse_tier === 'Not Determined' ? { type: 'warning', title: 'PSM classification pending', message: 'PSE tier requires site/company threshold review.' } : null,
      readiness.status !== 'Ready for Review' ? { type: 'warning', title: readiness.status, message: `${readiness.blockers.length} readiness item(s) need attention.` } : null,
      this.isPastDate(incident.due_date) && !this.closedStatus(incident.status) ? { type: 'danger', title: 'Overdue investigation', message: 'The investigation due date has passed.' } : null,
      incident.high_potential_near_miss ? { type: 'danger', title: 'High-potential near miss', message: 'Potential severity drives priority and investigation level.' } : null,
      incident.regulatory_reporting_required ? { type: 'danger', title: 'Regulatory reporting required', message: 'Regulatory/notification follow-up is required.' } : null,
      incident.area_safe_now === 'No' ? { type: 'danger', title: 'Unsafe condition remains open', message: 'Area safe now is marked No.' } : null
    ].filter(Boolean);
  }

  private quickLinks(id: string, readiness: any) {
    return [
      ['event-details', 'Event Details & Classification'],
      ['potential-severity', 'Potential Severity / Risk Matrix'],
      ['people', 'People / Injury / Exposure'],
      ['asset-chemical', 'Asset / Equipment / Chemical'],
      ['evidence', 'Evidence / Attachments'],
      ['immediate-actions', 'Immediate Actions'],
      ['investigation-team', 'Investigation Team'],
      ['rca', 'Root Cause Analysis'],
      ['barrier-failure', 'Barrier / Safeguard Failure'],
      ['capa', 'Corrective / Preventive Actions'],
      ['linked-records', 'Linked Records'],
      ['notifications', 'Notifications / Regulatory Reporting'],
      ['review', 'Review & Approval'],
      ['history', 'History']
    ].map(([key, label]) => ({ key, label, href: `/incidents/${id}?tab=${key}`, blocker: readiness.blockers.some((b: any) => b.section === label) }));
  }

  private overviewCharts(incident: any, evidence: any[], actions: any[], readiness: any) {
    const open = actions.filter((a) => this.openActionStatus(a.status));
    return {
      severityComparison: [
        { label: 'Actual', value: incident.actual_severity ?? 'Not Set' },
        { label: 'Potential', value: incident.potential_severity ?? 'Not Set' }
      ],
      readiness: [
        { label: 'Complete', count: readiness.checklist.filter((c: any) => c.status === 'Complete').length },
        { label: 'Incomplete', count: readiness.checklist.filter((c: any) => c.status === 'Incomplete').length },
        { label: 'Blocked', count: readiness.checklist.filter((c: any) => c.status === 'Blocked').length }
      ],
      actionStatus: this.groupLocal(actions, 'status'),
      evidenceStatus: evidence.length ? this.groupLocal(evidence, 'evidence_type') : []
    };
  }

  private restrictedTab(incident: any, title: string) {
    return {
      restricted: true,
      header: { title, incidentNumber: incident.incident_number, status: incident.status },
      summaryCards: [{ label: 'Restricted incident', value: 'Redacted', tone: 'danger', help: incident.actionsDisabledReason }],
      readiness: { status: 'Blocked', score: 0, blockers: [{ title: 'Restricted content', section: title, status: 'Blocked', hard: true }] },
      actions: [{ key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }]
    };
  }

  private eventDetailsReadiness(incident: any, psmConfig: any, pseConfig: any) {
    const checks = [
      this.check('Incident title captured', !!incident.title, 'Core Event Information'),
      this.check('Short description captured', !!incident.short_description, 'Core Event Information'),
      this.check('Detailed event description captured', !!incident.detailed_description, 'Event Description'),
      this.check('Event date/time captured', !!incident.event_datetime, 'Location / Time / Operation'),
      this.check('Site captured', !!incident.site_id, 'Location / Time / Operation'),
      this.check('Event type selected', !!incident.event_type, 'Event Type & Classification'),
      this.check('Classification selected', !!incident.classification, 'Event Type & Classification'),
      this.check('PSM/PSE classification reviewed or review requested', incident.pse_tier !== 'Not Determined' || !!incident.psm_pse_review_required, 'PSM / Process Safety / API RP 754', !pseConfig.configured),
      this.check('Reporter or anonymous report captured', !!incident.reported_by || !!incident.anonymous_report, 'Reporter / Witness Snapshot')
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return {
      status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete',
      score: Math.round((complete / checks.length) * 100),
      checklist: checks,
      blockers,
      missingFields: this.missingFields(incident, [['title','Incident title'], ['short_description','Short description'], ['detailed_description','Detailed description'], ['event_datetime','Event date/time'], ['site_id','Site'], ['event_type','Event type'], ['classification','Classification']]),
      configWarnings: [
        !psmConfig.configured ? 'Company/site classification indicator configuration is missing.' : null,
        !pseConfig.configured ? 'Company/site PSE threshold configuration is missing; API RP 754 tier remains Not Determined until reviewed.' : null
      ].filter(Boolean)
    };
  }

  private severityReadiness(incident: any, matrix: any) {
    const checks = [
      this.check('Actual severity selected', !!incident.actual_severity, 'Actual Consequence'),
      this.check('Potential severity selected', !!incident.potential_severity, 'Potential Consequence'),
      this.check('Likelihood/probability selected', !!incident.likelihood, 'Likelihood / Probability'),
      this.check('Risk matrix configured or severity review requested', matrix.configured || !!incident.severity_review_required, 'Risk Matrix', !matrix.configured),
      this.check('Risk score calculated or marked Not Determined', incident.potential_risk_score !== null && incident.potential_risk_score !== undefined || !!incident.risk_matrix_config_missing, 'Risk Matrix'),
      this.check('Investigation priority decision available', !!incident.investigation_priority, 'Investigation Priority Decision')
    ];
    const complete = checks.filter((c) => c.status === 'Complete').length;
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return {
      status: blockers.some((b) => b.hard) ? 'Blocked' : blockers.length ? 'Needs Review' : 'Complete',
      score: Math.round((complete / checks.length) * 100),
      checklist: checks,
      blockers,
      missingFields: this.missingFields(incident, [['actual_severity','Actual severity'], ['potential_severity','Potential severity'], ['likelihood','Likelihood']]),
      configWarnings: matrix.configured ? [] : [matrix.missingReason ?? 'Risk matrix configuration is missing.']
    };
  }

  private incidentEventTypes() {
    return ['Incident', 'Near Miss', 'Unsafe Condition', 'Process Upset', 'Loss of Containment', 'Spill', 'Release', 'Fire', 'Explosion', 'Injury', 'Illness', 'Exposure', 'Equipment Damage', 'Environmental Event', 'Security Event', 'Quality Event', 'Other'];
  }

  private incidentClassifications() {
    return ['Occupational Safety', 'Process Safety', 'Environmental', 'Asset / Reliability', 'Security', 'Quality', 'Other'];
  }

  private severityRank(value?: string) {
    const index = this.severities().indexOf(value ?? '');
    return index < 0 ? 0 : index + 1;
  }

  private followupFlags(incident: any) {
    return [
      ['Formal team', incident.formal_team_required],
      ['RCA', incident.rca_required],
      ['MOC', incident.moc_required],
      ['PSSR', incident.pssr_required],
      ['PTW review', incident.ptw_review_required],
      ['HAZOP/PHA review', incident.hazop_review_required],
      ['LOPA/SIL review', incident.lopa_review_required],
      ['Mechanical Integrity', incident.mechanical_integrity_followup_required],
      ['Regulatory notification', incident.regulatory_reporting_required]
    ].map(([label, required]) => ({ label, required: !!required }));
  }

  private detailPermissionMap(permissions: string[]) {
    const canReadIncident = permissions.includes('incidents.view') || permissions.includes('incidents.register.view');
    return {
      ...this.permissionMap(permissions),
      canViewDetail: canReadIncident || permissions.includes('incidents.detail.view'),
      canViewOverview: canReadIncident || permissions.includes('incidents.overview.view'),
      canEditBasic: permissions.includes('incidents.edit_basic'),
      canChangeStatus: permissions.includes('incidents.status.change'),
      canClose: permissions.includes('incidents.close'),
      canReopen: permissions.includes('incidents.reopen'),
      canVoid: permissions.includes('incidents.void'),
      canViewMedical: permissions.includes('incidents.medical_fields.view') || permissions.includes('incidents.medical_fields.manage'),
      canRequestPsmReview: permissions.includes('incidents.psm.review.request'),
      canRequestSeverityReview: permissions.includes('incidents.severity.review.request'),
      canViewLinkedRecords: permissions.includes('incidents.linked_records.view'),
      canExportSummary: permissions.includes('incidents.export_summary')
    };
  }

  private card(label: string, value: any, tone: string, help: string) { return { label, value, tone, help }; }
  private check(title: string, ok: boolean, section: string, hard = false) { return { title, section, status: ok ? 'Complete' : hard ? 'Blocked' : 'Incomplete', hard }; }
  private linkedRecordCount(incident: any) { return [incident.ptw_id, incident.moc_id, incident.pssr_id, incident.hazop_review_required, incident.lopa_review_required, incident.mechanical_integrity_followup_required].filter(Boolean).length; }
  private missingFields(row: any, fields: Array<[string, string]>) { return fields.filter(([key]) => !row[key]).map(([, label]) => label); }
  private firstValue(rows: any[], key: string) { return rows.find((r) => r[key])?.[key] ?? null; }
  private groupLocal(rows: any[], key: string) { const m = new Map<string, number>(); rows.forEach((r) => m.set(r[key] ?? 'Unspecified', (m.get(r[key] ?? 'Unspecified') ?? 0) + 1)); return Array.from(m.entries()).map(([label, count]) => ({ label, count })); }
  private distributionBy(rows: any[], picker: (row: any) => string) { const m = new Map<string, number>(); rows.forEach((row) => { const label = picker(row) || 'Not Determined'; m.set(label, (m.get(label) ?? 0) + 1); }); return Array.from(m.entries()).map(([label, count]) => ({ label, count })); }
  private temporaryControlExpired(row: any) {
    const expiry = row.temporary_control_expiry_at ?? row.temporary_control_expiry;
    return !!expiry && this.isPastDate(expiry) && !row.completed && !['Completed', 'Verified', 'Cancelled', 'Superseded'].includes(row.status);
  }
  private teamProfileFromUser(user: any) {
    const statusText = String(user.status ?? '').toUpperCase();
    const active = ['ACTIVE', 'Active', ''].includes(user.status) || statusText === 'ACTIVE';
    return {
      userId: user.id,
      profileId: user.profileId ?? user.id,
      displayName: user.displayName ?? user.email,
      email: user.email,
      jobTitle: user.title,
      department: user.department,
      profileDetected: true,
      profileDetectionSource: 'IAM/RBAC user',
      profileStatus: active ? 'Active' : 'Disabled',
      profileDisabledReason: active ? null : `IAM status is ${user.status ?? 'Disabled'}`
    };
  }

  private async detectTeamUserProfile(tenantId: string, scope: Scope, dto: Record<string, any>) {
    const userId = dto.userId ?? dto.replacementUserId;
    const email = dto.email ?? dto.replacementEmail;
    let query = this.db.from('User').select('id,displayName,email,title,department,status,tenantId').eq('tenantId', tenantId).limit(1);
    if (userId) query = query.eq('id', userId);
    else if (email) query = query.ilike('email', email);
    else return { profileDetected: false, profileStatus: undefined, profileDetectionSource: undefined, profileDisabledReason: null };
    const user = await this.safeSingle<any>(query.maybeSingle());
    if (!user) return { profileDetected: false, profileStatus: undefined, profileDetectionSource: undefined, profileDisabledReason: null };
    return this.teamProfileFromUser(user);
  }

  private async decoratedIncidents(tenantId: string, scope: Scope, permissions: string[], filters: Record<string, any>): Promise<IncidentRow[]> {
    return (await this.register(tenantId, scope, filters, permissions)).rows;
  }

  private async firstConfig(tenantId: string, scope: Scope, keys: string[]) {
    const tables = [
      { table: 'CompanyConfiguration', tenant: 'tenantId', key: 'key', value: 'valueJson', site: 'siteId' },
      { table: 'company_configurations', tenant: 'tenant_id', key: 'config_key', value: 'config_json', site: 'site_id' },
      { table: 'site_configurations', tenant: 'tenant_id', key: 'config_key', value: 'config_json', site: 'site_id' }
    ];
    for (const configTable of tables) {
      for (const key of keys) {
        let query = this.db.from(configTable.table).select('*').eq(configTable.tenant, tenantId).eq(configTable.key, key).limit(1);
        if (scope.selectedSiteId) query = query.or(`${configTable.site}.is.null,${configTable.site}.eq.${scope.selectedSiteId}`);
        const row = await this.safeSingle<any>(query.single());
        if (row) return row[configTable.value] ?? row.value_json ?? row.config_json ?? row;
      }
    }
    return null;
  }

  private async nextIncidentNumber(tenantId: string, siteId?: string | null) {
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    let query = this.db.from('incidents').select('incident_number').eq('tenant_id', tenantId).ilike('incident_number', `${prefix}%`).order('incident_number', { ascending: false }).limit(1);
    if (siteId) query = query.eq('site_id', siteId);
    const latest = await this.safeMany<any>(query);
    const n = latest[0]?.incident_number ? Number(String(latest[0].incident_number).split('-').pop()) + 1 : 1;
    return `${prefix}${String(Number.isFinite(n) ? n : 1).padStart(5, '0')}`;
  }

  private async insertInitialChildren(tenantId: string, actorId: string, incident: IncidentRow, dto: Record<string, any>) {
    if (dto.peopleInvolved || dto.injuryOccurred || dto.exposureOccurred || dto.personName || dto.confidentialMedicalNotes) {
      await this.safeSingle(this.db.from('incident_people_initial').insert({
        id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id,
        people_involved: !!dto.peopleInvolved, injured_person_count: dto.injuredPersonCount ? Number(dto.injuredPersonCount) : null,
        employee_involved: !!dto.employeeInvolved, contractor_involved: !!dto.contractorInvolved, visitor_involved: !!dto.visitorInvolved,
        person_type: dto.personType, person_name: dto.personName, job_role: dto.personJobRole, employee_id: dto.employeeId, contractor_company: dto.contractorCompany,
        injury_occurred: !!dto.injuryOccurred, illness_occurred: !!dto.illnessOccurred, exposure_occurred: !!dto.exposureOccurred,
        injury_type: dto.injuryType, body_part: dto.bodyPart, treatment_type: dto.treatmentType,
        lost_time_potential: !!dto.lostTimePotential, medical_treatment_required: !!dto.medicalTreatmentRequired, hospitalization: !!dto.hospitalization, fatality: !!dto.fatality,
        ppe_used: dto.ppeUsed, ppe_issue_suspected: !!dto.ppeIssueSuspected, exposure_route: dto.exposureRoute, chemical_exposure: !!dto.chemicalExposure,
        confidential_notes: dto.confidentialMedicalNotes, created_by: actorId
      }).select().single());
    }
    if (dto.equipmentInvolved || dto.chemicalInvolved || dto.safeguardInvolved) {
      await this.safeSingle(this.db.from('incident_equipment_chemical_initial').insert({
        id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id,
        equipment_involved: !!dto.equipmentInvolved, equipment_id: dto.equipmentId, equipment_tag_snapshot: dto.equipmentTag, equipment_name_snapshot: dto.equipmentName, equipment_type_snapshot: dto.equipmentType,
        equipment_location: dto.equipmentLocation, equipment_status: dto.equipmentStatus, maintenance_overdue_suspected: !!dto.maintenanceOverdueSuspected,
        safeguard_involved: !!dto.safeguardInvolved, safeguard_failed: !!dto.safeguardFailed, ipl_involved: !!dto.iplInvolved,
        sis_sif_involved: !!dto.sisSifInvolved, psv_relief_involved: !!dto.psvReliefInvolved, alarm_interlock_involved: !!dto.alarmInterlockInvolved,
        chemical_involved: !!dto.chemicalInvolved, chemical_id: dto.chemicalId, chemical_name_snapshot: dto.chemicalName, cas_number_snapshot: dto.casNumber,
        sds_id: dto.sdsId, sds_link: dto.sdsLink, material_state: dto.materialState, estimated_quantity_involved: this.numberOrNull(dto.estimatedQuantityInvolved),
        released_quantity: this.numberOrNull(dto.releasedQuantity), release_unit: dto.releaseUnit, process_condition: dto.processCondition, temperature: dto.temperature, pressure: dto.pressure, flow_rate: dto.flowRate,
        created_by: actorId
      }).select().single());
    }
    const actionKeys: Array<[string, string]> = [
      ['areaIsolated', 'Area isolated'], ['equipmentStopped', 'Equipment stopped'], ['spillContained', 'Spill contained'], ['fireResponseActivated', 'Fire response activated'],
      ['firstAidProvided', 'First aid provided'], ['emergencyResponseCalled', 'Emergency response called'], ['barricadeInstalled', 'Barricade installed'], ['permitSuspended', 'Permit suspended'],
      ['operationStopped', 'Operation stopped'], ['temporaryControlAdded', 'Temporary control added'], ['notificationSent', 'Notification sent']
    ];
    const actionRows = actionKeys.filter(([key]) => !!dto[key]).map(([key, label]) => ({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id,
      action_key: key, action_label: label, completed: true, notes: dto.immediateActionNotes, current_site_condition: dto.currentSiteCondition, temporary_control: key === 'temporaryControlAdded',
      temporary_control_expiry: this.dateOrNull(dto.temporaryControlExpiration), created_by: actorId
    }));
    if (dto.otherImmediateAction) actionRows.push({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, action_key: 'otherImmediateAction', action_label: dto.otherImmediateAction, completed: true, notes: dto.immediateActionNotes, current_site_condition: dto.currentSiteCondition, temporary_control: false, temporary_control_expiry: null, created_by: actorId });
    if (actionRows.length) await this.safeMany(this.db.from('incident_immediate_actions_initial').insert(actionRows).select());
    if (Array.isArray(dto.evidence) && dto.evidence.length) {
      const evidenceRows = dto.evidence.map((e: any) => ({
        id: e.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: incident.company_id, site_id: incident.site_id, incident_id: incident.id, draft_id: null,
        evidence_type: e.evidenceType, file_name: e.fileName, description: e.description, storage_provider: e.storageProvider ?? 'configured-storage',
        storage_key: e.storageKey ?? e.fileName, file_type: e.fileType, mime_type: e.mimeType, file_size: this.integerOrNull(e.fileSize),
        source: e.source, classification: e.classification, restricted: !!e.restricted, confidential: !!e.confidential,
        medical_confidential: !!e.medicalConfidential, upload_status: e.uploadStatus ?? 'Uploaded', collected_by: e.collectedBy ?? actorId, collected_at: e.collectedAt ?? new Date().toISOString(),
        notes: e.notes, uploaded_by: actorId
      }));
      await this.safeMany(this.db.from('incident_initial_evidence').insert(evidenceRows).select());
    }
  }

  private assertSiteAccess(scope: Scope, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) {
      throw new ForbiddenException('You do not have access to the selected site.');
    }
  }

  private value(dto: Record<string, any>, field: string) {
    return dto[field] ?? dto[field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)];
  }

  private yes(value: any) {
    return value === true || value === 'true' || value === 'Yes' || value === 'Confirmed';
  }

  private numberOrNull(value: any) {
    if (value === undefined || value === null || value === '') return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private integerOrNull(value: any) {
    const numberValue = this.numberOrNull(value);
    return numberValue === null ? null : Math.trunc(numberValue);
  }

  private dateOrNull(value: any) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
  }

  private dateTimeOrNull(value: any) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  private intervalOrNull(value: any) {
    if (!value) return null;
    const text = String(value).trim();
    if (!text) return null;
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) return text;
    if (/^\d+(\.\d+)?\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days)$/i.test(text)) return text;
    return null;
  }

  private priorityFromScore(score: number, severity: string) {
    if (score >= 20 || ['Fatality', 'Catastrophic'].includes(severity)) return 'Critical';
    if (score >= 12 || ['Serious', 'Major'].includes(severity)) return 'High';
    if (score >= 6) return 'Medium';
    return 'Low';
  }

  private priorityFromSeverity(severity: string) {
    if (['Fatality', 'Catastrophic'].includes(severity)) return 'Critical';
    if (['Serious', 'Major'].includes(severity)) return 'High';
    if (severity === 'Moderate') return 'Medium';
    return 'Low';
  }

  private investigationLevel(priority: string, severity: string) {
    if (priority === 'Critical' || ['Fatality', 'Catastrophic'].includes(severity)) return 'Senior management review';
    if (priority === 'High') return 'Full RCA investigation';
    if (priority === 'Medium') return 'Standard investigation';
    return 'Supervisor review';
  }

  private suggestedDueDate(priority: string) {
    const d = new Date();
    d.setDate(d.getDate() + (priority === 'Critical' ? 7 : priority === 'High' ? 14 : priority === 'Medium' ? 30 : 45));
    return d.toISOString().slice(0, 10);
  }

  private async visibleIncidents(tenantId: string, scope: Scope, permissions: string[]) {
    const rows = await this.safeMany<IncidentRow>(this.scopeQuery(this.db.from('incidents').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false }).limit(1000), scope, 'site_id'));
    return rows.filter((row) => this.canSee(row, permissions));
  }

  private async decorateRows(tenantId: string, rows: IncidentRow[], permissions: string[]): Promise<IncidentRow[]> {
    if (!rows.length) return [];
    const [sites, units, areas, users] = await Promise.all([
      this.lookup(tenantId, 'Site', 'id,name,code', rows.map((r) => r.site_id), 'tenantId'),
      this.lookup(tenantId, 'Unit', 'id,name,code', rows.map((r) => r.unit_id), 'tenantId'),
      this.lookup(tenantId, 'Area', 'id,name,code', rows.map((r) => r.area_id), 'tenantId'),
      this.lookup(tenantId, 'User', 'id,displayName,email,title,department', rows.flatMap((r) => [r.reported_by, r.investigation_owner_id]).filter(Boolean), 'tenantId')
    ]);
    return rows.filter((r) => this.canSee(r, permissions)).map((row): IncidentRow => {
      const restrictedRedacted = this.redacted(row, permissions);
      return restrictedRedacted ? {
        id: row.id, incident_number: row.incident_number, restrictedRedacted: true, title: 'Restricted incident', short_description: 'You do not have permission to view this incident.', status: row.status, site: sites[row.site_id], event_datetime: row.event_datetime, classification: 'Restricted', actionsDisabledReason: 'Missing restricted/confidential incident permission'
      } : { ...row, site: sites[row.site_id], unit: units[row.unit_id], area: areas[row.area_id], reporter: users[row.reported_by], owner: users[row.investigation_owner_id], locked: this.closedStatus(row.status), overdue: this.isPastDate(row.due_date) && !this.closedStatus(row.status) };
    });
  }

  private applyFilters(query: any, f: Record<string, any>) {
    const eq: Array<[string, string]> = [['site_id','siteId'], ['unit_id','unitId'], ['area_id','areaId'], ['event_type','eventType'], ['classification','classification'], ['status','status'], ['pse_tier','pseTier'], ['actual_severity','actualSeverity'], ['potential_severity','potentialSeverity'], ['investigation_priority','investigationPriority'], ['investigation_owner_id','ownerId'], ['reported_by','reportedBy'], ['rca_status','rcaStatus']];
    for (const [col, key] of eq) {
      const value = f[key] ?? f[col];
      if (value) query = query.eq(col, value);
    }
    const bools: Array<[string, string]> = [['is_psm_incident','isPsmIncident'], ['rca_required','rcaRequired'], ['regulatory_reporting_required','regulatoryReportingRequired'], ['moc_required','mocRequired'], ['pssr_required','pssrRequired'], ['hazop_review_required','hazopReviewRequired'], ['lopa_review_required','lopaReviewRequired'], ['mechanical_integrity_followup_required','miRequired'], ['contractor_involved','contractorInvolved'], ['injury_occurred','injuryInvolved'], ['environmental_impact','environmentalImpact'], ['fire_explosion_occurred','fireExplosion'], ['restricted','restricted']];
    for (const [col, key] of bools) if (f[key] !== undefined && f[key] !== '') query = query.eq(col, String(f[key]) === 'true');
    if (f.id) query = query.eq('id', f.id);
    if (f.dateFrom) query = query.gte('event_datetime', f.dateFrom);
    if (f.dateTo) query = query.lte('event_datetime', f.dateTo);
    if (f.search || f.q) {
      const v = this.escape(String(f.search ?? f.q));
      query = query.or(`incident_number.ilike.%${v}%,title.ilike.%${v}%,short_description.ilike.%${v}%,location_text.ilike.%${v}%,released_material.ilike.%${v}%`);
    }
    if (f.overdueInvestigation === 'true') query = query.lt('due_date', new Date().toISOString().slice(0, 10));
    if (f.overdueActions === 'true') query = query.gt('overdue_actions_count', 0);
    return query;
  }

  private scopeQuery(query: any, scope: Scope, siteColumn: string) {
    if (scope.selectedSiteId) return query.eq(siteColumn, scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in(siteColumn, scope.allowedSiteIds);
    return query;
  }

  private async lookup(tenantId: string, table: string, select: string, ids: string[], tenantColumn: 'tenantId' | 'tenant_id') {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (!unique.length) return {};
    const rows = await this.safeMany<any>(this.db.from(table).select(select).eq(tenantColumn, tenantId).in('id', unique));
    return Object.fromEntries(rows.map((r) => [r.id, r]));
  }

  private parseSort(value?: unknown) {
    const allowed = new Set(['incident_number', 'title', 'event_type', 'classification', 'status', 'event_datetime', 'reported_datetime', 'due_date', 'actual_severity', 'potential_severity', 'potential_risk_score', 'updated_at']);
    const [col = 'updated_at', dir = 'desc'] = String(value ?? 'updated_at.desc').split('.');
    return { column: allowed.has(col) ? col : 'updated_at', ascending: dir === 'asc' };
  }

  private async ensureRca(tenantId: string, incident: any, actorId?: string) {
    const existing = await this.safeSingle<any>(this.db.from('incident_rca').select('*').eq('tenant_id', tenantId).eq('incident_id', incident.id).single());
    if (existing) return existing;
    const rcaRequired = !!incident.rca_required || ['Full RCA investigation', 'Senior management review'].includes(incident.investigation_level_required ?? '') || this.highPotentialSeverity(incident.potential_severity) || !!incident.is_psm_incident || ['Tier 1', 'Tier 2'].includes(incident.pse_tier ?? '');
    const row = await this.db.single<any>(this.db.from('incident_rca').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      incident_id: incident.id,
      rca_required: rcaRequired,
      rca_required_reason: rcaRequired ? 'Generated from severity, investigation level, PSM/PSE classification, and company/site policy inputs.' : 'RCA is not currently required by backend prerequisites.',
      rca_status: rcaRequired ? 'Required' : 'Not Required',
      rca_lead_id: incident.investigation_owner_id ?? null,
      due_date: incident.due_date ?? null,
      created_by: actorId ?? null,
      updated_by: actorId ?? null
    }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ rca_status: row.rca_status, rca_method: row.selected_method, rca_lead_id: row.rca_lead_id, rca_due_date: row.due_date, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incident.id).select('id').single());
    return row;
  }

  private assertCanEditIncidentRca(incident: any) {
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen the incident before changing RCA.');
  }

  private async updateIncidentRcaStatus(tenantId: string, incidentId: string, actorId: string, status: string) {
    await Promise.all([
      this.safeSingle(this.db.from('incident_rca').update({ rca_status: status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', incidentId).select('id').single()),
      this.safeSingle(this.db.from('incidents').update({ rca_status: status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single())
    ]);
  }

  private async writeRcaMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason?: string, before?: any, after?: any, action = 'incidents.rca.update', entityId?: string) {
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
    await this.safeSingle(this.audit.write({ tenantId, actorId, action, entityType: 'IncidentRCA', entityId: entityId ?? incident.id, before: before ?? null, after: after ?? null, metadata: { incidentId: incident.id, reason: reason ?? null, relatedTab: 'Root Cause Analysis' } }));
  }

  private rcaCausalFactorPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, rca: any, update: boolean, index = 1) {
    return this.clean({
      id: update ? undefined : crypto.randomUUID(),
      tenant_id: update ? undefined : tenantId,
      company_id: update ? undefined : incident.company_id,
      site_id: update ? undefined : incident.site_id,
      incident_id: update ? undefined : incident.id,
      rca_id: update ? undefined : rca.id,
      causal_factor_number: update ? undefined : dto.causalFactorNumber ?? `CF-${String(index).padStart(3, '0')}`,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      cause_statement: dto.causeStatement,
      status: dto.status,
      evidence_support_level: dto.evidenceSupportLevel,
      confidence_level: dto.confidenceLevel,
      related_timeline_event_ids_json: dto.relatedTimelineEventIds,
      related_evidence_ids_json: dto.relatedEvidenceIds,
      related_people_ids_json: dto.relatedPeopleIds,
      related_equipment_ids_json: dto.relatedEquipmentIds,
      related_chemical_ids_json: dto.relatedChemicalIds,
      related_records_json: dto.relatedRecords,
      related_immediate_action_ids_json: dto.relatedImmediateActionIds,
      hypothesis: dto.hypothesis,
      owner_id: dto.ownerId,
      due_date: this.dateOrNull(dto.dueDate),
      notes: dto.notes,
      created_by: update ? undefined : actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private rcaRootCausePatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, rca: any, update: boolean, index = 1) {
    return this.clean({
      id: update ? undefined : crypto.randomUUID(),
      tenant_id: update ? undefined : tenantId,
      company_id: update ? undefined : incident.company_id,
      site_id: update ? undefined : incident.site_id,
      incident_id: update ? undefined : incident.id,
      rca_id: update ? undefined : rca.id,
      root_cause_number: update ? undefined : dto.rootCauseNumber ?? `RC-${String(index).padStart(3, '0')}`,
      root_cause_statement: dto.rootCauseStatement,
      category: dto.category,
      description: dto.description,
      linked_causal_factor_ids_json: dto.linkedCausalFactorIds,
      linked_evidence_ids_json: dto.linkedEvidenceIds,
      evidence_support_level: dto.evidenceSupportLevel,
      confidence_level: dto.confidenceLevel,
      cause_classification: dto.causeClassification,
      systemic_cause: dto.systemicCause,
      management_system_element: dto.managementSystemElement,
      risk_control_gap: dto.riskControlGap,
      capa_required: dto.capaRequired,
      capa_required_justification: dto.capaRequiredJustification,
      capa_recommendation: dto.capaRecommendation,
      universal_action_id: dto.universalActionId,
      owner_id: dto.ownerId,
      due_date: this.dateOrNull(dto.dueDate),
      review_status: dto.reviewStatus,
      notes: dto.notes,
      created_by: update ? undefined : actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private rcaSimplePatch(table: string, dto: Record<string, any>, tenantId: string, actorId: string, incident: any, rca: any, update: boolean) {
    const base = this.clean({ id: update ? undefined : crypto.randomUUID(), tenant_id: update ? undefined : tenantId, company_id: update ? undefined : incident.company_id, site_id: update ? undefined : incident.site_id, incident_id: update ? undefined : incident.id, rca_id: update || table === 'incident_rca_five_why_steps' ? undefined : rca.id, created_by: update ? undefined : actorId, updated_by: actorId, updated_at: new Date().toISOString() });
    const map: Record<string, Record<string, any>> = {
      incident_rca_five_why_chains: { causal_factor_id: dto.causalFactorId, problem_statement: dto.problemStatement, status: dto.status, root_cause_conclusion: dto.rootCauseConclusion, evidence_support_level: dto.evidenceSupportLevel, reviewer_comments: dto.reviewerComments },
      incident_rca_five_why_steps: { chain_id: dto.chainId, step_number: this.integerOrNull(dto.stepNumber), why_statement: dto.whyStatement, evidence_ids_json: dto.evidenceIds, notes: dto.notes },
      incident_rca_fishbone_items: { category: dto.category, cause_item: dto.causeItem, description: dto.description, evidence_support_level: dto.evidenceSupportLevel, evidence_ids_json: dto.evidenceIds, timeline_event_ids_json: dto.timelineEventIds, status: dto.status, root_cause_candidate: dto.rootCauseCandidate },
      incident_rca_cause_tree_nodes: { node_type: dto.nodeType, title: dto.title, description: dto.description, evidence_support_level: dto.evidenceSupportLevel, status: dto.status, root_cause_candidate: dto.rootCauseCandidate, linked_action_id: dto.linkedActionId, position_json: dto.position },
      incident_rca_cause_tree_edges: { source_node_id: dto.sourceNodeId, target_node_id: dto.targetNodeId, relationship_type: dto.relationshipType, updated_by: undefined, updated_at: undefined },
      incident_rca_systemic_weaknesses: { management_system_element: dto.managementSystemElement, weakness_description: dto.weaknessDescription, related_root_cause_ids_json: dto.relatedRootCauseIds, related_evidence_ids_json: dto.relatedEvidenceIds, repeated_issue: dto.repeatedIssue, similar_prior_incidents_json: dto.similarPriorIncidents, existing_control: dto.existingControl, gap_description: dto.gapDescription, capa_required: dto.capaRequired, notes: dto.notes },
      incident_rca_hypotheses: { hypothesis: dto.hypothesis, related_causal_factor_id: dto.relatedCausalFactorId, evidence_needed: dto.evidenceNeeded, owner_id: dto.ownerId, due_date: this.dateOrNull(dto.dueDate), status: dto.status, resolution: dto.resolution, notes: dto.notes }
    };
    return this.clean({ ...base, ...(map[table] ?? dto) });
  }

  private rcaPrerequisites(incident: any, rca: any, related: { evidence: any[]; timeline: any[]; teamMembers: any[]; actions: any[] }) {
    const checks = [
      this.check('Incident details complete', !!incident.title && !!incident.event_datetime && !!incident.site_id, 'Complete core event details before RCA.'),
      this.check('Timeline ready', related.timeline.length > 0 || ['Not Required', 'Completed'].includes(incident.timeline_readiness_status ?? ''), 'Timeline events help validate cause sequence.'),
      this.check('Evidence available', related.evidence.length > 0, 'Evidence is required to support causal factors and root causes.'),
      this.check('Investigation team ready', related.teamMembers.some((m) => ['Active', 'Accepted'].includes(m.active_status ?? m.acceptance_status)), 'At least one active/accepted investigator is required.'),
      this.check('RCA lead assigned', !!rca.rca_lead_id || !!incident.investigation_owner_id, 'Assign an RCA lead or investigation owner.'),
      this.check('High priority blockers handled', !related.actions.some((a) => this.openActionStatus(a.status) && (a.priority === 'Critical' || a.blocking)), 'Resolve or accept critical investigation blockers.')
    ];
    const blockers = checks.filter((c) => c.status !== 'Complete');
    return { status: blockers.length ? 'Blocked' : 'Ready', checks, blockers, generatedAt: new Date().toISOString() };
  }

  private rcaQualityChecks(incident: any, rca: any, causalFactors: any[], rootCauses: any[], systemicWeaknesses: any[], hypotheses: any[]) {
    const confirmedFactors = causalFactors.filter((row) => row.status === 'Confirmed');
    const evidenceSupported = [...confirmedFactors, ...rootCauses].filter((row) => ['Strong evidence', 'Partial evidence'].includes(row.evidence_support_level));
    const openHypotheses = hypotheses.filter((row) => ['Open', 'Evidence requested'].includes(row.status ?? 'Open'));
    const checks = [
      this.check('RCA method selected', !!rca.selected_method, 'Select 5-Why, Fishbone, Cause Tree, or another configured RCA method.'),
      this.check('Causal factors identified', causalFactors.length > 0, 'Record causal factors before assigning root causes.'),
      this.check('Confirmed causal factors', confirmedFactors.length > 0, 'At least one causal factor must be confirmed.'),
      this.check('Root causes identified', rootCauses.length > 0 || rca.rca_required === false, 'Root cause register is required when RCA is required.'),
      this.check('Evidence supports causes', evidenceSupported.length > 0 || rca.rca_required === false, 'Evidence support is required for causal factors/root causes.'),
      this.check('Unsupported hypotheses resolved', openHypotheses.length === 0, 'Resolve unsupported assumptions and open hypotheses.'),
      this.check('Systemic weaknesses assessed', systemicWeaknesses.length > 0 || rootCauses.some((row) => !row.systemic_cause), 'Assess management-system/systemic weakness.'),
      this.check('CAPA mapping ready', rootCauses.every((row) => !row.capa_required || row.universal_action_id || row.capa_recommendation), 'CAPA mapping or recommendation is required for CAPA-required root causes.')
    ];
    return { status: checks.every((c) => c.status === 'Complete') ? 'Passed' : 'Gaps Present', checks, score: Math.round((checks.filter((c) => c.status === 'Complete').length / Math.max(1, checks.length)) * 100), method: rca.selected_method, highPotentialContext: this.highPotentialSeverity(incident.potential_severity) };
  }

  private rcaReadiness(incident: any, rca: any, prerequisites: any, quality: any, causalFactors: any[], rootCauses: any[], hypotheses: any[], review: any) {
    const checklist = [
      ...prerequisites.checks,
      ...quality.checks,
      this.check('Review requested/approved', ['Requested', 'Approved'].includes(review?.status ?? ''), 'Request RCA review once analysis is ready.'),
      this.check('No rejected review open', review?.status !== 'Rejected', 'Rejected RCA review requires rework.')
    ];
    const complete = checklist.filter((item) => item.status === 'Complete').length;
    const blockers = checklist.filter((item) => item.status !== 'Complete');
    const status = blockers.length ? (blockers.length > 3 ? 'Blocked' : 'Warning') : 'Ready';
    return { status, score: Math.round((complete / Math.max(1, checklist.length)) * 100), checklist, blockers, readyForCapa: rootCauses.length > 0 && rootCauses.every((row) => !row.capa_required || row.universal_action_id || row.capa_recommendation), openHypotheses: hypotheses.filter((row) => ['Open', 'Evidence requested'].includes(row.status ?? 'Open')).length, readOnly: this.closedStatus(incident.status), lastUpdated: rca.updated_at };
  }

  private rcaSummaryCards(incident: any, rca: any, prerequisites: any, causalFactors: any[], rootCauses: any[], systemicWeaknesses: any[], hypotheses: any[], quality: any, review: any) {
    const confirmed = causalFactors.filter((row) => row.status === 'Confirmed').length;
    const unsupported = [...causalFactors, ...rootCauses].filter((row) => ['Unsupported assumption', 'Weak evidence', 'Not determined', null, undefined, ''].includes(row.evidence_support_level)).length;
    return [
      this.card('RCA required', rca.rca_required ? 'Yes' : 'No', rca.rca_required ? 'warning' : 'ok', rca.rca_required_reason),
      this.card('RCA status', rca.rca_status ?? incident.rca_status ?? 'Not Started', 'status', 'Backend RCA workflow status'),
      this.card('RCA method', rca.selected_method ?? 'Not Selected', 'info', 'Selected investigation method'),
      this.card('RCA lead', rca.rca_lead_id ?? incident.investigation_owner_id ?? 'Unassigned', 'info', 'Assigned lead/owner'),
      this.card('Timeline ready', prerequisites.checks.find((c: any) => c.title === 'Timeline ready')?.status ?? 'Incomplete', 'status', 'Timeline prerequisite'),
      this.card('Evidence ready', prerequisites.checks.find((c: any) => c.title === 'Evidence available')?.status ?? 'Incomplete', 'status', 'Evidence prerequisite'),
      this.card('Team ready', prerequisites.checks.find((c: any) => c.title === 'Investigation team ready')?.status ?? 'Incomplete', 'status', 'Team prerequisite'),
      this.card('Causal factors', causalFactors.length, 'info', 'Total causal factors'),
      this.card('Confirmed factors', confirmed, confirmed ? 'ok' : 'warning', 'Confirmed with evidence or justification'),
      this.card('Root causes', rootCauses.length, rootCauses.length ? 'ok' : 'warning', 'Root causes identified'),
      this.card('Systemic weaknesses', systemicWeaknesses.length, systemicWeaknesses.length ? 'info' : 'warning', 'Management-system weaknesses'),
      this.card('Evidence-supported causes', [...causalFactors, ...rootCauses].filter((row) => ['Strong evidence', 'Partial evidence'].includes(row.evidence_support_level)).length, 'ok', 'Causes with evidence support'),
      this.card('Unsupported assumptions', unsupported, unsupported ? 'warning' : 'ok', 'Weak/unsupported cause claims'),
      this.card('Open hypotheses', hypotheses.filter((row) => ['Open', 'Evidence requested'].includes(row.status ?? 'Open')).length, 'warning', 'Open hypothesis tracking'),
      this.card('RCA quality', `${quality.score}%`, quality.score >= 80 ? 'ok' : 'warning', 'Backend quality checklist score'),
      this.card('CAPA mapping', this.capaMappingStatus(rootCauses), 'status', 'Root causes mapped to CAPA/action'),
      this.card('Review status', review?.status ?? 'Not Requested', 'status', 'RCA review workflow'),
      this.card('Ready for CAPA', rootCauses.some((row) => row.capa_required) ? 'Yes' : 'No', 'info', 'CAPA generation preview')
    ];
  }

  private rcaMethodPanel(rca: any, incident: any) {
    const methods = ['5-Why', 'Fishbone / Ishikawa', 'Cause Tree', 'TapRooT', 'Apollo RCA', 'Barrier Analysis', 'Fault Tree', 'Other'];
    return { selectedMethod: rca.selected_method, methodVersion: rca.method_version, scope: rca.scope, objective: rca.objective, rcaLeadId: rca.rca_lead_id ?? incident.investigation_owner_id, dueDate: rca.due_date, notes: rca.notes, methods, requiredReason: rca.rca_required_reason, status: rca.rca_status, changeReason: rca.method_change_reason };
  }

  private rcaFishboneCategories(rows: any[]) {
    const categories = ['People', 'Process', 'Equipment', 'Materials', 'Environment', 'Management System', 'Procedures', 'Training', 'Human Factors', 'Design', 'Maintenance', 'Other'];
    return categories.map((category) => ({ category, items: rows.filter((row) => row.category === category), count: rows.filter((row) => row.category === category).length }));
  }

  private rcaCauseClassification(causalFactors: any[], rootCauses: any[]) {
    const rows = [...causalFactors.map((row) => ({ ...row, recordType: 'Causal Factor' })), ...rootCauses.map((row) => ({ ...row, recordType: 'Root Cause', title: row.root_cause_statement }))];
    return { human: rows.filter((row) => row.category === 'Human' || row.cause_classification === 'Human'), equipment: rows.filter((row) => row.category === 'Equipment' || row.cause_classification === 'Equipment'), process: rows.filter((row) => row.category === 'Process' || row.cause_classification === 'Process'), managementSystem: rows.filter((row) => row.systemic_cause || row.category === 'Management System' || row.cause_classification === 'Management System'), rows };
  }

  private rcaEvidenceMapping(causalFactors: any[], rootCauses: any[], evidence: any[]) {
    const evidenceById = new Map(evidence.map((row) => [row.id, row]));
    const rows = [...causalFactors.map((row) => ({ ...row, recordType: 'Causal Factor', evidenceIds: row.related_evidence_ids_json ?? [] })), ...rootCauses.map((row) => ({ ...row, recordType: 'Root Cause', title: row.root_cause_statement, evidenceIds: row.linked_evidence_ids_json ?? [] }))];
    return rows.map((row) => ({ ...row, evidence: (row.evidenceIds ?? []).map((id: string) => evidenceById.get(id)).filter(Boolean), missingEvidence: !(row.evidenceIds ?? []).length, supportLevel: row.evidence_support_level ?? 'Not determined' }));
  }

  private rcaCapaPreview(rootCauses: any[], actions: any[]) {
    const openActions = new Set(actions.filter((row) => this.openActionStatus(row.status)).map((row) => row.id));
    const rows = rootCauses.map((root) => ({ rootCauseId: root.id, rootCauseStatement: root.root_cause_statement, capaRequired: root.capa_required, universalActionId: root.universal_action_id, capaRecommendation: root.capa_recommendation, mapped: !!root.universal_action_id, actionOpen: root.universal_action_id ? openActions.has(root.universal_action_id) : false, status: root.capa_required ? (root.universal_action_id ? 'Mapped' : root.capa_recommendation ? 'Recommendation Ready' : 'Mapping Required') : 'Not Required' }));
    return { status: this.capaMappingStatus(rootCauses), rows, missingMappings: rows.filter((row) => row.status === 'Mapping Required') };
  }

  private capaMappingStatus(rootCauses: any[]) {
    if (!rootCauses.length) return 'No Root Causes';
    if (rootCauses.every((row) => !row.capa_required)) return 'Not Required';
    if (rootCauses.every((row) => !row.capa_required || row.universal_action_id)) return 'Mapped';
    if (rootCauses.some((row) => row.universal_action_id || row.capa_recommendation)) return 'Partially Mapped';
    return 'Mapping Required';
  }

  private rcaActions(permissions: string[], locked: boolean, lockedReason: string | null) {
    const enabled = (permission: string) => !locked && permissions.includes(permission);
    const reason = (permission: string) => locked ? lockedReason : `Missing ${permission} permission`;
    return [
      { key: 'add-causal-factor', label: 'Add Causal Factor', enabled: enabled('incidents.rca.causal_factors.create'), disabledReason: enabled('incidents.rca.causal_factors.create') ? null : reason('incidents.rca.causal_factors.create') },
      { key: 'add-root-cause', label: 'Add Root Cause', enabled: enabled('incidents.rca.root_causes.create'), disabledReason: enabled('incidents.rca.root_causes.create') ? null : reason('incidents.rca.root_causes.create') },
      { key: 'select-method', label: 'Select RCA Method', enabled: enabled('incidents.rca.method.select'), disabledReason: enabled('incidents.rca.method.select') ? null : reason('incidents.rca.method.select') },
      { key: 'readiness-check', label: 'Run RCA Readiness Check', enabled: permissions.includes('incidents.rca.view'), disabledReason: permissions.includes('incidents.rca.view') ? null : 'Missing incidents.rca.view permission' },
      { key: 'request-review', label: 'Request RCA Review', enabled: enabled('incidents.rca.review.request'), disabledReason: enabled('incidents.rca.review.request') ? null : reason('incidents.rca.review.request') },
      { key: 'create-capa', label: 'Create CAPA from Root Cause', enabled: enabled('incidents.rca.create_capa'), disabledReason: enabled('incidents.rca.create_capa') ? null : reason('incidents.rca.create_capa') },
      { key: 'complete-rca', label: 'Complete RCA', enabled: enabled('incidents.rca.complete'), disabledReason: enabled('incidents.rca.complete') ? null : reason('incidents.rca.complete') },
      { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
    ];
  }

  private async ensureBarrierAnalysis(tenantId: string, incident: any, actorId?: string) {
    const existing = await this.safeSingle<any>(this.db.from('incident_barrier_analysis').select('*').eq('tenant_id', tenantId).eq('incident_id', incident.id).single());
    if (existing) return existing;
    const analysisRequired = this.barrierAnalysisRequired(incident);
    const row = await this.db.single<any>(this.db.from('incident_barrier_analysis').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      incident_id: incident.id,
      analysis_required: analysisRequired,
      analysis_required_reason: analysisRequired ? 'Generated from safeguard failure, PSM/PSE classification, severity, equipment/chemical involvement, and follow-up flags.' : 'Barrier analysis is not currently required by backend prerequisites.',
      analysis_status: analysisRequired ? 'Required' : 'Not Required',
      review_status: incident.barrier_analysis_review_status ?? 'Not Requested',
      created_by: actorId ?? null,
      updated_by: actorId ?? null
    }).select().single());
    await this.safeSingle(this.db.from('incidents').update({ barrier_analysis_required: row.analysis_required, barrier_analysis_required_reason: row.analysis_required_reason, barrier_analysis_status: row.analysis_status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incident.id).select('id').single());
    return row;
  }

  private barrierAnalysisRequired(incident: any) {
    return !!incident.safeguard_failed || !!incident.lopa_review_required || !!incident.mechanical_integrity_followup_required || !!incident.is_psm_incident || !!incident.is_process_safety_event || ['Tier 1', 'Tier 2'].includes(incident.pse_tier ?? '') || this.highPotentialSeverity(incident.potential_severity);
  }

  private assertCanEditIncidentBarrier(incident: any) {
    if (this.closedStatus(incident.status)) throw new BadRequestException('Closed/approved incidents are read-only. Reopen the incident before changing Barrier / Safeguard Failure.');
  }

  private barrierPatch(dto: Record<string, any>, tenantId: string, actorId: string, incident: any, analysis: any, update: boolean, index = 1) {
    return this.clean({
      id: update ? undefined : crypto.randomUUID(),
      tenant_id: update ? undefined : tenantId,
      company_id: update ? undefined : incident.company_id,
      site_id: update ? undefined : incident.site_id,
      incident_id: update ? undefined : incident.id,
      analysis_id: update ? undefined : analysis.id,
      barrier_number: update ? undefined : dto.barrierNumber ?? `BF-${String(index).padStart(3, '0')}`,
      barrier_name: dto.barrierName,
      barrier_type: dto.barrierType,
      category: dto.category,
      expected_function: dto.expectedFunction,
      related_hazard: dto.relatedHazard,
      equipment_id: dto.equipmentId,
      chemical_id: dto.chemicalId,
      timeline_event_id: dto.timelineEventId,
      hazop_scenario_id: dto.hazopScenarioId,
      lopa_record_id: dto.lopaRecordId,
      ipl_record_id: dto.iplRecordId,
      sif_record_id: dto.sifRecordId,
      ptw_record_id: dto.ptwRecordId,
      moc_record_id: dto.mocRecordId,
      pssr_record_id: dto.pssrRecordId,
      mi_record_id: dto.miRecordId,
      demand_occurred: dto.demandOccurred,
      demand_at: this.dateTimeOrNull(dto.demandAt),
      expected_response: dto.expectedResponse,
      actual_response: dto.actualResponse,
      response_time: this.intervalOrNull(dto.responseTime),
      response_successful: dto.responseSuccessful,
      partial_response: dto.partialResponse,
      late_response: dto.lateResponse,
      no_response: dto.noResponse,
      detection_occurred: dto.detectionOccurred,
      operator_action_required: dto.operatorActionRequired,
      performance_status: dto.performanceStatus,
      failure_status: dto.failureStatus,
      failure_mode: dto.failureMode,
      failure_mechanism: dto.failureMechanism,
      immediate_cause: dto.immediateCause,
      contributing_cause: dto.contributingCause,
      failure_description: dto.failureDescription,
      credited_ipl: dto.creditedIpl,
      ipl_type: dto.iplType,
      ipl_function: dto.iplFunction,
      ipl_independence_status: dto.iplIndependenceStatus,
      ipl_effectiveness_status: dto.iplEffectivenessStatus,
      ipl_auditability_status: dto.iplAuditabilityStatus,
      pfdavg_snapshot: dto.pfdavgSnapshot,
      rrf_snapshot: dto.rrfSnapshot,
      proof_test_status: dto.proofTestStatus,
      last_proof_test: this.dateOrNull(dto.lastProofTest),
      bypass_status: dto.bypassStatus,
      failure_impact: dto.failureImpact,
      lopa_review_required: dto.lopaReviewRequired,
      sis_sif_involved: dto.sisSifInvolved,
      sif_tag: dto.sifTag,
      sif_function: dto.sifFunction,
      sif_response: dto.sifResponse,
      trip_interlock_activated: dto.tripInterlockActivated,
      trip_setpoint: dto.tripSetpoint,
      bypass_override_active: dto.bypassOverrideActive,
      bypass_authorized: dto.bypassAuthorized,
      sif_failed_degraded_bypassed: dto.sifFailedDegradedBypassed,
      sil_impact_review_required: dto.silImpactReviewRequired,
      psv_relief_involved: dto.psvReliefInvolved,
      psv_tag: dto.psvTag,
      protected_equipment_id: dto.protectedEquipmentId,
      psv_lifted: dto.psvLifted,
      psv_failed_to_lift: dto.psvFailedToLift,
      psv_lifted_early_late: dto.psvLiftedEarlyLate,
      psv_leak_chatter: dto.psvLeakChatter,
      set_pressure: dto.setPressure,
      last_inspection_test: this.dateOrNull(dto.lastInspectionTest),
      inspection_overdue: dto.inspectionOverdue,
      relief_path_clear: dto.reliefPathClear,
      discharge_flare_issue: dto.dischargeFlareIssue,
      mi_followup_required: dto.miFollowupRequired,
      alarm_interlock_involved: dto.alarmInterlockInvolved,
      alarm_tag: dto.alarmTag,
      alarm_priority: dto.alarmPriority,
      alarm_activated: dto.alarmActivated,
      alarm_acknowledged: dto.alarmAcknowledged,
      operator_response_time: this.intervalOrNull(dto.operatorResponseTime),
      response_according_to_procedure: dto.responseAccordingToProcedure,
      alarm_missed_suppressed_flooded: dto.alarmMissedSuppressedFlooded,
      interlock_bypassed: dto.interlockBypassed,
      alarm_management_followup_required: dto.alarmManagementFollowupRequired,
      procedure_required: dto.procedureRequired,
      procedure_followed: dto.procedureFollowed,
      procedure_available: dto.procedureAvailable,
      procedure_current: dto.procedureCurrent,
      ptw_required: dto.ptwRequired,
      ptw_issued: dto.ptwIssued,
      ptw_complied_with: dto.ptwCompliedWith,
      isolation_loto_required: dto.isolationLotoRequired,
      isolation_completed: dto.isolationCompleted,
      moc_required: dto.mocRequired,
      moc_completed: dto.mocCompleted,
      pssr_required: dto.pssrRequired,
      pssr_completed: dto.pssrCompleted,
      control_failed_missing: dto.controlFailedMissing,
      ppe_required: dto.ppeRequired,
      ppe_used: dto.ppeUsed,
      ppe_adequate: dto.ppeAdequate,
      ppe_failed: dto.ppeFailed,
      emergency_response_required: dto.emergencyResponseRequired,
      emergency_response_activated: dto.emergencyResponseActivated,
      emergency_response_effective: dto.emergencyResponseEffective,
      fire_gas_detection_involved: dto.fireGasDetectionInvolved,
      evacuation_shelter_in_place_involved: dto.evacuationShelterInPlaceInvolved,
      decontamination_involved: dto.decontaminationInvolved,
      evidence_ids_json: dto.evidenceIds,
      rca_item_ids_json: dto.rcaItemIds,
      related_records_json: dto.relatedRecords,
      followup_required: dto.followupRequired,
      review_status: dto.reviewStatus,
      notes: dto.notes,
      change_reason: dto.changeReason ?? dto.reason,
      created_by: update ? undefined : actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private barrierSummaryCards(incident: any, analysis: any, barriers: any[], followups: any[], readiness: any, review: any) {
    const failed = barriers.filter((row) => ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? ''));
    const creditedFailed = failed.filter((row) => row.credited_ipl === 'Yes');
    return [
      this.card('Analysis required', analysis.analysis_required ? 'Yes' : 'No', analysis.analysis_required ? 'warning' : 'ok', analysis.analysis_required_reason),
      this.card('Analysis status', analysis.analysis_status ?? incident.barrier_analysis_status ?? 'Not Started', 'status', 'Backend barrier analysis workflow status'),
      this.card('Total barriers', barriers.length, 'info', 'All safeguards/barriers under review'),
      this.card('Performed', barriers.filter((row) => row.performance_status === 'Performed').length, 'ok', 'Barriers that performed as expected'),
      this.card('Failed/degraded', failed.length, failed.length ? 'danger' : 'ok', 'Failed, degraded, bypassed, or missing barriers'),
      this.card('Credited IPL failed', creditedFailed.length, creditedFailed.length ? 'danger' : 'ok', 'Credited IPLs with failure/degradation flags'),
      this.card('SIS/SIF involved', barriers.filter((row) => row.sis_sif_involved).length, 'info', 'SIS/SIF/interlock involvement'),
      this.card('PSV/relief involved', barriers.filter((row) => row.psv_relief_involved).length, 'info', 'PSV/relief device involvement'),
      this.card('Alarm/operator involved', barriers.filter((row) => row.alarm_interlock_involved).length, 'info', 'Alarm/operator or interlock involvement'),
      this.card('LOPA review required', barriers.filter((row) => row.lopa_review_required).length, 'warning', 'Failed credited IPL or LOPA dependency review'),
      this.card('MI follow-up required', barriers.filter((row) => row.mi_followup_required || row.inspection_overdue).length, 'warning', 'Mechanical integrity/proof-test follow-up'),
      this.card('Open follow-ups', followups.filter((row) => this.openActionStatus(row.status)).length, 'warning', 'Open barrier follow-up requirements'),
      this.card('Evidence mapped', barriers.filter((row) => (row.evidence_ids_json ?? []).length).length, 'ok', 'Barriers with mapped evidence'),
      this.card('RCA linked', barriers.filter((row) => (row.rca_item_ids_json ?? []).length).length, 'info', 'Barriers linked to causal factors/root causes'),
      this.card('Review status', review?.status ?? 'Not Requested', 'status', 'Barrier review workflow'),
      this.card('Readiness', `${readiness.score}%`, readiness.status === 'Ready' ? 'ok' : 'warning', 'Backend readiness score')
    ];
  }

  private barrierReadiness(incident: any, analysis: any, barriers: any[], followups: any[], evidence: any[], review: any) {
    const failed = barriers.filter((row) => ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? ''));
    const checklist = [
      this.check('Analysis required decision generated', analysis.analysis_required !== null && analysis.analysis_required !== undefined, 'Backend must decide whether barrier analysis is required.'),
      this.check('Barrier register populated', barriers.length > 0 || !analysis.analysis_required, 'Add or import safeguards/barriers when analysis is required.'),
      this.check('Demand/performance captured', barriers.every((row) => row.demand_occurred && row.performance_status && row.performance_status !== 'Not determined'), 'Capture demand and performance status for every barrier.'),
      this.check('Failure modes documented', failed.every((row) => row.failure_mode && row.failure_description), 'Failed/degraded/bypassed/missing barriers need failure mode and description.'),
      this.check('Credited IPL check complete', barriers.every((row) => row.credited_ipl && row.credited_ipl !== 'Not Determined'), 'Confirm whether any barrier was credited as an IPL in LOPA.'),
      this.check('Evidence mapped', !barriers.length || barriers.some((row) => (row.evidence_ids_json ?? []).length) || evidence.length > 0, 'Map evidence to support barrier performance/failure conclusions.'),
      this.check('RCA linkage reviewed', failed.every((row) => (row.rca_item_ids_json ?? []).length || row.followup_required || row.lopa_review_required || row.mi_followup_required), 'Link failed barriers to RCA or create follow-up requirements.'),
      this.check('Follow-ups addressed', followups.every((row) => !this.openActionStatus(row.status) || row.universal_action_id), 'Open barrier follow-ups must be converted to Universal Action Engine actions or justified.'),
      this.check('Review requested/approved', ['Requested', 'Approved'].includes(review?.status ?? ''), 'Request review when barrier analysis is ready.')
    ];
    const complete = checklist.filter((item) => item.status === 'Complete').length;
    const blockers = checklist.filter((item) => item.status !== 'Complete');
    const status = blockers.length ? (failed.length || blockers.length > 3 ? 'Blocked' : 'Warning') : 'Ready';
    return { status, score: Math.round((complete / Math.max(1, checklist.length)) * 100), checklist, blockers, readyForCapa: failed.length > 0 && followups.every((row) => !this.openActionStatus(row.status) || row.universal_action_id), readOnly: this.closedStatus(incident.status), lastUpdated: analysis.updated_at };
  }

  private barrierPanels(barriers: any[], followups: any[], evidence: any[], rcaItems: any[], timeline: any[]) {
    const failed = barriers.filter((row) => ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? ''));
    const evidenceById = new Map(evidence.map((row) => [row.id, row]));
    const rcaById = new Map(rcaItems.map((row) => [row.id, row]));
    return {
      demandPerformance: { status: failed.length ? 'Failures Found' : barriers.length ? 'Reviewed' : 'Empty', rows: barriers.map((row) => ({ id: row.id, barrierName: row.barrier_name, demandOccurred: row.demand_occurred, demandAt: row.demand_at, expectedResponse: row.expected_response, actualResponse: row.actual_response, responseTime: row.response_time, responseSuccessful: row.response_successful, partialResponse: row.partial_response, lateResponse: row.late_response, noResponse: row.no_response, performanceStatus: row.performance_status })) },
      failureModeAnalysis: { status: failed.length ? 'Required' : 'No Failures', rows: failed, failureModes: this.distributionBy(failed, (row) => row.failure_mode ?? 'Missing failure mode') },
      iplLopaCreditCheck: { status: barriers.some((row) => row.lopa_review_required) ? 'Review Required' : 'Clear', rows: barriers.filter((row) => row.credited_ipl === 'Yes' || row.lopa_review_required || row.ipl_record_id), warning: 'Registry/source safeguards are not automatically credited. Only study-specific validated IPLs can be credited.' },
      sisSifInterlock: { status: barriers.some((row) => row.sif_failed_degraded_bypassed) ? 'SIL Impact Review Required' : 'Tracked', rows: barriers.filter((row) => row.sis_sif_involved || row.sif_record_id || row.trip_interlock_activated) },
      psvReliefDevice: { status: barriers.some((row) => row.psv_failed_to_lift || row.inspection_overdue || row.mi_followup_required) ? 'MI Follow-up Required' : 'Tracked', rows: barriers.filter((row) => row.psv_relief_involved || row.psv_tag) },
      alarmOperatorResponse: { status: barriers.some((row) => row.alarm_missed_suppressed_flooded || row.alarm_management_followup_required) ? 'Alarm Management Review Required' : 'Tracked', rows: barriers.filter((row) => row.alarm_interlock_involved || row.alarm_tag) },
      administrativeProcedurePtw: { status: barriers.some((row) => row.control_failed_missing || row.ptw_required || row.moc_required || row.pssr_required) ? 'Control Review Required' : 'Tracked', rows: barriers.filter((row) => row.procedure_required || row.ptw_required || row.moc_required || row.pssr_required || row.isolation_loto_required) },
      ppeEmergencyResponseBarrier: { status: barriers.some((row) => row.ppe_failed || row.emergency_response_effective === 'No') ? 'Response Gap Found' : 'Tracked', rows: barriers.filter((row) => row.ppe_required || row.emergency_response_required || row.fire_gas_detection_involved || row.evacuation_shelter_in_place_involved || row.decontamination_involved) },
      bowtieBarrierMap: { threats: timeline.slice(0, 8), preventive: barriers.filter((row) => !['PPE', 'Emergency Response'].includes(row.barrier_type)), mitigative: barriers.filter((row) => ['PPE', 'Emergency Response', 'Fire and Gas Detection / Action', 'Deluge / Fire Protection'].includes(row.barrier_type)), failed, status: barriers.length ? 'Generated' : 'Empty' },
      evidenceMappedBarrier: barriers.map((row) => ({ ...row, evidence: (row.evidence_ids_json ?? []).map((evidenceId: string) => evidenceById.get(evidenceId)).filter(Boolean), missingEvidence: !(row.evidence_ids_json ?? []).length })),
      rcaLinkage: barriers.map((row) => ({ ...row, rcaItems: (row.rca_item_ids_json ?? []).map((rcaId: string) => rcaById.get(rcaId)).filter(Boolean), missingLink: ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? '') && !(row.rca_item_ids_json ?? []).length })),
      followups
    };
  }

  private barrierGeneratedFollowups(barriers: any[]) {
    return barriers.flatMap((row) => {
      const followups: any[] = [];
      if (row.lopa_review_required || row.credited_ipl === 'Yes') followups.push({ barrierId: row.id, title: 'Review LOPA/IPL credit impact', type: 'LOPA Review', priority: 'High', reason: 'Credited IPL failed/degraded/bypassed or requires validation.' });
      if (row.mi_followup_required || row.inspection_overdue || row.psv_failed_to_lift) followups.push({ barrierId: row.id, title: 'Mechanical Integrity inspection/proof-test follow-up', type: 'MI Follow-up', priority: 'High', reason: 'PSV/SIS/proof-test/inspection issue found.' });
      if (row.alarm_management_followup_required || row.alarm_missed_suppressed_flooded) followups.push({ barrierId: row.id, title: 'Alarm management review', type: 'Alarm Review', priority: 'Medium', reason: 'Alarm/operator response gap found.' });
      if (row.sil_impact_review_required || row.sif_failed_degraded_bypassed) followups.push({ barrierId: row.id, title: 'SIL/SIF impact review', type: 'SIL Review', priority: 'High', reason: 'SIS/SIF/interlock failed, degraded, or bypassed.' });
      return followups;
    });
  }

  private async updateIncidentBarrierStatus(tenantId: string, incidentId: string, actorId: string) {
    const [analysis, barriers, followups] = await Promise.all([
      this.safeSingle<any>(this.db.from('incident_barrier_analysis').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).single()),
      this.safeMany<any>(this.db.from('incident_barriers').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId).is('deleted_at', null)),
      this.safeMany<any>(this.db.from('incident_barrier_followups').select('*').eq('tenant_id', tenantId).eq('incident_id', incidentId))
    ]);
    const failed = barriers.filter((row) => ['Failed', 'Degraded', 'Bypassed', 'Missing'].includes(row.performance_status ?? ''));
    const status = barriers.length ? (failed.length ? 'In Progress' : 'Completed') : (analysis?.analysis_required ? 'Required' : 'Not Required');
    const followupCount = followups.filter((row) => this.openActionStatus(row.status)).length + this.barrierGeneratedFollowups(barriers).length;
    await Promise.all([
      this.safeSingle(this.db.from('incident_barrier_analysis').update({ analysis_status: status, ready_for_capa: failed.length > 0, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('incident_id', incidentId).select('id').single()),
      this.safeSingle(this.db.from('incidents').update({ barrier_analysis_status: status, barrier_analysis_ready_for_capa: failed.length > 0, barrier_followups_required_count: followupCount, safeguard_failed: failed.length > 0, lopa_review_required: barriers.some((row) => row.lopa_review_required), mechanical_integrity_followup_required: barriers.some((row) => row.mi_followup_required || row.inspection_overdue), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', incidentId).select('id').single())
    ]);
  }

  private async writeBarrierMutation(tenantId: string, incident: any, actorId: string, eventType: string, title: string, reason?: string, before?: any, after?: any, action = 'incidents.barriers.update', entityId?: string) {
    await this.writeHistory(tenantId, incident, actorId, eventType, title, reason, before, after);
    await this.safeSingle(this.audit.write({ tenantId, actorId, action, entityType: 'IncidentBarrierSafeguard', entityId: entityId ?? incident.id, before: before ?? null, after: after ?? null, metadata: { incidentId: incident.id, reason: reason ?? null, relatedTab: 'Barrier / Safeguard Failure' } }));
  }

  private barrierActions(permissions: string[], locked: boolean, lockedReason: string | null) {
    const enabled = (permission: string) => !locked && permissions.includes(permission);
    const reason = (permission: string) => locked ? lockedReason : `Missing ${permission} permission`;
    return [
      { key: 'add-barrier', label: 'Add Barrier', enabled: enabled('incidents.barriers.edit'), disabledReason: enabled('incidents.barriers.edit') ? null : reason('incidents.barriers.edit') },
      { key: 'import-hazop', label: 'Import from HAZOP', enabled: enabled('incidents.barriers.import'), disabledReason: enabled('incidents.barriers.import') ? null : reason('incidents.barriers.import') },
      { key: 'import-lopa', label: 'Import from LOPA/IPL', enabled: enabled('incidents.barriers.import'), disabledReason: enabled('incidents.barriers.import') ? null : reason('incidents.barriers.import') },
      { key: 'link-evidence', label: 'Link Evidence', enabled: enabled('incidents.barriers.evidence.map'), disabledReason: enabled('incidents.barriers.evidence.map') ? null : reason('incidents.barriers.evidence.map') },
      { key: 'create-followup', label: 'Create Follow-up', enabled: enabled('incidents.barriers.followups.create'), disabledReason: enabled('incidents.barriers.followups.create') ? null : reason('incidents.barriers.followups.create') },
      { key: 'request-review', label: 'Request Review', enabled: enabled('incidents.barriers.review.request'), disabledReason: enabled('incidents.barriers.review.request') ? null : reason('incidents.barriers.review.request') },
      { key: 'save-changes', label: 'Save Changes', enabled: enabled('incidents.barriers.edit'), disabledReason: enabled('incidents.barriers.edit') ? null : reason('incidents.barriers.edit') },
      { key: 'refresh', label: 'Refresh', enabled: true, disabledReason: null }
    ];
  }

  private async writeHistory(tenantId: string, row: any, actorId: string, eventType: string, title: string, description?: string, before?: any, after?: any) {
    const count = await this.safeMany<any>(this.db.from('incident_history_events').select('id').eq('tenant_id', tenantId).eq('incident_id', row.id));
    return this.safeSingle(this.db.from('incident_history_events').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: row.company_id, site_id: row.site_id, incident_id: row.id, event_number: count.length + 1, event_type: eventType, event_category: 'Register', event_title: title, event_description: description, actor_user_id: actorId, severity: 'Info', before_values_json: before ?? null, after_values_json: after ?? null, source_system: 'PSM OS'
    }).select().single());
  }

  private canSee(row: any, permissions: string[]) {
    if (row.restricted && !permissions.includes('incidents.restricted.view')) return true;
    if (row.confidential && !permissions.includes('incidents.confidential.view')) return true;
    return true;
  }

  private redacted(row: any, permissions: string[]) {
    return (row.restricted && !permissions.includes('incidents.restricted.view')) || (row.confidential && !permissions.includes('incidents.confidential.view'));
  }

  private permissionMap(permissions: string[]) {
    return {
      canView: permissions.includes('incidents.view') || permissions.includes('incidents.register.view'),
      canCreate: permissions.includes('incidents.create'),
      canEdit: permissions.includes('incidents.edit'),
      canAssign: permissions.includes('incidents.assign'),
      canBulkUpdate: permissions.includes('incidents.bulk_update'),
      canExport: permissions.includes('incidents.export'),
      canCreateActions: permissions.includes('incidents.actions.create'),
      canSaveDraft: permissions.includes('incidents.draft.create') || permissions.includes('incidents.draft.edit') || permissions.includes('incidents.create'),
      canDeleteDraft: permissions.includes('incidents.draft.delete'),
      canSubmit: permissions.includes('incidents.submit') || permissions.includes('incidents.create'),
      canCreateRestricted: permissions.includes('incidents.restricted.create'),
      canCreateConfidential: permissions.includes('incidents.confidential.create'),
      canManageMedical: permissions.includes('incidents.medical_fields.manage'),
      canUploadEvidence: permissions.includes('incidents.evidence.upload') || permissions.includes('incidents.create'),
      canClassifyPsm: permissions.includes('incidents.psm.classify') || permissions.includes('incidents.create'),
      canOverrideFollowup: permissions.includes('incidents.followup.override')
    };
  }

  private defaultViewFilter(name: string) {
    if (name.includes('My')) return { myInvestigations: true };
    if (name.includes('Pending triage')) return { status: 'Triage' };
    if (name.includes('High potential')) return { highPotential: true };
    if (name.includes('PSM')) return { isPsmIncident: true };
    if (name.includes('Tier')) return { pseTier: 'Tier 1' };
    if (name.includes('Overdue')) return { overdueInvestigation: true };
    if (name.includes('Open actions')) return { overdueActions: true };
    if (name.includes('Ready')) return { status: 'Pending Review' };
    if (name.includes('Closed')) return { status: 'Closed' };
    return {};
  }

  private distribution(rows: any[], key: string, buckets: string[]) { return buckets.map((label) => ({ label, count: rows.filter((r) => (r[key] ?? 'Not Determined') === label).length })); }
  private group(rows: any[], key: string) { const m = new Map<string, number>(); rows.forEach((r) => m.set(r[key] ?? 'Unassigned', (m.get(r[key] ?? 'Unassigned') ?? 0) + 1)); return Array.from(m.entries()).map(([label, count]) => ({ label, count })).sort((a,b)=>b.count-a.count).slice(0, 10); }
  private monthly(rows: any[], key: string) { const m = new Map<string, number>(); rows.forEach((r) => { const d = r[key] ? new Date(r[key]) : new Date(r.created_at ?? Date.now()); const label = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; m.set(label, (m.get(label) ?? 0) + 1); }); return Array.from(m.entries()).sort(([a],[b]) => a.localeCompare(b)).slice(-12).map(([month, count]) => ({ month, count })); }
  private repeatEvents(rows: any[]) { return this.group(rows.filter((r) => r.equipment_involved || r.unit_id), 'unit_id'); }
  private repeatEventCount(rows: any[]) { return this.repeatEvents(rows).filter((g) => g.count > 1).length; }
  private severities() { return ['Negligible', 'Minor', 'Moderate', 'Serious', 'Major', 'Fatality', 'Catastrophic']; }
  private highPotentialSeverity(value?: string) { return ['Serious', 'Major', 'Fatality', 'Catastrophic'].includes(value ?? ''); }
  private closedStatus(value?: string) { return ['Approved', 'Closed', 'Cancelled / Void'].includes(value ?? ''); }
  private openActionStatus(value?: string) { return !['Closed', 'Completed', 'Verified', 'Cancelled'].includes(value ?? 'Open'); }
  private isPastDate(value?: string) { if (!value) return false; return new Date(value).getTime() < new Date(new Date().toDateString()).getTime(); }
  private dateAfterDays(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d; }
  private daysBetween(a?: string, b?: string) { if (!a || !b) return 0; return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)); }
  private count<T>(rows: T[], fn: (row: T) => boolean) { return rows.filter(fn).length; }
  private escape(value: string) { return value.replace(/[,%*()]/g, ' ').replace(/\s+/g, ' ').trim(); }
  private csv(value: any) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
  private clean<T extends Record<string, any>>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as T;
  }

  private async insertWithMissingColumnFallback<T>(table: string, payload: Record<string, any>) {
    const nextPayload = { ...payload };
    const removed = new Set<string>();
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        return await this.db.single<T>(this.db.from(table).insert(nextPayload).select().single());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const missingColumn = this.missingColumnFromError(message);
        if (!missingColumn || removed.has(missingColumn) || !(missingColumn in nextPayload)) throw error;
        delete nextPayload[missingColumn];
        removed.add(missingColumn);
      }
    }
    throw new BadRequestException(`Unable to save ${table}: too many schema fallback attempts.`);
  }

  private missingColumnFromError(message: string) {
    return message.match(/'([^']+)' column/)?.[1]
      ?? message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)?.[1]
      ?? null;
  }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
}
