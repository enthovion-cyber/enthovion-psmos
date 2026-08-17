import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { CreateEquipmentDto } from '../equipment/dto/create-equipment.dto';
import { EquipmentFilterDto } from '../equipment/dto/equipment-filter.dto';
import { UpdateEquipmentDto } from '../equipment/dto/update-equipment.dto';
import { UploadEquipmentDocumentDto } from '../equipment/dto/upload-equipment-document.dto';
import { EquipmentService } from '../equipment/equipment.service';

type RegistryQuery = EquipmentFilterDto & Record<string, string | undefined>;

const statusValues = ['Draft', 'Active', 'In Service', 'Standby', 'Out of Service', 'Under Maintenance', 'Under Inspection', 'Impaired', 'Bypassed', 'Restricted Service', 'Not Fit for Service', 'Startup Blocked', 'Archived', 'Decommissioned'];
const legacyStatusValues = ['ACTIVE', 'INACTIVE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'];
const criticalityValues = ['LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'];
const fitnessValues = ['Fit for Service', 'Fit with Restrictions', 'Not Fit for Service', 'Out of Service', 'Startup Blocked', 'Not Evaluated'];

@Injectable()
export class MechanicalIntegrityService {
  constructor(
    private readonly db: SupabaseService,
    private readonly equipment: EquipmentService,
    private readonly audit: AuditService
  ) {}

  async dashboard(user: RequestUser) {
    const equipment = await this.equipmentRows(user, {});
    const inspectionPlans = await this.scopedInspectionPlans(user, {}).catch(() => []);
    const reliefDevices = await this.reliefDeviceRows(user, {}).catch(() => []);
    const recentActivity = await this.recentActivity(user);
    const [inspectionRecords, cmlAlerts, pmPlans, pmRecords, calibrationPlans, calibrationRecords, safeguardTests, impairments, deficiencies, deviations, workOrders, readinessAssessments, documents, generatedReports, exportJobs] = await Promise.all([
      this.scopedMiRows(user, 'mi_inspection_records'),
      this.scopedMiRows(user, 'mi_cml_alerts'),
      this.scopedMiRows(user, 'mi_pm_plans'),
      this.scopedMiRows(user, 'mi_pm_records'),
      this.scopedMiRows(user, 'mi_calibration_plans'),
      this.scopedMiRows(user, 'mi_calibration_records'),
      this.scopedMiRows(user, 'mi_safeguard_tests'),
      this.scopedMiRows(user, 'mi_safeguard_impairments'),
      this.scopedMiRows(user, 'mi_deficiencies'),
      this.scopedMiRows(user, 'mi_deviations'),
      this.scopedMiRows(user, 'mi_work_orders'),
      this.scopedMiRows(user, 'mi_readiness_assessments'),
      this.scopedMiRows(user, 'mi_document_links'),
      this.scopedMiRows(user, 'mi_generated_reports'),
      this.scopedMiRows(user, 'mi_export_jobs')
    ]);
    const now = Date.now();
    const overdueInspections = equipment.filter((item) => this.isPast(item.nextInspectionDueDate));
    const upcomingInspections = equipment.filter((item) => this.isWithin(item.nextInspectionDueDate, 30, now));
    const overduePm = equipment.filter((item) => this.isPast(item.nextPmDueDate));
    const overdueCal = equipment.filter((item) => this.isPast(item.nextCalibrationDueDate));
    const overdueRelief = reliefDevices.filter((item) => item.dueStatus === 'Overdue');
    const upcomingRelief = reliefDevices.filter((item) => this.isWithin(item.nextTestDueDate ?? item.next_test_due_date, 30, now));
    const activeBypasses = equipment.filter((item) => item.bypassActive || item.status === 'BYPASSED' || item.status === 'Impaired' || item.status === 'Bypassed');
    const openDeficiencies = equipment.filter((item) => Number(item.openDeficiencyCount ?? 0) > 0 || item.status === 'Not Fit for Service');
    const criticalEquipment = equipment.filter((item) => item.safetyCritical || item.criticality === 'SAFETY_CRITICAL' || item.criticality === 'HIGH');
    const psmCriticalEquipment = equipment.filter((item) => item.psmCritical || item.psm_critical || item.psmCriticalEquipment);
    const notFit = equipment.filter((item) => item.fitnessStatus === 'Not Fit for Service' || item.status === 'Not Fit for Service' || item.status === 'OUT_OF_SERVICE');
    const startupBlocked = equipment.filter((item) => item.startupBlocked || item.status === 'Startup Blocked');
    const fitWithRestrictions = equipment.filter((item) => this.fitness(item) === 'Fit with Restrictions');
    const failedInspections = inspectionRecords.filter((row) => /fail|failed|not fit/i.test(`${row.result ?? row.overall_result ?? row.overall_fitness_status ?? row.status ?? ''}`));
    const lowRemainingLife = equipment.filter((item) => Number(item.remainingLifeYears ?? item.remaining_life_years ?? item.minimumRemainingLifeYears ?? 9999) <= 1);
    const cmlBelowAlert = cmlAlerts.filter((row) => /alert|below/i.test(`${row.alert_state ?? row.alertStatus ?? row.status ?? ''}`));
    const cmlBelowMinimum = cmlAlerts.filter((row) => /minimum|critical|min/i.test(`${row.alert_state ?? row.alertStatus ?? row.alert_type ?? ''}`));
    const pmDue = pmPlans.filter((row) => this.isWithin(row.next_due_date ?? row.current_next_due_date, 30, now));
    const pmOverdue = pmPlans.filter((row) => this.isPast(row.next_due_date ?? row.current_next_due_date) || /overdue/i.test(`${row.due_status ?? row.current_due_status ?? ''}`));
    const failedPm = pmRecords.filter((row) => /fail|failed/i.test(`${row.result ?? row.final_result ?? row.status ?? ''}`));
    const calibrationDue = calibrationPlans.filter((row) => this.isWithin(row.next_due_date ?? row.current_next_due_date, 30, now));
    const calibrationOverdue = calibrationPlans.filter((row) => this.isPast(row.next_due_date ?? row.current_next_due_date) || /overdue/i.test(`${row.due_status ?? row.current_due_status ?? ''}`));
    const failedCalibration = calibrationRecords.filter((row) => /fail|failed/i.test(`${row.result ?? row.final_result ?? row.status ?? ''}`));
    const missingCalibrationCertificates = calibrationRecords.filter((row) => !row.calibration_certificate_document_id && !row.certificate_document_id);
    const failedSafeguardTests = safeguardTests.filter((row) => /fail|failed/i.test(`${row.final_result ?? row.result ?? row.status ?? ''}`));
    const activeSafeguardBypass = impairments.filter((row) => /active|approved|open/i.test(`${row.status ?? row.impairment_status ?? ''}`));
    const expiredImpairments = impairments.filter((row) => this.isPast(row.expiry_at ?? row.expiry_date ?? row.required_restore_by));
    const degradedSafeguards = safeguardTests.filter((row) => /degraded|partial|conditional/i.test(`${row.final_result ?? row.result ?? row.status ?? ''}`));
    const criticalDeficiencies = deficiencies.filter((row) => /critical/i.test(`${row.severity ?? row.risk_rank ?? row.priority ?? ''}`));
    const overdueDeficiencies = deficiencies.filter((row) => this.isPast(row.due_date ?? row.target_due_date) || /overdue/i.test(`${row.status ?? ''}`));
    const activeDeviations = deviations.filter((row) => /active|approved|open/i.test(`${row.status ?? ''}`));
    const expiredDeviations = deviations.filter((row) => this.isPast(row.expiry_date ?? row.expiry_at));
    const openWorkOrders = workOrders.filter((row) => !/closed|completed|cancelled|verified/i.test(`${row.status ?? ''}`));
    const overdueWorkOrders = workOrders.filter((row) => this.isPast(row.due_date ?? row.target_due_date));
    const pendingVerificationWork = workOrders.filter((row) => /pending verification|verification/i.test(`${row.status ?? row.verification_status ?? ''}`));
    const pendingReadinessApprovals = readinessAssessments.filter((row) => /pending|submitted|review/i.test(`${row.approval_status ?? row.status ?? ''}`));
    const startupBlockers = readinessAssessments.filter((row) => row.startup_blocked || /startup blocked|blocked/i.test(`${row.readiness_status ?? row.status ?? ''}`));
    const pendingApprovals = [...inspectionRecords, ...pmRecords, ...calibrationRecords, ...readinessAssessments].filter((row) => /pending|submitted|review/i.test(`${row.approval_status ?? row.review_status ?? row.status ?? ''}`));
    const missingRequiredDocuments = documents.filter((row) => row.required && !row.document_id);
    const expiredDocuments = documents.filter((row) => this.isPast(row.expiry_date ?? row.expires_at));
    const failedExportJobs = exportJobs.filter((row) => /fail|failed|error/i.test(`${row.status ?? ''}`));

    return {
      header: {
        title: 'Mechanical Integrity',
        subtitle: 'Asset health, inspection readiness, deficiencies, and safety-critical equipment status',
        activeSiteId: user.selectedSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      kpis: [
        this.kpi('Total Equipment', equipment.length),
        this.kpi('Active Equipment', equipment.filter((item) => ['ACTIVE', 'Active', 'In Service'].includes(item.status)).length, 'Normal operations'),
        this.kpi('Critical Equipment', criticalEquipment.length, 'Safety and high criticality'),
        this.kpi('Safety-Critical Equipment', equipment.filter((item) => item.safetyCritical).length, 'Backend scoped safety-critical equipment'),
        this.kpi('PSM-Critical Equipment', psmCriticalEquipment.length, 'Backend scoped PSM-critical equipment'),
        this.kpi('Out of Service Equipment', equipment.filter((item) => ['OUT_OF_SERVICE', 'Out of Service'].includes(item.status)).length),
        this.kpi('Fit for Service', equipment.filter((item) => this.fitness(item) === 'Fit for Service').length),
        this.kpi('Fit with Restrictions', fitWithRestrictions.length),
        this.kpi('Not Fit for Service', notFit.length, undefined, notFit.length ? 'danger' : 'neutral'),
        this.kpi('Startup Blocked', startupBlocked.length, undefined, startupBlocked.length ? 'danger' : 'neutral'),
        this.kpi('Inspection Due', overdueInspections.concat(upcomingInspections).length, 'Due soon plus overdue inspections', overdueInspections.length ? 'warning' : 'neutral'),
        this.kpi('Overdue Inspections', overdueInspections.length, undefined, overdueInspections.length ? 'warning' : 'neutral'),
        this.kpi('Failed Inspections', failedInspections.length, undefined, failedInspections.length ? 'danger' : 'neutral'),
        this.kpi('Low Remaining Life', lowRemainingLife.length, 'Remaining life at or below configured low threshold', lowRemainingLife.length ? 'warning' : 'neutral'),
        this.kpi('CML Below Alert', cmlBelowAlert.length, undefined, cmlBelowAlert.length ? 'warning' : 'neutral'),
        this.kpi('CML Below Minimum', cmlBelowMinimum.length, undefined, cmlBelowMinimum.length ? 'danger' : 'neutral'),
        this.kpi('Total Inspection Plans', inspectionPlans.length),
        this.kpi('Approved Inspection Plans', inspectionPlans.filter((plan) => plan.status === 'Approved' || plan.status === 'Active').length),
        this.kpi('Equipment Without Approved Plan', Math.max(equipment.length - new Set(inspectionPlans.filter((plan) => ['Approved', 'Active'].includes(plan.status)).map((plan) => plan.equipment_id)).size, 0), undefined, 'warning'),
        this.kpi('Scheduler Errors', inspectionPlans.filter((plan) => /error|required|insufficient/i.test(String(plan.current_scheduler_status ?? ''))).length, undefined, 'warning'),
        this.kpi('Remaining-Life Driven Inspections', inspectionPlans.filter((plan) => /remaining|half/i.test(String(plan.current_due_basis ?? ''))).length),
        this.kpi('Upcoming Inspections', upcomingInspections.length),
        this.kpi('PM Due', pmDue.length),
        this.kpi('Overdue PM Tasks', overduePm.length, undefined, overduePm.length ? 'warning' : 'neutral'),
        this.kpi('PM Overdue', pmOverdue.length, undefined, pmOverdue.length ? 'warning' : 'neutral'),
        this.kpi('Failed PM', failedPm.length, undefined, failedPm.length ? 'danger' : 'neutral'),
        this.kpi('Calibration Due', calibrationDue.length),
        this.kpi('Overdue Calibrations', overdueCal.length, undefined, overdueCal.length ? 'warning' : 'neutral'),
        this.kpi('Calibration Overdue', calibrationOverdue.length, undefined, calibrationOverdue.length ? 'warning' : 'neutral'),
        this.kpi('Failed Calibration', failedCalibration.length, undefined, failedCalibration.length ? 'danger' : 'neutral'),
        this.kpi('Missing Calibration Certificates', missingCalibrationCertificates.length, undefined, missingCalibrationCertificates.length ? 'warning' : 'neutral'),
        this.kpi('PSV Tests Due', overdueRelief.concat(upcomingRelief).length, undefined, overdueRelief.length ? 'warning' : 'neutral'),
        this.kpi('PSV Tests Overdue', overdueRelief.length, undefined, overdueRelief.length ? 'warning' : 'neutral'),
        this.kpi('Failed PSV Tests', reliefDevices.filter((item) => /fail|failed/i.test(`${item.lastTestResult ?? item.last_test_result ?? item.status ?? ''}`)).length),
        this.kpi('PSV Impaired', reliefDevices.filter((item) => item.impaired || /impaired|bypassed/i.test(`${item.status ?? ''}`)).length),
        this.kpi('PSV Seal Issues', reliefDevices.filter((item) => /broken|missing|issue/i.test(`${item.sealStatus ?? item.seal_status ?? ''}`)).length),
        this.kpi('SIS Proof Tests Due', equipment.filter((item) => String(item.type ?? '').toLowerCase().includes('sis')).length),
        this.kpi('Proof Tests Overdue', safeguardTests.filter((row) => this.isPast(row.next_due_date ?? row.due_date) || /overdue/i.test(`${row.due_status ?? ''}`)).length),
        this.kpi('Failed Safeguard Tests', failedSafeguardTests.length, undefined, failedSafeguardTests.length ? 'danger' : 'neutral'),
        this.kpi('Critical Alarm / Interlock Tests Due', equipment.filter((item) => ['alarm', 'interlock'].some((term) => String(item.type ?? '').toLowerCase().includes(term))).length),
        this.kpi('Degraded Safeguards', degradedSafeguards.length, undefined, degradedSafeguards.length ? 'warning' : 'neutral'),
        this.kpi('Active Bypasses / Impairments', activeBypasses.length, undefined, activeBypasses.length ? 'danger' : 'neutral'),
        this.kpi('Expired Bypasses', equipment.filter((item) => this.isPast(item.nextImpairmentExpiryAt)).length),
        this.kpi('Active Safeguard Bypass', activeSafeguardBypass.length, undefined, activeSafeguardBypass.length ? 'danger' : 'neutral'),
        this.kpi('Expired Impairments', expiredImpairments.length, undefined, expiredImpairments.length ? 'danger' : 'neutral'),
        this.kpi('Open Deficiencies', openDeficiencies.length, undefined, openDeficiencies.length ? 'warning' : 'neutral'),
        this.kpi('Critical Deficiencies', criticalDeficiencies.length || equipment.filter((item) => Number(item.criticalDeficiencyCount ?? 0) > 0).length, undefined, 'danger'),
        this.kpi('Overdue Deficiencies', overdueDeficiencies.length, undefined, overdueDeficiencies.length ? 'warning' : 'neutral'),
        this.kpi('Active Deviations', activeDeviations.length),
        this.kpi('Expired Deviations', expiredDeviations.length, undefined, expiredDeviations.length ? 'danger' : 'neutral'),
        this.kpi('Open Work Orders', openWorkOrders.length),
        this.kpi('Overdue Work Orders', overdueWorkOrders.length, undefined, overdueWorkOrders.length ? 'warning' : 'neutral'),
        this.kpi('Pending Verification', pendingVerificationWork.length),
        this.kpi('Pending Readiness Approval', pendingReadinessApprovals.length),
        this.kpi('Startup Blockers', startupBlockers.length, undefined, startupBlockers.length ? 'danger' : 'neutral'),
        this.kpi('Pending Approvals', pendingApprovals.length),
        this.kpi('Missing Required Documents', missingRequiredDocuments.length, undefined, missingRequiredDocuments.length ? 'warning' : 'neutral'),
        this.kpi('Expired Documents', expiredDocuments.length, undefined, expiredDocuments.length ? 'warning' : 'neutral'),
        this.kpi('Reports Generated', generatedReports.filter((row) => /generated|completed|ready/i.test(`${row.status ?? ''}`)).length),
        this.kpi('Export Jobs Failed', failedExportJobs.length, undefined, failedExportJobs.length ? 'danger' : 'neutral'),
        this.kpi('Linked Open MOCs / PSSRs / Incidents', equipment.reduce((sum, item) => sum + Number(item.linkedPsmRecordsCount ?? 0), 0))
      ],
      criticalAttention: [
        ...criticalEquipment.filter((item) => ['OUT_OF_SERVICE', 'Out of Service'].includes(item.status)).map((item) => this.attention(item, 'Critical equipment out of service', 'Critical')),
        ...notFit.map((item) => this.attention(item, 'Equipment not fit for service', 'Critical')),
        ...startupBlocked.map((item) => this.attention(item, 'Startup blocked equipment', 'Critical')),
        ...activeBypasses.map((item) => this.attention(item, 'Active bypass or impairment', item.safetyCritical ? 'Critical' : 'High')),
        ...overdueInspections.filter((item) => item.safetyCritical || item.criticality === 'SAFETY_CRITICAL').map((item) => this.attention(item, 'Overdue inspection for critical equipment', 'High')),
        ...overdueRelief.map((item) => ({ equipmentId: item.id, equipmentTag: item.deviceTag ?? item.device_tag, equipmentName: item.deviceName ?? item.device_name, site: item.site_id, unit: item.unit_id, area: item.area_id, issueType: 'Overdue PSV / relief device test', severity: item.safetyCritical ? 'Critical' : 'High', dueDate: item.nextTestDueDate ?? item.next_test_due_date, href: `/mechanical-integrity/relief-devices/${item.id}` }))
      ].slice(0, 20),
      charts: {
        byStatus: this.distribution(equipment, (item) => item.status ?? 'Unknown'),
        byCriticality: this.distribution(equipment, (item) => item.criticality ?? 'Unknown'),
        byType: this.distribution(equipment, (item) => item.type ?? 'Unknown'),
        byFitness: this.distribution(equipment, (item) => this.fitness(item)),
        bySiteUnitArea: this.distribution(equipment, (item) => [item.site?.name, item.unit?.name, item.area?.name].filter(Boolean).join(' / ') || item.siteId || 'Unassigned'),
        inspectionDue: [
          { label: 'Overdue', count: overdueInspections.length },
          { label: 'Next 30 days', count: upcomingInspections.length },
          { label: 'No date configured', count: equipment.filter((item) => !item.nextInspectionDueDate).length }
        ],
        deficiencySeverity: [
          { label: 'Critical', count: equipment.filter((item) => Number(item.criticalDeficiencyCount ?? 0) > 0).length },
          { label: 'Open', count: openDeficiencies.length }
        ]
      },
      dueSoon: { inspections: overdueInspections.concat(upcomingInspections).slice(0, 10), pm: overduePm.slice(0, 10), calibrations: overdueCal.slice(0, 10), reliefDevices: overdueRelief.concat(upcomingRelief).slice(0, 10) },
      bypasses: activeBypasses.slice(0, 10),
      deficiencies: openDeficiencies.slice(0, 10),
      recentActivity
    };
  }

  async registry(user: RequestUser, query: RegistryQuery) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.db.from('Equipment').select('*, site:Site(*), unit:Unit(*), area:Area(*)', { count: 'exact' }).eq('tenantId', user.tenantId);
    request = this.applyFilters(request, user, query);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sort = String(query.sort ?? 'tag.asc').split('.');
    const sortColumn = this.sortColumn(sort[0]);
    const ascending = sort[1] !== 'desc';
    const { data, error, count } = await request.order(sortColumn, { ascending }).range(from, to);
    if (error) throw new Error(error.message);
    const rows = (data ?? []).map((item) => this.withMiDerivedFields(item));
    return {
      rows,
      page,
      limit,
      total: count ?? rows.length,
      summary: this.registrySummary(rows),
      savedViews: ['All Equipment', 'Critical Equipment', 'Safety-Critical Equipment', 'Overdue Inspections', 'Active Bypasses', 'Open Deficiencies', 'Startup Blockers', 'Out of Service', 'PSV / Relief Devices', 'SIS / SIF / Interlocks', 'Piping Circuits', 'Pressure Vessels', 'Rotating Equipment'],
      lastUpdated: new Date().toISOString()
    };
  }

  create(user: RequestUser, dto: CreateEquipmentDto) {
    return this.equipment.create(user.tenantId, user.id, dto);
  }

  get(user: RequestUser, equipmentId: string) {
    return this.equipment.get(user.tenantId, equipmentId, user.siteIds).then((item) => this.withMiDerivedFields(item));
  }

  async header(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const statusSummary = await this.statusSummary(user, equipmentId);
    const archived = this.isArchived(equipment);
    return {
      equipment,
      statusSummary,
      readOnly: archived,
      readOnlyReason: archived ? 'Archived/decommissioned equipment is read-only unless reactivated by an authorized user.' : null,
      actions: this.detailActions(user, equipment, archived),
      lastUpdated: equipment.updatedAt ?? equipment.updated_at ?? null,
      createdAt: equipment.createdAt ?? equipment.created_at ?? null
    };
  }

  update(user: RequestUser, equipmentId: string, dto: UpdateEquipmentDto) {
    return this.equipment.update(user.tenantId, user.id, equipmentId, dto, user.siteIds);
  }

  async changeStatus(user: RequestUser, equipmentId: string, status?: string, reason?: string) {
    if (!status?.trim()) throw new BadRequestException('Status is required.');
    if (!reason?.trim()) throw new BadRequestException('Status change reason is required.');
    const before = await this.get(user, equipmentId);
    if (before.startupBlocked && /fit for service|active|in service/i.test(status)) {
      throw new BadRequestException('Cannot mark equipment fit or in service while startup is blocked.');
    }
    const after = await this.equipment.update(user.tenantId, user.id, equipmentId, { status } as UpdateEquipmentDto, user.siteIds);
    await this.writeMiAudit(user, equipmentId, 'MI_EQUIPMENT_STATUS_CHANGED', before, after, reason);
    await this.addMiHistory(user, equipmentId, 'STATUS_CHANGED', 'Equipment status changed', reason, before, after);
    return this.withMiDerivedFields(after);
  }

  async archive(user: RequestUser, equipmentId: string, reason?: string) {
    if (!reason?.trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.get(user, equipmentId);
    if (before.bypassActive || Number(before.criticalDeficiencyCount ?? 0) > 0 || before.startupBlocked) {
      throw new BadRequestException('Archive blocked because equipment has active MI blockers. Resolve or override through the approved workflow.');
    }
    const after = await this.equipment.update(user.tenantId, user.id, equipmentId, { status: 'DECOMMISSIONED' } as UpdateEquipmentDto, user.siteIds);
    await this.writeMiAudit(user, equipmentId, 'MI_EQUIPMENT_ARCHIVED', before, after, reason);
    return after;
  }

  async reactivate(user: RequestUser, equipmentId: string, reason?: string) {
    const before = await this.get(user, equipmentId);
    const after = await this.equipment.update(user.tenantId, user.id, equipmentId, { status: 'ACTIVE' } as UpdateEquipmentDto, user.siteIds);
    await this.writeMiAudit(user, equipmentId, 'MI_EQUIPMENT_REACTIVATED', before, after, reason ?? 'Equipment reactivated');
    return after;
  }

  async overview(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const [summary, documentsSummary, history, blockers, inspectionPlanSummary] = await Promise.all([
      this.linkedRecordsSummary(user, equipmentId),
      this.documentsSummary(user, equipmentId),
      this.equipmentRecentActivity(user, equipmentId),
      this.blockers(user, equipmentId),
      this.equipmentInspectionPlanSummary(user, equipmentId).catch(() => null)
    ]);
    return {
      equipment,
      snapshot: {
        tag: equipment.tag,
        name: equipment.name,
        type: equipment.type,
        status: equipment.status,
        criticality: equipment.criticality,
        site: equipment.site,
        unit: equipment.unit,
        area: equipment.area,
        owner: equipment.custodianUserId ?? equipment.ownerDepartmentId ?? null
      },
      statusCards: await this.statusSummary(user, equipmentId),
      technicalSummary: this.technicalDataFromEquipment(equipment),
      criticalitySummary: {
        criticalEquipment: equipment.criticality === 'HIGH' || equipment.criticality === 'SAFETY_CRITICAL',
        safetyCritical: !!equipment.safetyCritical,
        psmCritical: !!equipment.psmCritical,
        category: equipment.criticality ?? 'Not evaluated',
        environmentalCriticality: equipment.environmentalCriticality ?? null,
        productionCriticality: equipment.productionCriticality ?? null,
        riskRankingMethod: equipment.riskRankingMethod ?? 'Configuration required',
        lastCriticalityReviewDate: equipment.lastCriticalityReviewDate ?? null,
        criticalityReviewRequired: !equipment.criticality,
        psmCriticalReason: equipment.psmCriticalReason ?? null,
        safetyCriticalReason: equipment.safetyCriticalReason ?? null
      },
      scheduleSummary: this.scheduleFromEquipment(equipment),
      inspectionPlanSummary,
      cmlSummary: {
        cmlCount: equipment.cmlCount ?? 0,
        activeCmlCount: equipment.activeCmlCount ?? 0,
        lastUtReadingDate: equipment.lastUtReadingDate ?? null,
        minimumRemainingLife: equipment.minimumRemainingLife ?? null,
        highestCorrosionRate: equipment.highestCorrosionRate ?? null,
        cmlAlertCount: equipment.cmlAlertCount ?? 0,
        cmlOverdueCount: equipment.cmlOverdueCount ?? 0,
        nextCmlInspectionDue: equipment.nextCmlInspectionDue ?? null
      },
      safeguardSummary: {
        isSafeguard: !!equipment.isSafeguard || !!equipment.safetyCritical,
        safeguardType: equipment.safeguardType ?? equipment.type,
        isIplCandidate: !!equipment.isIplCandidate,
        proofTestRequired: !!equipment.proofTestRequired,
        bypassAllowed: equipment.bypassAllowed ?? null,
        hasReliefProtection: !!equipment.psvProtected || !!equipment.psvTag,
        linkedPsvCount: equipment.linkedPsvCount ?? (equipment.psvTag ? 1 : 0),
        psvTestsDue: equipment.psvTestsDue ?? 0,
        failedPsvTests: equipment.failedPsvTests ?? 0,
        nextPsvTestDue: equipment.nextPsvTestDue ?? null,
        linkedSifCount: equipment.linkedSifCount ?? (equipment.sisFunctionTag ? 1 : 0),
        targetSilSummary: equipment.targetSilSummary ?? null,
        proofTestsDue: equipment.proofTestsDue ?? 0,
        failedProofTests: equipment.failedProofTests ?? 0,
        criticalAlarmsLinked: equipment.alarmTags ? String(equipment.alarmTags).split(',').filter(Boolean).length : 0,
        interlocksLinked: equipment.interlockTags ? String(equipment.interlockTags).split(',').filter(Boolean).length : 0
      },
      bypassSummary: {
        activeImpairmentCount: equipment.activeImpairmentCount ?? 0,
        expiredImpairmentCount: equipment.expiredImpairmentCount ?? 0,
        safetyCriticalImpairmentCount: equipment.safetyCriticalImpairmentCount ?? 0,
        bypassActive: !!equipment.bypassActive,
        bypassRiskLevel: equipment.bypassRiskLevel ?? null,
        latestImpairmentStartTime: equipment.latestImpairmentStartTime ?? null,
        nextImpairmentExpiryAt: equipment.nextImpairmentExpiryAt ?? null,
        temporaryMitigationSummary: equipment.temporaryMitigationSummary ?? null,
        authorizationStatus: equipment.impairmentAuthorizationStatus ?? null
      },
      deficiencySummary: {
        openDeficiencyCount: equipment.openDeficiencyCount ?? 0,
        criticalDeficiencyCount: equipment.criticalDeficiencyCount ?? 0,
        overdueDeficiencyCount: equipment.overdueDeficiencyCount ?? 0,
        temporaryControlsActive: equipment.temporaryControlsActive ?? 0,
        repairsPending: equipment.repairsPending ?? 0,
        verificationPending: equipment.verificationPending ?? 0,
        latestDeficiency: equipment.latestDeficiency ?? null,
        startupBlockerDeficiencies: equipment.startupBlockerDeficiencies ?? 0
      },
      readinessSummary: await this.readinessSummary(user, equipmentId),
      linkedRecordsSummary: summary,
      documentsSummary,
      recentActivity: history.slice(0, 10),
      blockers
    };
  }

  async statusSummary(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    return [
      this.statusItem('Equipment Status', equipment.status ?? 'Unknown', 'overview', equipment.status ? null : 'Equipment status is not set.'),
      this.statusItem('Criticality', equipment.criticality ?? 'Not evaluated', 'criticality', equipment.criticality ? null : 'Criticality/risk ranking is not evaluated.'),
      this.statusItem('Safety-Critical', equipment.safetyCritical ? 'Yes' : 'No', 'criticality', equipment.safetyCritical ? 'Safety-critical controls apply.' : null),
      this.statusItem('Fitness-for-Service', this.fitness(equipment), 'fitness-readiness', equipment.fitnessStatus ? null : 'Fitness status is derived from available equipment data.'),
      this.statusItem('Inspection Status', equipment.inspectionStatus ?? this.dueStatus(equipment.nextInspectionDueDate), 'inspection-plan', equipment.nextInspectionDueDate ? null : 'Next inspection due date is not configured.'),
      this.statusItem('PM Status', equipment.pmStatus ?? this.dueStatus(equipment.nextPmDueDate), 'preventive-maintenance', equipment.nextPmDueDate ? null : 'PM schedule is not configured.'),
      this.statusItem('Calibration Status', equipment.calibrationStatus ?? this.dueStatus(equipment.nextCalibrationDueDate), 'calibration-testing', equipment.nextCalibrationDueDate ? null : 'Calibration schedule is not configured.'),
      this.statusItem('CML/TML Status', equipment.cmlCount ? `${equipment.cmlCount} CML/TML` : 'Not configured', 'cml-tml', equipment.cmlCount ? null : 'CML/TML registry foundation is ready but no points are configured.'),
      this.statusItem('PSV/SIS Test Status', equipment.proofTestRequired ? 'Proof test required' : 'Not configured', 'psv-relief', equipment.proofTestRequired ? null : 'PSV/SIS proof-test basis is not configured.'),
      this.statusItem('Active Bypass', equipment.bypassActive ? 'Active' : 'None', 'bypass-impairment', equipment.bypassActive ? 'Active bypass/impairment requires monitoring.' : null),
      this.statusItem('Open Deficiencies', String(equipment.openDeficiencyCount ?? 0), 'deficiencies', Number(equipment.openDeficiencyCount ?? 0) ? 'Open deficiencies affect readiness.' : null),
      this.statusItem('Startup Readiness', equipment.startupBlocked ? 'Blocked' : equipment.readinessStatus ?? 'Not evaluated', 'fitness-readiness', equipment.startupBlockReason ?? null)
    ];
  }

  async technicalSummary(user: RequestUser, equipmentId: string) {
    return this.technicalData(user, equipmentId);
  }

  async readinessSummary(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const blockers = await this.blockers(user, equipmentId);
    return {
      fitnessStatus: this.fitness(equipment),
      readinessStatus: blockers.some((item) => item.severity === 'Critical') ? 'Blocked' : equipment.readinessStatus ?? 'Not evaluated',
      startupBlocked: !!equipment.startupBlocked,
      startupBlockReason: equipment.startupBlockReason ?? null,
      restrictionsSummary: equipment.restrictionsSummary ?? null,
      lastReadinessCheck: equipment.lastReadinessCheck ?? null,
      checkedBy: equipment.readinessCheckedBy ?? null,
      missingReadinessRequirements: blockers.filter((item) => item.category === 'Missing Data').map((item) => item.reason),
      openBlockers: blockers,
      checks: [
        this.readinessCheck('Inspection current', !this.isPast(equipment.nextInspectionDueDate), equipment.nextInspectionDueDate ? null : 'No next inspection due date configured.'),
        this.readinessCheck('PM current', !this.isPast(equipment.nextPmDueDate), equipment.nextPmDueDate ? null : 'No PM due date configured.'),
        this.readinessCheck('Calibration current', !this.isPast(equipment.nextCalibrationDueDate), equipment.nextCalibrationDueDate ? null : 'No calibration due date configured.'),
        this.readinessCheck('PSV current', !equipment.psvTestsDue && !equipment.failedPsvTests, equipment.proofTestRequired ? null : 'PSV proof-test requirement is not configured.'),
        this.readinessCheck('SIS proof test current', !equipment.proofTestsDue && !equipment.failedProofTests, equipment.sisProtected ? null : 'SIS proof-test requirement is not configured.'),
        this.readinessCheck('No active critical bypass', !(equipment.bypassActive && equipment.safetyCritical), equipment.bypassActive ? 'Active bypass is recorded.' : null),
        this.readinessCheck('No critical deficiency', Number(equipment.criticalDeficiencyCount ?? 0) === 0, null),
        this.readinessCheck('Required documents available', !blockers.some((item) => item.type === 'MISSING_REQUIRED_DOCUMENTS'), null),
        this.readinessCheck('Required approvals complete', !equipment.approvalPending, equipment.approvalPending ? 'Approval pending.' : null)
      ]
    };
  }

  async blockers(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const documents = await this.documents(user, equipmentId).catch(() => []);
    const blockers: any[] = [];
    const push = (type: string, severity: string, sourceSection: string, reason: string, recommendedNextAction: string, dueDate?: string | null) => {
      blockers.push({ id: `${equipmentId}-${type}`, type, category: /missing|not configured|not evaluated/i.test(reason) ? 'Missing Data' : 'Open Blocker', severity, sourceSection, reason, owner: equipment.custodianUserId ?? equipment.ownerDepartmentId ?? null, dueDate: dueDate ?? null, href: `/mechanical-integrity/equipment/${equipmentId}`, recommendedNextAction });
    };
    if (!equipment.designPressure && equipment.safetyCritical) push('MISSING_DESIGN_PRESSURE', 'High', 'Technical Data', 'Safety-critical equipment is missing design pressure.', 'Complete technical data or link approved datasheet.');
    if (!equipment.designTemperature && equipment.safetyCritical) push('MISSING_DESIGN_TEMPERATURE', 'High', 'Technical Data', 'Safety-critical equipment is missing design temperature.', 'Complete technical data or link approved datasheet.');
    if (!equipment.materialOfConstruction && equipment.safetyCritical) push('MISSING_MATERIAL', 'High', 'Technical Data', 'Safety-critical equipment is missing material of construction.', 'Complete material/corrosion data.');
    if (!equipment.criticality) push('CRITICALITY_NOT_EVALUATED', 'Medium', 'Criticality / Risk Ranking', 'Criticality has not been evaluated.', 'Complete criticality/risk ranking review.');
    if (this.isPast(equipment.nextInspectionDueDate)) push('INSPECTION_OVERDUE', 'High', 'Inspection Plan', 'Inspection is overdue.', 'Schedule or record inspection.', equipment.nextInspectionDueDate);
    if (this.isPast(equipment.nextPmDueDate)) push('PM_OVERDUE', 'Medium', 'Preventive Maintenance', 'PM task is overdue.', 'Complete preventive maintenance.', equipment.nextPmDueDate);
    if (this.isPast(equipment.nextCalibrationDueDate)) push('CALIBRATION_OVERDUE', 'Medium', 'Calibration / Testing', 'Calibration is overdue.', 'Complete calibration/testing.', equipment.nextCalibrationDueDate);
    if (equipment.bypassActive && this.isPast(equipment.nextImpairmentExpiryAt)) push('EXPIRED_BYPASS', 'Critical', 'Bypass / Impairment', 'Active bypass/impairment is expired.', 'Review bypass authorization and temporary mitigation.', equipment.nextImpairmentExpiryAt);
    if (Number(equipment.criticalDeficiencyCount ?? 0) > 0) push('CRITICAL_DEFICIENCY_OPEN', 'Critical', 'Deficiencies', 'Critical deficiency is open.', 'Resolve or formally accept deficiency.');
    if (!documents.length && equipment.safetyCritical) push('MISSING_REQUIRED_DOCUMENTS', 'Medium', 'Documents / Certificates', 'Safety-critical equipment has no linked documents/certificates.', 'Link datasheet, inspection report, certificate, or controlled document.');
    if (!equipment.fitnessStatus) push('FITNESS_NOT_EVALUATED', 'Medium', 'Fitness-for-Service / Readiness', 'Fitness-for-service has not been explicitly evaluated.', 'Complete readiness/fitness review.');
    if (equipment.startupBlocked) push('STARTUP_BLOCKED', 'Critical', 'Fitness-for-Service / Readiness', equipment.startupBlockReason ?? 'Startup is blocked.', 'Resolve startup readiness blocker.');
    return blockers;
  }

  async technicalData(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const row = await this.db.single<any>(this.db.from('mi_equipment_technical_data').select('*').eq('equipment_id', shadow.id).maybeSingle()).catch(() => null);
    const data = this.technicalDataFromEquipment(equipment, row);
    return { ...data, completeness: this.calculateTechnicalCompleteness(data, equipment.safetyCritical), revisionMetadata: row ? { updatedAt: row.updated_at, revisedBy: row.revised_by, revisionReason: row.revision_reason } : null };
  }

  async updateTechnicalData(user: RequestUser, equipmentId: string, dto: Record<string, any>) {
    const reason = String(dto.reason ?? dto.revisionReason ?? '').trim();
    const before = await this.technicalData(user, equipmentId);
    const equipment = await this.get(user, equipmentId);
    if (equipment.safetyCritical && this.technicalDataChangeFields(dto).some((field) => ['designPressure', 'designTemperature', 'materialOfConstruction', 'minimumRequiredThickness', 'reliefProtection', 'sisProtected', 'psvTag'].includes(field)) && !reason) {
      throw new BadRequestException('Revision reason is required when changing safety-critical technical data.');
    }
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const legacyUpdate = this.legacyTechnicalUpdate(dto);
    const afterLegacy = Object.keys(legacyUpdate).length
      ? await this.equipment.update(user.tenantId, user.id, equipmentId, legacyUpdate, user.siteIds)
      : equipment;
    const extended = this.technicalDataPayload(dto, afterLegacy, shadow, user, reason);
    await this.db.single<any>(this.db.from('mi_equipment_technical_data').upsert(extended, { onConflict: 'equipment_id' }).select().single());
    const after = await this.technicalData(user, equipmentId);
    const changedFields = this.diffTopLevel(before, after);
    await this.recordTechnicalRevision(user, shadow, reason || 'Technical data updated', changedFields, before, after);
    await this.writeMiAudit(user, equipmentId, 'MI_TECHNICAL_DATA_UPDATED', before, after, reason || 'Technical data updated');
    await this.addMiHistory(user, equipmentId, 'TECHNICAL_DATA_UPDATED', 'Technical data updated', reason || changedFields.join(', '), before, after);
    return after;
  }

  async technicalDataCompleteness(user: RequestUser, equipmentId: string) {
    const data = await this.technicalData(user, equipmentId);
    return data.completeness;
  }

  async technicalDataRevisions(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    return this.db.many<any>(this.db.from('mi_equipment_technical_data_revisions').select('*').eq('equipment_id', shadow.id).order('created_at', { ascending: false }).limit(100)).catch(() => []);
  }

  async technicalDataChangeImpact(user: RequestUser, equipmentId: string, query: Record<string, string | undefined>) {
    const equipment = await this.get(user, equipmentId);
    const changedField = query.field ?? 'technicalData';
    const impacts = [];
    if (equipment.safetyCritical) impacts.push('Safety-critical data change requires revision reason and history record.');
    if (/thickness|corrosion|material/i.test(changedField)) impacts.push('CML calculations may require recalculation.');
    if (/pressure|temperature|relief|psv|sis/i.test(changedField)) impacts.push('Protection basis and inspection strategy may need review.');
    return { equipmentId, changedField, impacts, requiresReason: equipment.safetyCritical, requiresRecalculation: impacts.some((item) => /CML/.test(item)) };
  }

  async listCmls(user: RequestUser, equipmentId: string, query: Record<string, string | undefined>) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let request = this.db.from('mi_cmls').select('*').eq('equipment_id', shadow.id);
    if (query.status) request = request.eq('status', query.status);
    if (query.cmlType) request = request.eq('cml_type', query.cmlType);
    if (query.componentType) request = request.eq('component_type', query.componentType);
    if (query.inspectionMethod) request = request.eq('inspection_method', query.inspectionMethod);
    if (query.material) request = request.or(`material.ilike.%${this.cleanSearch(query.material)}%,material_of_construction.ilike.%${this.cleanSearch(query.material)}%`);
    if (query.activeOnly === 'true') request = request.eq('active', true);
    if (query.archived === 'true') request = request.eq('status', 'Archived');
    if (query.q) {
      const q = this.cleanSearch(query.q);
      request = request.or(`cml_number.ilike.%${q}%,location_description.ilike.%${q}%,component_type.ilike.%${q}%,damage_mechanism.ilike.%${q}%,equipment_section.ilike.%${q}%,piping_circuit.ilike.%${q}%,drawing_reference.ilike.%${q}%,isometric_reference.ilike.%${q}%`);
    }
    const sort = this.cmlSort(query.sort);
    const rows = await this.db.many<any>(request.order(sort.column, { ascending: sort.ascending }).range(from, to)).catch(() => []);
    const snapshots = await this.latestCmlSnapshots(shadow.id);
    let enriched = rows.map((row) => this.withCmlDerived(row, snapshots.get(row.id)));
    if (query.noReading === 'true') enriched = enriched.filter((row) => !row.latestReadingDate);
    if (query.belowAlert === 'true') enriched = enriched.filter((row) => /below alert/i.test(String(row.alertStatus ?? '')));
    if (query.belowMinimum === 'true') enriched = enriched.filter((row) => /below minimum|below retirement/i.test(String(row.alertStatus ?? '')));
    if (query.overdue === 'true') enriched = enriched.filter((row) => this.isPast(row.nextDueDate));
    if (query.pendingReview === 'true') enriched = enriched.filter((row) => Number(row.pendingReadingCount ?? 0) > 0);
    return {
      rows: enriched,
      page,
      limit,
      total: enriched.length,
      summary: await this.cmlSummary(user, equipmentId),
      alerts: await this.cmlAlerts(user, equipmentId)
    };
  }

  async cmlSummary(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const rows = await this.db.many<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', shadow.id)).catch(() => []);
    const readings = await this.db.many<any>(this.db.from('mi_cml_thickness_readings').select('id,cml_id,reading_date,review_status').eq('equipment_id', shadow.id)).catch(() => []);
    const snapshots = await this.latestCmlSnapshots(shadow.id);
    const enriched = rows.map((row) => this.withCmlDerived(row, snapshots.get(row.id)));
    const readingsByCml = new Map<string, any[]>();
    readings.forEach((reading) => readingsByCml.set(reading.cml_id, [...(readingsByCml.get(reading.cml_id) ?? []), reading]));
    const sortedReadingDates = readings.map((reading) => reading.reading_date).filter(Boolean).sort();
    const latestUt = sortedReadingDates.length ? sortedReadingDates[sortedReadingDates.length - 1] : null;
    const remainingLifeValues = enriched.map((row) => row.remainingLifeYears).filter((value) => value !== null && value !== undefined).map((value) => Number(value)).filter(Number.isFinite);
    return {
      total: rows.length,
      active: rows.filter((row) => row.active && row.status !== 'Archived').length,
      archived: rows.filter((row) => !row.active || row.status === 'Archived').length,
      belowAlertThickness: enriched.filter((row) => /below alert/i.test(String(row.alertStatus ?? ''))).length,
      belowMinimumRequiredThickness: enriched.filter((row) => /below minimum|below retirement/i.test(String(row.alertStatus ?? ''))).length,
      noReadings: rows.filter((row) => !(readingsByCml.get(row.id)?.length)).length,
      overdue: enriched.filter((row) => this.isPast(row.nextDueDate)).length,
      alertsOpen: enriched.filter((row) => /critical|warning|overdue|below|high/i.test(String(row.alertStatus ?? ''))).length,
      lowRemainingLife: enriched.filter((row) => Number(row.remainingLifeYears ?? 999) <= Number(row.low_remaining_life_threshold_years ?? 2)).length,
      minimumRemainingLife: remainingLifeValues.length ? Math.min(...remainingLifeValues) : null,
      highestCorrosionRate: enriched.reduce((max, row) => Math.max(max, Number(row.governingCorrosionRate ?? 0)), 0),
      nextDueDate: enriched.map((row) => row.nextDueDate).filter(Boolean).sort()[0] ?? null,
      latestUtReadingDate: latestUt,
      readingsPendingReview: readings.filter((reading) => reading.review_status !== 'Approved' && reading.review_status !== 'Rejected' && reading.review_status !== 'Superseded').length,
      byStatus: this.distribution(enriched, (row) => row.status ?? 'Unknown'),
      byAlert: this.distribution(enriched, (row) => row.alertStatus ?? 'No Calculation')
    };
  }

  async cmlAlerts(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    return this.db.many<any>(this.db.from('mi_cml_alerts').select('*').eq('equipment_id', shadow.id).neq('status', 'Resolved').order('created_at', { ascending: false }).limit(100)).catch(() => []);
  }

  async createCml(user: RequestUser, equipmentId: string, body: Record<string, any>) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    this.assertEquipmentEditable(equipment);
    if (!body.cmlNumber && !body.cml_number) throw new BadRequestException('CML number is required.');
    await this.validateCmlInput(shadow, body);
    const payload = this.cmlPayload(user, shadow, body);
    const row = await this.db.single<any>(this.db.from('mi_cmls').insert(payload).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_CREATED', null, row, body.reason ?? 'CML/TML created');
    await this.addMiHistory(user, equipmentId, 'CML_CREATED', 'CML/TML created', row.cml_number, null, row, 'CML', row.id);
    return this.getCml(user, equipmentId, row.id);
  }

  async getCml(user: RequestUser, equipmentId: string, cmlId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const row = await this.db.single<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', shadow.id).eq('id', cmlId).maybeSingle());
    if (!row) throw new BadRequestException('CML/TML was not found for this equipment.');
    return {
      ...this.withCmlDerived(row, await this.latestCmlSnapshot(cmlId)),
      readings: await this.cmlReadings(user, equipmentId, cmlId).catch(() => []),
      calculation: await this.cmlCalculation(user, equipmentId, cmlId).catch(() => null)
    };
  }

  async updateCml(user: RequestUser, equipmentId: string, cmlId: string, body: Record<string, any>) {
    const before = await this.getCml(user, equipmentId, cmlId);
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    this.assertEquipmentEditable(equipment);
    this.assertCmlEditable(before);
    await this.validateCmlInput(shadow, body, cmlId);
    const row = await this.db.single<any>(this.db.from('mi_cmls').update(this.cmlPayload(user, shadow, body, true)).eq('equipment_id', shadow.id).eq('id', cmlId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_UPDATED', before, row, body.reason ?? 'CML/TML updated');
    await this.addMiHistory(user, equipmentId, 'CML_UPDATED', 'CML/TML updated', body.reason ?? row.cml_number, before, row, 'CML', cmlId);
    return this.getCml(user, equipmentId, cmlId);
  }

  async archiveCml(user: RequestUser, equipmentId: string, cmlId: string, reason?: string) {
    if (!reason?.trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.getCml(user, equipmentId, cmlId);
    const openCritical = await this.db.single<any>(this.db.from('mi_cml_alerts').select('id').eq('cml_id', cmlId).eq('status', 'Open').eq('severity', 'Critical').limit(1).maybeSingle()).catch(() => null);
    if (openCritical) throw new BadRequestException('CML/TML cannot be archived while an open critical alert exists.');
    const row = await this.db.single<any>(this.db.from('mi_cmls').update({ status: 'Archived', active: false, archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', cmlId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_ARCHIVED', before, row, reason);
    await this.addMiHistory(user, equipmentId, 'CML_ARCHIVED', 'CML/TML archived', reason, before, row, 'CML', cmlId);
    return row;
  }

  async reactivateCml(user: RequestUser, equipmentId: string, cmlId: string, reason?: string) {
    const before = await this.getCml(user, equipmentId, cmlId);
    const equipment = await this.get(user, equipmentId);
    this.assertEquipmentEditable(equipment);
    const row = await this.db.single<any>(this.db.from('mi_cmls').update({ status: 'Active', active: true, archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', cmlId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_REACTIVATED', before, row, reason ?? 'CML/TML reactivated');
    await this.addMiHistory(user, equipmentId, 'CML_REACTIVATED', 'CML/TML reactivated', reason ?? null, before, row, 'CML', cmlId);
    return row;
  }

  async cmlReadings(user: RequestUser, equipmentId: string, cmlId: string) {
    await this.getCmlBase(user, equipmentId, cmlId);
    return this.db.many<any>(this.db.from('mi_cml_thickness_readings').select('*').eq('cml_id', cmlId).order('reading_date', { ascending: false }).limit(200)).catch(() => []);
  }

  async addCmlReading(user: RequestUser, equipmentId: string, cmlId: string, body: Record<string, any>) {
    const cml = await this.getCmlBase(user, equipmentId, cmlId);
    this.assertCmlEditable(cml);
    const payload = this.cmlReadingPayload(user, cml, body);
    const row = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').insert(payload).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_READING_CREATED', null, row, body.reason ?? 'CML/TML thickness reading created');
    await this.addMiHistory(user, equipmentId, 'CML_READING_CREATED', 'CML/TML reading created', `${cml.cml_number}: ${row.thickness_value} ${row.thickness_unit}`, null, row, 'CML Reading', row.id);
    if (row.review_status === 'Approved') await this.recalculateCml(user, equipmentId, cmlId);
    return row;
  }

  async updateCmlReading(user: RequestUser, equipmentId: string, cmlId: string, readingId: string, body: Record<string, any>) {
    const before = await this.reading(user, equipmentId, cmlId, readingId);
    const cml = await this.getCmlBase(user, equipmentId, cmlId);
    this.assertCmlEditable(cml);
    const row = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').update(this.cmlReadingPayload(user, cml, body, true)).eq('id', readingId).eq('cml_id', cmlId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_READING_UPDATED', before, row, body.reason ?? 'CML/TML reading updated');
    await this.addMiHistory(user, equipmentId, 'CML_READING_UPDATED', 'CML/TML reading updated', body.reason ?? null, before, row, 'CML Reading', readingId);
    if (row.review_status === 'Approved') await this.recalculateCml(user, equipmentId, cmlId);
    return row;
  }

  async reviewCmlReading(user: RequestUser, equipmentId: string, cmlId: string, readingId: string, body: Record<string, any>) {
    const before = await this.reading(user, equipmentId, cmlId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').update({ review_status: 'In Review', review_comment: body.comment ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.addMiHistory(user, equipmentId, 'CML_READING_REVIEW_REQUESTED', 'CML/TML reading review requested', body.comment ?? null, before, row, 'CML Reading', readingId);
    return row;
  }

  async approveCmlReading(user: RequestUser, equipmentId: string, cmlId: string, readingId: string, body: Record<string, any>) {
    const before = await this.reading(user, equipmentId, cmlId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').update({ status: 'Approved', review_status: 'Approved', review_comment: body.comment ?? null, approved_by: user.id, approved_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_READING_APPROVED', before, row, body.comment ?? 'CML/TML reading approved');
    await this.addMiHistory(user, equipmentId, 'CML_READING_APPROVED', 'CML/TML reading approved', body.comment ?? null, before, row, 'CML Reading', readingId);
    await this.recalculateCml(user, equipmentId, cmlId);
    return row;
  }

  async rejectCmlReading(user: RequestUser, equipmentId: string, cmlId: string, readingId: string, body: Record<string, any>) {
    if (!body.reason && !body.comment) throw new BadRequestException('Rejection reason is required.');
    const before = await this.reading(user, equipmentId, cmlId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').update({ status: 'Rejected', review_status: 'Rejected', review_comment: body.reason ?? body.comment, rejected_by: user.id, rejected_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_READING_REJECTED', before, row, body.reason ?? body.comment);
    await this.addMiHistory(user, equipmentId, 'CML_READING_REJECTED', 'CML/TML reading rejected', body.reason ?? body.comment, before, row, 'CML Reading', readingId);
    return row;
  }

  async supersedeCmlReading(user: RequestUser, equipmentId: string, cmlId: string, readingId: string, body: Record<string, any>) {
    if (!body.reason) throw new BadRequestException('Supersede reason is required.');
    const before = await this.reading(user, equipmentId, cmlId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').update({ status: 'Superseded', review_status: 'Superseded', superseded_by_reading_id: body.supersededByReadingId ?? null, review_comment: body.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_CML_READING_SUPERSEDED', before, row, body.reason);
    await this.addMiHistory(user, equipmentId, 'CML_READING_SUPERSEDED', 'CML/TML reading superseded', body.reason, before, row, 'CML Reading', readingId);
    await this.recalculateCml(user, equipmentId, cmlId);
    return row;
  }

  async cmlCalculation(user: RequestUser, equipmentId: string, cmlId: string) {
    await this.getCmlBase(user, equipmentId, cmlId);
    const latest = await this.latestCmlSnapshot(cmlId);
    return latest ?? { calculation_status: 'Not Calculated', alert_status: 'No Reading', methodology_json: this.cmlMethodologySnapshot() };
  }

  async recalculateCml(user: RequestUser, equipmentId: string, cmlId: string) {
    const cml = await this.getCmlBase(user, equipmentId, cmlId);
    const readings = await this.db.many<any>(this.db.from('mi_cml_thickness_readings').select('*').eq('cml_id', cmlId).eq('review_status', 'Approved').order('reading_date', { ascending: false })).catch(() => []);
    const snapshot = this.calculateCmlSnapshot(user, cml, readings);
    const row = await this.db.single<any>(this.db.from('mi_cml_calculation_snapshots').insert(snapshot).select().single());
    await this.db.single(this.db.from('mi_cmls').update({ last_reading_date: row.latest_reading_date, next_due_date: row.final_next_due_date ?? row.next_due_date, next_due_basis: row.next_due_basis, next_due_source: row.next_due_source, status: row.alert_state === 'Normal' ? 'Monitoring' : row.alert_state === 'No Reading' ? 'No Reading' : /below|critical/i.test(String(row.alert_state ?? '')) ? 'Critical' : /overdue/i.test(String(row.alert_state ?? '')) ? 'Overdue' : 'Alert', updated_at: new Date().toISOString(), updated_by: user.id }).eq('id', cmlId).select().single()).catch(() => null);
    await this.refreshCmlAlert(user, cml, row);
    await this.writeMiAudit(user, equipmentId, 'MI_CML_RECALCULATED', null, row, 'CML/TML recalculated');
    await this.addMiHistory(user, equipmentId, 'CML_RECALCULATED', 'CML/TML recalculated', row.alert_status, null, row, 'CML', cmlId);
    return row;
  }

  async recalculateAllCmls(user: RequestUser, equipmentId: string) {
    const list = await this.listCmls(user, equipmentId, {});
    const results = [];
    for (const row of list.rows) results.push(await this.recalculateCml(user, equipmentId, row.id));
    return { recalculated: results.length, results };
  }

  async cmlCalculationSummary(user: RequestUser, equipmentId: string) {
    const summary = await this.cmlSummary(user, equipmentId);
    return { ...summary, methodology: this.cmlMethodologySnapshot(), generatedAt: new Date().toISOString() };
  }

  async cmlImportTemplate(user: RequestUser, equipmentId: string) {
    await this.get(user, equipmentId);
    return {
      fileName: 'mi-cml-import-template.csv',
      content: this.csv([{ cml_number: '', cml_type: 'CML', component_type: '', location_description: '', nominal_thickness: '', minimum_required_thickness: '', thickness_unit: 'mm', damage_mechanism: '', inspection_method: '' }], ['cml_number', 'cml_type', 'component_type', 'location_description', 'nominal_thickness', 'minimum_required_thickness', 'thickness_unit', 'damage_mechanism', 'inspection_method'])
    };
  }

  async importCmls(user: RequestUser, equipmentId: string, body: Record<string, any>) {
    return this.createImportJob(user, equipmentId, 'CML', body);
  }

  async importCmlReadings(user: RequestUser, equipmentId: string, body: Record<string, any>) {
    return this.createImportJob(user, equipmentId, 'CML_READING', body);
  }

  async getCmlImportJob(user: RequestUser, equipmentId: string, jobId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const job = await this.db.single<any>(this.db.from('mi_cml_import_jobs').select('*').eq('equipment_id', shadow.id).eq('id', jobId).maybeSingle());
    if (!job) throw new BadRequestException('CML import job was not found.');
    const rows = await this.db.many<any>(this.db.from('mi_cml_import_rows').select('*').eq('job_id', jobId).order('row_number', { ascending: true })).catch(() => []);
    return { ...job, rows };
  }

  async validateCmlImportJob(user: RequestUser, equipmentId: string, jobId: string) {
    const job = await this.getCmlImportJob(user, equipmentId, jobId);
    const existingCmls = await this.db.many<any>(this.db.from('mi_cmls').select('id,cml_number').eq('equipment_id', job.equipment_id)).catch(() => []);
    const existingByNumber = new Map(existingCmls.map((cml) => [cml.cml_number, cml]));
    const seen = new Set<string>();
    const rows = (job.rows ?? []).map((row: any) => {
      const required = job.import_type === 'CML_READING' ? ['cml_number', 'reading_date', 'thickness_value'] : ['cml_number'];
      const errors = required.filter((field) => !row.row_json?.[field]).map((field) => `${field} is required`);
      const cmlNumber = row.row_json?.cml_number ?? row.row_json?.cmlNumber;
      if (job.import_type === 'CML') {
        if (cmlNumber && (existingByNumber.has(cmlNumber) || seen.has(cmlNumber))) errors.push('Duplicate CML/TML number for this equipment');
        if (cmlNumber) seen.add(cmlNumber);
      }
      if (job.import_type === 'CML_READING' && cmlNumber && !existingByNumber.has(cmlNumber)) errors.push('CML/TML number does not exist under this equipment');
      if (row.row_json?.thickness_value !== undefined && this.numberOrNull(row.row_json.thickness_value) === null) errors.push('thickness_value must be numeric');
      if (row.row_json?.nominal_thickness !== undefined && this.numberOrNull(row.row_json.nominal_thickness) === null) errors.push('nominal_thickness must be numeric');
      return { ...row, validation_status: errors.length ? 'Error' : 'Valid', validation_errors: errors };
    });
    for (const row of rows) await this.db.single(this.db.from('mi_cml_import_rows').update({ validation_status: row.validation_status, validation_errors: row.validation_errors, validation_errors_json: row.validation_errors, normalized_data_json: row.row_json }).eq('id', row.id).select().single()).catch(() => null);
    await this.db.single(this.db.from('mi_cml_import_jobs').update({ status: rows.some((row: any) => row.validation_errors.length) ? 'Validation Failed' : 'Validated', total_rows: rows.length, valid_rows: rows.filter((row: any) => !row.validation_errors.length).length, error_rows: rows.filter((row: any) => row.validation_errors.length).length }).eq('id', jobId).select().single());
    return this.getCmlImportJob(user, equipmentId, jobId);
  }

  async commitCmlImportJob(user: RequestUser, equipmentId: string, jobId: string) {
    const job = await this.validateCmlImportJob(user, equipmentId, jobId);
    if (job.error_rows) throw new BadRequestException('Fix import validation errors before committing.');
    for (const row of job.rows ?? []) {
      if (job.import_type === 'CML') {
        const created = await this.createCml(user, equipmentId, row.row_json);
        await this.db.single(this.db.from('mi_cml_import_rows').update({ created_record_id: created.id }).eq('id', row.id).select().single()).catch(() => null);
      } else if (job.import_type === 'CML_READING') {
        const cmlNumber = row.row_json?.cml_number ?? row.row_json?.cmlNumber;
        const cml = await this.db.single<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', job.equipment_id).eq('cml_number', cmlNumber).maybeSingle());
        if (!cml) throw new BadRequestException(`CML/TML ${cmlNumber} was not found for reading import row ${row.row_number}.`);
        const created = await this.addCmlReading(user, equipmentId, cml.id, row.row_json);
        await this.db.single(this.db.from('mi_cml_import_rows').update({ created_record_id: created.id }).eq('id', row.id).select().single()).catch(() => null);
      }
    }
    await this.db.single(this.db.from('mi_cml_import_jobs').update({ status: 'Committed', committed_by: user.id, committed_at: new Date().toISOString(), created_count: job.valid_rows, uploaded_by: user.id }).eq('id', jobId).select().single());
    await this.addMiHistory(user, equipmentId, 'CML_IMPORT_COMMITTED', 'CML import committed', `${job.valid_rows} rows`, null, job, 'CML Import', jobId);
    return this.getCmlImportJob(user, equipmentId, jobId);
  }

  async cmlImportErrorReport(user: RequestUser, equipmentId: string, jobId: string) {
    const job = await this.getCmlImportJob(user, equipmentId, jobId);
    return { fileName: `mi-cml-import-errors-${jobId}.csv`, content: this.csv((job.rows ?? []).map((row: any) => ({ row_number: row.row_number, status: row.validation_status, errors: (row.validation_errors ?? []).join('; ') })), ['row_number', 'status', 'errors']) };
  }

  async exportCmls(user: RequestUser, equipmentId: string) {
    const data = await this.listCmls(user, equipmentId, {});
    return { fileName: `mi-cmls-${equipmentId}.csv`, content: this.csv(data.rows, ['cml_number', 'cml_type', 'component_type', 'location_description', 'nominal_thickness', 'minimum_required_thickness', 'latestThickness', 'governingCorrosionRate', 'remainingLifeYears', 'nextDueDate', 'alertStatus', 'status']) };
  }

  async inspectionPlanRegistry(user: RequestUser, query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.db.from('mi_inspection_plans').select('*, equipment:mi_equipment(*)', { count: 'exact' });
    request = this.applyInspectionPlanScope(request, user, query);
    if (query.search?.trim()) {
      const q = this.cleanSearch(query.search);
      request = request.or(`plan_number.ilike.%${q}%,plan_title.ilike.%${q}%,plan_type.ilike.%${q}%,inspection_method.ilike.%${q}%`);
    }
    for (const [key, column] of Object.entries({
      equipmentId: 'equipment_id',
      siteId: 'site_id',
      planType: 'plan_type',
      inspectionMethod: 'inspection_method',
      status: 'status',
      approvalStatus: 'approval_status',
      dueStatus: 'current_due_status',
      schedulerStatus: 'current_scheduler_status',
      scheduleBasis: 'current_due_basis'
    })) {
      const value = query[key];
      if (value) request = request.eq(column, value);
    }
    if (query.overdue === 'true') request = request.in('current_due_status', ['Overdue', 'Critical Overdue']);
    if (query.dueSoon === 'true') request = request.in('current_due_status', ['Due Soon', 'Due']);
    if (query.remainingLife === 'true') request = request.ilike('current_due_basis', '%remaining%');
    if (query.fixedInterval === 'true') request = request.ilike('current_due_basis', '%fixed%');
    if (query.manualOverride === 'true') request = request.eq('current_scheduler_status', 'Manual Override');
    const [rawSort = 'current_next_due_date', rawDirection = 'asc'] = String(query.sort ?? 'current_next_due_date.asc').split('.');
    const sortMap: Record<string, string> = {
      planNumber: 'plan_number',
      planTitle: 'plan_title',
      planType: 'plan_type',
      status: 'status',
      approvalStatus: 'approval_status',
      nextDueDate: 'current_next_due_date',
      dueStatus: 'current_due_status',
      updatedAt: 'updated_at',
      current_next_due_date: 'current_next_due_date'
    };
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await request.order(sortMap[rawSort] ?? 'current_next_due_date', { ascending: rawDirection !== 'desc', nullsFirst: false }).range(from, to);
    if (error) throw new Error(error.message);
    const rows = (data ?? []).map((row: any) => this.withInspectionPlanDerived(row));
    return {
      rows,
      page,
      limit,
      total: count ?? rows.length,
      summary: await this.inspectionPlanSummary(user, query).catch(() => null),
      savedViews: ['All Plans', 'Approved Plans', 'Draft Plans', 'Pending Review', 'Due Soon', 'Overdue', 'Critical Equipment Plans', 'CML/TML Plans', 'PSV Test Plans', 'SIS Proof Test Plans', 'Manual Override Plans', 'Scheduler Errors', 'Equipment Missing Plans'],
      lastUpdated: new Date().toISOString()
    };
  }

  async inspectionPlanSummary(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const plans = await this.scopedInspectionPlans(user, query).catch(() => []);
    const equipment = await this.equipmentRows(user, query as RegistryQuery).catch(() => []);
    const approvedEquipment = new Set(plans.filter((plan) => ['Approved', 'Active'].includes(plan.approval_status) || ['Approved', 'Active'].includes(plan.status)).map((plan) => plan.equipment_id));
    const withoutPlan = equipment.filter((item) => !approvedEquipment.has(item.id));
    const criticalWithoutPlan = withoutPlan.filter((item) => item.safetyCritical || item.psmCritical || item.criticality === 'HIGH' || item.criticality === 'SAFETY_CRITICAL');
    const dueNext30 = plans.filter((plan) => this.isWithin(plan.current_next_due_date, 30, Date.now()));
    const dueNext90 = plans.filter((plan) => this.isWithin(plan.current_next_due_date, 90, Date.now()));
    return {
      cards: [
        this.kpi('Total Plans', plans.length),
        this.kpi('Approved Plans', plans.filter((plan) => plan.approval_status === 'Approved' || plan.status === 'Approved' || plan.status === 'Active').length),
        this.kpi('Draft Plans', plans.filter((plan) => plan.status === 'Draft').length),
        this.kpi('Plans Pending Review', plans.filter((plan) => plan.approval_status === 'Pending Review' || plan.status === 'Pending Review').length),
        this.kpi('Equipment Without Plan', withoutPlan.length, undefined, withoutPlan.length ? 'warning' : 'neutral'),
        this.kpi('Critical Equipment Without Plan', criticalWithoutPlan.length, undefined, criticalWithoutPlan.length ? 'danger' : 'neutral'),
        this.kpi('Due Next 30 Days', dueNext30.length, undefined, dueNext30.length ? 'warning' : 'neutral'),
        this.kpi('Due Next 90 Days', dueNext90.length),
        this.kpi('Overdue Inspections', plans.filter((plan) => ['Overdue', 'Critical Overdue'].includes(plan.current_due_status)).length, undefined, 'danger'),
        this.kpi('Plans With Scheduler Error', plans.filter((plan) => /error|required|insufficient/i.test(String(plan.current_scheduler_status ?? ''))).length, undefined, 'warning'),
        this.kpi('Plans With Manual Override', plans.filter((plan) => plan.current_scheduler_status === 'Manual Override').length),
        this.kpi('Plans Driven by Remaining Life', plans.filter((plan) => /remaining|half/i.test(String(plan.current_due_basis ?? ''))).length),
        this.kpi('Plans Driven by Fixed Interval', plans.filter((plan) => /fixed|interval/i.test(String(plan.current_due_basis ?? ''))).length),
        this.kpi('Plans Requiring Revision', plans.filter((plan) => plan.status === 'Revision Required').length, undefined, 'warning'),
        this.kpi('Archived Plans', plans.filter((plan) => plan.status === 'Archived').length)
      ],
      equipmentWithoutPlan: withoutPlan.slice(0, 20),
      criticalEquipmentWithoutPlan: criticalWithoutPlan.slice(0, 20),
      generatedAt: new Date().toISOString()
    };
  }

  async createInspectionPlan(user: RequestUser, body: Record<string, any>, equipmentId?: string) {
    const targetEquipmentId = equipmentId ?? body.equipmentId ?? body.equipment_id;
    if (!targetEquipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.get(user, targetEquipmentId);
    this.assertEquipmentEditable(equipment);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    this.validateInspectionPlanInput(body);
    const planNumber = body.planNumber ?? body.plan_number ?? await this.nextInspectionPlanNumber(shadow);
    const now = new Date().toISOString();
    const planPayload = {
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      equipment_id: shadow.id,
      plan_number: planNumber,
      plan_title: body.planTitle ?? body.plan_title,
      plan_description: body.planDescription ?? body.plan_description ?? null,
      plan_type: body.planType ?? body.plan_type,
      inspection_category: body.inspectionCategory ?? body.inspection_category ?? null,
      inspection_method: body.inspectionMethod ?? body.inspection_method,
      status: body.status ?? 'Draft',
      approval_status: body.approvalStatus ?? body.approval_status ?? 'Draft',
      revision_number: Number(body.revisionNumber ?? body.revision_number ?? 0),
      effective_date: body.effectiveDate ?? body.effective_date ?? null,
      expiry_review_date: body.expiryReviewDate ?? body.reviewDate ?? body.expiry_review_date ?? null,
      responsible_department_id: body.responsibleDepartmentId ?? body.responsible_department_id ?? null,
      responsible_team_id: body.responsibleTeamId ?? body.responsible_team_id ?? null,
      responsible_user_id: body.responsibleUserId ?? body.responsible_user_id ?? null,
      vendor_required: !!(body.vendorRequired ?? body.vendor_required),
      vendor_name: body.vendorName ?? body.vendor_name ?? null,
      priority: body.priority ?? 'Normal',
      criticality_basis: body.criticalityBasis ?? body.criticality_basis ?? null,
      scheduler_active: body.schedulerActive ?? body.scheduler_active ?? true,
      created_by: user.id,
      updated_by: user.id,
      created_at: now,
      updated_at: now
    };
    const plan = await this.db.single<any>(this.db.from('mi_inspection_plans').insert(planPayload).select('*, equipment:mi_equipment(*)').single());
    await this.upsertInspectionPlanScope(user, plan.id, body.scope ?? body);
    await this.upsertInspectionPlanCmlScope(user, plan.id, body.cmlScope ?? body);
    await this.upsertInspectionPlanSchedule(user, plan.id, body.schedule ?? body);
    await this.replaceInspectionChecklist(user, plan.id, body.checklistItems ?? body.checklist ?? []);
    await this.replaceInspectionCriteria(user, plan.id, body.acceptanceCriteria ?? body.criteria ?? []);
    await this.replaceInspectionDocuments(user, plan.id, body.documents ?? []);
    await this.previewInspectionSchedule(user, plan.id, { persist: true });
    await this.writeMiAudit(user, targetEquipmentId, 'MI_INSPECTION_PLAN_CREATED', null, plan, body.reason ?? 'Inspection plan created');
    await this.addMiHistory(user, targetEquipmentId, 'INSPECTION_PLAN_CREATED', 'Inspection plan created', plan.plan_number, null, plan, 'Inspection Plan', plan.id);
    return this.inspectionPlanDetail(user, plan.id);
  }

  async inspectionPlanDetail(user: RequestUser, planId: string) {
    const plan = await this.getInspectionPlanBase(user, planId);
    const [scope, cmlScope, checklist, criteria, schedule, latestEvaluation, occurrences, revisions, documents, cmls] = await Promise.all([
      this.db.single<any>(this.db.from('mi_inspection_plan_scopes').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null),
      this.db.many<any>(this.db.from('mi_inspection_plan_checklist_items').select('*').eq('plan_id', planId).order('sort_order', { ascending: true })).catch(() => []),
      this.db.many<any>(this.db.from('mi_inspection_plan_acceptance_criteria').select('*').eq('plan_id', planId)).catch(() => []),
      this.db.single<any>(this.db.from('mi_inspection_plan_schedules').select('*, rule:mi_inspection_schedule_rules(*)').eq('plan_id', planId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('mi_inspection_due_date_evaluations').select('*').eq('plan_id', planId).order('evaluation_time', { ascending: false }).limit(1).maybeSingle()).catch(() => null),
      this.db.many<any>(this.db.from('mi_inspection_schedule_occurrences').select('*').eq('plan_id', planId).order('due_date', { ascending: true }).limit(100)).catch(() => []),
      this.db.many<any>(this.db.from('mi_inspection_plan_revisions').select('*').eq('plan_id', planId).order('created_at', { ascending: false })).catch(() => []),
      this.db.many<any>(this.db.from('mi_inspection_plan_documents').select('*').eq('plan_id', planId).order('linked_at', { ascending: false })).catch(() => []),
      this.listCmls(user, plan.equipment_id, { limit: '200' }).then((result) => result.rows).catch(() => [])
    ]);
    const readOnly = ['Archived', 'Superseded'].includes(plan.status);
    return {
      plan: this.withInspectionPlanDerived(plan),
      scope,
      cmlScope,
      checklist,
      acceptanceCriteria: criteria,
      schedule,
      latestEvaluation,
      occurrences,
      revisions,
      documents,
      cmlOptions: cmls,
      validation: this.inspectionPlanValidation(plan, scope, cmlScope, checklist, criteria, schedule, latestEvaluation),
      readOnly,
      readOnlyReason: readOnly ? `${plan.status} inspection plans are read-only.` : null,
      actions: this.inspectionPlanActions(user, plan, latestEvaluation)
    };
  }

  async inspectionPlanScope(user: RequestUser, planId: string) {
    await this.getInspectionPlanBase(user, planId);
    return this.db.single<any>(this.db.from('mi_inspection_plan_scopes').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
  }

  async updateInspectionPlanScope(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.inspectionPlanScope(user, planId);
    const row = await this.upsertInspectionPlanScope(user, planId, body);
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.writeMiAudit(user, plan.equipment_id, 'MI_INSPECTION_PLAN_SCOPE_UPDATED', before, row, body.reason ?? 'Inspection plan scope updated');
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_PLAN_SCOPE_UPDATED', 'Inspection plan scope updated', body.reason ?? null, before, row, 'Inspection Plan', planId);
    return row;
  }

  async inspectionPlanCmlScope(user: RequestUser, planId: string) {
    await this.getInspectionPlanBase(user, planId);
    return this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
  }

  async updateInspectionPlanCmlScope(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.inspectionPlanCmlScope(user, planId);
    const row = await this.upsertInspectionPlanCmlScope(user, planId, body);
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.previewInspectionSchedule(user, planId, { persist: true });
    await this.writeMiAudit(user, plan.equipment_id, 'MI_INSPECTION_PLAN_CML_SCOPE_UPDATED', before, row, body.reason ?? 'Inspection plan CML/TML scope updated');
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_PLAN_CML_SCOPE_UPDATED', 'Inspection plan CML/TML scope updated', body.reason ?? null, before, row, 'Inspection Plan', planId);
    return row;
  }

  async inspectionPlanChecklist(user: RequestUser, planId: string) {
    await this.getInspectionPlanBase(user, planId);
    return this.db.many<any>(this.db.from('mi_inspection_plan_checklist_items').select('*').eq('plan_id', planId).order('sort_order', { ascending: true })).catch(() => []);
  }

  async addInspectionPlanChecklistItem(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getInspectionPlanBase(user, planId);
    const item = await this.db.single<any>(this.db.from('mi_inspection_plan_checklist_items').insert({
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: planId,
      item_number: body.itemNumber ?? body.item_number ?? null,
      section_title: body.sectionTitle ?? body.section_title ?? null,
      item_title: body.itemTitle ?? body.item_title,
      requirement_text: body.requirementText ?? body.requirement_text ?? null,
      response_type: body.responseType ?? body.response_type ?? 'Pass/Fail',
      acceptance_criteria: body.acceptanceCriteria ?? body.acceptance_criteria ?? null,
      evidence_required: !!(body.evidenceRequired ?? body.evidence_required),
      attachment_required: !!(body.attachmentRequired ?? body.attachment_required),
      required: body.required ?? true,
      sort_order: Number(body.sortOrder ?? body.sort_order ?? 0),
      active: body.active ?? true
    }).select().single());
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_CHECKLIST_ITEM_CREATED', 'Inspection checklist item created', item.item_title, null, item, 'Inspection Plan', planId);
    return item;
  }

  async updateInspectionPlanChecklistItem(user: RequestUser, planId: string, itemId: string, body: Record<string, any>) {
    const before = await this.db.single<any>(this.db.from('mi_inspection_plan_checklist_items').select('*').eq('plan_id', planId).eq('id', itemId).maybeSingle());
    if (!before) throw new BadRequestException('Checklist item was not found.');
    const row = await this.db.single<any>(this.db.from('mi_inspection_plan_checklist_items').update({
      item_number: body.itemNumber ?? body.item_number ?? before.item_number,
      section_title: body.sectionTitle ?? body.section_title ?? before.section_title,
      item_title: body.itemTitle ?? body.item_title ?? before.item_title,
      requirement_text: body.requirementText ?? body.requirement_text ?? before.requirement_text,
      response_type: body.responseType ?? body.response_type ?? before.response_type,
      acceptance_criteria: body.acceptanceCriteria ?? body.acceptance_criteria ?? before.acceptance_criteria,
      evidence_required: body.evidenceRequired ?? body.evidence_required ?? before.evidence_required,
      attachment_required: body.attachmentRequired ?? body.attachment_required ?? before.attachment_required,
      required: body.required ?? before.required,
      sort_order: body.sortOrder ?? body.sort_order ?? before.sort_order,
      active: body.active ?? before.active,
      updated_at: new Date().toISOString()
    }).eq('id', itemId).select().single());
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_CHECKLIST_ITEM_UPDATED', 'Inspection checklist item updated', row.item_title, before, row, 'Inspection Plan', planId);
    return row;
  }

  async deleteInspectionPlanChecklistItem(user: RequestUser, planId: string, itemId: string) {
    const before = await this.db.single<any>(this.db.from('mi_inspection_plan_checklist_items').select('*').eq('plan_id', planId).eq('id', itemId).maybeSingle());
    if (!before) throw new BadRequestException('Checklist item was not found.');
    await this.db.single(this.db.from('mi_inspection_plan_checklist_items').delete().eq('id', itemId).select('id').single());
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_CHECKLIST_ITEM_DELETED', 'Inspection checklist item deleted', before.item_title, before, null, 'Inspection Plan', planId);
    return { deleted: true };
  }

  async inspectionPlanAcceptanceCriteria(user: RequestUser, planId: string) {
    await this.getInspectionPlanBase(user, planId);
    return this.db.many<any>(this.db.from('mi_inspection_plan_acceptance_criteria').select('*').eq('plan_id', planId)).catch(() => []);
  }

  async addInspectionPlanAcceptanceCriterion(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getInspectionPlanBase(user, planId);
    if (!(body.criterionType ?? body.criterion_type)?.trim()) {
      throw new BadRequestException('Acceptance criterion type is required.');
    }
    const row = await this.db.single<any>(this.db.from('mi_inspection_plan_acceptance_criteria').insert({
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: planId,
      criterion_type: body.criterionType ?? body.criterion_type,
      criterion_key: body.criterionKey ?? body.criterion_key ?? body.criterionType ?? body.criterion_type,
      operator: body.operator ?? null,
      value_numeric: this.numberOrNull(body.valueNumeric ?? body.value_numeric),
      value_text: body.valueText ?? body.value_text ?? null,
      unit: body.unit ?? null,
      severity_if_failed: body.severityIfFailed ?? body.severity_if_failed ?? null,
      create_deficiency_on_fail: !!(body.createDeficiencyOnFail ?? body.create_deficiency_on_fail),
      notes: body.notes ?? null
    }).select().single());
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_ACCEPTANCE_CRITERION_CREATED', 'Inspection acceptance criterion created', row.criterion_type, null, row, 'Inspection Plan', planId);
    return row;
  }

  async updateInspectionPlanAcceptanceCriterion(user: RequestUser, planId: string, criterionId: string, body: Record<string, any>) {
    const before = await this.db.single<any>(this.db.from('mi_inspection_plan_acceptance_criteria').select('*').eq('plan_id', planId).eq('id', criterionId).maybeSingle());
    if (!before) throw new BadRequestException('Acceptance criterion was not found.');
    const row = await this.db.single<any>(this.db.from('mi_inspection_plan_acceptance_criteria').update({
      criterion_type: body.criterionType ?? body.criterion_type ?? before.criterion_type,
      criterion_key: body.criterionKey ?? body.criterion_key ?? before.criterion_key,
      operator: body.operator ?? before.operator,
      value_numeric: this.numberOrNull(body.valueNumeric ?? body.value_numeric ?? before.value_numeric),
      value_text: body.valueText ?? body.value_text ?? before.value_text,
      unit: body.unit ?? before.unit,
      severity_if_failed: body.severityIfFailed ?? body.severity_if_failed ?? before.severity_if_failed,
      create_deficiency_on_fail: body.createDeficiencyOnFail ?? body.create_deficiency_on_fail ?? before.create_deficiency_on_fail,
      notes: body.notes ?? before.notes,
      updated_at: new Date().toISOString()
    }).eq('id', criterionId).select().single());
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_ACCEPTANCE_CRITERION_UPDATED', 'Inspection acceptance criterion updated', row.criterion_type, before, row, 'Inspection Plan', planId);
    return row;
  }

  async inspectionPlanDocuments(user: RequestUser, planId: string) {
    await this.getInspectionPlanBase(user, planId);
    return this.db.many<any>(this.db.from('mi_inspection_plan_documents').select('*').eq('plan_id', planId).order('linked_at', { ascending: false })).catch(() => []);
  }

  async addInspectionPlanDocument(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.inspectionPlanDocuments(user, planId);
    await this.replaceInspectionDocuments(user, planId, [...before, body]);
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_PLAN_DOCUMENT_LINKED', 'Inspection plan document linked', body.title, null, body, 'Inspection Plan', planId);
    return this.inspectionPlanDocuments(user, planId);
  }

  async removeInspectionPlanDocument(user: RequestUser, planId: string, documentLinkId: string) {
    const before = await this.db.single<any>(this.db.from('mi_inspection_plan_documents').select('*').eq('plan_id', planId).eq('id', documentLinkId).maybeSingle());
    if (!before) throw new BadRequestException('Inspection plan document link was not found.');
    await this.db.single(this.db.from('mi_inspection_plan_documents').delete().eq('id', documentLinkId).select('id').single());
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_PLAN_DOCUMENT_UNLINKED', 'Inspection plan document unlinked', before.title, before, null, 'Inspection Plan', planId);
    return { deleted: true };
  }

  inspectionPlanRevisions(user: RequestUser, planId: string) {
    return this.getInspectionPlanBase(user, planId).then(() => this.db.many<any>(this.db.from('mi_inspection_plan_revisions').select('*').eq('plan_id', planId).order('created_at', { ascending: false })).catch(() => []));
  }

  async updateInspectionPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getInspectionPlanBase(user, planId);
    if (['Archived', 'Superseded'].includes(before.status)) throw new BadRequestException(`${before.status} inspection plans are read-only.`);
    if (['Approved', 'Active'].includes(before.status) || before.approval_status === 'Approved') {
      return this.createInspectionPlanRevision(user, planId, body.reason ?? 'Approved plan changed');
    }
    this.validateInspectionPlanInput({ ...before, ...body });
    const payload = this.inspectionPlanUpdatePayload(body, user.id);
    const row = await this.db.single<any>(this.db.from('mi_inspection_plans').update(payload).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    if (body.scope) await this.upsertInspectionPlanScope(user, planId, body.scope);
    if (body.cmlScope) await this.upsertInspectionPlanCmlScope(user, planId, body.cmlScope);
    if (body.schedule) await this.upsertInspectionPlanSchedule(user, planId, body.schedule);
    if (Array.isArray(body.checklistItems)) await this.replaceInspectionChecklist(user, planId, body.checklistItems);
    if (Array.isArray(body.acceptanceCriteria)) await this.replaceInspectionCriteria(user, planId, body.acceptanceCriteria);
    if (Array.isArray(body.documents)) await this.replaceInspectionDocuments(user, planId, body.documents);
    await this.previewInspectionSchedule(user, planId, { persist: true });
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_UPDATED', before, row, body.reason ?? 'Inspection plan updated');
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_UPDATED', 'Inspection plan updated', body.reason ?? row.plan_number, before, row, 'Inspection Plan', planId);
    return this.inspectionPlanDetail(user, planId);
  }

  async archiveInspectionPlan(user: RequestUser, planId: string, reason?: string) {
    if (!reason?.trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.getInspectionPlanBase(user, planId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_plans').update({ status: 'Archived', approval_status: 'Archived', archived_by: user.id, archived_at: new Date().toISOString(), archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_ARCHIVED', before, row, reason);
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_ARCHIVED', 'Inspection plan archived', reason, before, row, 'Inspection Plan', planId);
    return this.inspectionPlanDetail(user, planId);
  }

  async reactivateInspectionPlan(user: RequestUser, planId: string, reason?: string) {
    const before = await this.getInspectionPlanBase(user, planId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_plans').update({ status: 'Draft', approval_status: 'Draft', archived_by: null, archived_at: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_REACTIVATED', before, row, reason ?? 'Inspection plan reactivated');
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_REACTIVATED', 'Inspection plan reactivated', reason ?? null, before, row, 'Inspection Plan', planId);
    return this.inspectionPlanDetail(user, planId);
  }

  async submitInspectionPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getInspectionPlanBase(user, planId);
    const detail = await this.inspectionPlanDetail(user, planId);
    const blockers = detail.validation.blockers as string[];
    if (blockers.length) throw new BadRequestException(`Cannot submit plan: ${blockers.join('; ')}`);
    const row = await this.db.single<any>(this.db.from('mi_inspection_plans').update({ status: 'Pending Review', approval_status: 'Pending Review', updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    await this.createPlanRevisionEvent(user, row, 'Pending Review', body.comment ?? body.reason ?? 'Submitted for review');
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_SUBMITTED', before, row, body.comment ?? 'Inspection plan submitted');
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_SUBMITTED', 'Inspection plan submitted', body.comment ?? null, before, row, 'Inspection Plan', planId);
    return this.inspectionPlanDetail(user, planId);
  }

  async approveInspectionPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getInspectionPlanBase(user, planId);
    const detail = await this.inspectionPlanDetail(user, planId);
    const approvalBlockers = (detail.validation.blockers as string[]).concat(detail.latestEvaluation?.scheduler_error ? [detail.latestEvaluation.scheduler_error] : []);
    if (approvalBlockers.length) throw new BadRequestException(`Cannot approve plan: ${approvalBlockers.join('; ')}`);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('mi_inspection_plans').update({ status: 'Approved', approval_status: 'Approved', approved_by: user.id, approved_at: now, effective_date: body.effectiveDate ?? before.effective_date ?? now.slice(0, 10), updated_by: user.id, updated_at: now }).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    await this.createPlanRevisionEvent(user, row, 'Approved', body.comment ?? 'Approved');
    const evaluation = await this.previewInspectionSchedule(user, planId, { persist: true });
    if (evaluation.final_next_due_date) await this.generateInspectionOccurrence(user, row, evaluation);
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_APPROVED', before, row, body.comment ?? 'Inspection plan approved');
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_APPROVED', 'Inspection plan approved', body.comment ?? null, before, row, 'Inspection Plan', planId);
    return this.inspectionPlanDetail(user, planId);
  }

  async rejectInspectionPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    if (!body.reason?.trim() && !body.comment?.trim()) throw new BadRequestException('Rejection reason is required.');
    const before = await this.getInspectionPlanBase(user, planId);
    const reason = body.reason ?? body.comment;
    const row = await this.db.single<any>(this.db.from('mi_inspection_plans').update({ status: 'Draft', approval_status: 'Rejected', updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    await this.createPlanRevisionEvent(user, row, 'Rejected', reason);
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_REJECTED', before, row, reason);
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_REJECTED', 'Inspection plan rejected', reason, before, row, 'Inspection Plan', planId);
    return this.inspectionPlanDetail(user, planId);
  }

  async createInspectionPlanRevision(user: RequestUser, planId: string, reason?: string) {
    if (!reason?.trim()) throw new BadRequestException('Revision reason is required.');
    const before = await this.getInspectionPlanBase(user, planId);
    const newPlan = await this.db.single<any>(this.db.from('mi_inspection_plans').insert({
      ...this.clonePlanForRevision(before),
      id: crypto.randomUUID(),
      plan_number: await this.nextInspectionPlanNumber(before.equipment),
      status: 'Draft',
      approval_status: 'Draft',
      revision_number: Number(before.revision_number ?? 0) + 1,
      parent_plan_id: before.id,
      approved_by: null,
      approved_at: null,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select('*, equipment:mi_equipment(*)').single());
    await this.copyInspectionPlanChildren(before.id, newPlan.id);
    await this.createPlanRevisionEvent(user, newPlan, 'Draft', reason, before, newPlan);
    await this.writeMiAudit(user, before.equipment_id, 'MI_INSPECTION_PLAN_REVISION_CREATED', before, newPlan, reason);
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_PLAN_REVISION_CREATED', 'Inspection plan revision created', reason, before, newPlan, 'Inspection Plan', newPlan.id);
    return this.inspectionPlanDetail(user, newPlan.id);
  }

  async equipmentInspectionPlans(user: RequestUser, equipmentId: string, query: Record<string, string | undefined>) {
    await this.get(user, equipmentId);
    return this.inspectionPlanRegistry(user, { ...query, equipmentId });
  }

  async equipmentInspectionPlanSummary(user: RequestUser, equipmentId: string) {
    const plans = await this.equipmentInspectionPlans(user, equipmentId, { limit: '100' });
    const rows = plans.rows ?? [];
    const approved = rows.filter((plan: any) => ['Approved', 'Active'].includes(plan.approvalStatus ?? plan.approval_status ?? plan.status));
    const current = approved.sort((a: any, b: any) => String(a.nextDueDate ?? '').localeCompare(String(b.nextDueDate ?? '')))[0] ?? null;
    return {
      approvedPlanCount: approved.length,
      draftPendingPlanCount: rows.filter((plan: any) => ['Draft', 'Pending Review'].includes(plan.status)).length,
      currentNextInspectionDue: current?.nextDueDate ?? null,
      dueStatus: current?.dueStatus ?? (approved.length ? 'Not Scheduled' : 'No Approved Plan'),
      schedulerStatus: current?.schedulerStatus ?? 'Not Configured',
      scheduleBasis: current?.scheduleBasis ?? null,
      governingCml: current?.latestEvaluation?.governing_cml_number ?? null,
      missingInspectionPlanBlocker: !approved.length,
      rows
    };
  }

  async equipmentInspectionSchedule(user: RequestUser, equipmentId: string) {
    const plans = await this.equipmentInspectionPlans(user, equipmentId, { limit: '100' });
    const occurrences = await this.db.many<any>(this.db.from('mi_inspection_schedule_occurrences').select('*, plan:mi_inspection_plans(*)').eq('equipment_id', equipmentId).order('due_date', { ascending: true }).limit(100)).catch(() => []);
    return { plans: plans.rows, occurrences, summary: await this.equipmentInspectionPlanSummary(user, equipmentId) };
  }

  async previewInspectionSchedule(user: RequestUser, planId: string, options: { persist?: boolean; schedulerRunId?: string } = {}) {
    const plan = await this.getInspectionPlanBase(user, planId);
    const schedule = await this.db.single<any>(this.db.from('mi_inspection_plan_schedules').select('*, rule:mi_inspection_schedule_rules(*)').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const cmlScope = await this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const evaluation = await this.calculateInspectionDueDate(user, plan, schedule, cmlScope, options.schedulerRunId);
    if (options.persist) {
      const row = await this.db.single<any>(this.db.from('mi_inspection_due_date_evaluations').insert(evaluation).select().single());
      await this.db.single(this.db.from('mi_inspection_plans').update({
        current_next_due_date: row.final_next_due_date,
        current_due_status: row.due_status,
        current_due_basis: row.final_due_basis,
        current_scheduler_status: row.scheduler_status,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }).eq('id', planId).select('id').single()).catch(() => null);
      await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_SCHEDULE_RECALCULATED', 'Inspection schedule recalculated', row.final_due_basis ?? row.scheduler_error, null, row, 'Inspection Plan', planId);
      return row;
    }
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_SCHEDULE_PREVIEWED', 'Inspection schedule preview generated', evaluation.final_due_basis ?? evaluation.scheduler_error, null, evaluation, 'Inspection Plan', planId).catch(() => null);
    return evaluation;
  }

  async applyInspectionManualOverride(user: RequestUser, planId: string, body: Record<string, any>) {
    if (!body.dueDate && !body.manualOverrideDueDate) throw new BadRequestException('Manual override due date is required.');
    if (!body.reason?.trim() && !body.manualOverrideReason?.trim()) throw new BadRequestException('Manual override reason is required.');
    const plan = await this.getInspectionPlanBase(user, planId);
    const before = await this.db.single<any>(this.db.from('mi_inspection_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const payload = {
      manual_override_due_date: body.dueDate ?? body.manualOverrideDueDate,
      manual_override_reason: body.reason ?? body.manualOverrideReason,
      manual_override_approved_by: user.id,
      manual_override_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await this.db.single(this.db.from('mi_inspection_plan_schedules').update(payload).eq('plan_id', planId).select('id').single());
    const evaluation = await this.previewInspectionSchedule(user, planId, { persist: true });
    await this.writeMiAudit(user, plan.equipment_id, 'MI_INSPECTION_MANUAL_OVERRIDE_APPLIED', before, payload, payload.manual_override_reason);
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_MANUAL_OVERRIDE_APPLIED', 'Inspection manual override applied', payload.manual_override_reason, before, payload, 'Inspection Plan', planId);
    return evaluation;
  }

  inspectionPlanEvaluations(user: RequestUser, planId: string) {
    return this.getInspectionPlanBase(user, planId).then(() => this.db.many<any>(this.db.from('mi_inspection_due_date_evaluations').select('*').eq('plan_id', planId).order('evaluation_time', { ascending: false }).limit(100)).catch(() => []));
  }

  inspectionPlanOccurrences(user: RequestUser, planId: string) {
    return this.getInspectionPlanBase(user, planId).then(() => this.db.many<any>(this.db.from('mi_inspection_schedule_occurrences').select('*').eq('plan_id', planId).order('due_date', { ascending: true }).limit(200)).catch(() => []));
  }

  async runInspectionScheduler(user: RequestUser, body: Record<string, any> = {}) {
    const run = await this.db.single<any>(this.db.from('mi_inspection_scheduler_runs').insert({
      company_id: this.companyScope(user),
      site_id: body.siteId ?? user.selectedSiteId ?? null,
      run_type: body.runType ?? 'Manual',
      status: 'Running',
      triggered_by: 'User',
      triggered_by_user_id: user.id
    }).select().single());
    const plans = await this.scopedInspectionPlans(user, { status: body.includeDrafts ? undefined : 'Approved' });
    const errors: any[] = [];
    let generated = 0;
    for (const plan of plans) {
      try {
        const evaluation = await this.previewInspectionSchedule(user, plan.id, { persist: true, schedulerRunId: run.id });
        if (evaluation.final_next_due_date && ['Approved', 'Active'].includes(plan.status)) {
          const occurrence = await this.generateInspectionOccurrence(user, plan, evaluation);
          if (occurrence) generated += 1;
        }
      } catch (error) {
        errors.push({ planId: plan.id, message: error instanceof Error ? error.message : 'Unknown scheduler error' });
      }
    }
    const finished = await this.db.single<any>(this.db.from('mi_inspection_scheduler_runs').update({
      status: errors.length ? 'Completed With Errors' : 'Completed',
      completed_at: new Date().toISOString(),
      total_plans_evaluated: plans.length,
      updated_plans_count: plans.length - errors.length,
      generated_occurrences_count: generated,
      scheduler_errors_count: errors.length,
      error_summary_json: errors
    }).eq('id', run.id).select().single());
    await this.addGlobalMiHistory(user, 'INSPECTION_SCHEDULER_RUN_COMPLETED', 'Inspection scheduler run completed', `${plans.length} plans evaluated; ${generated} occurrences generated`, finished);
    return finished;
  }

  inspectionSchedulerRuns(user: RequestUser) {
    let request = this.db.from('mi_inspection_scheduler_runs').select('*').eq('company_id', this.companyScope(user)).order('started_at', { ascending: false }).limit(100);
    if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    return this.db.many<any>(request).catch(() => []);
  }

  async inspectionSchedulerRules(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_inspection_schedule_rules').select('*').eq('company_id', this.companyScope(user));
    if (query.active) request = request.eq('active', query.active === 'true');
    if (query.planType) request = request.eq('plan_type', query.planType);
    if (query.inspectionMethod) request = request.eq('inspection_method', query.inspectionMethod);
    if (!user.corporateView && user.siteIds.length) request = request.or(`site_id.is.null,site_id.in.(${user.siteIds.join(',')})`);
    return this.db.many<any>(request.order('rule_name', { ascending: true })).catch(() => []);
  }

  async createInspectionSchedulerRule(user: RequestUser, body: Record<string, any>) {
    if (!body.ruleName && !body.rule_name) throw new BadRequestException('Rule name is required.');
    if (!body.maximumIntervalValue && !body.maximum_interval_value) throw new BadRequestException('Maximum interval is required.');
    const row = await this.db.single<any>(this.db.from('mi_inspection_schedule_rules').insert(this.schedulerRulePayload(user, body)).select().single());
    await this.addGlobalMiHistory(user, 'INSPECTION_SCHEDULER_RULE_CREATED', 'Inspection scheduler rule created', row.rule_name, row);
    return row;
  }

  async updateInspectionSchedulerRule(user: RequestUser, ruleId: string, body: Record<string, any>) {
    const before = await this.db.single<any>(this.db.from('mi_inspection_schedule_rules').select('*').eq('company_id', this.companyScope(user)).eq('id', ruleId).maybeSingle());
    if (!before) throw new BadRequestException('Scheduler rule was not found.');
    const row = await this.db.single<any>(this.db.from('mi_inspection_schedule_rules').update({ ...this.schedulerRulePayload(user, body, true), version: Number(before.version ?? 1) + 1 }).eq('id', ruleId).select().single());
    await this.addGlobalMiHistory(user, 'INSPECTION_SCHEDULER_RULE_UPDATED', 'Inspection scheduler rule updated', row.rule_name, row);
    return row;
  }

  async archiveInspectionSchedulerRule(user: RequestUser, ruleId: string) {
    const row = await this.updateInspectionSchedulerRule(user, ruleId, { active: false });
    return row;
  }

  async inspectionPlanImportTemplate(_user: RequestUser) {
    return { fileName: 'mi-inspection-plan-import-template.csv', content: this.csv([{ plan_title: '', equipment_tag: '', plan_type: 'Visual Inspection Plan', inspection_method: 'Visual', inspection_scope: '', scheduling_mode: 'Fixed calendar interval', frequency_value: '12', frequency_unit: 'Months', rule_name: '', responsible_person: '', responsible_team: '', checklist_items: '', acceptance_criteria: '', effective_date: '', review_date: '', notes: '' }], ['plan_title', 'equipment_tag', 'plan_type', 'inspection_method', 'inspection_scope', 'scheduling_mode', 'frequency_value', 'frequency_unit', 'rule_name', 'responsible_person', 'responsible_team', 'checklist_items', 'acceptance_criteria', 'effective_date', 'review_date', 'notes']) };
  }

  async importInspectionPlans(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const job = await this.db.single<any>(this.db.from('mi_inspection_plan_import_jobs').insert({
      company_id: this.companyScope(user),
      site_id: body.siteId ?? user.selectedSiteId ?? null,
      uploaded_by: user.id,
      file_name: body.fileName ?? 'inspection-plan-import.csv',
      file_key: body.fileKey ?? null,
      status: 'Uploaded',
      total_rows: rows.length
    }).select().single());
    for (let index = 0; index < rows.length; index += 1) {
      await this.db.single(this.db.from('mi_inspection_plan_import_rows').insert({ job_id: job.id, row_number: index + 1, raw_data_json: rows[index], normalized_data_json: rows[index] }).select().single()).catch(() => null);
    }
    await this.addGlobalMiHistory(user, 'INSPECTION_PLAN_IMPORT_STARTED', 'Inspection plan import started', `${rows.length} rows`, job);
    return this.getInspectionPlanImportJob(user, job.id);
  }

  async getInspectionPlanImportJob(user: RequestUser, jobId: string) {
    const job = await this.db.single<any>(this.db.from('mi_inspection_plan_import_jobs').select('*').eq('company_id', this.companyScope(user)).eq('id', jobId).maybeSingle());
    if (!job) throw new BadRequestException('Inspection plan import job was not found.');
    const rows = await this.db.many<any>(this.db.from('mi_inspection_plan_import_rows').select('*').eq('job_id', jobId).order('row_number', { ascending: true })).catch(() => []);
    return { ...job, rows };
  }

  async validateInspectionPlanImportJob(user: RequestUser, jobId: string) {
    const job = await this.getInspectionPlanImportJob(user, jobId);
    const equipment = await this.equipmentRows(user, {});
    const byTag = new Map(equipment.map((item: any) => [String(item.tag ?? item.equipmentTag ?? '').toLowerCase(), item]));
    for (const row of job.rows ?? []) {
      const raw = row.raw_data_json ?? {};
      const errors: string[] = [];
      if (!raw.plan_title && !raw.planTitle) errors.push('plan_title is required');
      if (!raw.equipment_tag && !raw.equipmentTag) errors.push('equipment_tag is required');
      if ((raw.equipment_tag || raw.equipmentTag) && !byTag.has(String(raw.equipment_tag ?? raw.equipmentTag).toLowerCase())) errors.push('equipment_tag was not found in allowed company/site scope');
      if (!raw.plan_type && !raw.planType) errors.push('plan_type is required');
      if (!raw.inspection_method && !raw.inspectionMethod) errors.push('inspection_method is required');
      if (raw.frequency_value && Number.isNaN(Number(raw.frequency_value))) errors.push('frequency_value must be numeric');
      await this.db.single(this.db.from('mi_inspection_plan_import_rows').update({ validation_status: errors.length ? 'Invalid' : 'Valid', validation_errors_json: errors, normalized_data_json: raw }).eq('id', row.id).select().single()).catch(() => null);
    }
    const updated = await this.getInspectionPlanImportJob(user, jobId);
    const errorRows = (updated.rows ?? []).filter((row: any) => row.validation_status === 'Invalid').length;
    await this.db.single(this.db.from('mi_inspection_plan_import_jobs').update({ status: errorRows ? 'Validation Failed' : 'Validated', valid_rows: (updated.rows ?? []).length - errorRows, error_rows: errorRows, updated_at: new Date().toISOString() }).eq('id', jobId).select().single()).catch(() => null);
    await this.addGlobalMiHistory(user, 'INSPECTION_PLAN_IMPORT_VALIDATED', 'Inspection plan import validated', `${errorRows} error rows`, updated);
    return this.getInspectionPlanImportJob(user, jobId);
  }

  async commitInspectionPlanImportJob(user: RequestUser, jobId: string) {
    const job = await this.validateInspectionPlanImportJob(user, jobId);
    if ((job.rows ?? []).some((row: any) => row.validation_status === 'Invalid')) throw new BadRequestException('Import has validation errors.');
    const equipment = await this.equipmentRows(user, {});
    const byTag = new Map(equipment.map((item: any) => [String(item.tag ?? item.equipmentTag ?? '').toLowerCase(), item]));
    let count = 0;
    for (const row of job.rows ?? []) {
      const raw = row.normalized_data_json ?? row.raw_data_json ?? {};
      const eq = byTag.get(String(raw.equipment_tag ?? raw.equipmentTag).toLowerCase());
      if (!eq) continue;
      const created = await this.createInspectionPlan(user, {
        equipmentId: eq.id,
        planTitle: raw.plan_title ?? raw.planTitle,
        planType: raw.plan_type ?? raw.planType,
        inspectionMethod: raw.inspection_method ?? raw.inspectionMethod,
        scope: { scopeStatement: raw.inspection_scope ?? raw.inspectionScope },
        schedule: { schedulingMode: raw.scheduling_mode ?? raw.schedulingMode, frequencyValue: raw.frequency_value ?? raw.frequencyValue, frequencyUnit: raw.frequency_unit ?? raw.frequencyUnit },
        effectiveDate: raw.effective_date ?? raw.effectiveDate,
        expiryReviewDate: raw.review_date ?? raw.reviewDate,
        notes: raw.notes
      });
      await this.db.single(this.db.from('mi_inspection_plan_import_rows').update({ created_plan_id: created.plan.id }).eq('id', row.id).select().single()).catch(() => null);
      count += 1;
    }
    await this.db.single(this.db.from('mi_inspection_plan_import_jobs').update({ status: 'Committed', created_count: count, updated_at: new Date().toISOString() }).eq('id', jobId).select().single()).catch(() => null);
    await this.addGlobalMiHistory(user, 'INSPECTION_PLAN_IMPORT_COMMITTED', 'Inspection plan import committed', `${count} plans created`, job);
    return this.getInspectionPlanImportJob(user, jobId);
  }

  inspectionPlanImportErrorReport(user: RequestUser, jobId: string) {
    return this.getInspectionPlanImportJob(user, jobId).then((job) => ({ fileName: `mi-inspection-plan-import-errors-${jobId}.csv`, content: this.csv((job.rows ?? []).map((row: any) => ({ row_number: row.row_number, status: row.validation_status, errors: (row.validation_errors_json ?? []).join('; ') })), ['row_number', 'status', 'errors']) }));
  }

  async exportInspectionPlans(user: RequestUser, query: Record<string, string | undefined>) {
    const data = await this.inspectionPlanRegistry(user, { ...query, limit: '500' });
    await this.addGlobalMiHistory(user, 'INSPECTION_PLAN_EXPORT_GENERATED', 'Inspection plan export generated', `${data.rows.length} rows`, null);
    return { fileName: 'mi-inspection-plans.csv', content: this.csv(data.rows, ['planNumber', 'planTitle', 'equipmentTag', 'equipmentName', 'planType', 'inspectionMethod', 'status', 'approvalStatus', 'scheduleBasis', 'nextDueDate', 'dueStatus', 'schedulerStatus', 'revisionNumber']) };
  }

  async exportInspectionPlan(user: RequestUser, planId: string) {
    const detail = await this.inspectionPlanDetail(user, planId);
    await this.addMiHistory(user, detail.plan.equipment_id ?? detail.plan.equipmentId, 'INSPECTION_PLAN_EXPORT_GENERATED', 'Inspection plan export generated', detail.plan.planNumber, null, detail, 'Inspection Plan', planId);
    return { fileName: `mi-inspection-plan-${detail.plan.planNumber}.csv`, content: this.csv([detail.plan], ['planNumber', 'planTitle', 'equipmentTag', 'equipmentName', 'planType', 'inspectionMethod', 'status', 'approvalStatus', 'scheduleBasis', 'nextDueDate', 'dueStatus', 'schedulerStatus', 'revisionNumber']) };
  }

  async inspectionRecordRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.scopedInspectionRecords(user, query);
    const search = String(query.search ?? '').trim();
    if (search) request = request.or(`inspection_number.ilike.%${search}%,inspection_type.ilike.%${search}%,inspection_method.ilike.%${search}%,inspector_name.ilike.%${search}%`);
    if (query.status) request = request.eq('status', query.status);
    if (query.reviewStatus) request = request.eq('review_status', query.reviewStatus);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    if (query.planId) request = request.eq('plan_id', query.planId);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sort = String(query.sort ?? 'inspection_date.desc').split('.');
    const { data, error, count } = await request.order(sort[0] || 'inspection_date', { ascending: sort[1] !== 'desc' }).range(from, to);
    if (error) throw new Error(error.message);
    const rows = await this.enrichInspectionRecords(data ?? []);
    return { rows, page, limit, total: count ?? rows.length, summary: this.inspectionRecordSummaryFromRows(rows), savedViews: ['All Records', 'Draft Records', 'In Progress', 'Pending Review', 'Approved Records', 'Records With Findings', 'Critical Findings', 'UT Reading Records', 'Calculation Errors', 'Remaining Life Updated', 'Rejected Records', 'My Inspections', 'Vendor Inspections'], lastUpdated: new Date().toISOString() };
  }

  async inspectionRecordSummary(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.enrichInspectionRecords(await this.db.many<any>(this.scopedInspectionRecords(user, query).limit(1000)).catch(() => []));
    return this.inspectionRecordSummaryFromRows(rows);
  }

  async inspectionReviewQueue(user: RequestUser) {
    return this.inspectionRecordRegistry(user, { reviewStatus: 'Pending Review', limit: '50' });
  }

  async equipmentInspectionRecords(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    await this.get(user, equipmentId);
    return this.inspectionRecordRegistry(user, { ...query, equipmentId });
  }

  async createInspectionRecord(user: RequestUser, body: Record<string, any>, forcedEquipmentId?: string) {
    const equipment = await this.get(user, forcedEquipmentId ?? body.equipmentId ?? body.equipment_id);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    if (this.isArchived(equipment) && !body.overrideArchived) throw new BadRequestException('Archived/decommissioned equipment requires authorized override before inspection execution.');
    const plan = body.planId || body.plan_id ? await this.getInspectionPlanBase(user, body.planId ?? body.plan_id) : null;
    if (plan && plan.equipment_id !== shadow.id) throw new BadRequestException('Inspection plan must belong to the selected equipment.');
    const occurrence = body.occurrenceId || body.occurrence_id ? await this.getInspectionOccurrenceBase(user, body.occurrenceId ?? body.occurrence_id) : null;
    if (occurrence && occurrence.equipment_id !== shadow.id) throw new BadRequestException('Scheduled occurrence must belong to the selected equipment.');
    const planned = body.planned ?? !!(plan || occurrence);
    if (!planned && !(body.unplannedReason ?? body.unplanned_reason)) throw new BadRequestException('Unplanned inspection reason is required.');
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').insert({
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      equipment_id: shadow.id,
      plan_id: plan?.id ?? null,
      occurrence_id: occurrence?.id ?? null,
      inspection_number: body.inspectionNumber ?? body.inspection_number ?? await this.nextInspectionRecordNumber(shadow),
      inspection_type: body.inspectionType ?? body.inspection_type ?? plan?.plan_type ?? 'External Visual Inspection',
      inspection_method: body.inspectionMethod ?? body.inspection_method ?? plan?.inspection_method ?? 'Visual',
      planned,
      unplanned_reason: body.unplannedReason ?? body.unplanned_reason ?? null,
      status: body.status ?? 'Draft',
      review_status: body.reviewStatus ?? body.review_status ?? 'Not Submitted',
      result: body.result ?? 'Not Evaluated',
      inspection_date: body.inspectionDate ?? body.inspection_date ?? new Date().toISOString().slice(0, 10),
      start_time: body.startTime ?? body.start_time ?? null,
      end_time: body.endTime ?? body.end_time ?? null,
      inspector_user_id: body.inspectorUserId ?? body.inspector_user_id ?? user.id,
      inspector_name: body.inspectorName ?? body.inspector_name ?? null,
      inspector_qualification: body.inspectorQualification ?? body.inspector_qualification ?? null,
      inspection_vendor: body.inspectionVendor ?? body.inspection_vendor ?? null,
      reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? null,
      responsible_engineer_id: body.responsibleEngineerId ?? body.responsible_engineer_id ?? null,
      online_offline_status: body.onlineOfflineStatus ?? body.online_offline_status ?? null,
      shutdown_required: !!(body.shutdownRequired ?? body.shutdown_required),
      entry_required: !!(body.entryRequired ?? body.entry_required),
      confined_space_permit_id: body.confinedSpacePermitId ?? body.confined_space_permit_id ?? null,
      ptw_id: body.ptwId ?? body.ptw_id ?? null,
      loto_id: body.lotoId ?? body.loto_id ?? null,
      procedure_document_id: body.procedureDocumentId ?? body.procedure_document_id ?? null,
      instrument_used: body.instrumentUsed ?? body.instrument_used ?? null,
      instrument_serial_number: body.instrumentSerialNumber ?? body.instrument_serial_number ?? null,
      instrument_calibration_document_id: body.instrumentCalibrationDocumentId ?? body.instrument_calibration_document_id ?? null,
      notes: body.notes ?? null,
      plan_snapshot_json: plan ?? {},
      occurrence_snapshot_json: occurrence ?? {},
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.seedInspectionChecklistFromPlan(user, row, plan);
    await this.seedInspectionReadingsFromPlan(user, row, plan, body.readings ?? []);
    await this.addMiHistory(user, shadow.id, 'INSPECTION_RECORD_CREATED', 'Inspection record created', row.inspection_number, null, row, 'Inspection Record', row.id);
    return this.inspectionRecordDetail(user, row.id);
  }

  async createInspectionRecordFromOccurrence(user: RequestUser, occurrenceId: string, body: Record<string, any> = {}) {
    const occurrence = await this.getInspectionOccurrenceBase(user, occurrenceId);
    return this.createInspectionRecord(user, { ...body, occurrenceId, planId: occurrence.plan_id, equipmentId: occurrence.equipment_id, planned: true }, occurrence.equipment_id);
  }

  async inspectionRecordDetail(user: RequestUser, inspectionId: string) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    const [checklist, readings, findings, documents, reviews, calculations] = await Promise.all([
      this.inspectionRecordChecklist(user, inspectionId),
      this.inspectionRecordReadings(user, inspectionId),
      this.inspectionRecordFindings(user, inspectionId),
      this.inspectionRecordDocuments(user, inspectionId),
      this.inspectionRecordReviews(user, inspectionId),
      this.inspectionRecordRemainingLifePreview(user, inspectionId)
    ]);
    const validation = this.inspectionRecordValidation(record, checklist, readings, findings);
    return { record: (await this.enrichInspectionRecords([record]))[0], checklist, readings, findings, documents, reviews, calculations, validation, actions: this.inspectionRecordActions(user, record, validation), readOnly: ['Approved', 'Rejected', 'Archived', 'Superseded'].includes(record.status), readOnlyReason: ['Approved', 'Rejected', 'Archived', 'Superseded'].includes(record.status) ? 'Inspection record is locked.' : null };
  }

  async updateInspectionRecord(user: RequestUser, inspectionId: string, body: Record<string, any>) {
    const before = await this.getInspectionRecordBase(user, inspectionId);
    this.assertInspectionRecordEditable(before);
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').update(this.inspectionRecordUpdatePayload(body, user.id)).eq('id', inspectionId).select().single());
    await this.addMiHistory(user, row.equipment_id, 'INSPECTION_RECORD_UPDATED', 'Inspection record updated', body.reason ?? null, before, row, 'Inspection Record', inspectionId);
    return this.inspectionRecordDetail(user, inspectionId);
  }

  async archiveInspectionRecord(user: RequestUser, inspectionId: string, reason?: string) {
    if (!reason) throw new BadRequestException('Archive reason is required.');
    const before = await this.getInspectionRecordBase(user, inspectionId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').update({ status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', inspectionId).select().single());
    await this.addMiHistory(user, row.equipment_id, 'INSPECTION_RECORD_ARCHIVED', 'Inspection record archived', reason, before, row, 'Inspection Record', inspectionId);
    return this.inspectionRecordDetail(user, inspectionId);
  }

  async inspectionRecordChecklist(user: RequestUser, inspectionId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    return this.db.many<any>(this.db.from('mi_inspection_record_checklist_items').select('*').eq('inspection_record_id', inspectionId).order('sort_order', { ascending: true })).catch(() => []);
  }

  async updateInspectionChecklistItem(user: RequestUser, inspectionId: string, itemId: string, body: Record<string, any>) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    this.assertInspectionRecordEditable(record);
    const before = await this.db.single<any>(this.db.from('mi_inspection_record_checklist_items').select('*').eq('inspection_record_id', inspectionId).eq('id', itemId).maybeSingle());
    if (!before) throw new BadRequestException('Checklist item was not found.');
    const completed = body.completed ?? body.inspectorCompleted ?? body.completed_at;
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_checklist_items').update({
      response_value_json: body.responseValueJson ?? body.response_value_json ?? body.response ?? before.response_value_json,
      pass_fail: body.passFail ?? body.pass_fail ?? before.pass_fail,
      comment: body.comment ?? before.comment,
      evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? before.evidence_document_id,
      finding_created: body.findingCreated ?? body.finding_created ?? before.finding_created,
      completed_by: completed ? user.id : before.completed_by,
      completed_at: completed ? new Date().toISOString() : before.completed_at,
      updated_at: new Date().toISOString()
    }).eq('id', itemId).select().single());
    await this.addMiHistory(user, record.equipment_id, row.pass_fail === 'Fail' ? 'INSPECTION_CHECKLIST_FAILED_ITEM' : 'INSPECTION_CHECKLIST_UPDATED', 'Inspection checklist item updated', row.item_title, before, row, 'Inspection Checklist', itemId);
    return row;
  }

  async inspectionRecordReadings(user: RequestUser, inspectionId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    const rows = await this.db.many<any>(this.db.from('mi_inspection_record_cml_readings').select('*, cml:mi_cmls(*)').eq('inspection_record_id', inspectionId).order('reading_date', { ascending: false })).catch(() => []);
    return rows.map((row) => ({ ...row, cmlNumber: row.cml?.cml_number ?? null, locationDescription: row.cml?.location_description ?? null, componentType: row.cml?.component_type ?? null }));
  }

  async addInspectionRecordReading(user: RequestUser, inspectionId: string, body: Record<string, any>) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    this.assertInspectionRecordEditable(record);
    const cml = await this.getCmlBase(user, record.equipment_id, body.cmlId ?? body.cml_id);
    const payload = await this.inspectionReadingPayload(user, record, cml, body);
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').insert(payload).select().single());
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_READING_CREATED', 'Inspection UT reading created', cml.cml_number, null, row, 'Inspection Reading', row.id);
    await this.generateRemainingLifeEvaluationFromInspectionReading(user, row, false);
    return row;
  }

  async updateInspectionRecordReading(user: RequestUser, inspectionId: string, readingId: string, body: Record<string, any>) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    this.assertInspectionRecordEditable(record);
    const before = await this.getInspectionReadingBase(user, inspectionId, readingId);
    if (before.review_status === 'Approved') throw new BadRequestException('Approved readings must be superseded/corrected, not silently edited.');
    const cml = await this.getCmlBase(user, record.equipment_id, before.cml_id);
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').update(await this.inspectionReadingPayload(user, record, cml, { ...before, ...body }, true)).eq('id', readingId).select().single());
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_READING_UPDATED', 'Inspection UT reading updated', body.reason ?? null, before, row, 'Inspection Reading', readingId);
    await this.generateRemainingLifeEvaluationFromInspectionReading(user, row, false);
    return row;
  }

  async reviewInspectionReading(user: RequestUser, inspectionId: string, readingId: string, body: Record<string, any>) {
    const before = await this.getInspectionReadingBase(user, inspectionId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').update({ reading_status: 'Pending Review', review_status: 'Pending Review', notes: body.comment ?? before.notes, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_READING_REVIEW_REQUESTED', 'Inspection UT reading review requested', body.comment ?? null, before, row, 'Inspection Reading', readingId);
    return row;
  }

  async approveInspectionReading(user: RequestUser, inspectionId: string, readingId: string, body: Record<string, any>) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    const before = await this.getInspectionReadingBase(user, inspectionId, readingId);
    if (before.not_inspected || before.not_accessible) throw new BadRequestException('Not inspected/not accessible readings cannot be approved as official thickness values.');
    if (this.numberOrNull(before.current_thickness) === null) throw new BadRequestException('Current thickness is required before approval.');
    const cmlReading = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').insert({
      cml_id: before.cml_id,
      equipment_id: before.equipment_id,
      company_id: before.company_id,
      site_id: before.site_id,
      reading_date: before.reading_date,
      thickness_value: before.normalized_thickness ?? before.current_thickness,
      thickness_unit: 'mm',
      inspection_method: record.inspection_method,
      inspector_user_id: before.inspector_user_id ?? user.id,
      surface_condition: before.surface_condition,
      evidence_document_id: before.attachment_document_id,
      status: 'Approved',
      review_status: 'Approved',
      review_comment: body.comment ?? null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: before.notes,
      created_by: before.created_by,
      updated_by: user.id
    }).select().single());
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').update({ reading_status: 'Approved', review_status: 'Approved', cml_thickness_reading_id: cmlReading.id, approved_by: user.id, approved_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    const snapshot = await this.recalculateCml(user, before.equipment_id, before.cml_id);
    await this.generateRemainingLifeEvaluationFromInspectionReading(user, row, true, snapshot);
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_READING_APPROVED', 'Inspection UT reading approved and official CML calculation updated', body.comment ?? null, before, row, 'Inspection Reading', readingId);
    return row;
  }

  async rejectInspectionReading(user: RequestUser, inspectionId: string, readingId: string, body: Record<string, any>) {
    if (!body.reason && !body.comment) throw new BadRequestException('Rejection reason is required.');
    const before = await this.getInspectionReadingBase(user, inspectionId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').update({ reading_status: 'Rejected', review_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejected_reason: body.reason ?? body.comment, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_READING_REJECTED', 'Inspection UT reading rejected', body.reason ?? body.comment, before, row, 'Inspection Reading', readingId);
    return row;
  }

  async supersedeInspectionReading(user: RequestUser, inspectionId: string, readingId: string, body: Record<string, any>) {
    if (!body.reason) throw new BadRequestException('Supersede reason is required.');
    const before = await this.getInspectionReadingBase(user, inspectionId, readingId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').update({ reading_status: 'Superseded', review_status: 'Superseded', superseded_by_reading_id: body.supersededByReadingId ?? body.superseded_by_reading_id ?? null, notes: body.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', readingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_READING_SUPERSEDED', 'Inspection UT reading superseded', body.reason, before, row, 'Inspection Reading', readingId);
    return row;
  }

  async approveAllValidInspectionReadings(user: RequestUser, inspectionId: string, body: Record<string, any> = {}) {
    const readings = await this.inspectionRecordReadings(user, inspectionId);
    const approved = [];
    for (const reading of readings) {
      if (!['Approved', 'Rejected', 'Superseded'].includes(reading.review_status) && !reading.not_inspected && !reading.not_accessible && this.numberOrNull(reading.current_thickness) !== null) approved.push(await this.approveInspectionReading(user, inspectionId, reading.id, body));
    }
    return { approved: approved.length, readings: approved };
  }

  async equipmentUtReadings(user: RequestUser, equipmentId: string) {
    await this.get(user, equipmentId);
    return this.db.many<any>(this.db.from('mi_inspection_record_cml_readings').select('*, cml:mi_cmls(cml_number,location_description,component_type)').eq('equipment_id', equipmentId).order('reading_date', { ascending: false }).limit(500)).catch(() => []);
  }

  async cmlInspectionReadings(user: RequestUser, equipmentId: string, cmlId: string) {
    await this.getCmlBase(user, equipmentId, cmlId);
    return this.db.many<any>(this.db.from('mi_inspection_record_cml_readings').select('*').eq('equipment_id', equipmentId).eq('cml_id', cmlId).order('reading_date', { ascending: false }).limit(300)).catch(() => []);
  }

  async addCmlInspectionReading(user: RequestUser, equipmentId: string, cmlId: string, body: Record<string, any>) {
    const record = body.inspectionId || body.inspection_record_id
      ? await this.getInspectionRecordBase(user, body.inspectionId ?? body.inspection_record_id)
      : await this.createInspectionRecord(user, { equipmentId, inspectionType: 'UT Thickness', inspectionMethod: 'UT', planned: false, unplannedReason: body.reason ?? 'Standalone UT reading entry' }, equipmentId).then((detail: any) => detail.record);
    return this.addInspectionRecordReading(user, record.id, { ...body, cmlId });
  }

  async inspectionRecordRemainingLifePreview(user: RequestUser, inspectionId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    const rows = await this.db.many<any>(this.db.from('mi_remaining_life_evaluations').select('*, cml:mi_cmls(cml_number,location_description,component_type)').eq('inspection_record_id', inspectionId).order('calculated_at', { ascending: false })).catch(() => []);
    return this.remainingLifeSummary(rows);
  }

  async equipmentRemainingLife(user: RequestUser, equipmentId: string) {
    await this.get(user, equipmentId);
    const rows = await this.db.many<any>(this.db.from('mi_remaining_life_evaluations').select('*, cml:mi_cmls(cml_number,location_description,component_type)').eq('equipment_id', equipmentId).eq('official', true).order('calculated_at', { ascending: false })).catch(() => []);
    if (rows.length) return this.remainingLifeSummary(rows);
    const snapshots = await this.db.many<any>(this.db.from('mi_cml_calculation_snapshots').select('*, cml:mi_cmls(cml_number,location_description,component_type)').eq('equipment_id', equipmentId).order('calculated_at', { ascending: false })).catch(() => []);
    return this.remainingLifeSummary(snapshots.map((row) => ({ ...row, evaluation_status: row.calculation_status, alert_state: row.alert_state ?? row.alert_status, current_thickness: row.current_thickness, current_reading_date: row.current_reading_date })));
  }

  async cmlRemainingLife(user: RequestUser, equipmentId: string, cmlId: string) {
    await this.getCmlBase(user, equipmentId, cmlId);
    const rows = await this.db.many<any>(this.db.from('mi_remaining_life_evaluations').select('*').eq('equipment_id', equipmentId).eq('cml_id', cmlId).order('calculated_at', { ascending: false })).catch(() => []);
    return { rows, latest: rows[0] ?? await this.latestCmlSnapshot(cmlId) };
  }

  async recalculateInspectionRecord(user: RequestUser, inspectionId: string) {
    const readings = await this.inspectionRecordReadings(user, inspectionId);
    const evaluations = [];
    for (const reading of readings) evaluations.push(await this.generateRemainingLifeEvaluationFromInspectionReading(user, reading, reading.review_status === 'Approved'));
    const preview = await this.inspectionRecordRemainingLifePreview(user, inspectionId);
    await this.db.single(this.db.from('mi_inspection_records').update({ calculation_preview_json: preview, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', inspectionId).select('id').single()).catch(() => null);
    return { evaluations, preview };
  }

  async recalculateCmlRemainingLife(user: RequestUser, equipmentId: string, cmlId: string) {
    const snapshot = await this.recalculateCml(user, equipmentId, cmlId);
    const cml = await this.getCmlBase(user, equipmentId, cmlId);
    return this.persistRemainingLifeEvaluation(user, cml, null, snapshot, true);
  }

  async recalculateEquipmentRemainingLife(user: RequestUser, equipmentId: string) {
    const cmls = await this.db.many<any>(this.db.from('mi_cmls').select('id').eq('equipment_id', equipmentId).eq('active', true)).catch(() => []);
    const rows = [];
    for (const cml of cmls) rows.push(await this.recalculateCmlRemainingLife(user, equipmentId, cml.id));
    return { recalculated: rows.length, summary: await this.equipmentRemainingLife(user, equipmentId) };
  }

  async inspectionRecordFindings(user: RequestUser, inspectionId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    return this.db.many<any>(this.db.from('mi_inspection_findings').select('*, cml:mi_cmls(cml_number)').eq('inspection_record_id', inspectionId).order('created_at', { ascending: false })).catch(() => []);
  }

  async addInspectionFinding(user: RequestUser, inspectionId: string, body: Record<string, any>) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    if (body.cmlId || body.cml_id) await this.getCmlBase(user, record.equipment_id, body.cmlId ?? body.cml_id);
    const row = await this.db.single<any>(this.db.from('mi_inspection_findings').insert({
      company_id: record.company_id,
      site_id: record.site_id,
      equipment_id: record.equipment_id,
      inspection_record_id: inspectionId,
      cml_id: body.cmlId ?? body.cml_id ?? null,
      finding_number: body.findingNumber ?? body.finding_number ?? await this.nextInspectionFindingNumber(record),
      finding_type: body.findingType ?? body.finding_type ?? 'Other',
      severity: body.severity ?? 'Medium',
      title: body.title ?? body.findingType ?? 'Inspection finding',
      description: body.description ?? null,
      location_description: body.locationDescription ?? body.location_description ?? null,
      evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? null,
      immediate_action_required: !!(body.immediateActionRequired ?? body.immediate_action_required),
      repair_required: !!(body.repairRequired ?? body.repair_required),
      engineering_review_required: !!(body.engineeringReviewRequired ?? body.engineering_review_required),
      deficiency_required: !!(body.deficiencyRequired ?? body.deficiency_required),
      recommended_action: body.recommendedAction ?? body.recommended_action ?? null,
      due_date: body.dueDate ?? body.due_date ?? null,
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      status: body.status ?? 'Open',
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_FINDING_CREATED', 'Inspection finding created', row.title, null, row, 'Inspection Finding', row.id);
    return row;
  }

  async updateInspectionFinding(user: RequestUser, inspectionId: string, findingId: string, body: Record<string, any>) {
    const before = await this.getInspectionFindingBase(user, inspectionId, findingId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_findings').update({
      finding_type: body.findingType ?? body.finding_type ?? before.finding_type,
      severity: body.severity ?? before.severity,
      title: body.title ?? before.title,
      description: body.description ?? before.description,
      location_description: body.locationDescription ?? body.location_description ?? before.location_description,
      immediate_action_required: body.immediateActionRequired ?? body.immediate_action_required ?? before.immediate_action_required,
      repair_required: body.repairRequired ?? body.repair_required ?? before.repair_required,
      engineering_review_required: body.engineeringReviewRequired ?? body.engineering_review_required ?? before.engineering_review_required,
      deficiency_required: body.deficiencyRequired ?? body.deficiency_required ?? before.deficiency_required,
      recommended_action: body.recommendedAction ?? body.recommended_action ?? before.recommended_action,
      due_date: body.dueDate ?? body.due_date ?? before.due_date,
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? before.owner_user_id,
      status: body.status ?? before.status,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', findingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_FINDING_UPDATED', 'Inspection finding updated', body.reason ?? null, before, row, 'Inspection Finding', findingId);
    return row;
  }

  async closeInspectionFinding(user: RequestUser, inspectionId: string, findingId: string, body: Record<string, any>) {
    if (!body.notes && !body.reason) throw new BadRequestException('Closure notes are required.');
    const before = await this.getInspectionFindingBase(user, inspectionId, findingId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_findings').update({ status: 'Closed', closed_by: user.id, closed_at: new Date().toISOString(), closure_notes: body.notes ?? body.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', findingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_FINDING_CLOSED', 'Inspection finding closed', body.notes ?? body.reason, before, row, 'Inspection Finding', findingId);
    return row;
  }

  async createActionFromInspectionFinding(user: RequestUser, inspectionId: string, findingId: string, body: Record<string, any>) {
    const before = await this.getInspectionFindingBase(user, inspectionId, findingId);
    const actionId = body.actionId ?? body.linkedActionId ?? `action_placeholder_${findingId}`;
    const row = await this.db.single<any>(this.db.from('mi_inspection_findings').update({ linked_action_id: actionId, status: 'Action Assigned', updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', findingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_FINDING_ACTION_LINKED', 'Inspection finding linked to action foundation', actionId, before, row, 'Inspection Finding', findingId);
    return row;
  }

  async createDeficiencyPlaceholderFromFinding(user: RequestUser, inspectionId: string, findingId: string, body: Record<string, any>) {
    const before = await this.getInspectionFindingBase(user, inspectionId, findingId);
    const deficiencyId = body.deficiencyId ?? `deficiency_placeholder_${findingId}`;
    const row = await this.db.single<any>(this.db.from('mi_inspection_findings').update({ linked_deficiency_id: deficiencyId, deficiency_required: true, status: 'Deficiency Created', updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', findingId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'INSPECTION_FINDING_DEFICIENCY_PLACEHOLDER_CREATED', 'Inspection finding deficiency placeholder created', deficiencyId, before, row, 'Inspection Finding', findingId);
    return row;
  }

  async submitInspectionRecord(user: RequestUser, inspectionId: string, body: Record<string, any> = {}) {
    const detail = await this.inspectionRecordDetail(user, inspectionId);
    if (detail.validation.blockers.length) throw new BadRequestException(detail.validation.blockers.join(' '));
    const before = detail.record;
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').update({ status: 'Submitted for Review', review_status: 'Pending Review', submitted_by: user.id, submitted_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', inspectionId).select().single());
    await this.db.single(this.db.from('mi_inspection_record_reviews').insert({ company_id: row.company_id, site_id: row.site_id, inspection_record_id: inspectionId, reviewer_user_id: user.id, review_action: 'Submitted', review_comments: body.comment ?? null }).select().single()).catch(() => null);
    await this.addMiHistory(user, row.equipment_id, 'INSPECTION_RECORD_SUBMITTED', 'Inspection record submitted for review', body.comment ?? null, before, row, 'Inspection Record', inspectionId);
    return this.inspectionRecordDetail(user, inspectionId);
  }

  async approveInspectionRecord(user: RequestUser, inspectionId: string, body: Record<string, any> = {}) {
    const detail = await this.inspectionRecordDetail(user, inspectionId);
    const before = detail.record;
    const pending = detail.readings.filter((reading: any) => !['Approved', 'Rejected', 'Superseded', 'Not Inspected', 'Not Accessible'].includes(String(reading.review_status ?? reading.reading_status)));
    for (const reading of pending) await this.approveInspectionReading(user, inspectionId, reading.id, { comment: 'Approved with inspection record.' }).catch(() => null);
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').update({ status: 'Approved', review_status: 'Approved', result: body.result ?? before.result ?? 'Pass', approved_by: user.id, approved_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString(), remaining_life_updated: true }).eq('id', inspectionId).select().single());
    await this.completeLinkedOccurrenceAfterInspection(user, row);
    await this.recalculateInspectionPlansForEquipment(user, row.equipment_id);
    await this.db.single(this.db.from('mi_inspection_record_reviews').insert({ company_id: row.company_id, site_id: row.site_id, inspection_record_id: inspectionId, reviewer_user_id: user.id, review_action: 'Approved', review_comments: body.comment ?? null, critical_alerts_acknowledged: !!body.criticalAlertsAcknowledged, findings_acknowledged: !!body.findingsAcknowledged }).select().single()).catch(() => null);
    await this.addMiHistory(user, row.equipment_id, 'INSPECTION_RECORD_APPROVED', 'Inspection record approved', body.comment ?? null, before, row, 'Inspection Record', inspectionId);
    return this.inspectionRecordDetail(user, inspectionId);
  }

  async rejectInspectionRecord(user: RequestUser, inspectionId: string, body: Record<string, any>) {
    if (!body.reason && !body.comment) throw new BadRequestException('Rejection reason is required.');
    const before = await this.getInspectionRecordBase(user, inspectionId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').update({ status: 'Rejected', review_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: body.reason ?? body.comment, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', inspectionId).select().single());
    await this.db.single(this.db.from('mi_inspection_record_reviews').insert({ company_id: row.company_id, site_id: row.site_id, inspection_record_id: inspectionId, reviewer_user_id: user.id, review_action: 'Rejected', review_comments: body.reason ?? body.comment }).select().single()).catch(() => null);
    await this.addMiHistory(user, row.equipment_id, 'INSPECTION_RECORD_REJECTED', 'Inspection record rejected', body.reason ?? body.comment, before, row, 'Inspection Record', inspectionId);
    return this.inspectionRecordDetail(user, inspectionId);
  }

  async returnInspectionRecordForCorrection(user: RequestUser, inspectionId: string, body: Record<string, any>) {
    if (!body.reason && !body.comment) throw new BadRequestException('Return reason is required.');
    const before = await this.getInspectionRecordBase(user, inspectionId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_records').update({ status: 'Returned for Correction', review_status: 'Returned', returned_by: user.id, returned_at: new Date().toISOString(), return_reason: body.reason ?? body.comment, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', inspectionId).select().single());
    await this.db.single(this.db.from('mi_inspection_record_reviews').insert({ company_id: row.company_id, site_id: row.site_id, inspection_record_id: inspectionId, reviewer_user_id: user.id, review_action: 'Returned for Correction', review_comments: body.reason ?? body.comment }).select().single()).catch(() => null);
    await this.addMiHistory(user, row.equipment_id, 'INSPECTION_RECORD_RETURNED', 'Inspection record returned for correction', body.reason ?? body.comment, before, row, 'Inspection Record', inspectionId);
    return this.inspectionRecordDetail(user, inspectionId);
  }

  async inspectionRecordReviews(user: RequestUser, inspectionId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    return this.db.many<any>(this.db.from('mi_inspection_record_reviews').select('*').eq('inspection_record_id', inspectionId).order('created_at', { ascending: false })).catch(() => []);
  }

  async inspectionRecordDocuments(user: RequestUser, inspectionId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    return this.db.many<any>(this.db.from('mi_inspection_record_documents').select('*').eq('inspection_record_id', inspectionId).order('linked_at', { ascending: false })).catch(() => []);
  }

  async addInspectionRecordDocument(user: RequestUser, inspectionId: string, body: Record<string, any>) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    const row = await this.db.single<any>(this.db.from('mi_inspection_record_documents').insert({ company_id: record.company_id, site_id: record.site_id, inspection_record_id: inspectionId, equipment_id: record.equipment_id, document_id: body.documentId ?? body.document_id ?? null, file_id: body.fileId ?? body.file_id ?? null, document_type: body.documentType ?? body.document_type ?? 'Evidence', title: body.title ?? 'Inspection evidence', version: body.version ?? null, status: body.status ?? 'Linked', linked_by: user.id }).select().single());
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_DOCUMENT_LINKED', 'Inspection evidence/report document linked', row.title, null, row, 'Inspection Document', row.id);
    return row;
  }

  async removeInspectionRecordDocument(user: RequestUser, inspectionId: string, documentLinkId: string) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    const before = await this.db.single<any>(this.db.from('mi_inspection_record_documents').select('*').eq('inspection_record_id', inspectionId).eq('id', documentLinkId).maybeSingle());
    if (!before) throw new BadRequestException('Inspection document link was not found.');
    await this.db.single(this.db.from('mi_inspection_record_documents').delete().eq('id', documentLinkId).select('id').single());
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_DOCUMENT_UNLINKED', 'Inspection document unlinked', before.title, before, null, 'Inspection Document', documentLinkId);
    return { deleted: true };
  }

  async inspectionRecordReport(user: RequestUser, inspectionId: string) {
    const detail = await this.inspectionRecordDetail(user, inspectionId);
    return { fileName: `${detail.record.inspection_number}.csv`, content: this.csv([{ section: 'Inspection', value: detail.record.inspection_number }, { section: 'Result', value: detail.record.result }, { section: 'Readings', value: detail.readings.length }, { section: 'Findings', value: detail.findings.length }], ['section', 'value']) };
  }

  async exportInspectionRecords(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const data = await this.inspectionRecordRegistry(user, { ...query, limit: '1000' });
    await this.addGlobalMiHistory(user, 'INSPECTION_RECORD_EXPORT_GENERATED', 'Inspection record export generated', `${data.rows.length} rows`, null);
    return { fileName: 'mi-inspection-records.csv', content: this.csv(data.rows, ['inspection_number', 'equipmentTag', 'equipmentName', 'inspection_type', 'inspection_method', 'inspection_date', 'status', 'review_status', 'result', 'inspector_name', 'readingsCount', 'findingsCount', 'criticalFindingsCount', 'remaining_life_updated', 'next_due_updated']) };
  }

  async inspectionRecordImportTemplate(_user: RequestUser) {
    return { fileName: 'mi-ut-reading-import-template.csv', content: this.csv([{ equipment_tag: '', inspection_number: '', cml_number: '', reading_date: '', current_thickness: '', thickness_unit: 'mm', inspector_name: '', surface_condition: '', scan_direction: '', measurement_point_label: '', not_inspected: 'false', not_inspected_reason: '', not_accessible: 'false', not_accessible_reason: '', notes: '' }], ['equipment_tag', 'inspection_number', 'cml_number', 'reading_date', 'current_thickness', 'thickness_unit', 'inspector_name', 'surface_condition', 'scan_direction', 'measurement_point_label', 'not_inspected', 'not_inspected_reason', 'not_accessible', 'not_accessible_reason', 'notes']) };
  }

  async importInspectionRecords(user: RequestUser, body: Record<string, any>, equipmentId?: string) {
    const scope = this.companyScope(user);
    const siteId = equipmentId ? (await this.get(user, equipmentId)).siteId : (body.siteId ?? user.selectedSiteId ?? user.siteIds[0]);
    const job = await this.db.single<any>(this.db.from('mi_inspection_record_import_jobs').insert({ company_id: scope, site_id: siteId, equipment_id: equipmentId ?? null, inspection_record_id: body.inspectionId ?? body.inspection_record_id ?? null, import_type: body.importType ?? 'UT Readings', uploaded_by: user.id, file_name: body.fileName ?? 'manual-import.csv', file_key: body.fileKey ?? null, status: 'Uploaded', total_rows: Array.isArray(body.rows) ? body.rows.length : 0 }).select().single());
    const rows = Array.isArray(body.rows) ? body.rows : [];
    for (let index = 0; index < rows.length; index += 1) await this.db.single(this.db.from('mi_inspection_record_import_rows').insert({ job_id: job.id, row_number: index + 1, raw_data_json: rows[index], normalized_data_json: rows[index], validation_status: 'Pending' }).select().single()).catch(() => null);
    await this.addGlobalMiHistory(user, 'INSPECTION_IMPORT_UPLOADED', 'Inspection/UT reading import uploaded', job.file_name, job);
    return this.getInspectionRecordImportJob(user, job.id);
  }

  async getInspectionRecordImportJob(user: RequestUser, jobId: string) {
    let request = this.db.from('mi_inspection_record_import_jobs').select('*').eq('company_id', this.companyScope(user)).eq('id', jobId);
    if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    const job = await this.db.single<any>(request.maybeSingle());
    if (!job) throw new BadRequestException('Import job was not found.');
    const rows = await this.db.many<any>(this.db.from('mi_inspection_record_import_rows').select('*').eq('job_id', jobId).order('row_number', { ascending: true })).catch(() => []);
    return { ...job, rows };
  }

  async validateInspectionRecordImportJob(user: RequestUser, jobId: string) {
    const job = await this.getInspectionRecordImportJob(user, jobId);
    for (const row of job.rows ?? []) {
      const raw = row.raw_data_json ?? {};
      const errors: string[] = [];
      if (!raw.equipment_tag && !job.equipment_id) errors.push('equipment_tag is required.');
      if (!raw.cml_number) errors.push('cml_number is required.');
      if (!raw.reading_date) errors.push('reading_date is required.');
      if (!raw.not_inspected && !raw.not_accessible && this.numberOrNull(raw.current_thickness) === null) errors.push('current_thickness must be positive numeric unless not inspected/not accessible.');
      if ((raw.not_inspected === true || raw.not_inspected === 'true') && !raw.not_inspected_reason) errors.push('not_inspected_reason is required.');
      if ((raw.not_accessible === true || raw.not_accessible === 'true') && !raw.not_accessible_reason) errors.push('not_accessible_reason is required.');
      await this.db.single(this.db.from('mi_inspection_record_import_rows').update({ validation_status: errors.length ? 'Error' : 'Valid', validation_errors_json: errors, normalized_data_json: raw }).eq('id', row.id).select('id').single()).catch(() => null);
    }
    const updated = await this.getInspectionRecordImportJob(user, jobId);
    const errorRows = (updated.rows ?? []).filter((row: any) => row.validation_status === 'Error').length;
    await this.db.single(this.db.from('mi_inspection_record_import_jobs').update({ status: errorRows ? 'Validation Failed' : 'Validated', valid_rows: (updated.rows ?? []).length - errorRows, error_rows: errorRows, updated_at: new Date().toISOString() }).eq('id', jobId).select('id').single()).catch(() => null);
    return this.getInspectionRecordImportJob(user, jobId);
  }

  async commitInspectionRecordImportJob(user: RequestUser, jobId: string) {
    const job = await this.validateInspectionRecordImportJob(user, jobId);
    if (job.error_rows) throw new BadRequestException('Import contains validation errors.');
    let created = 0;
    for (const row of job.rows ?? []) {
      const raw = row.normalized_data_json ?? row.raw_data_json ?? {};
      const equipment = job.equipment_id ? await this.get(user, job.equipment_id) : (await this.equipmentRows(user, { search: raw.equipment_tag })).find((item) => String(item.tag ?? item.equipment_tag).toLowerCase() === String(raw.equipment_tag).toLowerCase());
      if (!equipment) continue;
      const shadow = await this.ensureMiEquipmentShadow(user, equipment);
      const cml = await this.db.single<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', shadow.id).eq('cml_number', raw.cml_number).maybeSingle()).catch(() => null);
      if (!cml) continue;
      const record = raw.inspection_number ? await this.db.single<any>(this.db.from('mi_inspection_records').select('*').eq('company_id', shadow.company_id).eq('inspection_number', raw.inspection_number).maybeSingle()).catch(() => null) : await this.createInspectionRecord(user, { equipmentId: shadow.id, inspectionType: 'UT Thickness', inspectionMethod: 'UT', planned: false, unplannedReason: 'UT import' }, shadow.id).then((detail: any) => detail.record);
      const reading = await this.addInspectionRecordReading(user, record.id, { ...raw, cmlId: cml.id, readingStatus: 'Entered', reviewStatus: 'Pending Review' });
      await this.db.single(this.db.from('mi_inspection_record_import_rows').update({ created_record_id: reading.id }).eq('id', row.id).select('id').single()).catch(() => null);
      created += 1;
    }
    await this.db.single(this.db.from('mi_inspection_record_import_jobs').update({ status: 'Committed', created_count: created, updated_at: new Date().toISOString() }).eq('id', jobId).select('id').single()).catch(() => null);
    await this.addGlobalMiHistory(user, 'INSPECTION_IMPORT_COMMITTED', 'Inspection/UT reading import committed', String(created), job);
    return this.getInspectionRecordImportJob(user, jobId);
  }

  async inspectionRecordImportErrorReport(user: RequestUser, jobId: string) {
    const job = await this.getInspectionRecordImportJob(user, jobId);
    const rows = (job.rows ?? []).filter((row: any) => row.validation_status === 'Error');
    return { fileName: `mi-inspection-import-errors-${jobId}.csv`, content: this.csv(rows.map((row: any) => ({ row_number: row.row_number, errors: JSON.stringify(row.validation_errors_json ?? []), raw: JSON.stringify(row.raw_data_json ?? {}) })), ['row_number', 'errors', 'raw']) };
  }

  async inspectionRecordLookups(_user: RequestUser) {
    return {
      inspectionRecordStatuses: ['Draft', 'In Progress', 'Submitted for Review', 'Returned for Correction', 'Approved', 'Rejected', 'Superseded', 'Archived'],
      inspectionResults: ['Pass', 'Pass with Recommendations', 'Conditional Acceptance', 'Fail', 'Engineering Review Required', 'Not Evaluated'],
      readingStatuses: ['Draft', 'Entered', 'Pending Review', 'Approved', 'Rejected', 'Superseded', 'Not Inspected', 'Not Accessible', 'Calculation Error'],
      findingTypes: ['Thickness below alert', 'Thickness below minimum', 'Corrosion observed', 'Erosion observed', 'Crack indication', 'Leak', 'Coating/lining damage', 'CUI concern', 'Deformation', 'Mechanical damage', 'Missing component', 'PSV/SIS/alarm issue foundation', 'Procedure/checklist failure', 'Documentation gap', 'Other'],
      findingSeverities: ['Low', 'Medium', 'High', 'Critical'],
      surfaceConditions: ['Clean', 'Coated', 'Corroded', 'Rough', 'Insulated', 'CUI concern', 'Not accessible', 'Other'],
      scanDirections: ['Longitudinal', 'Circumferential', 'Grid', 'Spot', 'Axial', 'Radial', 'Other']
    };
  }

  async inspectionPlanLookups(_user: RequestUser) {
    return {
      planTypes: ['Visual Inspection Plan', 'External Inspection Plan', 'Internal Inspection Plan', 'Thickness Monitoring / UT Plan', 'CML/TML Inspection Plan', 'NDT Inspection Plan', 'Pressure Test Plan', 'Hydrotest Plan', 'Leak Test Plan', 'PSV / Relief Device Test Plan', 'SIS / SIF Proof Test Plan foundation', 'Critical Alarm Test Plan foundation', 'Interlock Test Plan foundation', 'Fire Protection Inspection Plan foundation', 'Gas Detector Inspection Plan foundation', 'Calibration Plan foundation', 'Preventive Maintenance Inspection Plan foundation', 'RBI-based Inspection Plan', 'Custom Inspection Plan'],
      inspectionMethods: ['Visual', 'UT Thickness', 'Radiography', 'Magnetic Particle', 'Dye Penetrant', 'Eddy Current', 'Hardness Testing', 'Positive Material Identification', 'Hydrotest', 'Pneumatic Test', 'Leak Test', 'Functional Test', 'Proof Test', 'Calibration Check', 'Custom'],
      schedulingModes: ['Fixed calendar interval', 'Runtime/hour-based interval foundation', 'Cycle/count-based interval foundation', 'Remaining-life based', 'Half-life rule based', 'Company/site rule based', 'RBI/risk based foundation', 'Manual due date override', 'One-time inspection', 'Event-triggered inspection foundation'],
      frequencyUnits: ['Days', 'Weeks', 'Months', 'Years', 'Operating hours foundation', 'Cycles foundation', 'Campaigns/batches foundation'],
      checklistResponseTypes: ['Pass/Fail', 'Yes/No', 'Numeric', 'Text', 'Photo', 'Attachment', 'Measurement', 'Date', 'Signature'],
      acceptanceCriteriaTypes: ['Minimum acceptable thickness', 'Alert thickness rule', 'Maximum allowable corrosion rate', 'Minimum remaining life', 'Defect acceptance criteria', 'Leak acceptance criteria', 'Test pressure criteria', 'PSV pop test tolerance foundation', 'SIS proof test pass/fail foundation', 'Calibration tolerance foundation', 'Visual defect criteria', 'NDT indication criteria', 'Required corrective action trigger', 'Deficiency auto-create rule foundation'],
      dueStatuses: ['Not Scheduled', 'Not Due', 'Due Soon', 'Due', 'Overdue', 'Critical Overdue', 'Blocked', 'Completed', 'Superseded']
    };
  }

  async cmlLookups(_user: RequestUser) {
    return {
      cmlTypes: ['CML', 'TML', 'Injection Point', 'Deadleg', 'Corrosion Probe', 'UT Grid Point', 'Other'],
      componentTypes: ['Pressure vessel shell', 'Pressure vessel head', 'Nozzle', 'Piping elbow', 'Piping straight run', 'Tee', 'Reducer', 'Weld', 'Tank shell', 'Tank bottom', 'Heat exchanger tube', 'PSV inlet/outlet', 'Other'],
      damageMechanisms: ['General corrosion', 'Localized corrosion', 'Pitting', 'Erosion-corrosion', 'FAC', 'CUI', 'Sulfidation', 'MIC', 'Chloride SCC', 'HIC/SOHIC', 'Thermal fatigue', 'Mechanical damage', 'Other'],
      inspectionMethods: ['UT thickness', 'PAUT', 'RT', 'Profile RT', 'Visual', 'CML manual reading', 'Corrosion probe', 'Other'],
      thicknessUnits: ['mm', 'in'],
      corrosionRateMethods: ['Short-term', 'Long-term', 'Governing maximum', 'Manual override']
    };
  }

  async history(user: RequestUser, equipmentId: string) {
    await this.get(user, equipmentId);
    return this.db.many<any>(this.db.from('EquipmentTimelineEvent').select('*').eq('tenantId', user.tenantId).eq('equipmentId', equipmentId).order('occurredAt', { ascending: false }).limit(100));
  }

  async equipmentRecentActivity(user: RequestUser, equipmentId: string) {
    return this.history(user, equipmentId).then((rows) => rows.slice(0, 20));
  }

  async linkedRecords(user: RequestUser, equipmentId: string, moduleKey?: string) {
    await this.get(user, equipmentId);
    return this.equipment.linkedRecords(user.tenantId, equipmentId, moduleKey);
  }

  async linkedRecordsSummary(user: RequestUser, equipmentId: string) {
    const rows = await this.linkedRecords(user, equipmentId);
    const modules = ['moc', 'pssr', 'incident', 'hazop', 'lopa', 'ptw', 'loto', 'actions', 'documents', 'sds'];
    return {
      total: rows.length,
      groups: modules.map((moduleKey) => ({ moduleKey, count: rows.filter((row: any) => String(row.moduleKey ?? '').toLowerCase() === moduleKey).length, records: rows.filter((row: any) => String(row.moduleKey ?? '').toLowerCase() === moduleKey).slice(0, 5) })),
      rows
    };
  }

  async addLinkedRecord(user: RequestUser, equipmentId: string, body: Record<string, any>) {
    const equipment = await this.get(user, equipmentId);
    const moduleKey = String(body.moduleKey ?? '').trim();
    const recordId = String(body.recordId ?? '').trim();
    if (!moduleKey || !recordId) throw new BadRequestException('Module and record ID are required to link a record.');
    const existing = await this.db.single<any>(this.db.from('EquipmentLinkedRecord').select('*').eq('tenantId', user.tenantId).eq('equipmentId', equipmentId).eq('moduleKey', moduleKey).eq('recordId', recordId).maybeSingle());
    if (existing) throw new BadRequestException('This record is already linked to the equipment.');
    const record = await this.db.single<any>(this.db.from('EquipmentLinkedRecord').insert({
      id: crypto.randomUUID(),
      tenantId: user.tenantId,
      equipmentId,
      moduleKey,
      recordType: body.recordType ?? moduleKey.toUpperCase(),
      recordId,
      title: body.title ?? `${moduleKey.toUpperCase()} ${recordId}`,
      status: body.status ?? 'Linked',
      priority: body.priority ?? null,
      url: body.url ?? null
    }).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_LINKED_RECORD_ADDED', null, record, body.reason ?? 'Linked record added');
    await this.addMiHistory(user, equipmentId, 'LINKED_RECORD_ADDED', 'Linked record added', record.title, null, record, moduleKey, recordId);
    return { ...record, equipmentTag: equipment.tag };
  }

  async removeLinkedRecord(user: RequestUser, equipmentId: string, linkId: string, reason?: string) {
    await this.get(user, equipmentId);
    const before = await this.db.single<any>(this.db.from('EquipmentLinkedRecord').select('*').eq('tenantId', user.tenantId).eq('equipmentId', equipmentId).eq('id', linkId).maybeSingle());
    if (!before) throw new BadRequestException('Linked record was not found for this equipment.');
    const deleted = await this.db.single<any>(this.db.from('EquipmentLinkedRecord').delete().eq('tenantId', user.tenantId).eq('id', linkId).select().single());
    await this.writeMiAudit(user, equipmentId, 'MI_LINKED_RECORD_REMOVED', before, deleted, reason ?? 'Linked record removed');
    await this.addMiHistory(user, equipmentId, 'LINKED_RECORD_REMOVED', 'Linked record removed', reason ?? before.title, before, deleted, before.moduleKey, before.recordId);
    return { id: linkId, deleted: true };
  }

  async documents(user: RequestUser, equipmentId: string) {
    return this.equipment.documents(user.tenantId, equipmentId, user.siteIds);
  }

  async documentsSummary(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const documents = await this.documents(user, equipmentId);
    const requiredTypes = ['Datasheet', 'P&ID', 'Inspection report', 'Calibration certificate', 'Vendor certificate'];
    const missingRequired = requiredTypes.filter((type) => equipment.safetyCritical && !documents.some((doc: any) => String(doc.documentType ?? doc.document_type ?? '').toLowerCase().includes(type.toLowerCase())));
    return {
      total: documents.length,
      missingRequired,
      expiringCertificates: documents.filter((doc: any) => this.isWithin(doc.expiresAt ?? doc.expiry_date, 60, Date.now())).length,
      latest: documents[0] ?? null,
      byType: this.distribution(documents, (doc: any) => doc.documentType ?? doc.document_type ?? 'Unclassified'),
      documents: documents.slice(0, 10)
    };
  }

  async addDocument(user: RequestUser, equipmentId: string, dto: UploadEquipmentDocumentDto, file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    await this.get(user, equipmentId);
    const document = await this.equipment.uploadDocument(user.tenantId, user.id, equipmentId, dto, file);
    await this.writeMiAudit(user, equipmentId, 'MI_DOCUMENT_LINKED', null, document, `Document linked: ${document.title ?? dto.title}`);
    await this.addMiHistory(user, equipmentId, 'DOCUMENT_LINKED', 'Document linked', document.title ?? dto.title, null, document, 'Document', document.id);
    return document;
  }

  async removeDocument(user: RequestUser, equipmentId: string, documentLinkId: string) {
    const before = await this.documents(user, equipmentId).then((rows: any[]) => rows.find((row) => row.id === documentLinkId) ?? null);
    const result = await this.equipment.deleteDocument(user.tenantId, user.id, equipmentId, documentLinkId);
    await this.writeMiAudit(user, equipmentId, 'MI_DOCUMENT_UNLINKED', before, result, 'Document unlinked');
    await this.addMiHistory(user, equipmentId, 'DOCUMENT_UNLINKED', 'Document unlinked', before?.title ?? documentLinkId, before, result, 'Document', documentLinkId);
    return result;
  }

  async recentActivity(user: RequestUser) {
    const query = this.db.from('EquipmentTimelineEvent').select('*').eq('tenantId', user.tenantId);
    return this.db.many<any>(query.order('occurredAt', { ascending: false }).limit(20)).catch(() => []);
  }

  async lookups(user: RequestUser) {
    const [sites, units, areas, equipmentTypes] = await Promise.all([
      this.db.many<any>(this.db.from('Site').select('id,name,code,companyId').eq('tenantId', user.tenantId).in('id', user.siteIds.length ? user.siteIds : ['__none__'])).catch(() => []),
      this.db.many<any>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', user.tenantId)).catch(() => []),
      this.db.many<any>(this.db.from('Area').select('id,name,code,unitId,siteId').eq('tenantId', user.tenantId)).catch(() => []),
      this.db.many<any>(this.db.from('mi_equipment_types').select('*').eq('active', true)).catch(() => [])
    ]);
    return {
      sites,
      units,
      areas,
      equipmentTypes: equipmentTypes.length ? equipmentTypes : defaultEquipmentTypes(),
      statuses: [...statusValues, ...legacyStatusValues],
      criticalityCategories: criticalityValues,
      fitnessStatuses: fitnessValues
    };
  }

  async exportRegistry(user: RequestUser, query: RegistryQuery) {
    const rows = await this.equipmentRows(user, query);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'MI_EQUIPMENT_REGISTRY_EXPORTED', entityType: 'MechanicalIntegrity', entityId: user.selectedSiteId ?? user.tenantId, after: { count: rows.length } as any });
    return {
      fileName: `mi-equipment-registry-${new Date().toISOString().slice(0, 10)}.csv`,
      content: this.csv(rows, ['tag', 'name', 'type', 'status', 'criticality', 'safetyCritical', 'fitnessStatus', 'siteId', 'unitId', 'areaId'])
    };
  }

  async exportEquipmentSummary(user: RequestUser, equipmentId: string) {
    const overview = await this.overview(user, equipmentId);
    return {
      fileName: `${overview.equipment.tag}-mi-summary.csv`.replace(/[^a-zA-Z0-9._-]/g, '_'),
      content: this.csv([overview.equipment], ['tag', 'name', 'type', 'status', 'criticality', 'safetyCritical', 'fitnessStatus', 'readinessStatus'])
    };
  }

  private scopedInspectionRecords(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_inspection_records').select('*, equipment:mi_equipment(*), plan:mi_inspection_plans(plan_number,plan_title,plan_type,inspection_method), occurrence:mi_inspection_schedule_occurrences(occurrence_number,due_date,due_basis,status)', { count: 'exact' }).eq('company_id', this.companyScope(user));
    if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    return request;
  }

  private async enrichInspectionRecords(records: any[]) {
    if (!records.length) return [];
    const ids = records.map((row) => row.id);
    const readings = await this.db.many<any>(this.db.from('mi_inspection_record_cml_readings').select('inspection_record_id,review_status,calculation_status,alert_state').in('inspection_record_id', ids)).catch(() => []);
    const findings = await this.db.many<any>(this.db.from('mi_inspection_findings').select('inspection_record_id,severity,status').in('inspection_record_id', ids)).catch(() => []);
    return records.map((row) => {
      const rowReadings = readings.filter((reading) => reading.inspection_record_id === row.id);
      const rowFindings = findings.filter((finding) => finding.inspection_record_id === row.id);
      return { ...row, inspectionId: row.id, inspectionNumber: row.inspection_number, equipmentTag: row.equipment?.equipment_tag ?? row.equipment?.tag ?? null, equipmentName: row.equipment?.equipment_name ?? row.equipment?.name ?? null, planNumber: row.plan?.plan_number ?? null, occurrenceDueDate: row.occurrence?.due_date ?? null, readingsCount: rowReadings.length, pendingReadingsCount: rowReadings.filter((reading) => /pending|entered|draft/i.test(String(reading.review_status))).length, approvedReadingsCount: rowReadings.filter((reading) => reading.review_status === 'Approved').length, calculationErrorsCount: rowReadings.filter((reading) => /error|insufficient/i.test(String(reading.calculation_status))).length, findingsCount: rowFindings.length, criticalFindingsCount: rowFindings.filter((finding) => finding.severity === 'Critical').length, readOnly: ['Approved', 'Rejected', 'Archived', 'Superseded'].includes(row.status) };
    });
  }

  private inspectionRecordSummaryFromRows(rows: any[]) {
    return {
      cards: [
        this.kpi('Total Inspection Records', rows.length),
        this.kpi('Draft Records', rows.filter((row) => row.status === 'Draft').length),
        this.kpi('In Progress', rows.filter((row) => row.status === 'In Progress').length),
        this.kpi('Submitted for Review', rows.filter((row) => row.status === 'Submitted for Review' || row.review_status === 'Pending Review').length),
        this.kpi('Approved Records', rows.filter((row) => row.status === 'Approved').length),
        this.kpi('Rejected / Returned Records', rows.filter((row) => ['Rejected', 'Returned for Correction'].includes(row.status)).length),
        this.kpi('Records With Findings', rows.filter((row) => Number(row.findingsCount ?? 0) > 0).length),
        this.kpi('Records With Critical Findings', rows.filter((row) => Number(row.criticalFindingsCount ?? 0) > 0).length, undefined, 'danger'),
        this.kpi('Records With UT Readings', rows.filter((row) => Number(row.readingsCount ?? 0) > 0).length),
        this.kpi('Records Pending Reading Review', rows.filter((row) => Number(row.pendingReadingsCount ?? 0) > 0).length),
        this.kpi('Records That Updated Remaining Life', rows.filter((row) => row.remaining_life_updated).length),
        this.kpi('Records Linked to Deficiencies', rows.filter((row) => Number(row.findingsCount ?? 0) > 0).length),
        this.kpi('Overdue Scheduled Occurrences', rows.filter((row) => row.occurrence?.status === 'Overdue').length),
        this.kpi('Completed This Month', rows.filter((row) => row.approved_at && new Date(row.approved_at).getMonth() === new Date().getMonth()).length)
      ],
      generatedAt: new Date().toISOString()
    };
  }

  private async getInspectionRecordBase(user: RequestUser, inspectionId: string) {
    let request = this.db.from('mi_inspection_records').select('*, equipment:mi_equipment(*), plan:mi_inspection_plans(*), occurrence:mi_inspection_schedule_occurrences(*)').eq('company_id', this.companyScope(user)).eq('id', inspectionId);
    if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    const record = await this.db.single<any>(request.maybeSingle());
    if (!record) throw new BadRequestException('Inspection record was not found.');
    return record;
  }

  private async getInspectionOccurrenceBase(user: RequestUser, occurrenceId: string) {
    let request = this.db.from('mi_inspection_schedule_occurrences').select('*').eq('company_id', this.companyScope(user)).eq('id', occurrenceId);
    if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    const occurrence = await this.db.single<any>(request.maybeSingle());
    if (!occurrence) throw new BadRequestException('Scheduled inspection occurrence was not found.');
    return occurrence;
  }

  private assertInspectionRecordEditable(record: any) {
    if (['Approved', 'Rejected', 'Archived', 'Superseded'].includes(record.status)) throw new BadRequestException('Approved/rejected/archived inspection records are locked.');
  }

  private inspectionRecordUpdatePayload(body: Record<string, any>, userId: string) {
    return {
      inspection_type: body.inspectionType ?? body.inspection_type,
      inspection_method: body.inspectionMethod ?? body.inspection_method,
      planned: body.planned,
      unplanned_reason: body.unplannedReason ?? body.unplanned_reason,
      result: body.result,
      inspection_date: body.inspectionDate ?? body.inspection_date,
      start_time: body.startTime ?? body.start_time,
      end_time: body.endTime ?? body.end_time,
      inspector_user_id: body.inspectorUserId ?? body.inspector_user_id,
      inspector_name: body.inspectorName ?? body.inspector_name,
      inspector_qualification: body.inspectorQualification ?? body.inspector_qualification,
      inspection_vendor: body.inspectionVendor ?? body.inspection_vendor,
      reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id,
      responsible_engineer_id: body.responsibleEngineerId ?? body.responsible_engineer_id,
      online_offline_status: body.onlineOfflineStatus ?? body.online_offline_status,
      shutdown_required: body.shutdownRequired ?? body.shutdown_required,
      entry_required: body.entryRequired ?? body.entry_required,
      confined_space_permit_id: body.confinedSpacePermitId ?? body.confined_space_permit_id,
      ptw_id: body.ptwId ?? body.ptw_id,
      loto_id: body.lotoId ?? body.loto_id,
      procedure_document_id: body.procedureDocumentId ?? body.procedure_document_id,
      instrument_used: body.instrumentUsed ?? body.instrument_used,
      instrument_serial_number: body.instrumentSerialNumber ?? body.instrument_serial_number,
      instrument_calibration_document_id: body.instrumentCalibrationDocumentId ?? body.instrument_calibration_document_id,
      notes: body.notes,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
  }

  private async nextInspectionRecordNumber(equipment: any) {
    const prefix = `MI-INS-${new Date().getFullYear()}`;
    const rows = await this.db.many<any>(this.db.from('mi_inspection_records').select('inspection_number').eq('company_id', equipment.company_id).ilike('inspection_number', `${prefix}%`)).catch(() => []);
    return `${prefix}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private async nextInspectionFindingNumber(record: any) {
    const prefix = `${record.inspection_number}-F`;
    const rows = await this.db.many<any>(this.db.from('mi_inspection_findings').select('finding_number').eq('inspection_record_id', record.id)).catch(() => []);
    return `${prefix}-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async seedInspectionChecklistFromPlan(user: RequestUser, record: any, plan: any | null) {
    if (!plan?.id) return;
    const items = await this.db.many<any>(this.db.from('mi_inspection_plan_checklist_items').select('*').eq('plan_id', plan.id).order('sort_order', { ascending: true })).catch(() => []);
    for (const item of items) await this.db.single(this.db.from('mi_inspection_record_checklist_items').insert({ company_id: record.company_id, site_id: record.site_id, inspection_record_id: record.id, plan_checklist_item_id: item.id, item_number: item.item_number, section_title: item.section_title, item_title: item.item_title, requirement_text: item.requirement_text, response_type: item.response_type, evidence_required: item.evidence_required, required: item.required, sort_order: item.sort_order }).select('id').single()).catch(() => null);
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_CHECKLIST_SNAPSHOT_CREATED', 'Inspection checklist snapshot created', `${items.length} items`, null, items, 'Inspection Record', record.id);
  }

  private async seedInspectionReadingsFromPlan(user: RequestUser, record: any, plan: any | null, bodyReadings: any[]) {
    const readings = Array.isArray(bodyReadings) ? bodyReadings : [];
    if (readings.length) {
      for (const reading of readings) await this.addInspectionRecordReading(user, record.id, reading).catch(() => null);
      return;
    }
    if (!plan?.id || !/thickness|ut|cml|tml/i.test(`${plan.plan_type} ${plan.inspection_method}`)) return;
    const cmlScope = await this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').select('*').eq('plan_id', plan.id).maybeSingle()).catch(() => null);
    let cmls = await this.db.many<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', record.equipment_id).eq('active', true)).catch(() => []);
    const selected = Array.isArray(cmlScope?.selected_cml_ids_json) ? cmlScope.selected_cml_ids_json : [];
    if (selected.length && !cmlScope?.include_all_active_cmls) cmls = cmls.filter((cml) => selected.includes(cml.id));
    for (const cml of cmls) await this.addInspectionRecordReading(user, record.id, { cmlId: cml.id, readingStatus: 'Draft', reviewStatus: 'Not Submitted', notInspected: true, notInspectedReason: 'Reading pending entry' }).catch(() => null);
  }

  private async inspectionReadingPayload(user: RequestUser, record: any, cml: any, body: Record<string, any>, update = false) {
    const thickness = this.numberOrNull(body.currentThickness ?? body.current_thickness);
    const normalized = thickness !== null ? this.toMm(thickness, body.thicknessUnit ?? body.thickness_unit ?? cml.thickness_unit ?? 'mm') : null;
    const previous = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').select('*').eq('cml_id', cml.id).eq('review_status', 'Approved').order('reading_date', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    if (!body.notInspected && !body.not_inspected && !body.notAccessible && !body.not_accessible && thickness !== null && thickness <= 0) throw new BadRequestException('Thickness must be a positive numeric value.');
    if ((body.notInspected ?? body.not_inspected) && !(body.notInspectedReason ?? body.not_inspected_reason)) throw new BadRequestException('Not inspected reason is required.');
    if ((body.notAccessible ?? body.not_accessible) && !(body.notAccessibleReason ?? body.not_accessible_reason)) throw new BadRequestException('Not accessible reason is required.');
    return {
      company_id: record.company_id, site_id: record.site_id, inspection_record_id: record.id, equipment_id: record.equipment_id, cml_id: cml.id, plan_id: record.plan_id, occurrence_id: record.occurrence_id,
      reading_date: body.readingDate ?? body.reading_date ?? record.inspection_date ?? new Date().toISOString().slice(0, 10),
      current_thickness: thickness,
      thickness_unit: body.thicknessUnit ?? body.thickness_unit ?? cml.thickness_unit ?? 'mm',
      normalized_thickness: normalized,
      previous_approved_thickness: previous?.thickness_value ?? body.previous_approved_thickness ?? null,
      previous_approved_reading_date: previous?.reading_date ?? body.previous_approved_reading_date ?? null,
      original_thickness: cml.original_thickness ?? cml.nominal_thickness ?? null,
      minimum_required_thickness: cml.minimum_required_thickness ?? cml.retirement_thickness ?? null,
      alert_thickness: cml.alert_thickness ?? null,
      retirement_thickness: cml.retirement_thickness ?? null,
      reading_status: body.readingStatus ?? body.reading_status ?? (update ? undefined : 'Draft'),
      review_status: body.reviewStatus ?? body.review_status ?? (update ? undefined : 'Not Submitted'),
      not_inspected: !!(body.notInspected ?? body.not_inspected),
      not_inspected_reason: body.notInspectedReason ?? body.not_inspected_reason ?? null,
      not_accessible: !!(body.notAccessible ?? body.not_accessible),
      not_accessible_reason: body.notAccessibleReason ?? body.not_accessible_reason ?? null,
      inspector_user_id: body.inspectorUserId ?? body.inspector_user_id ?? record.inspector_user_id ?? user.id,
      inspector_name: body.inspectorName ?? body.inspector_name ?? record.inspector_name ?? null,
      surface_condition: body.surfaceCondition ?? body.surface_condition ?? null,
      scan_direction: body.scanDirection ?? body.scan_direction ?? null,
      temperature_condition: body.temperatureCondition ?? body.temperature_condition ?? null,
      measurement_point_label: body.measurementPointLabel ?? body.measurement_point_label ?? null,
      notes: body.notes ?? null,
      attachment_document_id: body.attachmentDocumentId ?? body.attachment_document_id ?? null,
      calculation_status: normalized === null ? 'Insufficient Data' : 'Preview Calculated',
      alert_state: normalized === null ? 'Not Evaluated' : this.cmlAlertStatus(cml, normalized, 0, null, null),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      ...(update ? {} : { created_by: user.id })
    };
  }

  private async getInspectionReadingBase(user: RequestUser, inspectionId: string, readingId: string) {
    const record = await this.getInspectionRecordBase(user, inspectionId);
    const reading = await this.db.single<any>(this.db.from('mi_inspection_record_cml_readings').select('*').eq('inspection_record_id', inspectionId).eq('id', readingId).maybeSingle());
    if (!reading) throw new BadRequestException('Inspection UT reading was not found.');
    if (reading.equipment_id !== record.equipment_id) throw new BadRequestException('Inspection UT reading equipment mismatch.');
    return reading;
  }

  private async generateRemainingLifeEvaluationFromInspectionReading(user: RequestUser, reading: any, official: boolean, snapshot?: any) {
    const cml = await this.getCmlBase(user, reading.equipment_id, reading.cml_id);
    return this.persistRemainingLifeEvaluation(user, cml, reading, snapshot ?? null, official);
  }

  private async persistRemainingLifeEvaluation(user: RequestUser, cml: any, reading: any | null, snapshot: any | null, official: boolean) {
    const current = this.numberOrNull(reading?.normalized_thickness ?? reading?.current_thickness ?? snapshot?.current_thickness);
    const currentDate = reading?.reading_date ?? snapshot?.current_reading_date ?? null;
    let result = snapshot;
    if (!result && current !== null && currentDate) result = this.calculateCmlSnapshot(user, cml, [{ id: reading?.id ?? null, reading_date: currentDate, thickness_value: current, thickness_unit: 'mm' }]);
    const row = await this.db.single<any>(this.db.from('mi_remaining_life_evaluations').insert({ company_id: cml.company_id, site_id: cml.site_id, equipment_id: cml.equipment_id, cml_id: cml.id, inspection_record_id: reading?.inspection_record_id ?? null, cml_reading_id: reading?.id ?? null, cml_calculation_snapshot_id: result?.id ?? null, evaluation_type: official ? 'Official' : 'Preview', evaluation_status: result?.calculation_status ?? (current === null ? 'Insufficient Data' : 'Preview Calculated'), baseline_thickness: result?.original_thickness ?? cml.original_thickness ?? cml.nominal_thickness ?? null, baseline_date: cml.original_thickness_date ?? cml.created_at?.slice(0, 10) ?? null, previous_thickness: result?.previous_thickness ?? reading?.previous_approved_thickness ?? null, previous_reading_date: result?.previous_reading_date ?? reading?.previous_approved_reading_date ?? null, current_thickness: current ?? result?.current_thickness ?? null, current_reading_date: currentDate ?? result?.current_reading_date ?? null, minimum_required_thickness: result?.minimum_required_thickness ?? cml.minimum_required_thickness ?? cml.retirement_thickness ?? null, alert_thickness: cml.alert_thickness ?? result?.alert_thickness ?? null, retirement_thickness: cml.retirement_thickness ?? result?.retirement_thickness ?? null, short_term_corrosion_rate: result?.short_term_corrosion_rate ?? null, long_term_corrosion_rate: result?.long_term_corrosion_rate ?? null, governing_corrosion_rate: result?.governing_corrosion_rate ?? null, governing_rate_method: result?.governing_rate_method ?? 'maximum_positive_rate', remaining_life_years: result?.remaining_life_years ?? null, half_life_interval_years: result?.half_life_interval_years ?? null, half_life_due_date: result?.half_life_due_date ?? null, alert_state: result?.alert_state ?? result?.alert_status ?? 'Not Evaluated', calculation_inputs_json: { cml, reading }, calculation_result_json: result ?? {}, calculation_error: result?.calculation_error ?? null, official, calculated_by: user.id }).select().single());
    if (reading?.inspection_record_id && /below minimum|below retirement|below alert|critical/i.test(String(row.alert_state))) await this.addInspectionFinding(user, reading.inspection_record_id, { cmlId: cml.id, findingType: row.alert_state, severity: /minimum|retirement|critical/i.test(row.alert_state) ? 'Critical' : 'High', title: `${cml.cml_number}: ${row.alert_state}`, description: 'Generated from backend remaining-life evaluation.', engineeringReviewRequired: true, repairRequired: /minimum|retirement/i.test(row.alert_state), deficiencyRequired: /minimum|retirement/i.test(row.alert_state) }).catch(() => null);
    return row;
  }

  private remainingLifeSummary(rows: any[]) {
    const latestByCml = new Map<string, any>();
    rows.forEach((row) => { if (!latestByCml.has(row.cml_id)) latestByCml.set(row.cml_id, row); });
    const currentRows = [...latestByCml.values()];
    const governing = currentRows.filter((row) => row.remaining_life_years !== null && row.remaining_life_years !== undefined).sort((a, b) => Number(a.remaining_life_years) - Number(b.remaining_life_years))[0] ?? null;
    return { rows: currentRows, cards: [this.kpi('Lowest Remaining Life CML', governing?.cml?.cml_number ?? governing?.cml_id ?? 'Not calculated'), this.kpi('Minimum Remaining Life', governing?.remaining_life_years ?? 'Not calculated'), this.kpi('Highest Corrosion Rate', Math.max(0, ...currentRows.map((row) => Number(row.governing_corrosion_rate ?? 0)))), this.kpi('Below Alert', currentRows.filter((row) => /below alert/i.test(String(row.alert_state))).length, undefined, 'warning'), this.kpi('Below Minimum', currentRows.filter((row) => /below minimum|retirement/i.test(String(row.alert_state))).length, undefined, 'danger'), this.kpi('Calculation Errors', currentRows.filter((row) => /error|insufficient/i.test(String(row.evaluation_status ?? row.calculation_status))).length, undefined, 'warning')], governingCml: governing, generatedAt: new Date().toISOString() };
  }

  private async getInspectionFindingBase(user: RequestUser, inspectionId: string, findingId: string) {
    await this.getInspectionRecordBase(user, inspectionId);
    const finding = await this.db.single<any>(this.db.from('mi_inspection_findings').select('*').eq('inspection_record_id', inspectionId).eq('id', findingId).maybeSingle());
    if (!finding) throw new BadRequestException('Inspection finding was not found.');
    return finding;
  }

  private inspectionRecordValidation(record: any, checklist: any[], readings: any[], findings: any[]) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!record.inspection_date) blockers.push('Inspection date is required.');
    if (!record.inspector_user_id && !record.inspector_name) blockers.push('Inspector is required before submit.');
    if (record.planned && !record.plan_id && !record.occurrence_id) blockers.push('Planned inspection requires linked plan or occurrence.');
    if (!record.planned && !record.unplanned_reason) blockers.push('Unplanned inspection reason is required.');
    if (checklist.some((item) => item.required && !item.completed_at)) blockers.push('Required checklist items must be completed before submit.');
    if (checklist.some((item) => item.evidence_required && !item.evidence_document_id)) blockers.push('Evidence is required for one or more checklist items.');
    if (readings.some((reading) => !reading.current_thickness && !reading.not_inspected && !reading.not_accessible)) blockers.push('Required readings must be entered or justified.');
    if (findings.some((finding) => finding.severity === 'Critical' && !['Accepted', 'Closed', 'Deficiency Created', 'Action Assigned'].includes(finding.status))) warnings.push('Critical findings require reviewer acknowledgement or follow-up.');
    return { blockers, warnings, readyForReview: blockers.length === 0, readyForApproval: blockers.length === 0 };
  }

  private inspectionRecordActions(user: RequestUser, record: any, validation: any) {
    const can = (permission: string) => user.permissions?.includes(permission) || user.isSuperAdmin;
    const locked = ['Approved', 'Rejected', 'Archived', 'Superseded'].includes(record.status);
    const action = (key: string, permission: string, disabledReason?: string | null) => ({ key, permitted: can(permission), disabled: !!disabledReason || !can(permission), disabledReason: !can(permission) ? 'Missing permission.' : disabledReason ?? null });
    return [action('edit', 'mechanical_integrity.inspection_record.edit', locked ? 'Inspection record is locked.' : null), action('submit', 'mechanical_integrity.inspection_record.submit', validation.blockers.length ? validation.blockers.join(' ') : null), action('approve', 'mechanical_integrity.inspection_record.approve', record.review_status !== 'Pending Review' ? 'Record is not pending review.' : null), action('reject', 'mechanical_integrity.inspection_record.reject', record.review_status !== 'Pending Review' ? 'Record is not pending review.' : null), action('archive', 'mechanical_integrity.inspection_record.archive', record.status === 'Archived' ? 'Already archived.' : null), action('export', 'mechanical_integrity.inspection_record.export')];
  }

  private async completeLinkedOccurrenceAfterInspection(user: RequestUser, record: any) {
    if (!record.occurrence_id) return;
    const before = await this.db.single<any>(this.db.from('mi_inspection_schedule_occurrences').select('*').eq('id', record.occurrence_id).maybeSingle()).catch(() => null);
    const row = await this.db.single<any>(this.db.from('mi_inspection_schedule_occurrences').update({ status: 'Completed', completed_at: new Date().toISOString(), completed_by: user.id, completion_inspection_record_id: record.id, updated_at: new Date().toISOString() }).eq('id', record.occurrence_id).select().single()).catch(() => null);
    await this.addMiHistory(user, record.equipment_id, 'INSPECTION_OCCURRENCE_COMPLETED', 'Scheduled inspection occurrence completed', record.inspection_number, before, row, 'Inspection Occurrence', record.occurrence_id);
  }

  private async recalculateInspectionPlansForEquipment(user: RequestUser, equipmentId: string) {
    const plans = await this.db.many<any>(this.db.from('mi_inspection_plans').select('*').eq('equipment_id', equipmentId).eq('scheduler_active', true)).catch(() => []);
    for (const plan of plans) await this.previewInspectionSchedule(user, plan.id, { persist: true }).catch(() => null);
  }

  private async equipmentRows(user: RequestUser, query: RegistryQuery) {
    let request = this.db.from('Equipment').select('*, site:Site(*), unit:Unit(*), area:Area(*)').eq('tenantId', user.tenantId);
    request = this.applyFilters(request, user, query);
    const rows = await this.db.many<any>(request.order('tag', { ascending: true }).limit(1000));
    return rows.map((item) => this.withMiDerivedFields(item));
  }

  private applyFilters(request: any, user: RequestUser, query: RegistryQuery) {
    if (query.siteId) request = request.eq('siteId', query.siteId);
    else if (user.selectedSiteId) request = request.eq('siteId', user.selectedSiteId);
    else if (!user.corporateView && user.siteIds.length) request = request.in('siteId', user.siteIds);
    if (query.unitId) request = request.eq('unitId', query.unitId);
    if (query.areaId) request = request.eq('areaId', query.areaId);
    if (query.status) request = request.eq('status', query.status);
    if (query.criticality) request = request.eq('criticality', query.criticality);
    if (query.equipmentType) request = request.ilike('type', `%${this.cleanSearch(query.equipmentType)}%`);
    if (query.safetyCritical === 'true') request = request.eq('safetyCritical', true);
    if (query.q) {
      const q = this.cleanSearch(query.q);
      request = request.or(`tag.ilike.%${q}%,name.ilike.%${q}%,type.ilike.%${q}%,manufacturer.ilike.%${q}%,model.ilike.%${q}%,serialNumber.ilike.%${q}%`);
    }
    return request;
  }

  private withMiDerivedFields(item: any) {
    const fitnessStatus = item.fitnessStatus ?? (item.status === 'OUT_OF_SERVICE' ? 'Out of Service' : item.status === 'DECOMMISSIONED' ? 'Not Fit for Service' : 'Fit for Service');
    return {
      ...item,
      fitnessStatus,
      readinessStatus: item.readinessStatus ?? (item.startupBlocked ? 'Blocked' : 'Not evaluated'),
      inspectionStatus: item.inspectionStatus ?? this.dueStatus(item.nextInspectionDueDate),
      pmStatus: item.pmStatus ?? this.dueStatus(item.nextPmDueDate),
      calibrationStatus: item.calibrationStatus ?? this.dueStatus(item.nextCalibrationDueDate),
      cmlCount: item.cmlCount ?? 0,
      activeCmlCount: item.activeCmlCount ?? 0,
      activeImpairmentCount: item.activeImpairmentCount ?? (item.bypassActive ? 1 : 0),
      expiredImpairmentCount: item.expiredImpairmentCount ?? 0,
      openDeficiencyCount: item.openDeficiencyCount ?? 0,
      criticalDeficiencyCount: item.criticalDeficiencyCount ?? 0,
      linkedPsmRecordsCount: item.linkedPsmRecordsCount ?? 0
    };
  }

  private technicalDataFromEquipment(equipment: any, technical?: any | null) {
    return {
      identification: {
        tag: equipment.tag,
        name: equipment.name,
        description: equipment.description,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        assetNumber: equipment.assetNumber ?? equipment.nameplateNumber
      },
      location: {
        site: equipment.site,
        unit: equipment.unit,
        area: equipment.area,
        buildingLocation: equipment.buildingZone,
        gpsLatitude: equipment.gpsLatitude,
        gpsLongitude: equipment.gpsLongitude,
        pAndIdReference: equipment.pAndIdReference ?? equipment.designBasisDocumentRef,
        drawingReference: equipment.drawingReference
      },
      designData: {
        designPressure: technical?.design_pressure ?? equipment.designPressure,
        designPressureUnit: technical?.design_pressure_unit ?? equipment.designPressureUnit,
        designTemperature: technical?.design_temperature ?? equipment.designTemperature,
        designTemperatureUnit: technical?.design_temperature_unit ?? equipment.designTemperatureUnit,
        designCode: technical?.design_code ?? equipment.designCode,
        capacityValue: technical?.capacity_value ?? equipment.designCapacity,
        capacityUnit: technical?.capacity_unit ?? equipment.designCapacityUnit
      },
      operatingData: {
        operatingPressure: technical?.operating_pressure ?? equipment.operatingPressure,
        operatingPressureUnit: technical?.operating_pressure_unit ?? equipment.operatingPressureUnit,
        operatingTemperature: technical?.operating_temperature ?? equipment.operatingTemperature,
        operatingTemperatureUnit: technical?.operating_temperature_unit ?? equipment.operatingTemperatureUnit,
        operatingMode: technical?.operating_mode ?? equipment.operatingMode,
        serviceType: technical?.process_service ?? equipment.serviceType
      },
      materialsCorrosion: {
        materialOfConstruction: technical?.material_of_construction ?? equipment.materialOfConstruction,
        corrosionAllowance: technical?.corrosion_allowance ?? equipment.corrosionAllowance,
        nominalThickness: technical?.nominal_thickness ?? equipment.nominalThickness,
        minimumRequiredThickness: technical?.minimum_required_thickness ?? equipment.minimumRequiredThickness,
        internalCoating: technical?.internal_coating ?? null,
        externalCoating: technical?.external_coating ?? null,
        damageMechanisms: technical?.damage_mechanisms ?? [],
        corrosionLoop: technical?.corrosion_loop ?? null
      },
      processFluidChemical: {
        serviceFluid: technical?.service_fluid ?? equipment.fluidName ?? equipment.fluidService,
        chemicalId: technical?.chemical_id ?? null,
        sdsId: technical?.sds_id ?? null,
        sdsReference: equipment.sdsReference,
        hazardClass: equipment.hazardClass
      },
      geometryDimensions: {
        lineSize: technical?.line_size ?? null,
        diameter: technical?.diameter ?? null,
        ...(technical?.geometry_json ?? {})
      },
      codeStandardRating: {
        ratingClass: technical?.rating_class ?? null,
        designCode: technical?.design_code ?? equipment.designCode,
        ...(technical?.code_rating_json ?? {})
      },
      reliefProtectionData: {
        reliefProtection: technical?.relief_protection ?? equipment.psvProtected ?? equipment.reliefProtection,
        ...(technical?.relief_protection_json ?? {})
      },
      drawingsReferences: {
        pAndIdReference: technical?.p_and_id_reference ?? equipment.pAndIdReference ?? equipment.designBasisDocumentRef,
        drawingReference: technical?.drawing_reference ?? equipment.drawingReference,
        ...(technical?.drawings_json ?? {})
      },
      safetyCriticalAttributes: {
        safetyCritical: equipment.safetyCritical,
        reliefProtection: technical?.relief_protection ?? equipment.psvProtected ?? equipment.reliefProtection,
        psvTag: equipment.psvTag,
        sisProtected: equipment.sisProtected,
        sisFunctionTag: equipment.sisFunctionTag,
        alarmTags: equipment.alarmTags,
        interlockTags: equipment.interlockTags,
        ...(technical?.safety_critical_json ?? {})
      }
    };
  }

  private async ensureMiEquipmentShadow(user: RequestUser, equipment: any) {
    const existing = await this.db.single<any>(this.db.from('mi_equipment').select('*').eq('id', equipment.id).maybeSingle()).catch(() => null);
    if (existing) return existing;
    const payload = {
      id: equipment.id,
      tenant_id: user.tenantId,
      company_id: equipment.companyId ?? user.activeCompanyId ?? user.companyIds[0] ?? user.tenantId,
      site_id: equipment.siteId ?? user.selectedSiteId,
      unit_id: equipment.unitId ?? null,
      area_id: equipment.areaId ?? null,
      equipment_tag: equipment.tag ?? equipment.equipmentTag ?? equipment.id,
      equipment_name: equipment.name ?? equipment.equipmentName ?? equipment.tag ?? equipment.id,
      description: equipment.description ?? null,
      equipment_type_key: String(equipment.type ?? 'other').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      equipment_category: equipment.type ?? null,
      manufacturer: equipment.manufacturer ?? null,
      model: equipment.model ?? null,
      serial_number: equipment.serialNumber ?? null,
      asset_number: equipment.assetNumber ?? equipment.nameplateNumber ?? null,
      status: equipment.status ?? 'Active',
      owner_department_id: equipment.ownerDepartmentId ?? null,
      custodian_user_id: equipment.custodianUserId ?? null,
      created_by: user.id,
      updated_by: user.id
    };
    return this.db.single<any>(this.db.from('mi_equipment').insert(payload).select().single());
  }

  private legacyTechnicalUpdate(dto: Record<string, any>) {
    const allowed = ['designPressure', 'designPressureUnit', 'designTemperature', 'designTemperatureUnit', 'designCode', 'designCapacity', 'designCapacityUnit', 'operatingPressure', 'operatingPressureUnit', 'operatingTemperature', 'operatingTemperatureUnit', 'operatingMode', 'serviceType', 'materialOfConstruction', 'corrosionAllowance', 'nominalThickness', 'minimumRequiredThickness', 'fluidName', 'fluidService', 'safetyCritical', 'psvProtected', 'reliefProtection', 'psvTag', 'sisProtected', 'sisFunctionTag', 'alarmTags', 'interlockTags', 'pAndIdReference', 'drawingReference'];
    return Object.fromEntries(allowed.filter((field) => dto[field] !== undefined).map((field) => [field, dto[field]]));
  }

  private technicalDataPayload(dto: Record<string, any>, equipment: any, shadow: any, user: RequestUser, reason: string) {
    const pick = (field: string, fallback?: any) => dto[field] ?? fallback ?? null;
    const data = this.technicalDataFromEquipment(equipment);
    const completeness = this.calculateTechnicalCompleteness(data, equipment.safetyCritical);
    return {
      equipment_id: shadow.id,
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      design_pressure: pick('designPressure', equipment.designPressure),
      design_pressure_unit: pick('designPressureUnit', equipment.designPressureUnit),
      design_temperature: pick('designTemperature', equipment.designTemperature),
      design_temperature_unit: pick('designTemperatureUnit', equipment.designTemperatureUnit),
      operating_pressure: pick('operatingPressure', equipment.operatingPressure),
      operating_pressure_unit: pick('operatingPressureUnit', equipment.operatingPressureUnit),
      operating_temperature: pick('operatingTemperature', equipment.operatingTemperature),
      operating_temperature_unit: pick('operatingTemperatureUnit', equipment.operatingTemperatureUnit),
      operating_mode: pick('operatingMode', equipment.operatingMode),
      process_service: pick('serviceType', equipment.serviceType),
      design_code: pick('designCode', equipment.designCode),
      material_of_construction: pick('materialOfConstruction', equipment.materialOfConstruction),
      corrosion_allowance: pick('corrosionAllowance', equipment.corrosionAllowance),
      nominal_thickness: pick('nominalThickness', equipment.nominalThickness),
      minimum_required_thickness: pick('minimumRequiredThickness', equipment.minimumRequiredThickness),
      capacity_value: pick('capacityValue', equipment.designCapacity),
      capacity_unit: pick('capacityUnit', equipment.designCapacityUnit),
      line_size: pick('lineSize'),
      diameter: pick('diameter'),
      rating_class: pick('ratingClass'),
      service_fluid: pick('serviceFluid', equipment.fluidName ?? equipment.fluidService),
      chemical_id: pick('chemicalId'),
      sds_id: pick('sdsId'),
      insulation: dto.insulation ?? null,
      heat_tracing: dto.heatTracing ?? null,
      relief_protection: dto.reliefProtection ?? equipment.psvProtected ?? equipment.reliefProtection ?? null,
      p_and_id_reference: pick('pAndIdReference', equipment.pAndIdReference),
      drawing_reference: pick('drawingReference', equipment.drawingReference),
      internal_coating: pick('internalCoating'),
      external_coating: pick('externalCoating'),
      damage_mechanisms: Array.isArray(dto.damageMechanisms) ? dto.damageMechanisms : null,
      corrosion_loop: pick('corrosionLoop'),
      geometry_json: dto.geometryDimensions ?? {},
      code_rating_json: dto.codeStandardRating ?? {},
      relief_protection_json: dto.reliefProtectionData ?? {},
      drawings_json: dto.drawingsReferences ?? {},
      safety_critical_json: dto.safetyCriticalAttributes ?? {},
      custom_fields_json: dto.customFields ?? {},
      completeness_status: completeness.status,
      completeness_score: completeness.score,
      revised_by: user.id,
      revision_reason: reason || null,
      updated_at: new Date().toISOString()
    };
  }

  private calculateTechnicalCompleteness(data: Record<string, any>, safetyCritical?: boolean | null) {
    const required = [
      ['Identification', data.identification?.tag],
      ['Identification', data.identification?.name],
      ['Design pressure', data.designData?.designPressure],
      ['Design temperature', data.designData?.designTemperature],
      ['Operating pressure', data.operatingData?.operatingPressure],
      ['Operating temperature', data.operatingData?.operatingTemperature],
      ['Material of construction', data.materialsCorrosion?.materialOfConstruction],
      ['Nominal thickness', data.materialsCorrosion?.nominalThickness],
      ['Minimum required thickness', data.materialsCorrosion?.minimumRequiredThickness],
      ['Service fluid', data.processFluidChemical?.serviceFluid],
      ['P&ID reference', data.drawingsReferences?.pAndIdReference]
    ];
    if (safetyCritical) {
      required.push(['Relief/protection data', data.reliefProtectionData?.reliefProtection]);
      required.push(['Safety critical attributes', data.safetyCriticalAttributes?.safetyCritical]);
    }
    const missing = required.filter(([, value]) => value === undefined || value === null || value === '').map(([label]) => label);
    const score = Math.round(((required.length - missing.length) / Math.max(required.length, 1)) * 10000) / 100;
    return { score, status: score >= 95 ? 'Complete' : score >= 70 ? 'Mostly Complete' : 'Incomplete', missing, requiredCount: required.length, completedCount: required.length - missing.length };
  }

  private technicalDataChangeFields(dto: Record<string, any>) {
    return Object.keys(dto).filter((key) => !['reason', 'revisionReason'].includes(key));
  }

  private diffTopLevel(before: Record<string, any>, after: Record<string, any>) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  }

  private async recordTechnicalRevision(user: RequestUser, shadow: any, reason: string, changedFields: string[], before: any, after: any) {
    const latest = await this.db.single<any>(this.db.from('mi_equipment_technical_data_revisions').select('revision_number').eq('equipment_id', shadow.id).order('revision_number', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    return this.db.single(this.db.from('mi_equipment_technical_data_revisions').insert({
      equipment_id: shadow.id,
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      revision_number: Number(latest?.revision_number ?? 0) + 1,
      change_reason: reason,
      changed_fields: changedFields,
      before_value_json: before,
      after_value_json: after,
      impact_json: { cmlRecalculationMayBeRequired: changedFields.some((field) => /thickness|corrosion|material/i.test(field)) },
      created_by: user.id
    }).select().single()).catch(() => null);
  }

  private cmlPayload(user: RequestUser, shadow: any, body: Record<string, any>, update = false) {
    const pick = (camel: string, snake: string = camel.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)) => body[camel] ?? body[snake];
    const payload: Record<string, any> = {
      equipment_id: shadow.id,
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      unit_id: shadow.unit_id ?? null,
      area_id: shadow.area_id ?? null,
      cml_number: pick('cmlNumber') ?? body.cml_number,
      cml_type: pick('cmlType') ?? 'CML',
      description: pick('description') ?? null,
      equipment_section: pick('equipmentSection') ?? null,
      piping_circuit: pick('pipingCircuit') ?? null,
      vessel_section: pick('vesselSection') ?? null,
      tank_section: pick('tankSection') ?? null,
      component_type: pick('componentType') ?? null,
      location_description: pick('locationDescription') ?? null,
      circuit_or_component_id: pick('circuitOrComponentId') ?? null,
      line_number: pick('lineNumber') ?? null,
      drawing_reference: pick('drawingReference') ?? null,
      isometric_reference: pick('isometricReference') ?? null,
      grid_reference: pick('gridReference') ?? null,
      orientation: pick('orientation') ?? null,
      clock_position: pick('clockPosition') ?? null,
      elevation: pick('elevation') ?? null,
      distance_from_reference: pick('distanceFromReference') ?? null,
      service_fluid: pick('serviceFluid') ?? null,
      material: pick('material') ?? pick('materialOfConstruction') ?? null,
      material_of_construction: pick('materialOfConstruction') ?? null,
      material_specification: pick('materialSpecification') ?? null,
      weld_seam_nearby: this.booleanOrNull(pick('weldSeamNearby')),
      deadleg: this.booleanOrNull(pick('deadleg')),
      injection_point_nearby: this.booleanOrNull(pick('injectionPointNearby')),
      corrosion_zone: pick('corrosionZone') ?? null,
      damage_mechanism: pick('damageMechanism') ?? null,
      insulated: this.booleanOrNull(pick('insulated')),
      cui_risk: this.booleanOrNull(pick('cuiRisk')),
      inspection_method: pick('inspectionMethod') ?? null,
      ut_technique: pick('utTechnique') ?? null,
      nominal_thickness: this.numberOrNull(pick('nominalThickness')),
      minimum_required_thickness: this.numberOrNull(pick('minimumRequiredThickness')),
      retirement_thickness: this.numberOrNull(pick('retirementThickness')),
      critical_thickness: this.numberOrNull(pick('criticalThickness')),
      corrosion_allowance: this.numberOrNull(pick('corrosionAllowance')),
      thickness_unit: pick('thicknessUnit') ?? 'mm',
      original_thickness: this.numberOrNull(pick('originalThickness')),
      original_thickness_date: pick('originalThicknessDate') ?? null,
      alert_thickness: this.numberOrNull(pick('alertThickness')),
      overdue_threshold_days: this.numberOrNull(pick('overdueThresholdDays')),
      manual_alert_override_reason: pick('manualAlertOverrideReason') ?? null,
      high_corrosion_rate_threshold: this.numberOrNull(pick('highCorrosionRateThreshold')),
      low_remaining_life_threshold_years: this.numberOrNull(pick('lowRemainingLifeThresholdYears')),
      inspection_frequency_value: this.numberOrNull(pick('inspectionFrequencyValue')),
      inspection_frequency_unit: pick('inspectionFrequencyUnit') ?? null,
      last_reading_date: pick('lastReadingDate') ?? null,
      next_due_date: pick('nextDueDate') ?? null,
      next_due_basis: pick('nextDueBasis') ?? null,
      next_due_source: pick('nextDueSource') ?? null,
      inspection_procedure: pick('inspectionProcedure') ?? null,
      responsible_user_id: pick('responsibleUserId') ?? null,
      responsible_team_id: pick('responsibleTeamId') ?? null,
      corrosion_rate_method: pick('corrosionRateMethod') ?? null,
      use_short_term_rate: this.booleanOrNull(pick('useShortTermRate')),
      use_long_term_rate: this.booleanOrNull(pick('useLongTermRate')),
      governing_rate_method: pick('governingRateMethod') ?? null,
      minimum_rate_floor: this.numberOrNull(pick('minimumRateFloor')),
      remaining_life_method: pick('remainingLifeMethod') ?? null,
      next_due_rule_source: pick('nextDueRuleSource') ?? null,
      rule_config_reference: pick('ruleConfigReference') ?? null,
      manual_calculation_override: this.booleanOrNull(pick('manualCalculationOverride')) ?? false,
      override_reason: pick('overrideReason') ?? null,
      photo_document_id: pick('photoDocumentId') ?? null,
      design_basis_notes: pick('designBasisNotes') ?? null,
      status: pick('status') ?? 'Active',
      active: this.booleanOrNull(pick('active')) ?? true,
      criticality: pick('criticality') ?? null,
      notes: pick('notes') ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    if (!update) payload.created_by = user.id;
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }

  private cmlReadingPayload(user: RequestUser, cml: any, body: Record<string, any>, update = false) {
    const pick = (camel: string, snake: string = camel.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)) => body[camel] ?? body[snake];
    const payload: Record<string, any> = {
      cml_id: cml.id,
      equipment_id: cml.equipment_id,
      company_id: cml.company_id,
      site_id: cml.site_id,
      campaign_id: pick('campaignId') ?? null,
      reading_date: pick('readingDate'),
      thickness_value: this.numberOrNull(pick('thicknessValue')),
      thickness_unit: pick('thicknessUnit') ?? cml.thickness_unit ?? 'mm',
      normalized_thickness_value: this.toMm(pick('thicknessValue'), pick('thicknessUnit') ?? cml.thickness_unit ?? 'mm'),
      measurement_point_label: pick('measurementPointLabel') ?? null,
      scan_direction: pick('scanDirection') ?? null,
      inspection_method: pick('inspectionMethod') ?? cml.inspection_method ?? null,
      inspector_user_id: pick('inspectorUserId') ?? null,
      inspector_name: pick('inspectorName') ?? null,
      instrument_id: pick('instrumentId') ?? null,
      temperature_c: this.numberOrNull(pick('temperatureC')),
      surface_condition: pick('surfaceCondition') ?? null,
      temperature_condition: pick('temperatureCondition') ?? null,
      previous_thickness_value: this.numberOrNull(pick('previousThicknessValue')),
      previous_reading_date: pick('previousReadingDate') ?? null,
      reading_source: pick('readingSource') ?? 'manual',
      confidence: pick('confidence') ?? null,
      evidence_document_id: pick('evidenceDocumentId') ?? null,
      attachment_document_id: pick('attachmentDocumentId') ?? pick('evidenceDocumentId') ?? null,
      status: pick('status') ?? 'Draft',
      review_status: pick('reviewStatus') ?? 'Pending Review',
      notes: pick('notes') ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    if (!payload.reading_date) throw new BadRequestException('Reading date is required.');
    if (payload.thickness_value === null) throw new BadRequestException('Thickness value is required.');
    if (!update) payload.created_by = user.id;
    return payload;
  }

  private async getCmlBase(user: RequestUser, equipmentId: string, cmlId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const cml = await this.db.single<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', shadow.id).eq('id', cmlId).maybeSingle());
    if (!cml) throw new BadRequestException('CML/TML was not found for this equipment.');
    return cml;
  }

  private async validateCmlInput(shadow: any, body: Record<string, any>, currentCmlId?: string) {
    const cmlNumber = body.cmlNumber ?? body.cml_number;
    if (!cmlNumber) throw new BadRequestException('CML/TML number is required.');
    const existing = await this.db.single<any>(this.db.from('mi_cmls').select('id').eq('equipment_id', shadow.id).eq('cml_number', cmlNumber).maybeSingle()).catch(() => null);
    if (existing && existing.id !== currentCmlId) throw new BadRequestException('Duplicate CML/TML number for this equipment.');
    const nominal = this.numberOrNull(body.nominalThickness ?? body.nominal_thickness);
    const minimum = this.numberOrNull(body.minimumRequiredThickness ?? body.minimum_required_thickness);
    const alert = this.numberOrNull(body.alertThickness ?? body.alert_thickness);
    const retirement = this.numberOrNull(body.retirementThickness ?? body.retirement_thickness);
    if (nominal !== null && minimum !== null && minimum > nominal && !(body.justification || body.reason)) throw new BadRequestException('Minimum required thickness cannot be greater than nominal thickness without justification.');
    if (minimum !== null && alert !== null && alert <= minimum) throw new BadRequestException('Alert thickness should be greater than minimum required thickness.');
    if (alert !== null && retirement !== null && retirement > alert && !(body.justification || body.reason)) throw new BadRequestException('Retirement thickness should not be greater than alert thickness without justification.');
    for (const [label, value] of Object.entries({ nominalThickness: nominal, minimumRequiredThickness: minimum, alertThickness: alert, retirementThickness: retirement })) {
      if (value !== null && value < 0) throw new BadRequestException(`${label} must be numeric and non-negative.`);
    }
  }

  private assertEquipmentEditable(equipment: any) {
    if (this.isArchived(equipment)) throw new BadRequestException('Archived/decommissioned equipment is read-only.');
  }

  private assertCmlEditable(cml: any) {
    if (String(cml.status ?? '').toLowerCase() === 'archived' || cml.active === false) throw new BadRequestException('Archived CML/TML records are read-only.');
  }

  private async reading(user: RequestUser, equipmentId: string, cmlId: string, readingId: string) {
    await this.getCmlBase(user, equipmentId, cmlId);
    const reading = await this.db.single<any>(this.db.from('mi_cml_thickness_readings').select('*').eq('id', readingId).eq('cml_id', cmlId).maybeSingle());
    if (!reading) throw new BadRequestException('CML/TML reading was not found.');
    return reading;
  }

  private async latestCmlSnapshots(equipmentId: string) {
    const rows = await this.db.many<any>(this.db.from('mi_cml_calculation_snapshots').select('*').eq('equipment_id', equipmentId).order('calculated_at', { ascending: false })).catch(() => []);
    const map = new Map<string, any>();
    rows.forEach((row) => { if (!map.has(row.cml_id)) map.set(row.cml_id, row); });
    return map;
  }

  private latestCmlSnapshot(cmlId: string) {
    return this.db.single<any>(this.db.from('mi_cml_calculation_snapshots').select('*').eq('cml_id', cmlId).order('calculated_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
  }

  private withCmlDerived(row: any, snapshot?: any | null) {
    return {
      ...row,
      cmlNumber: row.cml_number,
      cmlType: row.cml_type,
      latestThickness: snapshot?.latest_thickness ?? null,
      latestReadingDate: snapshot?.latest_reading_date ?? null,
      governingCorrosionRate: snapshot?.governing_corrosion_rate ?? null,
      remainingLifeYears: snapshot?.remaining_life_years ?? null,
      nextDueDate: snapshot?.next_due_date ?? null,
      nextDueBasis: snapshot?.next_due_basis ?? null,
      alertStatus: snapshot?.alert_status ?? (row.active ? 'No Calculation' : 'Archived'),
      calculationStatus: snapshot?.calculation_status ?? 'Not Calculated'
    };
  }

  private calculateCmlSnapshot(user: RequestUser, cml: any, readings: any[]) {
    const latest = readings[0] ?? null;
    const previous = readings[1] ?? null;
    const originalThickness = this.toMm(cml.original_thickness ?? cml.nominal_thickness, cml.thickness_unit);
    const originalDate = cml.original_thickness_date ? new Date(cml.original_thickness_date) : cml.created_at ? new Date(cml.created_at) : null;
    if (!latest) return this.cmlSnapshotPayload(user, cml, null, 'Insufficient Data', 'No Reading', {});
    const latestThickness = this.toMm(latest.thickness_value, latest.thickness_unit);
    if (latestThickness === null) return this.cmlSnapshotPayload(user, cml, latest, 'Invalid Reading', 'Calculation Error', {});
    const latestDate = new Date(latest.reading_date);
    const longTerm = originalThickness && originalDate ? this.positiveRate(originalThickness - latestThickness, originalDate, latestDate) : null;
    const previousThickness = previous ? this.toMm(previous.thickness_value, previous.thickness_unit) : null;
    const shortTerm = previous && previousThickness !== null ? this.positiveRate(previousThickness - latestThickness, new Date(previous.reading_date), latestDate) : null;
    const governing = Math.max(shortTerm ?? 0, longTerm ?? 0);
    const minimum = this.toMm(cml.minimum_required_thickness ?? cml.retirement_thickness, cml.thickness_unit);
    const remainingLife = governing > 0 && minimum !== null ? Math.max((latestThickness - minimum) / governing, 0) : null;
    const due = this.nextDueDate(cml, latestDate, remainingLife);
    const alert = this.cmlAlertStatus(cml, latestThickness, governing, remainingLife, due?.date ?? null);
    return this.cmlSnapshotPayload(user, cml, latest, minimum === null ? 'Missing Minimum Thickness' : governing > 0 ? 'Calculated' : 'Calculated - No Loss', alert, {
      latestThickness,
      latestThicknessUnit: 'mm',
      shortTerm,
      longTerm,
      governing,
      remainingLife,
      nextDueDate: due?.date ?? null,
      nextDueBasis: due?.basis ?? null,
      halfLifeIntervalYears: remainingLife !== null ? Math.max(remainingLife / 2, 0) : null,
      halfLifeDueDate: remainingLife !== null ? this.addYears(latestDate, Math.max(remainingLife / 2, 0)).toISOString().slice(0, 10) : null,
      fixedIntervalDueDate: cml.inspection_frequency_value && cml.inspection_frequency_unit ? this.addInterval(latestDate, Number(cml.inspection_frequency_value), cml.inspection_frequency_unit).toISOString().slice(0, 10) : null,
      previousThickness,
      previousReadingDate: previous?.reading_date ?? null,
      originalThickness,
      minimum
    });
  }

  private cmlSnapshotPayload(user: RequestUser, cml: any, latest: any | null, status: string, alert: string, calc: Record<string, any>) {
    return {
      cml_id: cml.id,
      equipment_id: cml.equipment_id,
      company_id: cml.company_id,
      site_id: cml.site_id,
      calculation_status: status,
      latest_reading_id: latest?.id ?? null,
      latest_approved_reading_id: latest?.id ?? null,
      latest_thickness: calc.latestThickness ?? null,
      latest_thickness_unit: calc.latestThicknessUnit ?? null,
      latest_reading_date: latest?.reading_date ?? null,
      current_thickness: calc.latestThickness ?? null,
      current_thickness_unit: calc.latestThicknessUnit ?? null,
      current_reading_date: latest?.reading_date ?? null,
      previous_thickness: calc.previousThickness ?? null,
      previous_reading_date: calc.previousReadingDate ?? null,
      original_thickness: calc.originalThickness ?? null,
      minimum_required_thickness: calc.minimum ?? null,
      alert_thickness: cml.alert_thickness ?? null,
      retirement_thickness: cml.retirement_thickness ?? null,
      short_term_corrosion_rate: calc.shortTerm ?? null,
      long_term_corrosion_rate: calc.longTerm ?? null,
      governing_corrosion_rate: calc.governing ?? null,
      governing_rate_method: cml.governing_rate_method ?? 'maximum_positive_rate',
      corrosion_rate_unit: 'mm/year',
      remaining_life_years: calc.remainingLife ?? null,
      half_life_interval_years: calc.halfLifeIntervalYears ?? null,
      half_life_due_date: calc.halfLifeDueDate ?? null,
      fixed_interval_due_date: calc.fixedIntervalDueDate ?? null,
      rule_based_due_date: null,
      final_next_due_date: calc.nextDueDate ?? null,
      next_due_date: calc.nextDueDate ?? null,
      next_due_basis: calc.nextDueBasis ?? null,
      next_due_source: cml.next_due_rule_source ?? 'backend_calculation',
      risk_status: /below|overdue|high|low/i.test(alert) ? 'Attention Required' : 'Normal',
      alert_status: alert,
      alert_state: alert,
      calculation_error: /error|missing|invalid|insufficient/i.test(status) ? status : null,
      manual_override: cml.manual_calculation_override ?? false,
      override_reason: cml.override_reason ?? null,
      methodology_json: this.cmlMethodologySnapshot(),
      input_snapshot_json: { cml, latest },
      calculated_by: user.id,
      scheduler_status: calc.nextDueDate ? 'Ready' : 'Pending',
      scheduler_last_run_at: new Date().toISOString(),
      scheduler_error: calc.nextDueDate ? null : status
    };
  }

  private cmlMethodologySnapshot() {
    return { source: 'Backend generated', corrosionRate: 'short-term and long-term; governing maximum positive rate', remainingLife: '(latest thickness - minimum thickness) / governing corrosion rate', nextDue: 'earliest of half remaining life and configured interval where available', unitBase: 'mm/year' };
  }

  private async refreshCmlAlert(user: RequestUser, cml: any, snapshot: any) {
    await this.db.many<any>(this.db.from('mi_cml_alerts').update({ status: 'Resolved', resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('cml_id', cml.id).neq('status', 'Resolved').select()).catch(() => []);
    if (!/normal|calculated - no loss/i.test(String(snapshot.alert_status ?? ''))) {
      await this.db.single(this.db.from('mi_cml_alerts').insert({
        cml_id: cml.id,
        equipment_id: cml.equipment_id,
        company_id: cml.company_id,
        site_id: cml.site_id,
        alert_type: snapshot.alert_status,
        severity: /below retirement|below minimum|overdue/i.test(snapshot.alert_status) ? 'Critical' : 'Warning',
        title: `${cml.cml_number}: ${snapshot.alert_status}`,
        description: `Backend CML calculation status: ${snapshot.calculation_status}`,
        source_snapshot_id: snapshot.id,
        source_reading_id: snapshot.latest_reading_id ?? null,
        source_calculation_id: snapshot.id
      }).select().single()).catch(() => null);
    }
  }

  private cmlAlertStatus(cml: any, latestThickness: number, governing: number, remainingLife: number | null, nextDue: string | null) {
    const minimum = this.toMm(cml.minimum_required_thickness ?? cml.retirement_thickness, cml.thickness_unit);
    const retirement = this.toMm(cml.retirement_thickness, cml.thickness_unit);
    const alertThickness = this.toMm(cml.alert_thickness, cml.thickness_unit);
    if (retirement !== null && latestThickness <= retirement) return 'Below Retirement';
    if (minimum !== null && latestThickness <= minimum) return 'Below Minimum';
    if (alertThickness !== null && latestThickness <= alertThickness) return 'Below Alert';
    if (Number(cml.high_corrosion_rate_threshold ?? 0) > 0 && governing >= Number(cml.high_corrosion_rate_threshold)) return 'High Corrosion Rate';
    if (remainingLife !== null && Number(cml.low_remaining_life_threshold_years ?? 0) > 0 && remainingLife <= Number(cml.low_remaining_life_threshold_years)) return 'Low Remaining Life';
    if (this.isPast(nextDue)) return 'Overdue';
    return 'Normal';
  }

  private nextDueDate(cml: any, latestDate: Date, remainingLife: number | null) {
    const candidates: Array<{ date: string; basis: string }> = [];
    if (remainingLife !== null && Number.isFinite(remainingLife)) candidates.push({ date: this.addYears(latestDate, Math.max(remainingLife / 2, 0)).toISOString().slice(0, 10), basis: 'Half remaining life' });
    if (cml.inspection_frequency_value && cml.inspection_frequency_unit) candidates.push({ date: this.addInterval(latestDate, Number(cml.inspection_frequency_value), cml.inspection_frequency_unit).toISOString().slice(0, 10), basis: 'Configured inspection interval' });
    return candidates.sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  }

  private addInterval(date: Date, value: number, unit: string) {
    const next = new Date(date);
    if (/month/i.test(unit)) next.setMonth(next.getMonth() + value);
    else if (/day/i.test(unit)) next.setDate(next.getDate() + value);
    else next.setFullYear(next.getFullYear() + value);
    return next;
  }

  private addYears(date: Date, years: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + Math.round(years * 365.25));
    return next;
  }

  private positiveRate(loss: number, from: Date, to: Date) {
    const years = Math.max((to.getTime() - from.getTime()) / (365.25 * 86_400_000), 0);
    return years > 0 && loss > 0 ? loss / years : null;
  }

  private toMm(value: any, unit?: string | null) {
    const number = this.numberOrNull(value);
    if (number === null) return null;
    return /in/i.test(unit ?? '') ? number * 25.4 : number;
  }

  private numberOrNull(value: any) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private booleanOrNull(value: any) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return ['true', 'yes', '1', 'y'].includes(value.toLowerCase()) ? true : ['false', 'no', '0', 'n'].includes(value.toLowerCase()) ? false : null;
    return Boolean(value);
  }

  private cmlSort(value?: string) {
    const [rawColumn = 'cml_number', rawDirection = 'asc'] = String(value ?? 'cml_number.asc').split('.');
    const allowed: Record<string, string> = {
      cml_number: 'cml_number',
      cmlNumber: 'cml_number',
      status: 'status',
      component_type: 'component_type',
      componentType: 'component_type',
      next_due_date: 'next_due_date',
      nextDueDate: 'next_due_date',
      updated_at: 'updated_at',
      updatedAt: 'updated_at'
    };
    return { column: allowed[rawColumn] ?? 'cml_number', ascending: rawDirection !== 'desc' };
  }

  private async createImportJob(user: RequestUser, equipmentId: string, importType: string, body: Record<string, any>) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const job = await this.db.single<any>(this.db.from('mi_cml_import_jobs').insert({
      equipment_id: shadow.id,
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      import_type: importType,
      file_name: body.fileName ?? null,
      file_key: body.fileKey ?? null,
      status: 'Uploaded',
      total_rows: rows.length,
      created_by: user.id,
      uploaded_by: user.id
    }).select().single());
    for (let index = 0; index < rows.length; index += 1) {
      await this.db.single(this.db.from('mi_cml_import_rows').insert({ job_id: job.id, row_number: index + 1, row_json: rows[index], raw_data_json: rows[index] }).select().single()).catch(() => null);
    }
    await this.addMiHistory(user, equipmentId, 'CML_IMPORT_UPLOADED', 'CML import uploaded', `${rows.length} rows`, null, job, 'CML Import', job.id);
    return this.getCmlImportJob(user, equipmentId, job.id);
  }

  private scheduleFromEquipment(equipment: any) {
    return {
      inspectionRequired: equipment.inspectionRequired ?? true,
      lastInspectionDate: equipment.lastInspectionDate ?? equipment.inspections?.[0]?.inspectionDate ?? null,
      nextInspectionDueDate: equipment.nextInspectionDueDate ?? equipment.inspections?.[0]?.dueDate ?? null,
      nextInspectionDueSource: equipment.nextInspectionDueSource ?? 'Manual/Foundation',
      pmRequired: equipment.pmRequired ?? false,
      lastPmDate: equipment.lastPmDate ?? null,
      nextPmDueDate: equipment.nextPmDueDate ?? null,
      calibrationRequired: equipment.calibrationRequired ?? false,
      lastCalibrationDate: equipment.lastCalibrationDate ?? null,
      nextCalibrationDueDate: equipment.nextCalibrationDueDate ?? null,
      remainingLifeYears: equipment.remainingLifeYears ?? null,
      schedulerStatus: equipment.schedulerStatus ?? 'Foundation ready'
    };
  }

  private registrySummary(rows: any[]) {
    return [
      this.kpi('Total Equipment', rows.length),
      this.kpi('Critical Equipment', rows.filter((item) => item.criticality === 'HIGH' || item.criticality === 'SAFETY_CRITICAL').length),
      this.kpi('Safety-Critical Equipment', rows.filter((item) => item.safetyCritical).length),
      this.kpi('Out of Service', rows.filter((item) => item.status === 'OUT_OF_SERVICE' || item.status === 'Out of Service').length),
      this.kpi('Not Fit for Service', rows.filter((item) => this.fitness(item) === 'Not Fit for Service').length),
      this.kpi('Startup Blocked', rows.filter((item) => item.startupBlocked).length),
      this.kpi('Inspection Overdue', rows.filter((item) => this.isPast(item.nextInspectionDueDate)).length),
      this.kpi('PM Overdue', rows.filter((item) => this.isPast(item.nextPmDueDate)).length),
      this.kpi('Calibration Overdue', rows.filter((item) => this.isPast(item.nextCalibrationDueDate)).length),
      this.kpi('Active Bypass', rows.filter((item) => item.bypassActive).length),
      this.kpi('Open Deficiency', rows.filter((item) => Number(item.openDeficiencyCount ?? 0) > 0).length),
      this.kpi('Linked Active MOC/PSSR/Incident', rows.reduce((sum, item) => sum + Number(item.linkedPsmRecordsCount ?? 0), 0))
    ];
  }

  async criticalityRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.scopedCriticalityAssessments(user, query);
    return {
      rows: await this.enrichCriticalityRows(rows),
      summary: this.criticalitySummaryFromRows(rows),
      filters: query,
      lastUpdated: new Date().toISOString()
    };
  }

  async criticalitySummary(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.scopedCriticalityAssessments(user, query);
    return this.criticalitySummaryFromRows(rows);
  }

  async criticalityReviewQueue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    return this.enrichCriticalityRows(await this.scopedCriticalityAssessments(user, { ...query, approvalStatus: 'Pending Review' }));
  }

  async criticalityNotAssessed(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const equipment = await this.equipmentRows(user, query as RegistryQuery);
    const assessed = await this.scopedCriticalityAssessments(user, { ...query, status: 'Approved' });
    const assessedIds = new Set(assessed.map((item) => item.equipment_id));
    return equipment.filter((item) => !assessedIds.has(item.id)).map((item) => ({
      equipmentId: item.id,
      equipmentTag: item.tag,
      equipmentName: item.name,
      equipmentType: item.type,
      siteId: item.siteId,
      unitId: item.unitId,
      reason: 'No approved criticality assessment exists for this equipment.'
    }));
  }

  async criticalityReviewDue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const today = new Date().toISOString().slice(0, 10);
    return this.enrichCriticalityRows((await this.scopedCriticalityAssessments(user, { ...query, status: 'Approved' })).filter((item) => item.next_review_due && item.next_review_due <= today));
  }

  async equipmentCriticality(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const assessments = await this.scopedCriticalityAssessments(user, { equipmentId });
    const current = assessments.find((item) => item.status === 'Approved') ?? assessments[0] ?? null;
    return {
      equipment: { id: equipment.id, tag: equipment.tag, name: equipment.name, type: equipment.type, siteId: equipment.siteId, unitId: equipment.unitId },
      current,
      history: assessments,
      snapshot: await this.criticalityEquipmentSnapshot(user, shadow.id),
      suggestions: await this.equipmentCriticalitySuggestions(user, shadow.id),
      summary: this.criticalitySummaryFromRows(assessments)
    };
  }

  async currentEquipmentCriticality(user: RequestUser, equipmentId: string) {
    const rows = await this.scopedCriticalityAssessments(user, { equipmentId, status: 'Approved' });
    return rows[0] ?? null;
  }

  async equipmentCriticalityHistory(user: RequestUser, equipmentId: string) {
    await this.get(user, equipmentId);
    return this.db.many<any>(this.db.from('mi_criticality_history_events').select('*').eq('equipment_id', equipmentId).order('created_at', { ascending: false })).catch(() => []);
  }

  async createCriticalityAssessment(user: RequestUser, body: Record<string, any>) {
    if (!body.equipmentId && !body.equipment_id) throw new BadRequestException('Equipment is required for a criticality assessment.');
    const equipment = await this.get(user, body.equipmentId ?? body.equipment_id);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const config = await this.activeCriticalityConfig(user, shadow.site_id);
    const snapshot = await this.criticalityEquipmentSnapshot(user, shadow.id);
    const payload = {
      company_id: shadow.company_id,
      site_id: shadow.site_id,
      equipment_id: shadow.id,
      config_id: config.id,
      assessment_number: await this.nextCriticalityAssessmentNumber(shadow),
      assessment_type: body.assessmentType ?? body.assessment_type ?? 'Initial',
      assessment_reason: body.assessmentReason ?? body.assessment_reason ?? 'Criticality assessment',
      assessment_date: body.assessmentDate ?? body.assessment_date ?? new Date().toISOString().slice(0, 10),
      assessment_method: body.assessmentMethod ?? body.assessment_method ?? config.score_method ?? 'Configured Matrix',
      assessor_user_id: body.assessorUserId ?? body.assessor_user_id ?? user.id,
      assessor_name: body.assessorName ?? body.assessor_name ?? user.id,
      notes: body.notes ?? null,
      equipment_snapshot_json: snapshot,
      config_snapshot_json: config,
      integrity_drivers_json: snapshot.integrityDrivers ?? {},
      safety_critical: !!(body.safetyCritical ?? body.safety_critical ?? equipment.safetyCritical),
      safety_critical_reason: body.safetyCriticalReason ?? body.safety_critical_reason ?? null,
      primary_safety_function: body.primarySafetyFunction ?? body.primary_safety_function ?? null,
      failure_consequence: body.failureConsequence ?? body.failure_consequence ?? null,
      safeguard_role: body.safeguardRole ?? body.safeguard_role ?? null,
      ipl_candidate: !!(body.iplCandidate ?? body.ipl_candidate),
      sif_linked: !!(body.sifLinked ?? body.sif_linked),
      critical_alarm_interlock_linked: !!(body.criticalAlarmInterlockLinked ?? body.critical_alarm_interlock_linked),
      psv_relief_protection_linked: !!(body.psvReliefProtectionLinked ?? body.psv_relief_protection_linked),
      bypass_allowed: body.bypassAllowed ?? body.bypass_allowed ?? null,
      bypass_approval_required: body.bypassApprovalRequired ?? body.bypass_approval_required ?? null,
      testing_required: body.testingRequired ?? body.testing_required ?? null,
      psm_critical: !!(body.psmCritical ?? body.psm_critical),
      psm_critical_reason: body.psmCriticalReason ?? body.psm_critical_reason ?? null,
      psm_element_affected: body.psmElementAffected ?? body.psm_element_affected ?? null,
      related_hazard_scenario: body.relatedHazardScenario ?? body.related_hazard_scenario ?? null,
      startup_blocker_potential: !!(body.startupBlockerPotential ?? body.startup_blocker_potential),
      process_containment_role: !!(body.processContainmentRole ?? body.process_containment_role),
      energy_isolation_relevance: !!(body.energyIsolationRelevance ?? body.energy_isolation_relevance),
      chemical_release_potential: !!(body.chemicalReleasePotential ?? body.chemical_release_potential),
      fire_explosion_potential: !!(body.fireExplosionPotential ?? body.fire_explosion_potential),
      toxic_exposure_potential: !!(body.toxicExposurePotential ?? body.toxic_exposure_potential),
      environmental_release_potential: !!(body.environmentalReleasePotential ?? body.environmental_release_potential),
      created_by: user.id,
      updated_by: user.id
    };
    const assessment = await this.db.single<any>(this.db.from('mi_criticality_assessments').insert(payload).select().single());
    await this.seedCriticalityScores(user, assessment, config, snapshot);
    const calculated = await this.recalculateCriticalityAssessment(user, assessment.id);
    await this.addCriticalityHistory(user, assessment, 'CREATED', 'Criticality assessment created', null, calculated.assessment);
    return calculated;
  }

  async criticalityAssessmentDetail(user: RequestUser, assessmentId: string) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    const [consequenceScores, likelihoodScores, calculation, history, reviews] = await Promise.all([
      this.criticalityConsequenceScores(user, assessmentId),
      this.criticalityLikelihoodScores(user, assessmentId),
      this.criticalityCalculation(user, assessmentId),
      this.criticalityAssessmentHistory(user, assessmentId),
      this.db.many<any>(this.db.from('mi_criticality_reviews').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false })).catch(() => [])
    ]);
    const validation = this.criticalityValidation(assessment, consequenceScores, likelihoodScores, calculation);
    return { assessment, consequenceScores, likelihoodScores, calculation, history, reviews, validation, actions: this.criticalityActions(user, assessment, validation) };
  }

  async updateCriticalityAssessment(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    this.assertCriticalityEditable(before);
    const fields: Record<string, string> = {
      assessmentType: 'assessment_type',
      assessmentReason: 'assessment_reason',
      assessmentDate: 'assessment_date',
      assessmentMethod: 'assessment_method',
      assessorUserId: 'assessor_user_id',
      assessorName: 'assessor_name',
      reviewerUserId: 'reviewer_user_id',
      reviewerName: 'reviewer_name',
      reviewFrequencyMonths: 'review_frequency_months',
      nextReviewDue: 'next_review_due',
      notes: 'notes',
      safetyCritical: 'safety_critical',
      safetyCriticalReason: 'safety_critical_reason',
      primarySafetyFunction: 'primary_safety_function',
      failureConsequence: 'failure_consequence',
      safeguardRole: 'safeguard_role',
      protectedEquipmentId: 'protected_equipment_id',
      iplCandidate: 'ipl_candidate',
      lopaSilLinkedScenarioId: 'lopa_sil_linked_scenario_id',
      sifLinked: 'sif_linked',
      criticalAlarmInterlockLinked: 'critical_alarm_interlock_linked',
      psvReliefProtectionLinked: 'psv_relief_protection_linked',
      bypassAllowed: 'bypass_allowed',
      bypassApprovalRequired: 'bypass_approval_required',
      testingRequired: 'testing_required',
      psmCritical: 'psm_critical',
      psmCriticalReason: 'psm_critical_reason',
      psmElementAffected: 'psm_element_affected',
      relatedHazardScenario: 'related_hazard_scenario',
      startupBlockerPotential: 'startup_blocker_potential',
      processContainmentRole: 'process_containment_role',
      energyIsolationRelevance: 'energy_isolation_relevance',
      chemicalReleasePotential: 'chemical_release_potential',
      fireExplosionPotential: 'fire_explosion_potential',
      toxicExposurePotential: 'toxic_exposure_potential',
      environmentalReleasePotential: 'environmental_release_potential'
    };
    const payload: Record<string, any> = { updated_by: user.id, updated_at: new Date().toISOString() };
    for (const [camel, snake] of Object.entries(fields)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update(payload).eq('id', assessmentId).select().single());
    await this.addCriticalityHistory(user, row, 'UPDATED', 'Criticality assessment updated', before, row);
    return this.recalculateCriticalityAssessment(user, assessmentId);
  }

  async criticalityConsequenceScores(user: RequestUser, assessmentId: string) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    return this.db.many<any>(this.db.from('mi_criticality_consequence_scores').select('*').eq('assessment_id', assessment.id).order('dimension_label', { ascending: true })).catch(() => []);
  }

  async updateCriticalityConsequenceScores(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    this.assertCriticalityEditable(assessment);
    const scores = Array.isArray(body.scores) ? body.scores : [];
    for (const item of scores) {
      const payload = {
        score: this.numberOrNull(item.score),
        score_label: item.scoreLabel ?? item.score_label ?? null,
        description: item.description ?? null,
        justification: item.justification ?? null,
        evidence_document_id: item.evidenceDocumentId ?? item.evidence_document_id ?? null,
        weight: this.numberOrNull(item.weight) ?? 1,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };
      await this.db.single(this.db.from('mi_criticality_consequence_scores').update(payload).eq('assessment_id', assessmentId).eq('dimension_key', item.dimensionKey ?? item.dimension_key).select('id').single()).catch(() => null);
    }
    await this.addCriticalityHistory(user, assessment, 'CONSEQUENCE_SCORES_UPDATED', 'Consequence scores updated', null, scores);
    return this.recalculateCriticalityAssessment(user, assessmentId);
  }

  async criticalityLikelihoodScores(user: RequestUser, assessmentId: string) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    return this.db.many<any>(this.db.from('mi_criticality_likelihood_scores').select('*').eq('assessment_id', assessment.id).order('dimension_label', { ascending: true })).catch(() => []);
  }

  async updateCriticalityLikelihoodScores(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    this.assertCriticalityEditable(assessment);
    const scores = Array.isArray(body.scores) ? body.scores : [];
    for (const item of scores) {
      const payload = {
        score: this.numberOrNull(item.score),
        score_label: item.scoreLabel ?? item.score_label ?? null,
        description: item.description ?? null,
        justification: item.justification ?? null,
        data_source: item.dataSource ?? item.data_source ?? null,
        auto_suggested_score: this.numberOrNull(item.autoSuggestedScore ?? item.auto_suggested_score),
        manual_override_score: this.numberOrNull(item.manualOverrideScore ?? item.manual_override_score),
        override_reason: item.overrideReason ?? item.override_reason ?? null,
        weight: this.numberOrNull(item.weight) ?? 1,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };
      await this.db.single(this.db.from('mi_criticality_likelihood_scores').update(payload).eq('assessment_id', assessmentId).eq('dimension_key', item.dimensionKey ?? item.dimension_key).select('id').single()).catch(() => null);
    }
    await this.addCriticalityHistory(user, assessment, 'LIKELIHOOD_SCORES_UPDATED', 'Likelihood scores updated', null, scores);
    return this.recalculateCriticalityAssessment(user, assessmentId);
  }

  async criticalityCalculation(user: RequestUser, assessmentId: string) {
    await this.getCriticalityAssessmentBase(user, assessmentId);
    return this.db.single<any>(this.db.from('mi_criticality_calculation_results').select('*').eq('assessment_id', assessmentId).order('calculated_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
  }

  async recalculateCriticalityAssessment(user: RequestUser, assessmentId: string) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    const config = assessment.config_snapshot_json?.id ? assessment.config_snapshot_json : await this.activeCriticalityConfig(user, assessment.site_id);
    const [consequence, likelihood] = await Promise.all([this.criticalityConsequenceScores(user, assessmentId), this.criticalityLikelihoodScores(user, assessmentId)]);
    const result = this.calculateCriticality(assessment, consequence, likelihood, config);
    const calculation = await this.db.single<any>(this.db.from('mi_criticality_calculation_results').insert({
      assessment_id: assessment.id,
      company_id: assessment.company_id,
      site_id: assessment.site_id,
      equipment_id: assessment.equipment_id,
      config_id: assessment.config_id,
      score_method: config.score_method ?? 'matrix',
      ...result,
      calculation_inputs_json: { consequence, likelihood, configId: config.id },
      calculation_outputs_json: result,
      explanation: result.explanation,
      calculation_status: result.calculation_status,
      calculated_by: user.id
    }).select().single());
    const updated = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      consequence_score: result.consequence_score,
      likelihood_score: result.likelihood_score,
      weighted_score: result.weighted_score,
      final_risk_score: result.final_risk_score,
      risk_matrix_cell: result.risk_matrix_cell,
      criticality_category: result.criticality_category,
      inspection_priority: result.inspection_priority,
      rbi_candidate: result.rbi_candidate,
      risk_change_direction: result.risk_change_direction,
      calculation_status: result.calculation_status,
      review_frequency_months: result.review_frequency_months,
      next_review_due: result.next_review_due,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessment.id).select().single());
    await this.addCriticalityHistory(user, updated, 'RECALCULATED', 'Criticality score recalculated', assessment, updated);
    return { assessment: updated, calculation, consequenceScores: consequence, likelihoodScores: likelihood };
  }

  async criticalityManualOverride(user: RequestUser, assessmentId: string, body: Record<string, any>) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    this.assertCriticalityEditable(before);
    if (!(body.overrideReason ?? body.override_reason)) throw new BadRequestException('Override reason is required.');
    const category = body.overrideCategory ?? body.override_category;
    const priority = this.priorityForCategory(category);
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      manual_override: true,
      override_category: category,
      override_reason: body.overrideReason ?? body.override_reason,
      criticality_category: category,
      inspection_priority: priority,
      calculation_status: 'Manual Override',
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId).select().single());
    await this.addCriticalityHistory(user, row, 'OVERRIDE_APPLIED', 'Criticality override applied', before, row);
    return this.criticalityAssessmentDetail(user, assessmentId);
  }

  async submitCriticalityAssessment(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    this.assertCriticalityEditable(before);
    const detail = await this.criticalityAssessmentDetail(user, assessmentId);
    if (detail.validation.blockers.length) throw new BadRequestException(`Cannot submit: ${detail.validation.blockers.join(' ')}`);
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      status: 'Pending Review',
      approval_status: 'Pending Review',
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
      notes: body.notes ?? before.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId).select().single());
    await this.addCriticalityReviewRecord(user, row, 'Submitted', body.notes ?? null);
    await this.addCriticalityHistory(user, row, 'SUBMITTED', 'Criticality assessment submitted for review', before, row);
    return this.criticalityAssessmentDetail(user, assessmentId);
  }

  async approveCriticalityAssessment(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    if (before.approval_status !== 'Pending Review') throw new BadRequestException('Only assessments pending review can be approved.');
    const detail = await this.criticalityAssessmentDetail(user, assessmentId);
    if (detail.validation.blockers.length) throw new BadRequestException(`Cannot approve: ${detail.validation.blockers.join(' ')}`);
    await this.db.many<any>(this.db.from('mi_criticality_assessments').update({ status: 'Superseded', approval_status: 'Superseded', updated_at: new Date().toISOString() }).eq('equipment_id', before.equipment_id).eq('status', 'Approved').neq('id', before.id).select('id')).catch(() => []);
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      status: 'Approved',
      approval_status: 'Approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId).select().single());
    await this.applyCriticalityToEquipment(user, row);
    await this.addCriticalityReviewRecord(user, row, 'Approved', body.comments ?? body.reason ?? null);
    await this.addCriticalityHistory(user, row, 'APPROVED', 'Criticality assessment approved', before, row);
    return this.criticalityAssessmentDetail(user, assessmentId);
  }

  async rejectCriticalityAssessment(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    if (!(body.reason ?? body.rejectionReason)) throw new BadRequestException('Rejection reason is required.');
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      status: 'Rejected',
      approval_status: 'Rejected',
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: body.reason ?? body.rejectionReason,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId).select().single());
    await this.addCriticalityReviewRecord(user, row, 'Rejected', body.reason ?? body.rejectionReason);
    await this.addCriticalityHistory(user, row, 'REJECTED', 'Criticality assessment rejected', before, row);
    return this.criticalityAssessmentDetail(user, assessmentId);
  }

  async returnCriticalityAssessment(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    if (!(body.reason ?? body.returnReason)) throw new BadRequestException('Return reason is required.');
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      status: 'Returned for Correction',
      approval_status: 'Returned',
      returned_by: user.id,
      returned_at: new Date().toISOString(),
      return_reason: body.reason ?? body.returnReason,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId).select().single());
    await this.addCriticalityReviewRecord(user, row, 'Returned', body.reason ?? body.returnReason);
    await this.addCriticalityHistory(user, row, 'RETURNED', 'Criticality assessment returned for correction', before, row);
    return this.criticalityAssessmentDetail(user, assessmentId);
  }

  async createCriticalityRevision(user: RequestUser, assessmentId: string, body: Record<string, any> = {}) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    const { id, created_at, updated_at, approved_at, approved_by, rejected_at, rejected_by, returned_at, returned_by, submitted_at, submitted_by, archived_at, archived_by, archive_reason, ...copy } = before;
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').insert({
      ...copy,
      id: crypto.randomUUID(),
      assessment_number: await this.nextCriticalityAssessmentNumber(before),
      status: 'Draft',
      approval_status: 'Not Submitted',
      revision_number: Number(before.revision_number ?? 1) + 1,
      previous_assessment_id: before.id,
      assessment_reason: body.reason ?? before.assessment_reason,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.cloneCriticalityScores(before.id, row.id, user.id);
    await this.addCriticalityHistory(user, row, 'REVISION_CREATED', 'Criticality assessment revision created', before, row);
    return this.criticalityAssessmentDetail(user, row.id);
  }

  async archiveCriticalityAssessment(user: RequestUser, assessmentId: string, reason?: string) {
    const before = await this.getCriticalityAssessmentBase(user, assessmentId);
    if (!reason) throw new BadRequestException('Archive reason is required.');
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').update({
      status: 'Archived',
      approval_status: before.approval_status === 'Approved' ? 'Superseded' : before.approval_status,
      archived_by: user.id,
      archived_at: new Date().toISOString(),
      archive_reason: reason,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId).select().single());
    await this.addCriticalityHistory(user, row, 'ARCHIVED', 'Criticality assessment archived', before, row);
    return row;
  }

  async criticalityAssessmentHistory(user: RequestUser, assessmentId: string) {
    const assessment = await this.getCriticalityAssessmentBase(user, assessmentId);
    return this.db.many<any>(this.db.from('mi_criticality_history_events').select('*').eq('assessment_id', assessment.id).order('created_at', { ascending: false })).catch(() => []);
  }

  async criticalityConfig(user: RequestUser) {
    const config = await this.activeCriticalityConfig(user, user.selectedSiteId ?? null);
    const versions = await this.db.many<any>(this.db.from('mi_criticality_config_versions').select('*').eq('config_id', config.id).order('created_at', { ascending: false })).catch(() => []);
    return { active: config, versions, lookups: this.defaultCriticalityConfig(user, user.selectedSiteId ?? null) };
  }

  async createCriticalityConfig(user: RequestUser, body: Record<string, any>) {
    const companyId = this.companyScope(user);
    const siteId = body.siteId ?? body.site_id ?? user.selectedSiteId ?? null;
    if (body.active ?? true) await this.db.many<any>(this.db.from('mi_criticality_configs').update({ active: false }).eq('company_id', companyId).eq('site_id', siteId).select('id')).catch(() => []);
    const base = this.defaultCriticalityConfig(user, siteId);
    const payload = {
      ...base,
      id: crypto.randomUUID(),
      company_id: companyId,
      site_id: siteId,
      config_name: body.configName ?? body.config_name ?? base.config_name,
      scope: body.scope ?? (siteId ? 'Site' : 'Company'),
      active: body.active ?? true,
      matrix_size: Number(body.matrixSize ?? body.matrix_size ?? base.matrix_size),
      score_method: body.scoreMethod ?? body.score_method ?? base.score_method,
      consequence_method: body.consequenceMethod ?? body.consequence_method ?? base.consequence_method,
      likelihood_method: body.likelihoodMethod ?? body.likelihood_method ?? base.likelihood_method,
      consequence_scale_json: body.consequenceScale ?? body.consequence_scale_json ?? base.consequence_scale_json,
      likelihood_scale_json: body.likelihoodScale ?? body.likelihood_scale_json ?? base.likelihood_scale_json,
      consequence_dimensions_json: body.consequenceDimensions ?? body.consequence_dimensions_json ?? base.consequence_dimensions_json,
      likelihood_dimensions_json: body.likelihoodDimensions ?? body.likelihood_dimensions_json ?? base.likelihood_dimensions_json,
      category_thresholds_json: body.categoryThresholds ?? body.category_thresholds_json ?? base.category_thresholds_json,
      review_frequency_json: body.reviewFrequency ?? body.review_frequency_json ?? base.review_frequency_json,
      approval_rules_json: body.approvalRules ?? body.approval_rules_json ?? base.approval_rules_json,
      auto_suggestion_rules_json: body.autoSuggestionRules ?? body.auto_suggestion_rules_json ?? base.auto_suggestion_rules_json,
      inspection_priority_mapping_json: body.inspectionPriorityMapping ?? body.inspection_priority_mapping_json ?? base.inspection_priority_mapping_json,
      scheduler_mapping_json: body.schedulerMapping ?? body.scheduler_mapping_json ?? base.scheduler_mapping_json,
      created_by: user.id,
      updated_by: user.id
    };
    const row = await this.db.single<any>(this.db.from('mi_criticality_configs').insert(payload).select().single());
    await this.createCriticalityConfigVersion(user, row, body.changeReason ?? 'Configuration created');
    await this.addGlobalMiHistory(user, 'CRITICALITY_CONFIG_CREATED', 'Criticality configuration created', row.config_name, row);
    return row;
  }

  async getCriticalityConfig(user: RequestUser, configId: string) {
    const companyId = this.companyScope(user);
    const row = await this.db.single<any>(this.db.from('mi_criticality_configs').select('*').eq('company_id', companyId).eq('id', configId).maybeSingle());
    if (!row) throw new BadRequestException('Criticality configuration was not found in your company scope.');
    return row;
  }

  async updateCriticalityConfig(user: RequestUser, configId: string, body: Record<string, any>) {
    const before = await this.getCriticalityConfig(user, configId);
    const payload: Record<string, any> = {
      config_name: body.configName ?? body.config_name ?? before.config_name,
      scope: body.scope ?? before.scope,
      version_number: Number(before.version_number ?? 1) + 1,
      matrix_size: Number(body.matrixSize ?? body.matrix_size ?? before.matrix_size),
      score_method: body.scoreMethod ?? body.score_method ?? before.score_method,
      consequence_method: body.consequenceMethod ?? body.consequence_method ?? before.consequence_method,
      likelihood_method: body.likelihoodMethod ?? body.likelihood_method ?? before.likelihood_method,
      consequence_scale_json: body.consequenceScale ?? body.consequence_scale_json ?? before.consequence_scale_json,
      likelihood_scale_json: body.likelihoodScale ?? body.likelihood_scale_json ?? before.likelihood_scale_json,
      consequence_dimensions_json: body.consequenceDimensions ?? body.consequence_dimensions_json ?? before.consequence_dimensions_json,
      likelihood_dimensions_json: body.likelihoodDimensions ?? body.likelihood_dimensions_json ?? before.likelihood_dimensions_json,
      category_thresholds_json: body.categoryThresholds ?? body.category_thresholds_json ?? before.category_thresholds_json,
      review_frequency_json: body.reviewFrequency ?? body.review_frequency_json ?? before.review_frequency_json,
      approval_rules_json: body.approvalRules ?? body.approval_rules_json ?? before.approval_rules_json,
      auto_suggestion_rules_json: body.autoSuggestionRules ?? body.auto_suggestion_rules_json ?? before.auto_suggestion_rules_json,
      inspection_priority_mapping_json: body.inspectionPriorityMapping ?? body.inspection_priority_mapping_json ?? before.inspection_priority_mapping_json,
      scheduler_mapping_json: body.schedulerMapping ?? body.scheduler_mapping_json ?? before.scheduler_mapping_json,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const row = await this.db.single<any>(this.db.from('mi_criticality_configs').update(payload).eq('id', configId).select().single());
    await this.createCriticalityConfigVersion(user, row, body.changeReason ?? 'Configuration updated');
    await this.addGlobalMiHistory(user, 'CRITICALITY_CONFIG_UPDATED', 'Criticality configuration updated', row.config_name, { before, after: row });
    return row;
  }

  async archiveCriticalityConfig(user: RequestUser, configId: string, reason?: string) {
    if (!reason) throw new BadRequestException('Archive reason is required.');
    const before = await this.getCriticalityConfig(user, configId);
    const row = await this.db.single<any>(this.db.from('mi_criticality_configs').update({ active: false, archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', configId).select().single());
    await this.addGlobalMiHistory(user, 'CRITICALITY_CONFIG_ARCHIVED', 'Criticality configuration archived', reason, { before, after: row });
    return row;
  }

  async activateCriticalityConfig(user: RequestUser, configId: string, reason?: string) {
    const row = await this.getCriticalityConfig(user, configId);
    await this.db.many<any>(this.db.from('mi_criticality_configs').update({ active: false }).eq('company_id', row.company_id).eq('site_id', row.site_id).select('id')).catch(() => []);
    const active = await this.db.single<any>(this.db.from('mi_criticality_configs').update({ active: true, archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', configId).select().single());
    await this.addGlobalMiHistory(user, 'CRITICALITY_CONFIG_ACTIVATED', 'Criticality configuration activated', reason ?? 'Configuration activated', active);
    return active;
  }

  async criticalityConfigImpact(user: RequestUser, configId: string) {
    const config = await this.getCriticalityConfig(user, configId);
    const rows = await this.scopedCriticalityAssessments(user, { siteId: config.site_id ?? undefined });
    return {
      configId,
      affectedDraftAssessments: rows.filter((item) => ['Draft', 'Returned for Correction'].includes(item.status)).length,
      approvedAssessmentsUsingPreviousConfig: rows.filter((item) => item.status === 'Approved' && item.config_id !== configId).length,
      recalculationRequired: rows.filter((item) => item.config_id !== configId).map((item) => ({ assessmentId: item.id, assessmentNumber: item.assessment_number, equipmentId: item.equipment_id }))
    };
  }

  async criticalityImportTemplate(user: RequestUser) {
    return { fileName: 'mi-criticality-import-template.csv', content: this.csv([], ['equipment_tag', 'assessment_type', 'assessment_reason', 'safety_critical', 'psm_critical', 'consequence_score', 'likelihood_score', 'notes']) };
  }

  async importCriticality(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const job = await this.db.single<any>(this.db.from('mi_criticality_import_jobs').insert({ company_id: this.companyScope(user), site_id: body.siteId ?? user.selectedSiteId ?? null, file_name: body.fileName ?? 'criticality-import.csv', status: 'Uploaded', total_rows: rows.length, uploaded_by: user.id }).select().single());
    for (let index = 0; index < rows.length; index += 1) {
      await this.db.single(this.db.from('mi_criticality_import_rows').insert({ job_id: job.id, row_number: index + 1, raw_data_json: rows[index], normalized_data_json: rows[index], validation_status: 'Pending' }).select('id').single()).catch(() => null);
    }
    return job;
  }

  async getCriticalityImportJob(user: RequestUser, jobId: string) {
    const companyId = this.companyScope(user);
    const job = await this.db.single<any>(this.db.from('mi_criticality_import_jobs').select('*').eq('company_id', companyId).eq('id', jobId).maybeSingle());
    if (!job) throw new BadRequestException('Criticality import job was not found.');
    const rows = await this.db.many<any>(this.db.from('mi_criticality_import_rows').select('*').eq('job_id', jobId).order('row_number', { ascending: true })).catch(() => []);
    return { job, rows };
  }

  async validateCriticalityImport(user: RequestUser, jobId: string) {
    const data = await this.getCriticalityImportJob(user, jobId);
    let valid = 0;
    let errors = 0;
    for (const row of data.rows) {
      const rowErrors: string[] = [];
      if (!row.normalized_data_json?.equipment_tag && !row.normalized_data_json?.equipmentId) rowErrors.push('equipment_tag or equipmentId is required.');
      if (row.normalized_data_json?.consequence_score !== undefined && this.numberOrNull(row.normalized_data_json.consequence_score) === null) rowErrors.push('consequence_score must be numeric.');
      if (row.normalized_data_json?.likelihood_score !== undefined && this.numberOrNull(row.normalized_data_json.likelihood_score) === null) rowErrors.push('likelihood_score must be numeric.');
      if (rowErrors.length) errors += 1; else valid += 1;
      await this.db.single(this.db.from('mi_criticality_import_rows').update({ validation_status: rowErrors.length ? 'Error' : 'Valid', validation_errors_json: rowErrors, updated_at: new Date().toISOString() }).eq('id', row.id).select('id').single()).catch(() => null);
    }
    return this.db.single<any>(this.db.from('mi_criticality_import_jobs').update({ status: errors ? 'Validation Failed' : 'Validated', valid_rows: valid, error_rows: errors, updated_at: new Date().toISOString() }).eq('id', jobId).select().single());
  }

  async commitCriticalityImport(user: RequestUser, jobId: string) {
    const data = await this.getCriticalityImportJob(user, jobId);
    if (data.job.status !== 'Validated') throw new BadRequestException('Import must be validated before commit.');
    let created = 0;
    for (const row of data.rows.filter((item: any) => item.validation_status === 'Valid')) {
      const item = row.normalized_data_json ?? {};
      const equipment = item.equipmentId ? await this.get(user, item.equipmentId).catch(() => null) : (await this.equipmentRows(user, { q: item.equipment_tag } as RegistryQuery))[0];
      if (!equipment) continue;
      const createdAssessment = await this.createCriticalityAssessment(user, { equipmentId: equipment.id, assessmentType: item.assessment_type ?? 'Import', assessmentReason: item.assessment_reason ?? 'Imported criticality assessment', notes: item.notes });
      await this.db.single(this.db.from('mi_criticality_import_rows').update({ created_assessment_id: createdAssessment.assessment.id, updated_at: new Date().toISOString() }).eq('id', row.id).select('id').single()).catch(() => null);
      created += 1;
    }
    return this.db.single<any>(this.db.from('mi_criticality_import_jobs').update({ status: 'Committed', created_count: created, updated_at: new Date().toISOString() }).eq('id', jobId).select().single());
  }

  async criticalityImportErrorReport(user: RequestUser, jobId: string) {
    const data = await this.getCriticalityImportJob(user, jobId);
    const content = this.csv(data.rows.map((row: any) => ({ row_number: row.row_number, errors: (row.validation_errors_json ?? []).join('; '), raw: JSON.stringify(row.raw_data_json ?? {}) })), ['row_number', 'errors', 'raw']);
    return { fileName: `mi-criticality-import-errors-${jobId}.csv`, content };
  }

  async exportCriticality(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.enrichCriticalityRows(await this.scopedCriticalityAssessments(user, query));
    const content = this.csv(rows.map((row) => ({
      assessment_number: row.assessment_number,
      equipment_tag: row.equipmentTag,
      status: row.status,
      approval_status: row.approval_status,
      consequence_score: row.consequence_score,
      likelihood_score: row.likelihood_score,
      final_risk_score: row.final_risk_score,
      criticality_category: row.criticality_category,
      inspection_priority: row.inspection_priority,
      next_review_due: row.next_review_due
    })), ['assessment_number', 'equipment_tag', 'status', 'approval_status', 'consequence_score', 'likelihood_score', 'final_risk_score', 'criticality_category', 'inspection_priority', 'next_review_due']);
    await this.addGlobalMiHistory(user, 'CRITICALITY_EXPORTED', 'Criticality registry exported', `${rows.length} rows`, { count: rows.length });
    return { fileName: 'mi-criticality-export.csv', content };
  }

  async exportCriticalityAssessment(user: RequestUser, assessmentId: string) {
    const detail = await this.criticalityAssessmentDetail(user, assessmentId);
    const rows = [
      { section: 'assessment', payload: JSON.stringify(detail.assessment) },
      { section: 'calculation', payload: JSON.stringify(detail.calculation) },
      { section: 'validation', payload: JSON.stringify(detail.validation) }
    ];
    return { fileName: `${detail.assessment.assessment_number}-criticality.csv`, content: this.csv(rows, ['section', 'payload']) };
  }

  async criticalityLookups(user: RequestUser) {
    const config = await this.activeCriticalityConfig(user, user.selectedSiteId ?? null);
    return {
      categories: (config.category_thresholds_json ?? []).map((item: any) => item.category),
      riskMatrices: [{ id: config.id, name: config.config_name, matrixSize: config.matrix_size, scoreMethod: config.score_method }],
      consequenceDimensions: config.consequence_dimensions_json ?? [],
      likelihoodDimensions: config.likelihood_dimensions_json ?? [],
      assessmentTypes: ['Initial', 'Periodic Review', 'Change-driven Review', 'Post-incident Review', 'MOC Review', 'Manual Revision', 'Import'],
      inspectionPriorities: ['Routine', 'Priority', 'High Priority', 'Immediate', 'Startup Blocker']
    };
  }

  async equipmentCriticalitySuggestions(user: RequestUser, equipmentId: string) {
    const snapshot = await this.criticalityEquipmentSnapshot(user, equipmentId);
    return {
      consequenceDrivers: snapshot.consequenceDrivers ?? [],
      likelihoodDrivers: snapshot.likelihoodDrivers ?? [],
      suggestedFlags: {
        safetyCritical: snapshot.equipment?.safetyCritical || snapshot.integrityDrivers?.sisProtected || snapshot.integrityDrivers?.psvProtected,
        psmCritical: snapshot.integrityDrivers?.chemicalReleasePotential || snapshot.integrityDrivers?.processContainmentRole,
        startupBlockerPotential: snapshot.integrityDrivers?.activeBypass || snapshot.integrityDrivers?.notFitForService
      },
      disabledReason: null
    };
  }

  async criticalityEquipmentSnapshot(user: RequestUser, equipmentId: string) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const [technical, cmlSnapshotMap, status, openPlans, records] = await Promise.all([
      this.db.single<any>(this.db.from('mi_equipment_technical_data').select('*').eq('equipment_id', shadow.id).maybeSingle()).catch(() => null),
      this.latestCmlSnapshots(shadow.id).catch(() => []),
      this.db.single<any>(this.db.from('mi_equipment_integrity_status').select('*').eq('equipment_id', shadow.id).maybeSingle()).catch(() => null),
      this.db.many<any>(this.db.from('mi_inspection_plans').select('id,status,current_due_status,current_next_due_date').eq('equipment_id', shadow.id).limit(20)).catch(() => []),
      this.db.many<any>(this.db.from('mi_inspection_records').select('id,status,inspection_date,overall_fitness_status').eq('equipment_id', shadow.id).order('inspection_date', { ascending: false }).limit(10)).catch(() => [])
    ]);
    const cmls = Array.isArray(cmlSnapshotMap) ? cmlSnapshotMap : Array.from(cmlSnapshotMap.values());
    const lowestRemainingLife = cmls.reduce((min: number | null, item: any) => {
      const value = this.numberOrNull(item.remaining_life_years);
      return value === null ? min : min === null ? value : Math.min(min, value);
    }, null);
    const highestCorrosionRate = cmls.reduce((max: number, item: any) => Math.max(max, this.numberOrNull(item.long_term_corrosion_rate) ?? 0, this.numberOrNull(item.short_term_corrosion_rate) ?? 0), 0);
    const integrityDrivers = {
      safetyCritical: !!equipment.safetyCritical,
      psvProtected: !!(equipment.psvProtected ?? equipment.reliefProtection),
      sisProtected: !!equipment.sisProtected,
      processContainmentRole: /vessel|tank|pipe|reactor|exchanger/i.test(String(equipment.type ?? '')),
      chemicalReleasePotential: !!(equipment.fluidName ?? equipment.fluidService ?? technical?.service_fluid),
      activeBypass: !!equipment.bypassActive,
      notFitForService: this.fitness(equipment) === 'Not Fit for Service',
      inspectionOverdue: openPlans.some((plan: any) => plan.current_due_status === 'Overdue'),
      lowestRemainingLife,
      highestCorrosionRate
    };
    return {
      equipment: { id: equipment.id, tag: equipment.tag, name: equipment.name, type: equipment.type, siteId: equipment.siteId, unitId: equipment.unitId, status: equipment.status, safetyCritical: equipment.safetyCritical },
      technicalSummary: this.technicalDataFromEquipment(equipment, technical),
      cmlSummary: { count: cmls.length, lowestRemainingLife, highestCorrosionRate },
      integrityStatus: status,
      inspectionPlans: openPlans,
      recentInspections: records,
      integrityDrivers,
      consequenceDrivers: Object.entries(integrityDrivers).filter(([, value]) => !!value).map(([key]) => key),
      likelihoodDrivers: ['inspectionOverdue', 'lowestRemainingLife', 'highestCorrosionRate', 'activeBypass'].filter((key) => (integrityDrivers as any)[key])
    };
  }

  private kpi(label: string, value: number | string, helper?: string, tone: 'neutral' | 'warning' | 'danger' = 'neutral') {
    return { label, value, helper, tone };
  }

  private scopedCriticalityAssessments(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_criticality_assessments').select('*').eq('company_id', this.companyScope(user));
    const siteId = query.siteId ?? user.selectedSiteId ?? undefined;
    if (siteId) request = request.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    if (query.status) request = request.eq('status', query.status);
    if (query.approvalStatus) request = request.eq('approval_status', query.approvalStatus);
    if (query.category) request = request.eq('criticality_category', query.category);
    if (query.safetyCritical === 'true') request = request.eq('safety_critical', true);
    if (query.psmCritical === 'true') request = request.eq('psm_critical', true);
    if (query.q) {
      const q = this.cleanSearch(query.q);
      request = request.or(`assessment_number.ilike.%${q}%,assessment_reason.ilike.%${q}%,notes.ilike.%${q}%`);
    }
    return this.db.many<any>(request.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 500))).catch(() => []);
  }

  private async enrichCriticalityRows(rows: any[]) {
    const equipmentIds = [...new Set(rows.map((row) => row.equipment_id).filter(Boolean))];
    const equipmentRows = equipmentIds.length ? await this.db.many<any>(this.db.from('mi_equipment').select('id,equipment_tag,equipment_name,equipment_type_key,equipment_category,site_id,unit_id,area_id,status').in('id', equipmentIds)).catch(() => []) : [];
    const equipmentById = new Map(equipmentRows.map((item) => [item.id, item]));
    return rows.map((row) => {
      const equipment = equipmentById.get(row.equipment_id) ?? {};
      return {
        ...row,
        equipment,
        equipmentTag: equipment.equipment_tag ?? row.equipment_id,
        equipmentName: equipment.equipment_name ?? null,
        equipmentType: equipment.equipment_category ?? equipment.equipment_type_key ?? null,
        readOnly: ['Approved', 'Rejected', 'Archived', 'Superseded'].includes(row.status)
      };
    });
  }

  private criticalitySummaryFromRows(rows: any[]) {
    return {
      totalAssessments: rows.length,
      draft: rows.filter((item) => item.status === 'Draft').length,
      pendingReview: rows.filter((item) => item.approval_status === 'Pending Review').length,
      approved: rows.filter((item) => item.status === 'Approved').length,
      rejected: rows.filter((item) => item.status === 'Rejected').length,
      critical: rows.filter((item) => item.criticality_category === 'Critical').length,
      high: rows.filter((item) => item.criticality_category === 'High').length,
      medium: rows.filter((item) => item.criticality_category === 'Medium').length,
      low: rows.filter((item) => item.criticality_category === 'Low').length,
      safetyCritical: rows.filter((item) => item.safety_critical).length,
      psmCritical: rows.filter((item) => item.psm_critical).length,
      startupBlockers: rows.filter((item) => item.startup_blocker_potential || item.inspection_priority === 'Startup Blocker').length,
      reviewDue: rows.filter((item) => item.next_review_due && this.isPast(item.next_review_due)).length,
      needsRecalculation: rows.filter((item) => item.calculation_status !== 'Calculated' && item.calculation_status !== 'Manual Override').length,
      byCategory: this.distribution(rows, (item) => item.criticality_category ?? 'Not Calculated')
    };
  }

  private async activeCriticalityConfig(user: RequestUser, siteId?: string | null) {
    const companyId = this.companyScope(user);
    const siteConfig = siteId ? await this.db.single<any>(this.db.from('mi_criticality_configs').select('*').eq('company_id', companyId).eq('site_id', siteId).eq('active', true).maybeSingle()).catch(() => null) : null;
    if (siteConfig) return siteConfig;
    const companyConfig = await this.db.single<any>(this.db.from('mi_criticality_configs').select('*').eq('company_id', companyId).is('site_id', null).eq('active', true).maybeSingle()).catch(() => null);
    if (companyConfig) return companyConfig;
    return this.createDefaultCriticalityConfig(user, siteId ?? null);
  }

  private defaultCriticalityConfig(user: RequestUser, siteId?: string | null) {
    const consequenceScale = [1, 2, 3, 4, 5].map((score) => ({ score, label: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'][score - 1] }));
    const likelihoodScale = [1, 2, 3, 4, 5].map((score) => ({ score, label: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Frequent'][score - 1] }));
    const consequenceDimensions = [
      ['safety', 'Safety / Personnel Harm'],
      ['process_safety', 'Process Safety / Major Accident Potential'],
      ['environment', 'Environmental Impact'],
      ['production', 'Production / Business Interruption'],
      ['asset_damage', 'Asset Damage / Repair Cost'],
      ['regulatory', 'Regulatory / Compliance'],
      ['reputation', 'Community / Reputation'],
      ['startup', 'Startup / Restart Impact']
    ].map(([key, label]) => ({ key, label, required: true, weight: 1 }));
    const likelihoodDimensions = [
      ['damage_mechanism', 'Damage Mechanism Susceptibility'],
      ['corrosion_rate', 'Corrosion / Degradation Rate'],
      ['inspection_history', 'Inspection History'],
      ['condition', 'Current Condition'],
      ['operating_severity', 'Operating Severity'],
      ['age_service', 'Age / Service Exposure'],
      ['barrier_health', 'Safeguard / Barrier Health'],
      ['bypass_impairment', 'Bypass / Impairment State'],
      ['deficiency_history', 'Deficiency / Failure History'],
      ['management_controls', 'Management Controls']
    ].map(([key, label]) => ({ key, label, required: true, weight: 1 }));
    return {
      company_id: this.companyScope(user),
      site_id: siteId ?? null,
      config_name: 'Default MI Criticality Matrix',
      scope: siteId ? 'Site' : 'Company',
      version_number: 1,
      active: true,
      matrix_size: 5,
      score_method: 'matrix',
      consequence_method: 'maximum',
      likelihood_method: 'maximum',
      consequence_scale_json: consequenceScale,
      likelihood_scale_json: likelihoodScale,
      consequence_dimensions_json: consequenceDimensions,
      likelihood_dimensions_json: likelihoodDimensions,
      category_thresholds_json: [
        { category: 'Low', min: 1, max: 4, tone: 'success' },
        { category: 'Medium', min: 5, max: 9, tone: 'warning' },
        { category: 'High', min: 10, max: 14, tone: 'danger' },
        { category: 'Critical', min: 15, max: 25, tone: 'danger' }
      ],
      review_frequency_json: { Low: 36, Medium: 24, High: 12, Critical: 6 },
      approval_rules_json: { requireReviewForHigh: true, requireReviewForSafetyCritical: true },
      auto_suggestion_rules_json: {},
      inspection_priority_mapping_json: { Low: 'Routine', Medium: 'Priority', High: 'High Priority', Critical: 'Immediate' },
      scheduler_mapping_json: {}
    };
  }

  private async createDefaultCriticalityConfig(user: RequestUser, siteId?: string | null) {
    const payload = { ...this.defaultCriticalityConfig(user, siteId), id: crypto.randomUUID(), created_by: user.id, updated_by: user.id };
    const row = await this.db.single<any>(this.db.from('mi_criticality_configs').insert(payload).select().single());
    await this.createCriticalityConfigVersion(user, row, 'Default configuration seeded');
    return row;
  }

  private async createCriticalityConfigVersion(user: RequestUser, config: any, reason: string) {
    return this.db.single(this.db.from('mi_criticality_config_versions').insert({ config_id: config.id, company_id: config.company_id, site_id: config.site_id, version_number: config.version_number, config_snapshot_json: config, change_reason: reason, created_by: user.id }).select('id').single()).catch(() => null);
  }

  private async nextCriticalityAssessmentNumber(equipment: any) {
    const prefix = `MI-CRIT-${String(equipment.site_id ?? equipment.siteId ?? 'SITE').slice(0, 6).toUpperCase()}`;
    const rows = await this.db.many<any>(this.db.from('mi_criticality_assessments').select('assessment_number').eq('company_id', equipment.company_id ?? equipment.companyId).eq('site_id', equipment.site_id ?? equipment.siteId).ilike('assessment_number', `${prefix}-%`)).catch(() => []);
    return `${prefix}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private async seedCriticalityScores(user: RequestUser, assessment: any, config: any, snapshot: any) {
    const consequence = (config.consequence_dimensions_json ?? []).map((dimension: any) => ({
      assessment_id: assessment.id,
      company_id: assessment.company_id,
      site_id: assessment.site_id,
      equipment_id: assessment.equipment_id,
      dimension_key: dimension.key,
      dimension_label: dimension.label,
      score: this.suggestConsequenceScore(dimension.key, assessment, snapshot),
      score_label: null,
      description: null,
      justification: null,
      weight: dimension.weight ?? 1,
      required: dimension.required ?? true,
      created_by: user.id,
      updated_by: user.id
    }));
    const likelihood = (config.likelihood_dimensions_json ?? []).map((dimension: any) => {
      const suggested = this.suggestLikelihoodScore(dimension.key, assessment, snapshot);
      return {
        assessment_id: assessment.id,
        company_id: assessment.company_id,
        site_id: assessment.site_id,
        equipment_id: assessment.equipment_id,
        dimension_key: dimension.key,
        dimension_label: dimension.label,
        score: suggested,
        auto_suggested_score: suggested,
        score_label: null,
        description: null,
        justification: null,
        data_source: 'Equipment snapshot',
        weight: dimension.weight ?? 1,
        required: dimension.required ?? true,
        created_by: user.id,
        updated_by: user.id
      };
    });
    if (consequence.length) await this.db.many<any>(this.db.from('mi_criticality_consequence_scores').insert(consequence).select('id')).catch(() => []);
    if (likelihood.length) await this.db.many<any>(this.db.from('mi_criticality_likelihood_scores').insert(likelihood).select('id')).catch(() => []);
  }

  private suggestConsequenceScore(key: string, assessment: any, snapshot: any) {
    if (key === 'safety' && assessment.safety_critical) return 4;
    if (key === 'process_safety' && (assessment.psm_critical || snapshot.integrityDrivers?.processContainmentRole)) return 4;
    if (key === 'environment' && (assessment.environmental_release_potential || snapshot.integrityDrivers?.chemicalReleasePotential)) return 3;
    if (key === 'startup' && assessment.startup_blocker_potential) return 4;
    if (key === 'production' && snapshot.integrityDrivers?.notFitForService) return 3;
    return 2;
  }

  private suggestLikelihoodScore(key: string, assessment: any, snapshot: any) {
    if (key === 'bypass_impairment' && snapshot.integrityDrivers?.activeBypass) return 4;
    if (key === 'condition' && snapshot.integrityDrivers?.notFitForService) return 5;
    if (key === 'inspection_history' && snapshot.integrityDrivers?.inspectionOverdue) return 4;
    if (key === 'corrosion_rate' && Number(snapshot.cmlSummary?.highestCorrosionRate ?? 0) > 0.1) return 4;
    if (key === 'age_service' && Number(snapshot.cmlSummary?.lowestRemainingLife ?? 99) < 5) return 4;
    return 2;
  }

  private async getCriticalityAssessmentBase(user: RequestUser, assessmentId: string) {
    const row = await this.db.single<any>(this.db.from('mi_criticality_assessments').select('*').eq('company_id', this.companyScope(user)).eq('id', assessmentId).maybeSingle());
    if (!row) throw new BadRequestException('Criticality assessment was not found or is outside your company/site access.');
    if (!user.corporateView && user.siteIds.length && !user.siteIds.includes(row.site_id)) throw new BadRequestException('Criticality assessment is outside your site access.');
    return row;
  }

  private assertCriticalityEditable(assessment: any) {
    if (['Approved', 'Archived', 'Superseded'].includes(assessment.status)) throw new BadRequestException('Approved, archived, and superseded criticality assessments are immutable. Create a revision instead.');
  }

  private criticalityValidation(assessment: any, consequence: any[], likelihood: any[], calculation: any) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!assessment.assessment_reason) blockers.push('Assessment reason is required.');
    if (!consequence.length) blockers.push('Consequence score dimensions are missing.');
    if (!likelihood.length) blockers.push('Likelihood score dimensions are missing.');
    if (consequence.some((item) => item.required && this.numberOrNull(item.score) === null)) blockers.push('Required consequence scores are incomplete.');
    if (likelihood.some((item) => item.required && this.numberOrNull(item.manual_override_score ?? item.score ?? item.auto_suggested_score) === null)) blockers.push('Required likelihood scores are incomplete.');
    if (consequence.some((item) => Number(item.score ?? 0) >= 4 && !item.justification)) warnings.push('High consequence scores should include justification.');
    if (likelihood.some((item) => Number(item.manual_override_score ?? item.score ?? item.auto_suggested_score ?? 0) >= 4 && !item.justification)) warnings.push('High likelihood scores should include justification.');
    if (assessment.safety_critical && !assessment.safety_critical_reason) blockers.push('Safety-critical equipment requires a reason.');
    if (assessment.psm_critical && !assessment.psm_critical_reason) warnings.push('PSM-critical equipment should include a reason.');
    if (!calculation) blockers.push('Criticality calculation has not been generated.');
    return { blockers, warnings, readyForReview: blockers.length === 0, readyForApproval: blockers.length === 0 };
  }

  private calculateCriticality(assessment: any, consequence: any[], likelihood: any[], config: any) {
    const consequenceScores = consequence.map((item) => this.numberOrNull(item.score)).filter((item): item is number => item !== null);
    const likelihoodScores = likelihood.map((item) => this.numberOrNull(item.manual_override_score ?? item.score ?? item.auto_suggested_score)).filter((item): item is number => item !== null);
    const consequenceScore = consequenceScores.length ? Math.max(...consequenceScores) : null;
    const likelihoodScore = likelihoodScores.length ? Math.max(...likelihoodScores) : null;
    const finalScore = consequenceScore !== null && likelihoodScore !== null ? consequenceScore * likelihoodScore : null;
    const category = assessment.manual_override && assessment.override_category ? assessment.override_category : this.categoryForScore(finalScore, config);
    const priority = this.priorityForCategory(category, config);
    const reviewMonths = Number((config.review_frequency_json ?? {})[category ?? 'Medium'] ?? 24);
    const nextReview = new Date(assessment.assessment_date ?? new Date());
    nextReview.setMonth(nextReview.getMonth() + reviewMonths);
    return {
      consequence_score: consequenceScore,
      likelihood_score: likelihoodScore,
      weighted_score: finalScore,
      final_risk_score: finalScore,
      risk_matrix_cell: consequenceScore && likelihoodScore ? `C${consequenceScore}-L${likelihoodScore}` : null,
      criticality_category: category,
      inspection_priority: priority,
      rbi_candidate: ['High', 'Critical'].includes(category ?? ''),
      next_review_due: nextReview.toISOString().slice(0, 10),
      risk_change_direction: assessment.criticality_category ? this.riskTrend(assessment.criticality_category, category) : 'New',
      explanation: finalScore === null ? 'Score could not be calculated because required inputs are incomplete.' : `Final score ${finalScore} calculated from maximum consequence ${consequenceScore} and likelihood ${likelihoodScore}.`,
      calculation_status: finalScore === null ? 'Incomplete' : 'Calculated',
      review_frequency_months: reviewMonths
    };
  }

  private categoryForScore(score: number | null, config: any) {
    if (score === null) return null;
    const thresholds = config.category_thresholds_json ?? [];
    return thresholds.find((item: any) => score >= Number(item.min) && score <= Number(item.max))?.category ?? 'Medium';
  }

  private priorityForCategory(category?: string | null, config?: any) {
    if (!category) return 'Pending';
    return (config?.inspection_priority_mapping_json ?? {})[category] ?? ({ Low: 'Routine', Medium: 'Priority', High: 'High Priority', Critical: 'Immediate' } as any)[category] ?? 'Priority';
  }

  private riskTrend(before?: string | null, after?: string | null) {
    const order = ['Low', 'Medium', 'High', 'Critical'];
    const diff = order.indexOf(after ?? '') - order.indexOf(before ?? '');
    return diff > 0 ? 'Increased' : diff < 0 ? 'Reduced' : 'Unchanged';
  }

  private criticalityActions(user: RequestUser, assessment: any, validation: any) {
    const can = (permission: string) => user.permissions?.includes(permission) || user.isSuperAdmin;
    const locked = ['Approved', 'Archived', 'Superseded'].includes(assessment.status);
    const action = (key: string, permission: string, disabledReason?: string | null) => ({
      key,
      permitted: can(permission),
      disabled: !can(permission) || !!disabledReason,
      disabledReason: !can(permission) ? `Missing permission: ${permission}` : disabledReason ?? null
    });
    return [
      action('edit', 'mechanical_integrity.criticality.edit', locked ? 'Approved, archived, and superseded assessments are read-only.' : null),
      action('recalculate', 'mechanical_integrity.criticality_calculation.recalculate', locked ? 'Read-only assessment.' : null),
      action('submit', 'mechanical_integrity.criticality.submit', validation.blockers.length ? validation.blockers.join(' ') : null),
      action('approve', 'mechanical_integrity.criticality.approve', assessment.approval_status !== 'Pending Review' ? 'Assessment is not pending review.' : null),
      action('reject', 'mechanical_integrity.criticality.reject', assessment.approval_status !== 'Pending Review' ? 'Assessment is not pending review.' : null),
      action('override', 'mechanical_integrity.criticality.override', locked ? 'Read-only assessment.' : null),
      action('archive', 'mechanical_integrity.criticality.archive', assessment.status === 'Archived' ? 'Already archived.' : null),
      action('export', 'mechanical_integrity.criticality.export')
    ];
  }

  private async addCriticalityHistory(user: RequestUser, assessment: any, eventType: string, title: string, before?: any, after?: any) {
    await this.db.single(this.db.from('mi_criticality_history_events').insert({
      company_id: assessment.company_id,
      site_id: assessment.site_id,
      equipment_id: assessment.equipment_id,
      assessment_id: assessment.id,
      event_type: eventType,
      event_title: title,
      event_description: after?.assessment_number ?? assessment.assessment_number ?? null,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      source_record_id: assessment.id,
      actor_user_id: user.id
    }).select('id').single()).catch(() => null);
    await this.addMiHistory(user, assessment.equipment_id, eventType, title, assessment.assessment_number, before, after ?? assessment, 'MechanicalIntegrityCriticality', assessment.id).catch(() => null);
  }

  private async addCriticalityReviewRecord(user: RequestUser, assessment: any, action: string, comments?: string | null) {
    return this.db.single(this.db.from('mi_criticality_reviews').insert({ assessment_id: assessment.id, company_id: assessment.company_id, site_id: assessment.site_id, equipment_id: assessment.equipment_id, reviewer_user_id: user.id, review_action: action, review_comments: comments ?? null, created_by: user.id }).select('id').single()).catch(() => null);
  }

  private async applyCriticalityToEquipment(user: RequestUser, assessment: any) {
    const payload = {
      company_id: assessment.company_id,
      site_id: assessment.site_id,
      equipment_id: assessment.equipment_id,
      critical_equipment: ['High', 'Critical'].includes(assessment.criticality_category),
      safety_critical_equipment: !!assessment.safety_critical,
      psm_critical: !!assessment.psm_critical,
      environmental_critical: !!assessment.environmental_release_potential,
      production_critical: ['High', 'Critical'].includes(assessment.criticality_category),
      consequence_rating: assessment.consequence_score,
      likelihood_rating: assessment.likelihood_score,
      criticality_score: assessment.final_risk_score,
      criticality_category: assessment.criticality_category,
      risk_ranking_method: assessment.assessment_method,
      fitness_status: assessment.startup_blocker_potential ? 'Startup Blocked' : null,
      startup_blocked: !!assessment.startup_blocker_potential,
      startup_block_reason: assessment.startup_blocker_potential ? 'Criticality assessment indicates startup blocker potential.' : null,
      last_integrity_review_at: new Date().toISOString(),
      last_integrity_review_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const existing = await this.db.single<any>(this.db.from('mi_equipment_integrity_status').select('id').eq('equipment_id', assessment.equipment_id).maybeSingle()).catch(() => null);
    if (existing) return this.db.single(this.db.from('mi_equipment_integrity_status').update(payload).eq('id', existing.id).select('id').single()).catch(() => null);
    return this.db.single(this.db.from('mi_equipment_integrity_status').insert({ id: crypto.randomUUID(), ...payload }).select('id').single()).catch(() => null);
  }

  private async cloneCriticalityScores(fromAssessmentId: string, toAssessmentId: string, userId: string) {
    const tables = ['mi_criticality_consequence_scores', 'mi_criticality_likelihood_scores'];
    for (const table of tables) {
      const rows = await this.db.many<any>(this.db.from(table).select('*').eq('assessment_id', fromAssessmentId)).catch(() => []);
      for (const row of rows) {
        const { id, created_at, updated_at, ...copy } = row;
        await this.db.single(this.db.from(table).insert({ ...copy, id: crypto.randomUUID(), assessment_id: toAssessmentId, created_by: userId, updated_by: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select('id').single()).catch(() => null);
      }
    }
  }

  private detailActions(user: RequestUser, equipment: any, archived: boolean) {
    const can = (permission: string) => user.permissions.includes(permission) || user.isSuperAdmin;
    const action = (key: string, label: string, permission: string, disabledReason?: string | null) => {
      const permitted = can(permission);
      const readOnlyBlocked = archived && !['archive', 'reactivate', 'export', 'history'].includes(key);
      return {
        key,
        label,
        permitted,
        disabled: !permitted || readOnlyBlocked || !!disabledReason,
        disabledReason: !permitted ? `Missing permission: ${permission}` : readOnlyBlocked ? 'Archived/decommissioned equipment is read-only.' : disabledReason ?? null
      };
    };
    return [
      action('edit', 'Edit Equipment', 'mechanical_integrity.equipment.edit'),
      action('status-change', 'Change Status', 'mechanical_integrity.equipment.edit'),
      action('add-linked-record', 'Add Linked Record', 'mechanical_integrity.linked_records.manage'),
      action('add-document', 'Add Document', 'mechanical_integrity.documents.manage'),
      action('create-action', 'Create Action', 'actions.create'),
      action('create-deficiency', 'Create Deficiency', 'mechanical_integrity.equipment.edit', 'Deficiency workflow comes in a later Mechanical Integrity phase.'),
      action('inspection-plan', 'Open Inspection Plan', 'mechanical_integrity.equipment.view'),
      action('export', 'Export Equipment Summary', 'mechanical_integrity.equipment.export'),
      action('history', 'View Audit / History', 'mechanical_integrity.equipment.history.view'),
      action('archive', 'Archive Equipment', 'mechanical_integrity.equipment.archive', this.isArchived(equipment) ? 'Equipment is already archived/decommissioned.' : null),
      action('reactivate', 'Reactivate Equipment', 'mechanical_integrity.equipment.edit', this.isArchived(equipment) ? null : 'Equipment is not archived/decommissioned.')
    ];
  }

  private statusItem(label: string, value: string, tab: string, reason?: string | null) {
    const normalized = String(value ?? 'Not configured');
    const tone = /blocked|overdue|active|critical|not fit|expired/i.test(normalized)
      ? 'danger'
      : /not configured|not evaluated|missing|foundation/i.test(normalized)
        ? 'warning'
        : 'success';
    return { label, value: normalized, tab, tone, reason: reason ?? null };
  }

  private readinessCheck(label: string, passed: boolean, reason?: string | null) {
    return { label, status: passed ? 'Complete' : 'Attention Required', passed, reason: reason ?? null };
  }

  private attention(item: any, issueType: string, severity: string) {
    return {
      equipmentId: item.id,
      equipmentTag: item.tag,
      equipmentName: item.name,
      site: item.site?.name ?? item.siteId,
      unit: item.unit?.name ?? item.unitId,
      area: item.area?.name ?? item.areaId,
      issueType,
      severity,
      dueDate: item.nextInspectionDueDate ?? item.nextImpairmentExpiryAt ?? null,
      href: `/mechanical-integrity/equipment/${item.id}`
    };
  }

  async pmDashboard(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const plans = await this.pmPlanRows(user, query);
    const records = await this.pmRecordRows(user, query);
    const due = await this.pmDue(user, query);
    const overdue = due.rows.filter((item: any) => item.dueStatus === 'Overdue' || item.due_status === 'Overdue');
    return {
      header: { title: 'Preventive Maintenance', subtitle: 'PM plans, due work, execution records, findings, and readiness', lastUpdated: new Date().toISOString() },
      summary: this.pmSummary(plans, records, due.rows),
      plans: plans.slice(0, 25),
      due: due.rows.slice(0, 25),
      overdue: overdue.slice(0, 25),
      records: records.slice(0, 25),
      charts: {
        byStatus: this.distribution(plans, (item) => item.status ?? 'Unknown'),
        byDueStatus: this.distribution(due.rows, (item) => item.dueStatus ?? item.current_due_status ?? 'Unknown'),
        byResult: this.distribution(records, (item) => item.result ?? 'Not Completed')
      }
    };
  }

  async pmPlanRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.pmPlanRows(user, query);
    return { rows, summary: this.pmSummary(rows, await this.pmRecordRows(user, query), rows), lastUpdated: new Date().toISOString() };
  }

  async createPmPlan(user: RequestUser, body: Record<string, any>) {
    if (!(body.planTitle ?? body.plan_title)?.trim()) throw new BadRequestException('PM plan title is required.');
    if (!(body.pmTaskType ?? body.pm_task_type)?.trim()) throw new BadRequestException('PM task type is required.');
    const equipmentId = body.equipmentId ?? body.equipment_id;
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const planNumber = body.planNumber ?? body.plan_number ?? await this.nextMiSequence('mi_pm_plans', 'plan_number', 'MI-PM', shadow.site_id ?? shadow.siteId ?? user.selectedSiteId ?? 'SITE', shadow.company_id ?? this.companyScope(user));
    const payload = this.pmPlanPayload(body, user.id);
    const row = await this.db.single<any>(this.db.from('mi_pm_plans').insert({
      ...payload,
      company_id: shadow.company_id ?? this.companyScope(user),
      site_id: shadow.site_id ?? shadow.siteId ?? equipment.siteId ?? user.selectedSiteId,
      equipment_id: shadow.id,
      plan_number: planNumber,
      plan_title: body.planTitle ?? body.plan_title,
      pm_task_type: body.pmTaskType ?? body.pm_task_type,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.upsertPmSchedule(user, row.id, body);
    await this.replacePmChecklist(user, row.id, body.checklistItems ?? body.checklist_items ?? []);
    await this.recalculatePmPlanSchedule(user, row.id);
    await this.addMiHistory(user, row.equipment_id, 'PM_PLAN_CREATED', 'Preventive maintenance plan created', row.plan_number, null, row, 'PM Plan', row.id);
    return this.pmPlanDetail(user, row.id);
  }

  async pmPlanDetail(user: RequestUser, planId: string) {
    const plan = await this.getPmPlan(user, planId);
    const schedule = await this.db.single<any>(this.db.from('mi_pm_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const checklist = await this.db.many<any>(this.db.from('mi_pm_plan_checklist_items').select('*').eq('plan_id', planId).order('sort_order', { ascending: true })).catch(() => []);
    const occurrences = await this.db.many<any>(this.db.from('mi_pm_occurrences').select('*').eq('plan_id', planId).order('due_date', { ascending: true })).catch(() => []);
    const records = await this.db.many<any>(this.db.from('mi_pm_records').select('*').eq('plan_id', planId).order('pm_date', { ascending: false })).catch(() => []);
    return { plan: this.decoratePmPlan(plan), schedule, checklist, occurrences, records, actions: this.pmPlanActions(user, plan) };
  }

  async updatePmPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getPmPlan(user, planId);
    this.assertEditablePlan(before, 'PM plan');
    const row = await this.db.single<any>(this.db.from('mi_pm_plans').update(this.pmPlanPayload(body, user.id)).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    if (body.schedule || body.frequencyValue || body.frequency_value || body.manualOverrideDueDate) await this.upsertPmSchedule(user, planId, body.schedule ?? body);
    if (Array.isArray(body.checklistItems ?? body.checklist_items)) await this.replacePmChecklist(user, planId, body.checklistItems ?? body.checklist_items);
    await this.recalculatePmPlanSchedule(user, planId).catch(() => null);
    await this.addMiHistory(user, before.equipment_id, 'PM_PLAN_UPDATED', 'Preventive maintenance plan updated', body.reason ?? row.plan_number, before, row, 'PM Plan', planId);
    return this.pmPlanDetail(user, planId);
  }

  async submitPmPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    return this.transitionPmPlan(user, planId, { status: 'Pending Approval', approval_status: 'Submitted' }, 'PM_PLAN_SUBMITTED', 'Preventive maintenance plan submitted', body.comment);
  }

  async approvePmPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const detail = await this.transitionPmPlan(user, planId, { status: 'Active', approval_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), rejected_by: null, rejected_at: null, rejection_reason: null }, 'PM_PLAN_APPROVED', 'Preventive maintenance plan approved', body.comment);
    await this.recalculatePmPlanSchedule(user, planId).catch(() => null);
    return detail;
  }

  async rejectPmPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required.');
    return this.transitionPmPlan(user, planId, { status: 'Draft', approval_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: reason }, 'PM_PLAN_REJECTED', 'Preventive maintenance plan rejected', reason);
  }

  async createPmPlanRevision(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getPmPlan(user, planId);
    const copy = { ...before };
    delete copy.id;
    delete copy.equipment;
    const row = await this.db.single<any>(this.db.from('mi_pm_plans').insert({
      ...copy,
      id: crypto.randomUUID(),
      parent_plan_id: before.id,
      revision_number: Number(before.revision_number ?? 1) + 1,
      status: 'Draft',
      approval_status: 'Not Submitted',
      plan_number: await this.nextMiSequence('mi_pm_plans', 'plan_number', 'MI-PM', before.site_id, before.company_id),
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single());
    const schedule = await this.db.single<any>(this.db.from('mi_pm_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (schedule) {
      const next = { ...schedule, id: crypto.randomUUID(), plan_id: row.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await this.db.single(this.db.from('mi_pm_plan_schedules').insert(next).select('id').single()).catch(() => null);
    }
    await this.copyChildRows('mi_pm_plan_checklist_items', 'plan_id', planId, row.id);
    await this.addMiHistory(user, before.equipment_id, 'PM_PLAN_REVISION_CREATED', 'Preventive maintenance plan revision created', body.reason ?? row.plan_number, before, row, 'PM Plan', row.id);
    return this.pmPlanDetail(user, row.id);
  }

  async archivePmPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getPmPlan(user, planId);
    const row = await this.db.single<any>(this.db.from('mi_pm_plans').update({ status: 'Archived', archived_by: user.id, archived_at: new Date().toISOString(), archive_reason: body.reason ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'PM_PLAN_ARCHIVED', 'Preventive maintenance plan archived', body.reason ?? row.plan_number, before, row, 'PM Plan', planId);
    return this.pmPlanDetail(user, planId);
  }

  async recalculatePmPlanSchedule(user: RequestUser, planId: string) {
    const plan = await this.getPmPlan(user, planId);
    const schedule = await this.db.single<any>(this.db.from('mi_pm_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const nextDue = this.nextPmCalibrationDueDate(schedule?.last_pm_date ?? plan.effective_date, schedule?.frequency_value, schedule?.frequency_unit, schedule?.manual_override_due_date);
    const dueStatus = this.pmCalibrationDueStatus(nextDue);
    const row = await this.db.single<any>(this.db.from('mi_pm_plans').update({ current_next_due_date: nextDue, current_due_status: dueStatus, current_scheduler_status: nextDue ? 'Calculated' : 'Missing schedule basis', updated_at: new Date().toISOString() }).eq('id', planId).select().single());
    if (nextDue && ['Active', 'Approved'].includes(String(row.status))) await this.ensurePmOccurrence(user, row, nextDue);
    await this.updateScheduleSummary(row.equipment_id, { pm_required: true, pm_frequency_value: schedule?.frequency_value ?? null, pm_frequency_unit: schedule?.frequency_unit ?? null, last_pm_date: schedule?.last_pm_date ?? null, next_pm_due_date: nextDue });
    await this.addMiHistory(user, row.equipment_id, 'PM_SCHEDULE_RECALCULATED', 'Preventive maintenance schedule recalculated', dueStatus, plan, row, 'PM Plan', planId).catch(() => null);
    return { plan: this.decoratePmPlan(row), schedule, nextDueDate: nextDue, dueStatus };
  }

  async pmDue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = (await this.pmPlanRows(user, query)).filter((item) => item.current_next_due_date);
    return { rows: rows.map((item) => this.decoratePmPlan(item)).filter((item) => ['Overdue', 'Due Soon', 'Scheduled'].includes(item.dueStatus)), lastUpdated: new Date().toISOString() };
  }

  async pmOverdue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const due = await this.pmDue(user, query);
    return { rows: due.rows.filter((item: any) => item.dueStatus === 'Overdue'), lastUpdated: due.lastUpdated };
  }

  async runPmScheduler(user: RequestUser, body: Record<string, any>) {
    const plans = await this.pmPlanRows(user, body);
    const active = plans.filter((plan) => ['Active', 'Approved'].includes(String(plan.status)));
    const results = [];
    for (const plan of active) results.push(await this.recalculatePmPlanSchedule(user, plan.id).catch((error) => ({ planId: plan.id, error: error instanceof Error ? error.message : 'Scheduler failed' })));
    return { processed: active.length, results };
  }

  async pmRecordRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.pmRecordRows(user, query);
    return { rows, summary: this.pmRecordSummary(rows), lastUpdated: new Date().toISOString() };
  }

  async createPmRecord(user: RequestUser, body: Record<string, any>) {
    const planId = body.planId ?? body.plan_id;
    const plan = planId ? await this.getPmPlan(user, planId) : null;
    const equipmentId = body.equipmentId ?? body.equipment_id ?? plan?.equipment_id;
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const recordNumber = body.recordNumber ?? body.record_number ?? await this.nextMiSequence('mi_pm_records', 'record_number', 'MI-PMR', shadow.site_id ?? shadow.siteId ?? user.selectedSiteId ?? 'SITE', shadow.company_id ?? this.companyScope(user));
    const row = await this.db.single<any>(this.db.from('mi_pm_records').insert({
      company_id: shadow.company_id ?? this.companyScope(user),
      site_id: shadow.site_id ?? shadow.siteId ?? user.selectedSiteId,
      equipment_id: shadow.id,
      plan_id: plan?.id ?? null,
      occurrence_id: body.occurrenceId ?? body.occurrence_id ?? null,
      record_number: recordNumber,
      planned: body.planned ?? !!plan,
      unplanned_reason: body.unplannedReason ?? body.unplanned_reason ?? null,
      result: body.result ?? null,
      pm_date: body.pmDate ?? body.pm_date ?? new Date().toISOString().slice(0, 10),
      technician_user_id: body.technicianUserId ?? body.technician_user_id ?? null,
      technician_name: body.technicianName ?? body.technician_name ?? null,
      vendor_name: body.vendorName ?? body.vendor_name ?? plan?.vendor_name ?? null,
      reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? null,
      shutdown_required: !!(body.shutdownRequired ?? body.shutdown_required ?? plan?.required_shutdown),
      ptw_id: body.ptwId ?? body.ptw_id ?? null,
      loto_id: body.lotoId ?? body.loto_id ?? null,
      procedure_document_id: body.procedureDocumentId ?? body.procedure_document_id ?? plan?.procedure_document_id ?? null,
      notes: body.notes ?? null,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.seedPmRecordChecklist(row, plan?.id);
    await this.addMiHistory(user, row.equipment_id, 'PM_RECORD_CREATED', 'Preventive maintenance record created', row.record_number, null, row, 'PM Record', row.id);
    return this.pmRecordDetail(user, row.id);
  }

  async pmRecordDetail(user: RequestUser, recordId: string) {
    const record = await this.getPmRecord(user, recordId);
    const checklist = await this.db.many<any>(this.db.from('mi_pm_record_checklist_items').select('*').eq('pm_record_id', recordId).order('sort_order', { ascending: true })).catch(() => []);
    const findings = await this.db.many<any>(this.db.from('mi_pm_record_findings').select('*').eq('pm_record_id', recordId).order('created_at', { ascending: false })).catch(() => []);
    return { record, checklist, findings, actions: this.recordActions(user, record, 'pm_record') };
  }

  async updatePmRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const before = await this.getPmRecord(user, recordId);
    this.assertEditableRecord(before, 'PM record');
    const row = await this.db.single<any>(this.db.from('mi_pm_records').update(this.pmRecordPayload(body, user.id)).eq('id', recordId).select().single());
    if (Array.isArray(body.checklistItems ?? body.checklist_items)) await this.replacePmRecordChecklist(row, body.checklistItems ?? body.checklist_items);
    await this.addMiHistory(user, before.equipment_id, 'PM_RECORD_UPDATED', 'Preventive maintenance record updated', body.reason ?? row.record_number, before, row, 'PM Record', recordId);
    return this.pmRecordDetail(user, recordId);
  }

  async submitPmRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    return this.transitionPmRecord(user, recordId, { status: 'Submitted', review_status: 'Submitted', submitted_by: user.id, submitted_at: new Date().toISOString() }, 'PM_RECORD_SUBMITTED', 'Preventive maintenance record submitted', body.comment);
  }

  async approvePmRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const before = await this.getPmRecord(user, recordId);
    const row = await this.db.single<any>(this.db.from('mi_pm_records').update({ status: 'Approved', review_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), result: before.result ?? 'Completed', updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', recordId).select().single());
    await this.closePmOccurrence(row, user.id);
    await this.updateScheduleSummary(row.equipment_id, { last_pm_date: row.pm_date });
    if (row.plan_id) await this.recalculatePmPlanSchedule(user, row.plan_id).catch(() => null);
    await this.addMiHistory(user, row.equipment_id, 'PM_RECORD_APPROVED', 'Preventive maintenance record approved', body.comment ?? row.record_number, before, row, 'PM Record', recordId);
    return this.pmRecordDetail(user, recordId);
  }

  async rejectPmRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required.');
    return this.transitionPmRecord(user, recordId, { status: 'Rejected', review_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: reason }, 'PM_RECORD_REJECTED', 'Preventive maintenance record rejected', reason);
  }

  async returnPmRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Return reason is required.');
    return this.transitionPmRecord(user, recordId, { status: 'Draft', review_status: 'Returned', returned_by: user.id, returned_at: new Date().toISOString(), return_reason: reason }, 'PM_RECORD_RETURNED', 'Preventive maintenance record returned for correction', reason);
  }

  async equipmentPm(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    return this.pmPlanRegistry(user, { ...query, equipmentId });
  }

  async equipmentPmRecords(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    return this.pmRecordRegistry(user, { ...query, equipmentId });
  }

  pmImportTemplate(_user: RequestUser) {
    return Promise.resolve({ fileName: 'mi-preventive-maintenance-import-template.csv', content: this.csv([{ equipment_tag: '', plan_title: '', pm_category: '', pm_task_type: '', frequency_value: '', frequency_unit: 'Months', responsible_user_id: '', priority: 'Normal', checklist_items: '', notes: '' }], ['equipment_tag', 'plan_title', 'pm_category', 'pm_task_type', 'frequency_value', 'frequency_unit', 'responsible_user_id', 'priority', 'checklist_items', 'notes']) });
  }

  async importPm(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const job = await this.db.single<any>(this.db.from('mi_pm_calibration_import_jobs').insert({ company_id: this.companyScope(user), site_id: body.siteId ?? user.selectedSiteId ?? null, import_type: 'Preventive Maintenance', file_name: body.fileName ?? 'pm-import.csv', total_rows: rows.length, status: 'Uploaded', uploaded_by: user.id }).select().single());
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      await this.db.single(this.db.from('mi_pm_calibration_import_rows').insert({ company_id: job.company_id, site_id: job.site_id, job_id: job.id, row_number: index + 1, raw_data_json: row, normalized_data_json: row, validation_status: row.plan_title || row.planTitle ? 'Valid' : 'Invalid', validation_errors_json: row.plan_title || row.planTitle ? [] : ['plan_title is required'] }).select('id').single()).catch(() => null);
    }
    await this.addGlobalMiHistory(user, 'PM_IMPORT_UPLOADED', 'Preventive maintenance import uploaded', `${rows.length} rows`, job);
    return { jobId: job.id, job, rows: await this.db.many<any>(this.db.from('mi_pm_calibration_import_rows').select('*').eq('job_id', job.id)).catch(() => []) };
  }

  async exportPm(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.pmPlanRows(user, query);
    return { fileName: 'mi-preventive-maintenance-plans.csv', content: this.csv(rows.map((row) => this.decoratePmPlan(row)), ['planNumber', 'planTitle', 'equipmentTag', 'pmTaskType', 'status', 'approvalStatus', 'nextDueDate', 'dueStatus', 'revisionNumber']) };
  }

  async exportPmRecord(user: RequestUser, recordId: string) {
    const detail = await this.pmRecordDetail(user, recordId);
    return { fileName: `${detail.record.record_number}.csv`, content: this.csv([detail.record], ['record_number', 'pm_date', 'status', 'review_status', 'result', 'technician_name', 'equipment_id']) };
  }

  async calibrationDashboard(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const plans = await this.calibrationPlanRows(user, query);
    const records = await this.calibrationRecordRows(user, query);
    const due = await this.calibrationDue(user, query);
    return {
      header: { title: 'Calibration / Testing', subtitle: 'Instrument calibration plans, tolerance evaluations, certificates, due and failed calibrations', lastUpdated: new Date().toISOString() },
      summary: this.calibrationSummary(plans, records, due.rows),
      plans: plans.slice(0, 25),
      due: due.rows.slice(0, 25),
      overdue: due.rows.filter((item: any) => item.dueStatus === 'Overdue').slice(0, 25),
      failed: records.filter((item) => /fail|out of tolerance/i.test(String(item.result ?? item.as_left_result ?? item.as_found_result ?? ''))).slice(0, 25),
      records: records.slice(0, 25),
      charts: {
        byStatus: this.distribution(plans, (item) => item.status ?? 'Unknown'),
        byDueStatus: this.distribution(due.rows, (item) => item.dueStatus ?? 'Unknown'),
        byResult: this.distribution(records, (item) => item.result ?? 'Not Completed')
      }
    };
  }

  async calibrationPlanRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.calibrationPlanRows(user, query);
    return { rows: rows.map((row) => this.decorateCalibrationPlan(row)), summary: this.calibrationSummary(rows, await this.calibrationRecordRows(user, query), rows), lastUpdated: new Date().toISOString() };
  }

  async createCalibrationPlan(user: RequestUser, body: Record<string, any>) {
    if (!(body.planTitle ?? body.plan_title)?.trim()) throw new BadRequestException('Calibration plan title is required.');
    if (!(body.instrumentType ?? body.instrument_type)?.trim()) throw new BadRequestException('Instrument type is required.');
    if (!(body.calibrationType ?? body.calibration_type)?.trim()) throw new BadRequestException('Calibration type is required.');
    const equipmentId = body.equipmentId ?? body.equipment_id;
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const row = await this.db.single<any>(this.db.from('mi_calibration_plans').insert({
      ...this.calibrationPlanPayload(body, user.id),
      company_id: shadow.company_id ?? this.companyScope(user),
      site_id: shadow.site_id ?? shadow.siteId ?? user.selectedSiteId,
      equipment_id: shadow.id,
      plan_number: body.planNumber ?? body.plan_number ?? await this.nextMiSequence('mi_calibration_plans', 'plan_number', 'MI-CAL', shadow.site_id ?? shadow.siteId ?? user.selectedSiteId ?? 'SITE', shadow.company_id ?? this.companyScope(user)),
      plan_title: body.planTitle ?? body.plan_title,
      instrument_type: body.instrumentType ?? body.instrument_type,
      calibration_type: body.calibrationType ?? body.calibration_type,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.upsertCalibrationSchedule(user, row.id, body);
    await this.replaceCalibrationPlanPoints(user, row.id, body.points ?? body.calibrationPoints ?? body.calibration_points ?? []);
    await this.recalculateCalibrationPlanSchedule(user, row.id);
    await this.addMiHistory(user, row.equipment_id, 'CALIBRATION_PLAN_CREATED', 'Calibration plan created', row.plan_number, null, row, 'Calibration Plan', row.id);
    return this.calibrationPlanDetail(user, row.id);
  }

  async calibrationPlanDetail(user: RequestUser, planId: string) {
    const plan = await this.getCalibrationPlan(user, planId);
    const schedule = await this.db.single<any>(this.db.from('mi_calibration_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const points = await this.db.many<any>(this.db.from('mi_calibration_plan_points').select('*').eq('plan_id', planId).order('sort_order', { ascending: true })).catch(() => []);
    const occurrences = await this.db.many<any>(this.db.from('mi_calibration_occurrences').select('*').eq('plan_id', planId).order('due_date', { ascending: true })).catch(() => []);
    const records = await this.db.many<any>(this.db.from('mi_calibration_records').select('*').eq('plan_id', planId).order('calibration_date', { ascending: false })).catch(() => []);
    return { plan: this.decorateCalibrationPlan(plan), schedule, points, occurrences, records, actions: this.calibrationPlanActions(user, plan) };
  }

  async updateCalibrationPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getCalibrationPlan(user, planId);
    this.assertEditablePlan(before, 'Calibration plan');
    const row = await this.db.single<any>(this.db.from('mi_calibration_plans').update(this.calibrationPlanPayload(body, user.id)).eq('id', planId).select('*, equipment:mi_equipment(*)').single());
    if (body.schedule || body.frequencyValue || body.frequency_value || body.manualOverrideDueDate) await this.upsertCalibrationSchedule(user, planId, body.schedule ?? body);
    if (Array.isArray(body.points ?? body.calibrationPoints ?? body.calibration_points)) await this.replaceCalibrationPlanPoints(user, planId, body.points ?? body.calibrationPoints ?? body.calibration_points);
    await this.recalculateCalibrationPlanSchedule(user, planId).catch(() => null);
    await this.addMiHistory(user, before.equipment_id, 'CALIBRATION_PLAN_UPDATED', 'Calibration plan updated', body.reason ?? row.plan_number, before, row, 'Calibration Plan', planId);
    return this.calibrationPlanDetail(user, planId);
  }

  async submitCalibrationPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    return this.transitionCalibrationPlan(user, planId, { status: 'Pending Approval', approval_status: 'Submitted' }, 'CALIBRATION_PLAN_SUBMITTED', 'Calibration plan submitted', body.comment);
  }

  async approveCalibrationPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const detail = await this.transitionCalibrationPlan(user, planId, { status: 'Active', approval_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), rejected_by: null, rejected_at: null, rejection_reason: null }, 'CALIBRATION_PLAN_APPROVED', 'Calibration plan approved', body.comment);
    await this.recalculateCalibrationPlanSchedule(user, planId).catch(() => null);
    return detail;
  }

  async rejectCalibrationPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required.');
    return this.transitionCalibrationPlan(user, planId, { status: 'Draft', approval_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: reason }, 'CALIBRATION_PLAN_REJECTED', 'Calibration plan rejected', reason);
  }

  async createCalibrationPlanRevision(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getCalibrationPlan(user, planId);
    const copy = { ...before };
    delete copy.id;
    delete copy.equipment;
    const row = await this.db.single<any>(this.db.from('mi_calibration_plans').insert({
      ...copy,
      id: crypto.randomUUID(),
      parent_plan_id: before.id,
      revision_number: Number(before.revision_number ?? 1) + 1,
      status: 'Draft',
      approval_status: 'Not Submitted',
      plan_number: await this.nextMiSequence('mi_calibration_plans', 'plan_number', 'MI-CAL', before.site_id, before.company_id),
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single());
    const schedule = await this.db.single<any>(this.db.from('mi_calibration_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (schedule) await this.db.single(this.db.from('mi_calibration_plan_schedules').insert({ ...schedule, id: crypto.randomUUID(), plan_id: row.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select('id').single()).catch(() => null);
    await this.copyChildRows('mi_calibration_plan_points', 'plan_id', planId, row.id);
    await this.addMiHistory(user, before.equipment_id, 'CALIBRATION_PLAN_REVISION_CREATED', 'Calibration plan revision created', body.reason ?? row.plan_number, before, row, 'Calibration Plan', row.id);
    return this.calibrationPlanDetail(user, row.id);
  }

  async archiveCalibrationPlan(user: RequestUser, planId: string, body: Record<string, any>) {
    const before = await this.getCalibrationPlan(user, planId);
    const row = await this.db.single<any>(this.db.from('mi_calibration_plans').update({ status: 'Archived', archived_by: user.id, archived_at: new Date().toISOString(), archive_reason: body.reason ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select().single());
    await this.addMiHistory(user, before.equipment_id, 'CALIBRATION_PLAN_ARCHIVED', 'Calibration plan archived', body.reason ?? row.plan_number, before, row, 'Calibration Plan', planId);
    return this.calibrationPlanDetail(user, planId);
  }

  async recalculateCalibrationPlanSchedule(user: RequestUser, planId: string) {
    const plan = await this.getCalibrationPlan(user, planId);
    const schedule = await this.db.single<any>(this.db.from('mi_calibration_plan_schedules').select('*').eq('plan_id', planId).maybeSingle()).catch(() => null);
    const nextDue = this.nextPmCalibrationDueDate(schedule?.last_calibration_date ?? plan.effective_date, schedule?.frequency_value, schedule?.frequency_unit, schedule?.manual_override_due_date);
    const dueStatus = this.pmCalibrationDueStatus(nextDue);
    const row = await this.db.single<any>(this.db.from('mi_calibration_plans').update({ current_next_due_date: nextDue, current_due_status: dueStatus, current_scheduler_status: nextDue ? 'Calculated' : 'Missing schedule basis', updated_at: new Date().toISOString() }).eq('id', planId).select().single());
    if (nextDue && ['Active', 'Approved'].includes(String(row.status))) await this.ensureCalibrationOccurrence(user, row, nextDue);
    await this.updateScheduleSummary(row.equipment_id, { calibration_required: true, calibration_frequency_value: schedule?.frequency_value ?? null, calibration_frequency_unit: schedule?.frequency_unit ?? null, last_calibration_date: schedule?.last_calibration_date ?? null, next_calibration_due_date: nextDue });
    await this.addMiHistory(user, row.equipment_id, 'CALIBRATION_SCHEDULE_RECALCULATED', 'Calibration schedule recalculated', dueStatus, plan, row, 'Calibration Plan', planId).catch(() => null);
    return { plan: this.decorateCalibrationPlan(row), schedule, nextDueDate: nextDue, dueStatus };
  }

  async calibrationDue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = (await this.calibrationPlanRows(user, query)).filter((item) => item.current_next_due_date);
    return { rows: rows.map((item) => this.decorateCalibrationPlan(item)).filter((item) => ['Overdue', 'Due Soon', 'Scheduled'].includes(item.dueStatus)), lastUpdated: new Date().toISOString() };
  }

  async calibrationOverdue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const due = await this.calibrationDue(user, query);
    return { rows: due.rows.filter((item: any) => item.dueStatus === 'Overdue'), lastUpdated: due.lastUpdated };
  }

  async calibrationFailed(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.calibrationRecordRows(user, query);
    return { rows: rows.filter((item) => /fail|out of tolerance/i.test(String(item.result ?? item.as_left_result ?? item.as_found_result ?? ''))), lastUpdated: new Date().toISOString() };
  }

  async runCalibrationScheduler(user: RequestUser, body: Record<string, any>) {
    const plans = await this.calibrationPlanRows(user, body);
    const active = plans.filter((plan) => ['Active', 'Approved'].includes(String(plan.status)));
    const results = [];
    for (const plan of active) results.push(await this.recalculateCalibrationPlanSchedule(user, plan.id).catch((error) => ({ planId: plan.id, error: error instanceof Error ? error.message : 'Scheduler failed' })));
    return { processed: active.length, results };
  }

  async calibrationRecordRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.calibrationRecordRows(user, query);
    return { rows, summary: this.calibrationRecordSummary(rows), lastUpdated: new Date().toISOString() };
  }

  async createCalibrationRecord(user: RequestUser, body: Record<string, any>) {
    const planId = body.planId ?? body.plan_id;
    const plan = planId ? await this.getCalibrationPlan(user, planId) : null;
    const equipmentId = body.equipmentId ?? body.equipment_id ?? plan?.equipment_id;
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const recordNumber = body.recordNumber ?? body.record_number ?? await this.nextMiSequence('mi_calibration_records', 'record_number', 'MI-CALR', shadow.site_id ?? shadow.siteId ?? user.selectedSiteId ?? 'SITE', shadow.company_id ?? this.companyScope(user));
    const row = await this.db.single<any>(this.db.from('mi_calibration_records').insert({
      company_id: shadow.company_id ?? this.companyScope(user),
      site_id: shadow.site_id ?? shadow.siteId ?? user.selectedSiteId,
      equipment_id: shadow.id,
      plan_id: plan?.id ?? null,
      occurrence_id: body.occurrenceId ?? body.occurrence_id ?? null,
      record_number: recordNumber,
      planned: body.planned ?? !!plan,
      calibration_date: body.calibrationDate ?? body.calibration_date ?? new Date().toISOString().slice(0, 10),
      technician_user_id: body.technicianUserId ?? body.technician_user_id ?? null,
      technician_name: body.technicianName ?? body.technician_name ?? null,
      vendor_or_lab: body.vendorOrLab ?? body.vendor_or_lab ?? null,
      reference_standard: body.referenceStandard ?? body.reference_standard ?? null,
      environmental_conditions: body.environmentalConditions ?? body.environmental_conditions ?? null,
      notes: body.notes ?? null,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.seedCalibrationRecordPoints(row, plan?.id);
    await this.addMiHistory(user, row.equipment_id, 'CALIBRATION_RECORD_CREATED', 'Calibration record created', row.record_number, null, row, 'Calibration Record', row.id);
    return this.calibrationRecordDetail(user, row.id);
  }

  async calibrationRecordDetail(user: RequestUser, recordId: string) {
    const record = await this.getCalibrationRecord(user, recordId);
    const points = await this.db.many<any>(this.db.from('mi_calibration_record_points').select('*').eq('calibration_record_id', recordId).order('point_number', { ascending: true })).catch(() => []);
    const evaluations = await this.db.many<any>(this.db.from('mi_calibration_evaluations').select('*').eq('calibration_record_id', recordId).order('evaluated_at', { ascending: false })).catch(() => []);
    return { record, points, evaluations, actions: this.recordActions(user, record, 'calibration_record') };
  }

  async updateCalibrationRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const before = await this.getCalibrationRecord(user, recordId);
    this.assertEditableRecord(before, 'Calibration record');
    const row = await this.db.single<any>(this.db.from('mi_calibration_records').update(this.calibrationRecordPayload(body, user.id)).eq('id', recordId).select().single());
    if (Array.isArray(body.points ?? body.readings)) await this.replaceCalibrationRecordPoints(row, body.points ?? body.readings);
    await this.evaluateCalibrationRecord(user, recordId).catch(() => null);
    await this.addMiHistory(user, before.equipment_id, 'CALIBRATION_RECORD_UPDATED', 'Calibration record updated', body.reason ?? row.record_number, before, row, 'Calibration Record', recordId);
    return this.calibrationRecordDetail(user, recordId);
  }

  async evaluateCalibrationRecord(user: RequestUser, recordId: string) {
    const record = await this.getCalibrationRecord(user, recordId);
    const points = await this.db.many<any>(this.db.from('mi_calibration_record_points').select('*').eq('calibration_record_id', recordId)).catch(() => []);
    let asFoundFailed = 0;
    let asLeftFailed = 0;
    const outputs = [];
    for (const point of points) {
      const tolerance = this.calibrationTolerance(point);
      const asFound = this.evaluateCalibrationPoint(point.as_found_output, point.expected_output, tolerance.limit);
      const asLeft = this.evaluateCalibrationPoint(point.as_left_output, point.expected_output, tolerance.limit);
      const patch = {
        as_found_error: asFound.error,
        as_found_pass_fail: asFound.result,
        as_left_error: asLeft.error,
        as_left_pass_fail: asLeft.result,
        tolerance_applied_json: tolerance,
        updated_at: new Date().toISOString()
      };
      await this.db.single(this.db.from('mi_calibration_record_points').update(patch).eq('id', point.id).select('id').single()).catch(() => null);
      if (asFound.result === 'Fail') asFoundFailed += 1;
      if (asLeft.result === 'Fail') asLeftFailed += 1;
      outputs.push({ pointId: point.id, ...patch });
    }
    const asFoundResult = asFoundFailed ? 'Failed As Found' : points.length ? 'Passed As Found' : 'Not Evaluated';
    const asLeftResult = asLeftFailed ? 'Failed As Left' : points.some((point) => this.numberOrNull(point.as_left_output) !== null) ? 'Passed As Left' : null;
    const finalResult = asLeftFailed ? 'Failed As Left' : asFoundFailed && asLeftResult === 'Passed As Left' ? 'Passed After Adjustment' : asFoundFailed ? 'Failed As Found' : points.length ? 'Passed' : 'Not Evaluated';
    const evaluation = await this.db.single<any>(this.db.from('mi_calibration_evaluations').insert({ company_id: record.company_id, site_id: record.site_id, equipment_id: record.equipment_id, calibration_record_id: record.id, plan_id: record.plan_id, official: false, as_found_result: asFoundResult, as_left_result: asLeftResult, final_result: finalResult, failed_point_count: asFoundFailed + asLeftFailed, out_of_tolerance_as_found: asFoundFailed > 0, out_of_tolerance_as_left: asLeftFailed > 0, certificate_status: record.calibration_certificate_document_id ? 'Certificate Linked' : 'Certificate Missing', readiness_impact: /fail/i.test(finalResult) ? 'Blocks equipment readiness until reviewed' : 'No readiness blocker', calculation_inputs_json: points, calculation_outputs_json: outputs, evaluated_by: user.id }).select().single());
    const row = await this.db.single<any>(this.db.from('mi_calibration_records').update({ result: finalResult, as_found_result: asFoundResult, as_left_result: asLeftResult, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', recordId).select().single());
    await this.addMiHistory(user, record.equipment_id, 'CALIBRATION_EVALUATED', 'Calibration tolerance evaluated', finalResult, record, { row, evaluation }, 'Calibration Record', recordId);
    return this.calibrationRecordDetail(user, recordId);
  }

  async submitCalibrationRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    return this.transitionCalibrationRecord(user, recordId, { status: 'Submitted', review_status: 'Submitted', submitted_by: user.id, submitted_at: new Date().toISOString() }, 'CALIBRATION_RECORD_SUBMITTED', 'Calibration record submitted', body.comment);
  }

  async approveCalibrationRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    await this.evaluateCalibrationRecord(user, recordId).catch(() => null);
    const before = await this.getCalibrationRecord(user, recordId);
    const row = await this.db.single<any>(this.db.from('mi_calibration_records').update({ status: 'Approved', review_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', recordId).select().single());
    await this.db.single(this.db.from('mi_calibration_evaluations').update({ official: false }).eq('calibration_record_id', recordId).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('mi_calibration_evaluations').update({ official: true }).eq('calibration_record_id', recordId).order('evaluated_at', { ascending: false }).limit(1).select('id').single()).catch(() => null);
    await this.closeCalibrationOccurrence(row, user.id);
    await this.updateScheduleSummary(row.equipment_id, { last_calibration_date: row.calibration_date });
    if (row.plan_id) await this.recalculateCalibrationPlanSchedule(user, row.plan_id).catch(() => null);
    await this.addMiHistory(user, row.equipment_id, 'CALIBRATION_RECORD_APPROVED', 'Calibration record approved', body.comment ?? row.record_number, before, row, 'Calibration Record', recordId);
    return this.calibrationRecordDetail(user, recordId);
  }

  async rejectCalibrationRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required.');
    return this.transitionCalibrationRecord(user, recordId, { status: 'Rejected', review_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: reason }, 'CALIBRATION_RECORD_REJECTED', 'Calibration record rejected', reason);
  }

  async returnCalibrationRecord(user: RequestUser, recordId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Return reason is required.');
    return this.transitionCalibrationRecord(user, recordId, { status: 'Draft', review_status: 'Returned', returned_by: user.id, returned_at: new Date().toISOString(), return_reason: reason }, 'CALIBRATION_RECORD_RETURNED', 'Calibration record returned for correction', reason);
  }

  async equipmentCalibration(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    return this.calibrationPlanRegistry(user, { ...query, equipmentId });
  }

  async equipmentCalibrationRecords(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    return this.calibrationRecordRegistry(user, { ...query, equipmentId });
  }

  calibrationImportTemplate(_user: RequestUser) {
    return Promise.resolve({ fileName: 'mi-calibration-import-template.csv', content: this.csv([{ equipment_tag: '', plan_title: '', instrument_type: '', calibration_type: '', measurement_parameter: '', range_lower: '', range_upper: '', range_unit: '', tolerance_type: 'Absolute value', tolerance_value: '', tolerance_percent: '', frequency_value: '', frequency_unit: 'Months' }], ['equipment_tag', 'plan_title', 'instrument_type', 'calibration_type', 'measurement_parameter', 'range_lower', 'range_upper', 'range_unit', 'tolerance_type', 'tolerance_value', 'tolerance_percent', 'frequency_value', 'frequency_unit']) });
  }

  async importCalibration(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const job = await this.db.single<any>(this.db.from('mi_pm_calibration_import_jobs').insert({ company_id: this.companyScope(user), site_id: body.siteId ?? user.selectedSiteId ?? null, import_type: 'Calibration', file_name: body.fileName ?? 'calibration-import.csv', total_rows: rows.length, status: 'Uploaded', uploaded_by: user.id }).select().single());
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      await this.db.single(this.db.from('mi_pm_calibration_import_rows').insert({ company_id: job.company_id, site_id: job.site_id, job_id: job.id, row_number: index + 1, raw_data_json: row, normalized_data_json: row, validation_status: row.plan_title || row.planTitle ? 'Valid' : 'Invalid', validation_errors_json: row.plan_title || row.planTitle ? [] : ['plan_title is required'] }).select('id').single()).catch(() => null);
    }
    await this.addGlobalMiHistory(user, 'CALIBRATION_IMPORT_UPLOADED', 'Calibration import uploaded', `${rows.length} rows`, job);
    return { jobId: job.id, job, rows: await this.db.many<any>(this.db.from('mi_pm_calibration_import_rows').select('*').eq('job_id', job.id)).catch(() => []) };
  }

  async exportCalibration(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.calibrationPlanRows(user, query);
    return { fileName: 'mi-calibration-plans.csv', content: this.csv(rows.map((row) => this.decorateCalibrationPlan(row)), ['planNumber', 'planTitle', 'equipmentTag', 'instrumentType', 'calibrationType', 'status', 'approvalStatus', 'nextDueDate', 'dueStatus', 'revisionNumber']) };
  }

  async exportCalibrationRecord(user: RequestUser, recordId: string) {
    const detail = await this.calibrationRecordDetail(user, recordId);
    return { fileName: `${detail.record.record_number}.csv`, content: this.csv([detail.record], ['record_number', 'calibration_date', 'status', 'review_status', 'result', 'as_found_result', 'as_left_result', 'technician_name', 'equipment_id']) };
  }

  pmCalibrationLookups(_user: RequestUser) {
    return {
      pmCategories: ['Preventive Maintenance', 'Predictive Maintenance', 'Condition Monitoring', 'Lubrication', 'Cleaning', 'Functional Test', 'Proof Test', 'Vendor PM', 'Regulatory PM', 'Other'],
      pmTaskTypes: ['Visual check', 'Lubrication', 'Functional test', 'Proof test', 'Cleaning', 'Replacement', 'Adjustment', 'Inspection', 'Vendor service', 'Other'],
      calibrationTypes: ['Bench calibration', 'Field calibration', 'Loop check', 'Functional test', 'Proof test', 'Bump test', 'Verification only', 'Other'],
      instrumentTypes: ['Pressure transmitter', 'Temperature transmitter', 'Flow transmitter', 'Level transmitter', 'Analyzer', 'Gas detector', 'Control valve', 'Switch', 'Alarm', 'Interlock', 'Other'],
      toleranceTypes: ['Absolute value', 'Percent of span', 'Percent of reading'],
      pmResults: ['Completed', 'Completed with Findings', 'Incomplete', 'Failed', 'Deferred'],
      calibrationResults: ['Passed', 'Passed After Adjustment', 'Failed As Found', 'Failed As Left', 'Not Evaluated']
    };
  }

  async reliefDeviceDashboard(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.reliefDeviceRows(user, query);
    const tests = await this.reliefTestRows(user, query);
    const due = rows.filter((item) => ['Overdue', 'Due Soon', 'Scheduled'].includes(item.dueStatus));
    const overdue = rows.filter((item) => item.dueStatus === 'Overdue');
    const failed = tests.filter((item) => /fail/i.test(String(item.final_result ?? item.finalResult)));
    return {
      header: { title: 'PSV / Relief Device Management', subtitle: 'Relief device registry, protection coverage, testing, certificates, seals, and readiness', lastUpdated: new Date().toISOString() },
      summary: this.reliefSummary(rows, tests),
      rows,
      due,
      overdue,
      failed,
      charts: {
        byStatus: this.distribution(rows, (item) => item.status ?? 'Unknown'),
        byDueStatus: this.distribution(rows, (item) => item.dueStatus ?? item.due_status ?? 'Unknown'),
        byTestResult: this.distribution(tests, (item) => item.final_result ?? 'Not Evaluated')
      }
    };
  }

  async reliefDeviceSummary(user: RequestUser, query: Record<string, string | undefined> = {}) {
    return { summary: this.reliefSummary(await this.reliefDeviceRows(user, query), await this.reliefTestRows(user, query)), lastUpdated: new Date().toISOString() };
  }

  async createReliefDevice(user: RequestUser, body: Record<string, any>) {
    if (!(body.deviceTag ?? body.device_tag)?.trim()) throw new BadRequestException('Relief device tag is required.');
    const protectedEquipmentId = body.protectedEquipmentId ?? body.protected_equipment_id ?? body.equipmentId ?? body.equipment_id;
    let equipment: any = null;
    if (protectedEquipmentId) equipment = await this.get(user, protectedEquipmentId);
    const shadow = equipment ? await this.ensureMiEquipmentShadow(user, equipment) : null;
    const siteId = shadow?.site_id ?? body.siteId ?? body.site_id ?? user.selectedSiteId;
    if (!siteId) throw new BadRequestException('Site is required for a relief device.');
    const row = await this.db.single<any>(this.db.from('mi_relief_devices').insert({
      ...this.reliefDevicePayload(body, user.id),
      company_id: this.companyScope(user),
      site_id: siteId,
      unit_id: shadow?.unit_id ?? body.unitId ?? body.unit_id ?? null,
      area_id: shadow?.area_id ?? body.areaId ?? body.area_id ?? null,
      device_tag: body.deviceTag ?? body.device_tag,
      device_name: body.deviceName ?? body.device_name ?? body.deviceTag ?? body.device_tag,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.upsertReliefTechnicalData(user, row.id, body.technicalData ?? body.technical_data ?? body);
    await this.upsertReliefBasis(user, row.id, body.reliefBasis ?? body.relief_basis ?? body);
    await this.upsertReliefTestRequirement(user, row.id, body.testRequirement ?? body.test_requirement ?? body);
    await this.upsertReliefSeals(user, row.id, body.seals ?? body.seal ?? body);
    if (shadow) await this.linkReliefProtectedEquipment(user, row.id, { equipmentId: shadow.id, relationshipType: body.relationshipType ?? 'Primary protection', primaryProtection: true }).catch(() => null);
    await this.recalculateReliefSchedule(user, row.id).catch(() => null);
    await this.updateReliefReadinessSummary(user, row.id).catch(() => null);
    await this.addReliefHistory(user, row.id, shadow?.id ?? null, 'RELIEF_DEVICE_CREATED', 'Relief device created', row.device_tag, null, row);
    return this.reliefDeviceDetail(user, row.id);
  }

  async reliefDeviceDetail(user: RequestUser, reliefDeviceId: string) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const technicalData = await this.reliefTechnicalData(user, reliefDeviceId);
    const basis = await this.reliefBasis(user, reliefDeviceId);
    const testRequirement = await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    const seals = await this.reliefSeals(user, reliefDeviceId);
    const protectedEquipment = await this.reliefProtectedEquipment(user, reliefDeviceId);
    const tests = await this.reliefDeviceTestHistory(user, reliefDeviceId);
    const certificates = await this.reliefCertificates(user, reliefDeviceId);
    const occurrences = await this.reliefOccurrences(user, reliefDeviceId);
    const history = await this.db.many<any>(this.db.from('mi_relief_device_history_events').select('*').eq('relief_device_id', reliefDeviceId).order('created_at', { ascending: false }).limit(100)).catch(() => []);
    return { device: this.decorateReliefDevice(device), technicalData, basis, testRequirement, seals, protectedEquipment, tests: tests.rows, certificates, occurrences, history, actions: this.reliefDeviceActions(user, device) };
  }

  async updateReliefDevice(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const before = await this.getReliefDevice(user, reliefDeviceId);
    this.assertEditableReliefDevice(before);
    const pressureChanged = body.setPressure !== undefined || body.set_pressure !== undefined || body.ratedCapacity !== undefined || body.rated_capacity !== undefined || body.serviceFluid !== undefined || body.service_fluid !== undefined;
    const row = await this.db.single<any>(this.db.from('mi_relief_devices').update(this.reliefDevicePayload(body, user.id)).eq('id', reliefDeviceId).select().single());
    if (body.technicalData || body.setPressure !== undefined || body.set_pressure !== undefined) await this.upsertReliefTechnicalData(user, reliefDeviceId, body.technicalData ?? body);
    if (body.reliefBasis || body.governingScenario !== undefined || body.governing_scenario !== undefined) await this.upsertReliefBasis(user, reliefDeviceId, body.reliefBasis ?? body);
    if (body.testRequirement || body.frequencyValue !== undefined || body.frequency_value !== undefined) await this.upsertReliefTestRequirement(user, reliefDeviceId, body.testRequirement ?? body);
    if (body.seals || body.sealStatus !== undefined || body.seal_status !== undefined) await this.upsertReliefSeals(user, reliefDeviceId, body.seals ?? body);
    await this.recalculateReliefSchedule(user, reliefDeviceId).catch(() => null);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_DEVICE_UPDATED', 'Relief device updated', body.reason ?? row.device_tag, before, row);
    if (pressureChanged) await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_MOC_SUGGESTED', 'MOC suggested for relief device basis change', 'Set pressure, capacity, or service changed.', before, row);
    return this.reliefDeviceDetail(user, reliefDeviceId);
  }

  async archiveReliefDevice(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const before = await this.getReliefDevice(user, reliefDeviceId);
    const reason = body.reason ?? body.archiveReason;
    if (!reason) throw new BadRequestException('Archive reason is required.');
    const row = await this.db.single<any>(this.db.from('mi_relief_devices').update({ status: 'Archived', archived: true, archived_by: user.id, archived_at: new Date().toISOString(), archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', reliefDeviceId).select().single());
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_DEVICE_ARCHIVED', 'Relief device archived', reason, before, row);
    return this.reliefDeviceDetail(user, reliefDeviceId);
  }

  async reactivateReliefDevice(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const before = await this.getReliefDevice(user, reliefDeviceId);
    const row = await this.db.single<any>(this.db.from('mi_relief_devices').update({ status: 'Active', archived: false, archived_by: null, archived_at: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', reliefDeviceId).select().single());
    await this.recalculateReliefSchedule(user, reliefDeviceId).catch(() => null);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_DEVICE_REACTIVATED', 'Relief device reactivated', body.reason ?? null, before, row);
    return this.reliefDeviceDetail(user, reliefDeviceId);
  }

  async reliefTechnicalData(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    return this.db.single<any>(this.db.from('mi_relief_device_technical_data').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
  }

  async updateReliefTechnicalData(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const before = await this.reliefTechnicalData(user, reliefDeviceId);
    const row = await this.upsertReliefTechnicalData(user, reliefDeviceId, body);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_TECHNICAL_DATA_UPDATED', 'Relief technical data updated', body.reason ?? null, before, row);
    return row;
  }

  async reliefBasis(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    return this.db.single<any>(this.db.from('mi_relief_device_basis').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
  }

  async updateReliefBasis(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const before = await this.reliefBasis(user, reliefDeviceId);
    const row = await this.upsertReliefBasis(user, reliefDeviceId, body);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_BASIS_UPDATED', 'Relief basis updated', body.reason ?? null, before, row);
    return row;
  }

  async reliefProtectedEquipment(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    return this.db.many<any>(this.db.from('mi_relief_device_protected_equipment').select('*, equipment:mi_equipment(*)').eq('relief_device_id', reliefDeviceId).order('created_at', { ascending: true })).catch(() => []);
  }

  async linkReliefProtectedEquipment(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    this.assertEditableReliefDevice(device);
    const equipmentId = body.equipmentId ?? body.equipment_id;
    if (!equipmentId) throw new BadRequestException('Protected equipment is required.');
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    if (shadow.company_id !== device.company_id || shadow.site_id !== device.site_id) throw new BadRequestException('Protected equipment must be in the same company and site as the relief device.');
    const row = await this.db.single<any>(this.db.from('mi_relief_device_protected_equipment').insert({
      company_id: device.company_id,
      site_id: device.site_id,
      relief_device_id: reliefDeviceId,
      equipment_id: shadow.id,
      protected_equipment_tag: shadow.equipment_tag ?? equipment.tag ?? null,
      protected_equipment_type: shadow.equipment_type_key ?? equipment.equipmentTypeKey ?? null,
      protected_equipment_mawp: this.numberOrNull(body.mawp ?? body.protectedEquipmentMawp),
      protected_equipment_design_pressure: this.numberOrNull(body.designPressure ?? body.protectedEquipmentDesignPressure),
      protected_equipment_design_temperature: this.numberOrNull(body.designTemperature),
      service_fluid: body.serviceFluid ?? body.service_fluid ?? shadow.service_fluid ?? null,
      service_status: body.serviceStatus ?? body.service_status ?? shadow.status ?? null,
      criticality: shadow.criticality ?? null,
      relationship_type: body.relationshipType ?? body.relationship_type ?? 'Primary protection',
      primary_protection: body.primaryProtection ?? body.primary_protection ?? true,
      backup_protection: body.backupProtection ?? body.backup_protection ?? false,
      shared_header: body.sharedHeader ?? body.shared_header ?? false,
      multiple_equipment_protected: body.multipleEquipmentProtected ?? body.multiple_equipment_protected ?? false,
      relief_path_description: body.reliefPathDescription ?? body.relief_path_description ?? null,
      upstream_isolation: body.upstreamIsolation ?? body.upstream_isolation ?? null,
      downstream_isolation: body.downstreamIsolation ?? body.downstream_isolation ?? null,
      car_seal_required: body.carSealRequired ?? body.car_seal_required ?? false,
      snapshot_json: shadow,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.db.single<any>(this.db.from('mi_relief_devices').update({ protected_equipment_count: (await this.reliefProtectedEquipment(user, reliefDeviceId)).length + 1, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', reliefDeviceId).select('id').single()).catch(() => null);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, shadow.id, 'RELIEF_PROTECTED_EQUIPMENT_LINKED', 'Protected equipment linked', shadow.equipment_tag ?? equipment.tag, null, row, 'Protected Equipment', row.id);
    return row;
  }

  async unlinkReliefProtectedEquipment(user: RequestUser, reliefDeviceId: string, linkId: string) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    this.assertEditableReliefDevice(device);
    const before = await this.db.single<any>(this.db.from('mi_relief_device_protected_equipment').select('*').eq('relief_device_id', reliefDeviceId).eq('id', linkId).maybeSingle());
    if (!before) throw new BadRequestException('Protected equipment link was not found.');
    await this.db.single<any>(this.db.from('mi_relief_device_protected_equipment').delete().eq('id', linkId).select('id').single());
    const links = await this.reliefProtectedEquipment(user, reliefDeviceId);
    await this.db.single<any>(this.db.from('mi_relief_devices').update({ protected_equipment_count: links.length, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', reliefDeviceId).select('id').single()).catch(() => null);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, before.equipment_id, 'RELIEF_PROTECTED_EQUIPMENT_UNLINKED', 'Protected equipment unlinked', before.protected_equipment_tag, before, null, 'Protected Equipment', linkId);
    return { deleted: true, id: linkId };
  }

  async reliefSeals(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    return this.db.single<any>(this.db.from('mi_relief_device_seals').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
  }

  async updateReliefSeals(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const before = await this.reliefSeals(user, reliefDeviceId);
    const row = await this.upsertReliefSeals(user, reliefDeviceId, body);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_SEAL_UPDATED', 'Seal / lock / car-seal data updated', body.reason ?? null, before, row);
    return row;
  }

  async changeReliefSealStatus(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    return this.updateReliefSeals(user, reliefDeviceId, { ...body, sealStatus: body.sealStatus ?? body.status, carSealStatus: body.carSealStatus, lockStatus: body.lockStatus });
  }

  async reliefCertificates(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    return this.db.many<any>(this.db.from('mi_relief_device_certificates').select('*').eq('relief_device_id', reliefDeviceId).order('created_at', { ascending: false })).catch(() => []);
  }

  async addReliefCertificate(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const row = await this.db.single<any>(this.db.from('mi_relief_device_certificates').insert({
      company_id: device.company_id,
      site_id: device.site_id,
      relief_device_id: reliefDeviceId,
      test_id: body.testId ?? body.test_id ?? null,
      document_id: body.documentId ?? body.document_id ?? null,
      file_id: body.fileId ?? body.file_id ?? null,
      certificate_type: body.certificateType ?? body.certificate_type ?? 'Test certificate',
      certificate_number: body.certificateNumber ?? body.certificate_number ?? null,
      issued_by: body.issuedBy ?? body.issued_by ?? null,
      issued_at: body.issuedAt ?? body.issued_at ?? null,
      expiry_date: body.expiryDate ?? body.expiry_date ?? null,
      status: body.status ?? 'Linked',
      title: body.title ?? body.certificateNumber ?? body.certificate_number ?? 'Relief device certificate',
      document_snapshot_json: body.documentSnapshot ?? body.document_snapshot_json ?? {},
      linked_by: user.id
    }).select().single());
    await this.db.single<any>(this.db.from('mi_relief_devices').update({ certificate_status: row.status ?? 'Linked', updated_at: new Date().toISOString() }).eq('id', reliefDeviceId).select('id').single()).catch(() => null);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_CERTIFICATE_LINKED', 'Relief certificate linked', row.certificate_number ?? row.title, null, row, 'Certificate', row.id);
    return row;
  }

  async deleteReliefCertificate(user: RequestUser, reliefDeviceId: string, certificateId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    const before = await this.db.single<any>(this.db.from('mi_relief_device_certificates').select('*').eq('relief_device_id', reliefDeviceId).eq('id', certificateId).maybeSingle());
    if (!before) throw new BadRequestException('Certificate was not found.');
    await this.db.single<any>(this.db.from('mi_relief_device_certificates').delete().eq('id', certificateId).select('id').single());
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_CERTIFICATE_UNLINKED', 'Relief certificate unlinked', before.certificate_number ?? before.title, before, null, 'Certificate', certificateId);
    return { deleted: true, id: certificateId };
  }

  async reliefDeviceTestHistory(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    const rows = await this.reliefTestRows(user, { reliefDeviceId });
    return { rows, summary: this.reliefTestSummary(rows), lastUpdated: new Date().toISOString() };
  }

  async reliefOccurrences(user: RequestUser, reliefDeviceId: string) {
    await this.getReliefDevice(user, reliefDeviceId);
    return this.db.many<any>(this.db.from('mi_relief_device_occurrences').select('*').eq('relief_device_id', reliefDeviceId).order('due_date', { ascending: true })).catch(() => []);
  }

  async recalculateReliefSchedule(user: RequestUser, reliefDeviceId: string) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const requirement = await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    const nextDue = this.nextReliefDueDate(requirement?.last_test_date ?? device.last_test_date ?? device.commissioning_date, requirement?.frequency_value, requirement?.frequency_unit, requirement?.manual_override_due_date);
    const dueStatus = this.reliefDueStatus(nextDue);
    const requirementPatch = { next_test_due_date: nextDue, due_status: dueStatus, updated_at: new Date().toISOString() };
    if (requirement) await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').update(requirementPatch).eq('id', requirement.id).select('id').single()).catch(() => null);
    const row = await this.db.single<any>(this.db.from('mi_relief_devices').update({ next_test_due_date: nextDue, due_status: dueStatus, updated_at: new Date().toISOString() }).eq('id', reliefDeviceId).select().single());
    if (nextDue && !row.archived && !['Archived', 'Decommissioned'].includes(String(row.status))) await this.ensureReliefOccurrence(user, row, nextDue).catch(() => null);
    await this.updateReliefReadinessSummary(user, reliefDeviceId).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, null, 'RELIEF_SCHEDULE_RECALCULATED', 'Relief test schedule recalculated', dueStatus, device, row).catch(() => null);
    return { device: this.decorateReliefDevice(row), testRequirement: { ...(requirement ?? {}), ...requirementPatch }, nextDueDate: nextDue, dueStatus };
  }

  async runReliefScheduler(user: RequestUser, body: Record<string, any>) {
    const rows = await this.reliefDeviceRows(user, body);
    const active = rows.filter((item) => !item.archived && !['Archived', 'Decommissioned'].includes(String(item.status)));
    const results = [];
    for (const device of active) results.push(await this.recalculateReliefSchedule(user, device.id).catch((error) => ({ reliefDeviceId: device.id, error: error instanceof Error ? error.message : 'Scheduler failed' })));
    return { processed: active.length, results };
  }

  async createReliefTestFromOccurrence(user: RequestUser, occurrenceId: string, body: Record<string, any>) {
    const occurrence = await this.db.single<any>(this.applyReliefScope(this.db.from('mi_relief_device_occurrences').select('*').eq('id', occurrenceId), user, {}).maybeSingle());
    if (!occurrence) throw new BadRequestException('Relief occurrence was not found.');
    return this.createReliefTest(user, { ...body, reliefDeviceId: occurrence.relief_device_id, occurrenceId, planned: true, testDate: occurrence.due_date });
  }

  async completeReliefOccurrence(user: RequestUser, occurrenceId: string, body: Record<string, any>) {
    const occurrence = await this.db.single<any>(this.applyReliefScope(this.db.from('mi_relief_device_occurrences').select('*').eq('id', occurrenceId), user, {}).maybeSingle());
    if (!occurrence) throw new BadRequestException('Relief occurrence was not found.');
    const row = await this.db.single<any>(this.db.from('mi_relief_device_occurrences').update({ status: 'Completed', completed_test_id: body.testId ?? body.test_id ?? null, completed_at: new Date().toISOString(), completed_by: user.id, updated_at: new Date().toISOString() }).eq('id', occurrenceId).select().single());
    await this.addReliefHistory(user, occurrence.relief_device_id, occurrence.equipment_id, 'RELIEF_OCCURRENCE_COMPLETED', 'Relief occurrence completed', row.occurrence_number, occurrence, row, 'Relief Occurrence', row.id);
    return row;
  }

  async reliefDevicesDue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = (await this.reliefDeviceRows(user, query)).filter((item) => ['Overdue', 'Due Soon', 'Scheduled'].includes(item.dueStatus));
    return { rows, lastUpdated: new Date().toISOString() };
  }

  async reliefDevicesOverdue(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const due = await this.reliefDevicesDue(user, query);
    return { rows: due.rows.filter((item: any) => item.dueStatus === 'Overdue'), lastUpdated: due.lastUpdated };
  }

  async reliefDevicesFailed(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const tests = await this.reliefTestRows(user, query);
    return { rows: tests.filter((item) => /fail/i.test(String(item.final_result ?? item.finalResult))), lastUpdated: new Date().toISOString() };
  }

  async reliefTestRegistry(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.reliefTestRows(user, query);
    return { rows: rows.map((row) => this.decorateReliefTest(row)), summary: this.reliefTestSummary(rows), lastUpdated: new Date().toISOString() };
  }

  async createReliefTest(user: RequestUser, body: Record<string, any>) {
    const reliefDeviceId = body.reliefDeviceId ?? body.relief_device_id;
    if (!reliefDeviceId) throw new BadRequestException('Relief device is required.');
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const number = body.testRecordNumber ?? body.test_record_number ?? await this.nextMiSequence('mi_relief_device_tests', 'test_record_number', 'MI-PSVT', device.site_id, device.company_id);
    const row = await this.db.single<any>(this.db.from('mi_relief_device_tests').insert({
      ...this.reliefTestPayload(body, user.id),
      company_id: device.company_id,
      site_id: device.site_id,
      relief_device_id: reliefDeviceId,
      protected_equipment_id: body.protectedEquipmentId ?? body.protected_equipment_id ?? null,
      occurrence_id: body.occurrenceId ?? body.occurrence_id ?? null,
      test_record_number: number,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.upsertReliefTestResult(user, row.id, body.results ?? body.result ?? body);
    await this.upsertReliefLeakTest(user, row.id, body.leakTest ?? body.leak_test ?? body);
    await this.evaluateReliefTest(user, row.id).catch(() => null);
    await this.addReliefHistory(user, reliefDeviceId, row.protected_equipment_id, 'RELIEF_TEST_CREATED', 'Relief device test created', row.test_record_number, null, row, 'Relief Test', row.id);
    return this.reliefTestDetail(user, row.id);
  }

  async reliefTestDetail(user: RequestUser, testId: string) {
    const test = await this.getReliefTest(user, testId);
    const result = await this.db.single<any>(this.db.from('mi_relief_device_test_results').select('*').eq('test_id', testId).maybeSingle()).catch(() => null);
    const leakTest = await this.db.single<any>(this.db.from('mi_relief_device_leak_tests').select('*').eq('test_id', testId).maybeSingle()).catch(() => null);
    const certificates = await this.db.many<any>(this.db.from('mi_relief_device_certificates').select('*').eq('test_id', testId).order('created_at', { ascending: false })).catch(() => []);
    return { test: this.decorateReliefTest(test), result, leakTest, certificates, actions: this.reliefTestActions(user, test) };
  }

  async updateReliefTest(user: RequestUser, testId: string, body: Record<string, any>) {
    const before = await this.getReliefTest(user, testId);
    this.assertEditableReliefTest(before);
    const row = await this.db.single<any>(this.db.from('mi_relief_device_tests').update(this.reliefTestPayload(body, user.id)).eq('id', testId).select().single());
    if (body.results || body.result || body.asFoundPopPressure !== undefined || body.as_found_pop_pressure !== undefined) await this.upsertReliefTestResult(user, testId, body.results ?? body.result ?? body);
    if (body.leakTest || body.leak_test || body.leakTestPerformed !== undefined || body.leak_test_performed !== undefined) await this.upsertReliefLeakTest(user, testId, body.leakTest ?? body.leak_test ?? body);
    await this.evaluateReliefTest(user, testId).catch(() => null);
    await this.addReliefHistory(user, before.relief_device_id, before.protected_equipment_id, 'RELIEF_TEST_UPDATED', 'Relief test updated', body.reason ?? row.test_record_number, before, row, 'Relief Test', testId);
    return this.reliefTestDetail(user, testId);
  }

  async evaluateReliefTest(user: RequestUser, testId: string) {
    const test = await this.getReliefTest(user, testId);
    const result = await this.db.single<any>(this.db.from('mi_relief_device_test_results').select('*').eq('test_id', testId).maybeSingle()).catch(() => null);
    const leak = await this.db.single<any>(this.db.from('mi_relief_device_leak_tests').select('*').eq('test_id', testId).maybeSingle()).catch(() => null);
    const technical = await this.db.single<any>(this.db.from('mi_relief_device_technical_data').select('*').eq('relief_device_id', test.relief_device_id).maybeSingle()).catch(() => null);
    const requirement = await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').select('*').eq('relief_device_id', test.relief_device_id).maybeSingle()).catch(() => null);
    const evaluation = this.evaluateReliefTestCalculations(result, leak, technical, requirement);
    const row = await this.db.single<any>(this.db.from('mi_relief_device_test_results').update(evaluation.resultPatch).eq('id', result?.id).select().single()).catch(() => result);
    await this.db.single<any>(this.db.from('mi_relief_device_tests').update({ final_result: evaluation.finalResult, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select('id').single()).catch(() => null);
    await this.addReliefHistory(user, test.relief_device_id, test.protected_equipment_id, 'RELIEF_TEST_EVALUATED', 'Relief pop/leak test evaluated', evaluation.finalResult, test, { result: row, evaluation }, 'Relief Test', testId).catch(() => null);
    return this.reliefTestDetail(user, testId);
  }

  async submitReliefTest(user: RequestUser, testId: string, body: Record<string, any>) {
    return this.transitionReliefTest(user, testId, { status: 'Submitted', review_status: 'Submitted', submitted_by: user.id, submitted_at: new Date().toISOString() }, 'RELIEF_TEST_SUBMITTED', 'Relief test submitted', body.comment);
  }

  async approveReliefTest(user: RequestUser, testId: string, body: Record<string, any>) {
    const before = await this.getReliefTest(user, testId);
    const detail = await this.evaluateReliefTest(user, testId);
    const finalResult = detail.test.final_result ?? detail.test.finalResult ?? 'Not Evaluated';
    const row = await this.db.single<any>(this.db.from('mi_relief_device_tests').update({ status: 'Approved', review_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), final_result: finalResult, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select().single());
    const failed = /fail/i.test(String(finalResult));
    await this.db.single<any>(this.db.from('mi_relief_devices').update({ last_test_date: row.test_date, last_test_result: finalResult, status: failed ? 'Not Fit for Service' : 'Active', startup_blocked: failed, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', row.relief_device_id).select('id').single()).catch(() => null);
    const requirement = await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').select('*').eq('relief_device_id', row.relief_device_id).maybeSingle()).catch(() => null);
    if (requirement) await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').update({ last_test_date: row.test_date, updated_at: new Date().toISOString() }).eq('id', requirement.id).select('id').single()).catch(() => null);
    await this.completeReliefOccurrence(user, row.occurrence_id, { testId }).catch(() => null);
    await this.recalculateReliefSchedule(user, row.relief_device_id).catch(() => null);
    await this.updateReliefReadinessSummary(user, row.relief_device_id).catch(() => null);
    await this.addReliefHistory(user, row.relief_device_id, row.protected_equipment_id, failed ? 'RELIEF_TEST_APPROVED_FAILED' : 'RELIEF_TEST_APPROVED', 'Relief test approved', body.comment ?? finalResult, before, row, 'Relief Test', testId);
    return this.reliefTestDetail(user, testId);
  }

  async rejectReliefTest(user: RequestUser, testId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required.');
    return this.transitionReliefTest(user, testId, { status: 'Rejected', review_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: reason }, 'RELIEF_TEST_REJECTED', 'Relief test rejected', reason);
  }

  async returnReliefTest(user: RequestUser, testId: string, body: Record<string, any>) {
    const reason = body.reason ?? body.comment;
    if (!reason) throw new BadRequestException('Return reason is required.');
    return this.transitionReliefTest(user, testId, { status: 'Draft', review_status: 'Returned', returned_by: user.id, returned_at: new Date().toISOString(), return_reason: reason }, 'RELIEF_TEST_RETURNED', 'Relief test returned for correction', reason);
  }

  async reliefTestCertificate(user: RequestUser, testId: string) {
    const test = await this.getReliefTest(user, testId);
    return this.db.many<any>(this.db.from('mi_relief_device_certificates').select('*').eq('test_id', test.id)).catch(() => []);
  }

  async equipmentReliefDevices(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    const links = await this.db.many<any>(this.db.from('mi_relief_device_protected_equipment').select('relief_device_id').eq('equipment_id', shadow.id)).catch(() => []);
    const ids = links.map((item) => item.relief_device_id).filter(Boolean);
    const rows = ids.length ? await this.reliefDeviceRows(user, { ...query, ids: ids.join(',') }) : [];
    return { rows, summary: this.reliefSummary(rows, []), lastUpdated: new Date().toISOString() };
  }

  async equipmentReliefTests(user: RequestUser, equipmentId: string, query: Record<string, string | undefined> = {}) {
    const equipment = await this.get(user, equipmentId);
    const shadow = await this.ensureMiEquipmentShadow(user, equipment);
    return this.reliefTestRegistry(user, { ...query, protectedEquipmentId: shadow.id });
  }

  async equipmentReliefProtectionSummary(user: RequestUser, equipmentId: string) {
    const data = await this.equipmentReliefDevices(user, equipmentId);
    const rows = data.rows;
    return {
      protected: rows.length > 0,
      reliefDeviceCount: rows.length,
      overdueCount: rows.filter((item: any) => item.dueStatus === 'Overdue').length,
      failedCount: rows.filter((item: any) => /fail/i.test(String(item.lastTestResult ?? item.last_test_result))).length,
      startupBlocked: rows.some((item: any) => item.startupBlocked ?? item.startup_blocked),
      readinessStatus: rows.some((item: any) => item.startupBlocked ?? item.startup_blocked) ? 'Blocked' : rows.length ? 'Ready' : 'Missing Protection',
      rows
    };
  }

  reliefDeviceImportTemplate(_user: RequestUser) {
    return Promise.resolve({ fileName: 'mi-relief-device-import-template.csv', content: this.csv([{ device_tag: '', device_name: '', device_type: 'PSV', protected_equipment_tag: '', service_fluid: '', set_pressure: '', set_pressure_unit: 'psig', rated_capacity: '', capacity_unit: '', frequency_value: '', frequency_unit: 'Years', seal_required: '', certificate_required: '' }], ['device_tag', 'device_name', 'device_type', 'protected_equipment_tag', 'service_fluid', 'set_pressure', 'set_pressure_unit', 'rated_capacity', 'capacity_unit', 'frequency_value', 'frequency_unit', 'seal_required', 'certificate_required']) });
  }

  async importReliefDevices(user: RequestUser, body: Record<string, any>) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const job = await this.db.single<any>(this.db.from('mi_relief_device_import_jobs').insert({ company_id: this.companyScope(user), site_id: body.siteId ?? user.selectedSiteId ?? null, file_name: body.fileName ?? 'relief-device-import.csv', total_rows: rows.length, status: 'Uploaded', uploaded_by: user.id }).select().single());
    for (let index = 0; index < rows.length; index += 1) {
      const raw = rows[index];
      const valid = !!(raw.device_tag ?? raw.deviceTag);
      await this.db.single(this.db.from('mi_relief_device_import_rows').insert({ company_id: job.company_id, site_id: job.site_id, job_id: job.id, row_number: index + 1, raw_data_json: raw, normalized_data_json: raw, validation_status: valid ? 'Valid' : 'Invalid', validation_errors_json: valid ? [] : ['device_tag is required'] }).select('id').single()).catch(() => null);
    }
    await this.addGlobalMiHistory(user, 'RELIEF_IMPORT_UPLOADED', 'Relief device import uploaded', `${rows.length} rows`, job);
    return this.reliefDeviceImportJob(user, job.id);
  }

  async reliefDeviceImportJob(user: RequestUser, jobId: string) {
    const job = await this.db.single<any>(this.applyReliefScope(this.db.from('mi_relief_device_import_jobs').select('*').eq('id', jobId), user, {}).maybeSingle());
    if (!job) throw new BadRequestException('Relief device import job was not found.');
    const rows = await this.db.many<any>(this.db.from('mi_relief_device_import_rows').select('*').eq('job_id', jobId).order('row_number', { ascending: true })).catch(() => []);
    return { job, rows };
  }

  async validateReliefDeviceImport(user: RequestUser, jobId: string) {
    return this.reliefDeviceImportJob(user, jobId);
  }

  async commitReliefDeviceImport(user: RequestUser, jobId: string) {
    const detail = await this.reliefDeviceImportJob(user, jobId);
    let committed = 0;
    for (const row of detail.rows.filter((item: any) => item.validation_status === 'Valid' && !item.committed_record_id)) {
      const created = await this.createReliefDevice(user, row.normalized_data_json).catch(() => null);
      if (created?.device?.id) {
        committed += 1;
        await this.db.single(this.db.from('mi_relief_device_import_rows').update({ committed_record_id: created.device.id, updated_at: new Date().toISOString() }).eq('id', row.id).select('id').single()).catch(() => null);
      }
    }
    const job = await this.db.single<any>(this.db.from('mi_relief_device_import_jobs').update({ status: 'Committed', committed_rows: committed, committed_by: user.id, committed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', jobId).select().single());
    await this.addGlobalMiHistory(user, 'RELIEF_IMPORT_COMMITTED', 'Relief device import committed', `${committed} rows`, job);
    return this.reliefDeviceImportJob(user, jobId);
  }

  async reliefDeviceImportErrorReport(user: RequestUser, jobId: string) {
    const detail = await this.reliefDeviceImportJob(user, jobId);
    return { fileName: `mi-relief-device-import-${jobId}-errors.csv`, content: this.csv(detail.rows, ['row_number', 'validation_status', 'validation_errors_json']) };
  }

  async exportReliefDevices(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.reliefDeviceRows(user, query);
    return { fileName: 'mi-relief-devices.csv', content: this.csv(rows, ['deviceTag', 'deviceName', 'deviceType', 'protectedEquipmentCount', 'serviceFluid', 'setPressure', 'ratedCapacity', 'status', 'lastTestDate', 'nextTestDueDate', 'dueStatus', 'lastTestResult', 'certificateStatus', 'sealStatus']) };
  }

  async exportReliefDevice(user: RequestUser, reliefDeviceId: string) {
    const detail = await this.reliefDeviceDetail(user, reliefDeviceId);
    return { fileName: `${detail.device.deviceTag ?? detail.device.device_tag}.csv`, content: this.csv([detail.device], ['deviceTag', 'deviceName', 'deviceType', 'status', 'serviceFluid', 'nextTestDueDate', 'dueStatus', 'readinessStatus']) };
  }

  async exportReliefTest(user: RequestUser, testId: string) {
    const detail = await this.reliefTestDetail(user, testId);
    return { fileName: `${detail.test.test_record_number ?? detail.test.testRecordNumber}.csv`, content: this.csv([detail.test, detail.result, detail.leakTest].filter(Boolean), ['test_record_number', 'test_date', 'status', 'review_status', 'final_result', 'as_found_pop_result', 'as_left_pop_result', 'pass_fail']) };
  }

  reliefLookups(_user: RequestUser) {
    return {
      deviceTypes: ['PSV', 'PRV', 'Safety valve', 'Relief valve', 'Pilot-operated relief valve', 'Rupture disk', 'Breather', 'Vacuum relief', 'Conservation vent', 'Thermal relief', 'Emergency vent', 'Flame arrestor foundation', 'Custom'],
      scenarioTypes: ['Fire case', 'Blocked outlet', 'Cooling water failure', 'Power failure', 'Control valve failure', 'Thermal expansion', 'Tube rupture', 'Runaway reaction', 'Two-phase relief', 'Other'],
      testTypes: ['Shop test', 'Bench test', 'In-place test', 'Pop test', 'Leak test', 'As-found / as-left', 'Repair and retest', 'Other'],
      testResults: ['Passed', 'Passed After Adjustment', 'Failed As Found', 'Failed As Left', 'Failed Leak Test', 'Not Evaluated'],
      seatTightnessStandards: ['API 527', 'ISO 4126', 'Manufacturer standard', 'Company standard', 'Other'],
      sealStatuses: ['Not Required', 'Intact', 'Broken', 'Missing', 'Restored', 'Pending Verification'],
      carSealStatuses: ['Open', 'Closed', 'Car-sealed open', 'Car-sealed closed', 'Missing', 'Not Required']
    };
  }

  private applyReliefScope(request: any, user: RequestUser, query: Record<string, string | undefined> = {}) {
    request = request.eq('company_id', this.companyScope(user));
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? undefined;
    if (siteId) request = request.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    return request;
  }

  private reliefDeviceRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_relief_devices').select('*');
    request = this.applyReliefScope(request, user, query);
    if (query.ids) request = request.in('id', query.ids.split(',').map((item) => item.trim()).filter(Boolean));
    if (query.status) request = request.eq('status', query.status);
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_system_id', query.equipmentId ?? query.equipment_id);
    if (query.q ?? query.search) request = request.or(`device_tag.ilike.%${query.q ?? query.search}%,device_name.ilike.%${query.q ?? query.search}%,service_fluid.ilike.%${query.q ?? query.search}%`);
    return this.db.many<any>(request.order('next_test_due_date', { ascending: true })).then((rows) => rows.map((row) => this.decorateReliefDevice(row))).catch(() => []);
  }

  private reliefTestRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_relief_device_tests').select('*, relief_device:mi_relief_devices(*), protected_equipment:mi_equipment(*)');
    request = this.applyReliefScope(request, user, query);
    if (query.reliefDeviceId ?? query.relief_device_id) request = request.eq('relief_device_id', query.reliefDeviceId ?? query.relief_device_id);
    if (query.protectedEquipmentId ?? query.protected_equipment_id) request = request.eq('protected_equipment_id', query.protectedEquipmentId ?? query.protected_equipment_id);
    if (query.status) request = request.eq('status', query.status);
    return this.db.many<any>(request.order('test_date', { ascending: false })).catch(() => []);
  }

  private async getReliefDevice(user: RequestUser, reliefDeviceId: string) {
    const row = await this.db.single<any>(this.applyReliefScope(this.db.from('mi_relief_devices').select('*').eq('id', reliefDeviceId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Relief device was not found or is outside your company/site access.');
    return row;
  }

  private async getReliefTest(user: RequestUser, testId: string) {
    const row = await this.db.single<any>(this.applyReliefScope(this.db.from('mi_relief_device_tests').select('*, relief_device:mi_relief_devices(*), protected_equipment:mi_equipment(*)').eq('id', testId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Relief test was not found or is outside your company/site access.');
    return row;
  }

  private reliefDevicePayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = { deviceTag: 'device_tag', deviceName: 'device_name', description: 'description', deviceType: 'device_type', deviceCategory: 'device_category', manufacturer: 'manufacturer', model: 'model', serialNumber: 'serial_number', assetNumber: 'asset_number', installationDate: 'installation_date', commissioningDate: 'commissioning_date', status: 'status', ownerDepartment: 'owner_department', custodianUserId: 'custodian_user_id', vendorName: 'vendor_name', buildingLocation: 'building_location', installationLocation: 'installation_location', lineNumber: 'line_number', pAndId: 'p_and_id', isometricDrawing: 'isometric_drawing', installationDrawing: 'installation_drawing', valveStationOrRack: 'valve_station_or_rack', serviceFluid: 'service_fluid', safetyCritical: 'safety_critical', psmCritical: 'psm_critical', activeImpairment: 'active_impairment', startupBlocked: 'startup_blocked', notes: 'notes', unitId: 'unit_id', areaId: 'area_id', equipmentSystemId: 'equipment_system_id' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    return payload;
  }

  private reliefTechnicalPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const numeric = new Set(['set_pressure', 'cold_differential_test_pressure', 'mawp_reference', 'accumulation_percent', 'backpressure', 'superimposed_backpressure', 'built_up_backpressure', 'operating_pressure', 'blowdown', 'rated_capacity', 'required_relieving_capacity', 'effective_area', 'molecular_weight', 'operating_temperature', 'relieving_temperature', 'specific_gravity_or_density', 'compressibility_factor', 'viscosity', 'corrosion_allowance', 'rupture_disk_burst_pressure']);
    const map: Record<string, string> = { setPressure: 'set_pressure', setPressureUnit: 'set_pressure_unit', coldDifferentialTestPressure: 'cold_differential_test_pressure', cdtpUnit: 'cdtp_unit', mawpReference: 'mawp_reference', accumulationPercent: 'accumulation_percent', backpressure: 'backpressure', superimposedBackpressure: 'superimposed_backpressure', builtUpBackpressure: 'built_up_backpressure', operatingPressure: 'operating_pressure', blowdown: 'blowdown', blowdownUnit: 'blowdown_unit', ratedCapacity: 'rated_capacity', requiredRelievingCapacity: 'required_relieving_capacity', capacityUnit: 'capacity_unit', orificeDesignation: 'orifice_designation', effectiveArea: 'effective_area', inletSize: 'inlet_size', outletSize: 'outlet_size', inletRating: 'inlet_rating', outletRating: 'outlet_rating', inletFlange: 'inlet_flange', outletFlange: 'outlet_flange', serviceFluid: 'service_fluid', phase: 'phase', molecularWeight: 'molecular_weight', operatingTemperature: 'operating_temperature', relievingTemperature: 'relieving_temperature', specificGravityOrDensity: 'specific_gravity_or_density', compressibilityFactor: 'compressibility_factor', viscosity: 'viscosity', corrosiveService: 'corrosive_service', toxicService: 'toxic_service', flammableService: 'flammable_service', sourH2sService: 'sour_h2s_service', bodyMaterial: 'body_material', trimMaterial: 'trim_material', springMaterial: 'spring_material', seatMaterial: 'seat_material', gasketMaterial: 'gasket_material', materialSpecification: 'material_specification', corrosionAllowance: 'corrosion_allowance', valveType: 'valve_type', bonnetType: 'bonnet_type', springRange: 'spring_range', seatType: 'seat_type', capType: 'cap_type', liftingLever: 'lifting_lever', balancedBellows: 'balanced_bellows', pilotType: 'pilot_type', ruptureDiskBurstPressure: 'rupture_disk_burst_pressure', ruptureDiskMaterial: 'rupture_disk_material', technicalDataJson: 'technical_data_json' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private reliefBasisPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const numeric = new Set(['required_relieving_rate', 'selected_capacity', 'capacity_margin']);
    const map: Record<string, string> = { scenarioType: 'scenario_type', governingScenario: 'governing_scenario', scenarioDescription: 'scenario_description', reliefBasisDocumentId: 'relief_basis_document_id', calculationReference: 'calculation_reference', requiredRelievingRate: 'required_relieving_rate', selectedCapacity: 'selected_capacity', capacityMargin: 'capacity_margin', fireCase: 'fire_case', blockedOutlet: 'blocked_outlet', coolingWaterFailure: 'cooling_water_failure', powerFailure: 'power_failure', controlValveFailure: 'control_valve_failure', thermalExpansion: 'thermal_expansion', tubeRupture: 'tube_rupture', runawayReaction: 'runaway_reaction', twoPhaseRelief: 'two_phase_relief', disposalDestination: 'disposal_destination', reliefHeader: 'relief_header', lastReviewDate: 'last_review_date', nextReviewDue: 'next_review_due', basisJson: 'basis_json' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private reliefTestRequirementPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const numeric = new Set(['frequency_value', 'pop_pressure_tolerance_value']);
    const map: Record<string, string> = { testRequired: 'test_required', testType: 'test_type', frequencyValue: 'frequency_value', frequencyUnit: 'frequency_unit', lastTestDate: 'last_test_date', nextTestDueDate: 'next_test_due_date', dueStatus: 'due_status', testDueBasis: 'test_due_basis', testProcedureDocumentId: 'test_procedure_document_id', popPressureToleranceType: 'pop_pressure_tolerance_type', popPressureToleranceValue: 'pop_pressure_tolerance_value', popPressureToleranceUnit: 'pop_pressure_tolerance_unit', leakTestRequired: 'leak_test_required', seatTightnessStandard: 'seat_tightness_standard', certificateRequired: 'certificate_required', thirdPartyTestRequired: 'third_party_test_required', testVendor: 'test_vendor', reviewRequired: 'review_required', eSignatureRequired: 'e_signature_required', schedulerActive: 'scheduler_active', manualOverrideDueDate: 'manual_override_due_date', manualOverrideReason: 'manual_override_reason', schedulerNotes: 'scheduler_notes' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private reliefSealPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = { sealRequired: 'seal_required', sealNumber: 'seal_number', sealStatus: 'seal_status', carSealStatus: 'car_seal_status', lockStatus: 'lock_status', upstreamValveStatus: 'upstream_valve_status', downstreamValveStatus: 'downstream_valve_status', sealInstalledBy: 'seal_installed_by', sealInstalledAt: 'seal_installed_at', sealBroken: 'seal_broken', sealBrokenReason: 'seal_broken_reason', sealRestoredAt: 'seal_restored_at', sealInspectionFrequencyValue: 'seal_inspection_frequency_value', sealInspectionFrequencyUnit: 'seal_inspection_frequency_unit', lastSealVerification: 'last_seal_verification', nextSealVerificationDue: 'next_seal_verification_due', notes: 'notes' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = snake === 'seal_inspection_frequency_value' ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = snake === 'seal_inspection_frequency_value' ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private reliefTestPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = { planned: 'planned', unplannedReason: 'unplanned_reason', testDate: 'test_date', testType: 'test_type', testLocation: 'test_location', removedForTest: 'removed_for_test', testedInPlace: 'tested_in_place', testVendor: 'test_vendor', technicianUserId: 'technician_user_id', technicianName: 'technician_name', inspectorUserId: 'inspector_user_id', reviewerUserId: 'reviewer_user_id', procedureDocumentId: 'procedure_document_id', testMedium: 'test_medium', ambientConditions: 'ambient_conditions', status: 'status', reviewStatus: 'review_status', finalResult: 'final_result', notes: 'notes' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    return payload;
  }

  private reliefTestResultPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const numeric = new Set(['nameplate_set_pressure', 'required_set_pressure', 'as_found_pop_pressure', 'as_found_deviation', 'as_found_deviation_percent', 'as_found_tolerance_limit', 'as_left_set_pressure', 'as_left_pop_pressure', 'as_left_deviation', 'as_left_deviation_percent', 'as_left_tolerance_limit', 'final_set_pressure']);
    const map: Record<string, string> = { nameplateSetPressure: 'nameplate_set_pressure', requiredSetPressure: 'required_set_pressure', pressureUnit: 'pressure_unit', asFoundPopPressure: 'as_found_pop_pressure', asFoundDeviation: 'as_found_deviation', asFoundDeviationPercent: 'as_found_deviation_percent', asFoundToleranceLimit: 'as_found_tolerance_limit', asFoundPopResult: 'as_found_pop_result', asFoundLeakResult: 'as_found_leak_result', asFoundSeatCondition: 'as_found_seat_condition', adjustmentRequired: 'adjustment_required', repairRequired: 'repair_required', repairPerformed: 'repair_performed', repairType: 'repair_type', partsReplacedJson: 'parts_replaced_json', springReplaced: 'spring_replaced', seatReplaced: 'seat_replaced', sealReplaced: 'seal_replaced', repairNotes: 'repair_notes', replacementDeviceId: 'replacement_device_id', mocRequired: 'moc_required', linkedMocId: 'linked_moc_id', asLeftSetPressure: 'as_left_set_pressure', asLeftPopPressure: 'as_left_pop_pressure', asLeftDeviation: 'as_left_deviation', asLeftDeviationPercent: 'as_left_deviation_percent', asLeftToleranceLimit: 'as_left_tolerance_limit', asLeftPopResult: 'as_left_pop_result', asLeftLeakResult: 'as_left_leak_result', asLeftSeatCondition: 'as_left_seat_condition', finalSetPressure: 'final_set_pressure', readyForInstallation: 'ready_for_installation', resultCalculationJson: 'result_calculation_json' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private reliefLeakTestPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const numeric = new Set(['test_pressure', 'duration_value', 'observed_leakage']);
    const map: Record<string, string> = { leakTestRequired: 'leak_test_required', leakTestPerformed: 'leak_test_performed', leakTestMethod: 'leak_test_method', testPressure: 'test_pressure', testPressureUnit: 'test_pressure_unit', durationValue: 'duration_value', durationUnit: 'duration_unit', acceptanceCriteria: 'acceptance_criteria', observedLeakage: 'observed_leakage', observedLeakageUnit: 'observed_leakage_unit', seatTightnessResult: 'seat_tightness_result', passFail: 'pass_fail', notes: 'notes' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = numeric.has(snake) ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private async upsertReliefTechnicalData(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const payload = { ...this.reliefTechnicalPayload(body, user.id), company_id: device.company_id, site_id: device.site_id, relief_device_id: reliefDeviceId };
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_technical_data').select('id').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_relief_device_technical_data').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_relief_device_technical_data').insert({ ...payload, created_by: user.id }).select().single());
  }

  private async upsertReliefBasis(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const payload = { ...this.reliefBasisPayload(body, user.id), company_id: device.company_id, site_id: device.site_id, relief_device_id: reliefDeviceId };
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_basis').select('id').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_relief_device_basis').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_relief_device_basis').insert({ ...payload, created_by: user.id }).select().single());
  }

  private async upsertReliefTestRequirement(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const payload = { ...this.reliefTestRequirementPayload(body, user.id), company_id: device.company_id, site_id: device.site_id, relief_device_id: reliefDeviceId };
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').select('id').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_relief_device_test_requirements').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_relief_device_test_requirements').insert({ ...payload, created_by: user.id }).select().single());
  }

  private async upsertReliefSeals(user: RequestUser, reliefDeviceId: string, body: Record<string, any>) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const payload = { ...this.reliefSealPayload(body, user.id), company_id: device.company_id, site_id: device.site_id, relief_device_id: reliefDeviceId };
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_seals').select('id').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_relief_device_seals').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_relief_device_seals').insert({ ...payload, created_by: user.id }).select().single());
  }

  private async upsertReliefTestResult(user: RequestUser, testId: string, body: Record<string, any>) {
    const test = await this.getReliefTest(user, testId);
    const payload = { ...this.reliefTestResultPayload(body, user.id), company_id: test.company_id, site_id: test.site_id, relief_device_id: test.relief_device_id, test_id: testId };
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_test_results').select('id').eq('test_id', testId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_relief_device_test_results').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_relief_device_test_results').insert({ ...payload, created_by: user.id }).select().single());
  }

  private async upsertReliefLeakTest(user: RequestUser, testId: string, body: Record<string, any>) {
    const test = await this.getReliefTest(user, testId);
    const payload = { ...this.reliefLeakTestPayload(body, user.id), company_id: test.company_id, site_id: test.site_id, relief_device_id: test.relief_device_id, test_id: testId };
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_leak_tests').select('id').eq('test_id', testId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_relief_device_leak_tests').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_relief_device_leak_tests').insert({ ...payload, created_by: user.id }).select().single());
  }

  private decorateReliefDevice(row: any) {
    const dueStatus = row.due_status ?? this.reliefDueStatus(row.next_test_due_date);
    return { ...row, deviceTag: row.device_tag, deviceName: row.device_name, deviceType: row.device_type, serviceFluid: row.service_fluid, safetyCritical: row.safety_critical, protectedEquipmentCount: row.protected_equipment_count ?? 0, lastTestDate: row.last_test_date, nextTestDueDate: row.next_test_due_date, dueStatus, lastTestResult: row.last_test_result, popTestResult: row.pop_test_result, leakTestResult: row.leak_test_result, certificateStatus: row.certificate_status, sealStatus: row.seal_status, carSealStatus: row.car_seal_status, activeImpairment: row.active_impairment, startupBlocked: row.startup_blocked, readinessStatus: row.readiness_status, readinessBlockers: row.readiness_blockers_json ?? [] };
  }

  private decorateReliefTest(row: any) {
    return { ...row, testRecordNumber: row.test_record_number, reliefDeviceId: row.relief_device_id, reliefDeviceTag: row.relief_device?.device_tag, protectedEquipmentId: row.protected_equipment_id, protectedEquipmentTag: row.protected_equipment?.equipment_tag, testDate: row.test_date, testType: row.test_type, reviewStatus: row.review_status, finalResult: row.final_result };
  }

  private reliefSummary(rows: any[], tests: any[]) {
    const now = Date.now();
    return {
      totalReliefDevices: rows.length,
      activeReliefDevices: rows.filter((item) => ['Active', 'In Service', 'Standby'].includes(String(item.status))).length,
      safetyCritical: rows.filter((item) => item.safetyCritical ?? item.safety_critical).length,
      protectedEquipmentCount: rows.reduce((sum, item) => sum + Number(item.protectedEquipmentCount ?? item.protected_equipment_count ?? 0), 0),
      equipmentMissingReliefProtection: rows.filter((item) => Number(item.protectedEquipmentCount ?? item.protected_equipment_count ?? 0) === 0).length,
      testsDueNext30Days: rows.filter((item) => this.isWithin(item.nextTestDueDate ?? item.next_test_due_date, 30, now)).length,
      testsDueNext90Days: rows.filter((item) => this.isWithin(item.nextTestDueDate ?? item.next_test_due_date, 90, now)).length,
      overdueTests: rows.filter((item) => (item.dueStatus ?? item.due_status) === 'Overdue').length,
      criticalEquipmentPsvOverdue: rows.filter((item) => (item.safetyCritical ?? item.safety_critical) && (item.dueStatus ?? item.due_status) === 'Overdue').length,
      failedTests: tests.filter((item) => /fail/i.test(String(item.final_result ?? item.finalResult))).length,
      popTestFailed: tests.filter((item) => /pop/i.test(String(item.final_result ?? item.finalResult)) || /fail/i.test(String(item.pop_test_result ?? item.as_found_pop_result))).length,
      leakTestFailed: tests.filter((item) => /leak/i.test(String(item.final_result ?? item.finalResult)) || /fail/i.test(String(item.leak_test_result ?? item.pass_fail))).length,
      certificatesMissingOrExpiring: rows.filter((item) => !item.certificateStatus || /missing|expir/i.test(String(item.certificateStatus ?? item.certificate_status))).length,
      removedOutOfService: rows.filter((item) => /removed|out of service/i.test(String(item.status))).length,
      activeImpairmentsBypasses: rows.filter((item) => item.activeImpairment ?? item.active_impairment).length,
      mocRequired: tests.filter((item) => item.result?.moc_required || item.moc_required).length,
      startupBlocked: rows.filter((item) => item.startupBlocked ?? item.startup_blocked).length
    };
  }

  private reliefTestSummary(rows: any[]) {
    return { totalTests: rows.length, submitted: rows.filter((item) => item.status === 'Submitted').length, approved: rows.filter((item) => item.status === 'Approved').length, failed: rows.filter((item) => /fail/i.test(String(item.final_result))).length, certificatesMissing: rows.filter((item) => !item.certificate_document_id).length };
  }

  private nextReliefDueDate(baseDate?: string | null, frequencyValue?: number | string | null, frequencyUnit?: string | null, manualOverride?: string | null) {
    if (manualOverride) return manualOverride;
    const value = this.numberOrNull(frequencyValue);
    if (!baseDate || !value || !frequencyUnit) return null;
    const date = new Date(baseDate);
    const unit = String(frequencyUnit).toLowerCase();
    if (unit.startsWith('day')) date.setDate(date.getDate() + value);
    else if (unit.startsWith('week')) date.setDate(date.getDate() + value * 7);
    else if (unit.startsWith('month')) date.setMonth(date.getMonth() + value);
    else if (unit.startsWith('year')) date.setFullYear(date.getFullYear() + value);
    else return null;
    return date.toISOString().slice(0, 10);
  }

  private reliefDueStatus(date?: string | null) {
    if (!date) return 'Not Scheduled';
    const today = Date.now();
    const value = new Date(date).getTime();
    if (value < today) return 'Overdue';
    if (value <= today + 30 * 86_400_000) return 'Due Soon';
    return 'Scheduled';
  }

  private async ensureReliefOccurrence(user: RequestUser, device: any, dueDate: string) {
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_occurrences').select('id').eq('relief_device_id', device.id).eq('due_date', dueDate).maybeSingle()).catch(() => null);
    if (existing) return existing;
    const row = await this.db.single<any>(this.db.from('mi_relief_device_occurrences').insert({ company_id: device.company_id, site_id: device.site_id, relief_device_id: device.id, occurrence_number: await this.nextMiSequence('mi_relief_device_occurrences', 'occurrence_number', 'MI-PSVO', device.site_id, device.company_id), due_date: dueDate, due_basis: 'Relief device test requirement', status: 'Scheduled' }).select().single());
    await this.addReliefHistory(user, device.id, null, 'RELIEF_OCCURRENCE_GENERATED', 'Relief test occurrence generated', row.occurrence_number, null, row, 'Relief Occurrence', row.id).catch(() => null);
    return row;
  }

  private evaluateReliefTestCalculations(result: any, leak: any, technical: any, requirement: any) {
    const required = this.numberOrNull(result?.required_set_pressure ?? technical?.set_pressure);
    const asFound = this.numberOrNull(result?.as_found_pop_pressure);
    const asLeft = this.numberOrNull(result?.as_left_pop_pressure ?? result?.as_left_set_pressure);
    const tolerance = this.reliefToleranceLimit(required, requirement);
    const asFoundDeviation = asFound !== null && required !== null ? asFound - required : null;
    const asLeftDeviation = asLeft !== null && required !== null ? asLeft - required : null;
    const asFoundPass = asFoundDeviation === null || tolerance === null ? null : Math.abs(asFoundDeviation) <= tolerance;
    const asLeftPass = asLeftDeviation === null || tolerance === null ? null : Math.abs(asLeftDeviation) <= tolerance;
    const leakFail = /fail/i.test(String(leak?.pass_fail ?? leak?.seat_tightness_result ?? result?.as_left_leak_result ?? result?.as_found_leak_result ?? ''));
    let finalResult = 'Not Evaluated';
    if (leakFail || asLeftPass === false) finalResult = leakFail ? 'Failed Leak Test' : 'Failed As Left';
    else if (asFoundPass === false && asLeftPass === true) finalResult = 'Passed After Adjustment';
    else if (asFoundPass === true || asLeftPass === true) finalResult = 'Passed';
    else if (asFoundPass === false) finalResult = 'Failed As Found';
    const resultPatch = {
      required_set_pressure: required,
      as_found_deviation: asFoundDeviation,
      as_found_deviation_percent: required && asFoundDeviation !== null ? asFoundDeviation / required * 100 : null,
      as_found_tolerance_limit: tolerance,
      as_found_pop_result: asFoundPass === null ? result?.as_found_pop_result ?? 'Not Evaluated' : asFoundPass ? 'Pass' : 'Fail',
      as_left_deviation: asLeftDeviation,
      as_left_deviation_percent: required && asLeftDeviation !== null ? asLeftDeviation / required * 100 : null,
      as_left_tolerance_limit: tolerance,
      as_left_pop_result: asLeftPass === null ? result?.as_left_pop_result ?? 'Not Evaluated' : asLeftPass ? 'Pass' : 'Fail',
      ready_for_installation: ['Passed', 'Passed After Adjustment'].includes(finalResult),
      result_calculation_json: { requiredSetPressure: required, tolerance, asFoundDeviation, asLeftDeviation, leakFail, finalResult },
      updated_at: new Date().toISOString()
    };
    return { finalResult, resultPatch };
  }

  private reliefToleranceLimit(required: number | null, requirement: any) {
    const value = this.numberOrNull(requirement?.pop_pressure_tolerance_value);
    if (value === null) return required === null ? null : Math.abs(required) * 0.03;
    const type = String(requirement?.pop_pressure_tolerance_type ?? requirement?.pop_pressure_tolerance_unit ?? '').toLowerCase();
    if (type.includes('percent') && required !== null) return Math.abs(required) * value / 100;
    return value;
  }

  private async transitionReliefTest(user: RequestUser, testId: string, patch: Record<string, any>, eventType: string, title: string, description?: string | null) {
    const before = await this.getReliefTest(user, testId);
    const row = await this.db.single<any>(this.db.from('mi_relief_device_tests').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select().single());
    await this.addReliefHistory(user, before.relief_device_id, before.protected_equipment_id, eventType, title, description ?? null, before, row, 'Relief Test', testId);
    return this.reliefTestDetail(user, testId);
  }

  private async updateReliefReadinessSummary(user: RequestUser, reliefDeviceId: string) {
    const device = await this.getReliefDevice(user, reliefDeviceId);
    const technical = await this.db.single<any>(this.db.from('mi_relief_device_technical_data').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    const basis = await this.db.single<any>(this.db.from('mi_relief_device_basis').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    const requirement = await this.db.single<any>(this.db.from('mi_relief_device_test_requirements').select('*').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    const links = await this.db.many<any>(this.db.from('mi_relief_device_protected_equipment').select('id').eq('relief_device_id', reliefDeviceId)).catch(() => []);
    const blockers: string[] = [];
    if (!links.length) blockers.push('Protected equipment is not linked.');
    if (!technical?.set_pressure) blockers.push('Set pressure is missing.');
    if (!technical?.rated_capacity) blockers.push('Rated capacity is missing.');
    if (!basis?.governing_scenario) blockers.push('Governing relief scenario is missing.');
    if (!requirement?.next_test_due_date) blockers.push('Next test due date is not scheduled.');
    if (device.due_status === 'Overdue' || this.reliefDueStatus(requirement?.next_test_due_date) === 'Overdue') blockers.push('Relief device test is overdue.');
    if (/fail/i.test(String(device.last_test_result))) blockers.push('Last approved relief test failed.');
    if (device.active_impairment) blockers.push('Active impairment/bypass exists.');
    const startupBlocked = blockers.some((item) => /overdue|failed|impairment|protected/i.test(item));
    const readinessStatus = blockers.length ? (startupBlocked ? 'Blocked' : 'Missing Data') : 'Ready';
    const patch = { readiness_status: readinessStatus, startup_blocked: startupBlocked, readiness_blockers_json: blockers, updated_at: new Date().toISOString() };
    await this.db.single<any>(this.db.from('mi_relief_devices').update(patch).eq('id', reliefDeviceId).select('id').single()).catch(() => null);
    const existing = await this.db.single<any>(this.db.from('mi_relief_device_readiness').select('id').eq('relief_device_id', reliefDeviceId).maybeSingle()).catch(() => null);
    const readinessPayload = { company_id: device.company_id, site_id: device.site_id, relief_device_id: reliefDeviceId, readiness_status: readinessStatus, startup_blocked: startupBlocked, missing_required_data_json: blockers, blockers_json: blockers, warnings_json: [], last_evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (existing) await this.db.single<any>(this.db.from('mi_relief_device_readiness').update(readinessPayload).eq('id', existing.id).select('id').single()).catch(() => null);
    else await this.db.single<any>(this.db.from('mi_relief_device_readiness').insert(readinessPayload).select('id').single()).catch(() => null);
    return readinessPayload;
  }

  private assertEditableReliefDevice(device: any) {
    if (device.archived || ['Archived', 'Decommissioned'].includes(String(device.status))) throw new BadRequestException('Archived/decommissioned relief devices are read-only until reactivated.');
  }

  private assertEditableReliefTest(test: any) {
    if (['Approved'].includes(String(test.status)) || ['Approved'].includes(String(test.review_status))) throw new BadRequestException('Approved relief tests are locked and immutable.');
  }

  private reliefDeviceActions(_user: RequestUser, device: any) {
    const readOnly = device.archived || ['Archived', 'Decommissioned'].includes(String(device.status));
    return { edit: { enabled: !readOnly, disabledReason: readOnly ? 'Archived/decommissioned relief devices are read-only.' : null }, createTest: { enabled: !readOnly, disabledReason: readOnly ? 'Reactivate the relief device before creating a test.' : null }, archive: { enabled: !readOnly, disabledReason: readOnly ? 'Already archived.' : null }, recalculateSchedule: { enabled: true, disabledReason: null } };
  }

  private reliefTestActions(_user: RequestUser, test: any) {
    const locked = ['Approved'].includes(String(test.status)) || ['Approved'].includes(String(test.review_status));
    return { edit: { enabled: !locked, disabledReason: locked ? 'Approved relief tests are immutable.' : null }, submit: { enabled: !locked && test.status !== 'Submitted', disabledReason: locked ? 'Already approved.' : null }, approve: { enabled: !locked, disabledReason: locked ? 'Already approved.' : null }, reject: { enabled: !locked, disabledReason: locked ? 'Already approved.' : null } };
  }

  private async addReliefHistory(user: RequestUser, reliefDeviceId: string, equipmentId: string | null, eventType: string, title: string, description?: string | null, before?: any, after?: any, relatedRecordType?: string | null, relatedRecordId?: string | null) {
    const device = after?.company_id ? after : await this.db.single<any>(this.db.from('mi_relief_devices').select('*').eq('id', reliefDeviceId).maybeSingle()).catch(() => null);
    await this.db.single(this.db.from('mi_relief_device_history_events').insert({ company_id: device?.company_id ?? this.companyScope(user), site_id: device?.site_id ?? user.selectedSiteId ?? null, relief_device_id: reliefDeviceId, equipment_id: equipmentId, event_type: eventType, event_title: title, event_description: description ?? null, related_record_type: relatedRecordType ?? 'Relief Device', related_record_id: relatedRecordId ?? reliefDeviceId, actor_user_id: user.id, before_values_json: before ?? null, after_values_json: after ?? null }).select('id').single()).catch(() => null);
    if (equipmentId) await this.addMiHistory(user, equipmentId, eventType, title, description ?? null, before, after, relatedRecordType ?? 'Relief Device', relatedRecordId ?? reliefDeviceId).catch(() => null);
    else await this.addGlobalMiHistory(user, eventType, title, description ?? '', after).catch(() => null);
  }

  private applyPmCalibrationScope(request: any, user: RequestUser, query: Record<string, string | undefined> = {}) {
    request = request.eq('company_id', this.companyScope(user));
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? undefined;
    if (siteId) request = request.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', query.equipmentId ?? query.equipment_id);
    if (query.status) request = request.eq('status', query.status);
    return request;
  }

  private pmPlanRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_pm_plans').select('*, equipment:mi_equipment(*)');
    request = this.applyPmCalibrationScope(request, user, query);
    if (query.q ?? query.search) request = request.or(`plan_number.ilike.%${query.q ?? query.search}%,plan_title.ilike.%${query.q ?? query.search}%`);
    return this.db.many<any>(request.order('current_next_due_date', { ascending: true })).catch(() => []);
  }

  private pmRecordRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_pm_records').select('*, equipment:mi_equipment(*), plan:mi_pm_plans(plan_number,plan_title,pm_task_type), occurrence:mi_pm_occurrences(occurrence_number,due_date,status)');
    request = this.applyPmCalibrationScope(request, user, query);
    return this.db.many<any>(request.order('pm_date', { ascending: false })).catch(() => []);
  }

  private calibrationPlanRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_calibration_plans').select('*, equipment:mi_equipment(*)');
    request = this.applyPmCalibrationScope(request, user, query);
    if (query.q ?? query.search) request = request.or(`plan_number.ilike.%${query.q ?? query.search}%,plan_title.ilike.%${query.q ?? query.search}%`);
    return this.db.many<any>(request.order('current_next_due_date', { ascending: true })).catch(() => []);
  }

  private calibrationRecordRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_calibration_records').select('*, equipment:mi_equipment(*), plan:mi_calibration_plans(plan_number,plan_title,instrument_type,calibration_type), occurrence:mi_calibration_occurrences(occurrence_number,due_date,status)');
    request = this.applyPmCalibrationScope(request, user, query);
    return this.db.many<any>(request.order('calibration_date', { ascending: false })).catch(() => []);
  }

  private async getPmPlan(user: RequestUser, planId: string) {
    const plan = await this.db.single<any>(this.applyPmCalibrationScope(this.db.from('mi_pm_plans').select('*, equipment:mi_equipment(*)').eq('id', planId), user, {}).maybeSingle());
    if (!plan) throw new BadRequestException('PM plan was not found or is outside your company/site access.');
    return plan;
  }

  private async getPmRecord(user: RequestUser, recordId: string) {
    const record = await this.db.single<any>(this.applyPmCalibrationScope(this.db.from('mi_pm_records').select('*, equipment:mi_equipment(*), plan:mi_pm_plans(*)').eq('id', recordId), user, {}).maybeSingle());
    if (!record) throw new BadRequestException('PM record was not found or is outside your company/site access.');
    return record;
  }

  private async getCalibrationPlan(user: RequestUser, planId: string) {
    const plan = await this.db.single<any>(this.applyPmCalibrationScope(this.db.from('mi_calibration_plans').select('*, equipment:mi_equipment(*)').eq('id', planId), user, {}).maybeSingle());
    if (!plan) throw new BadRequestException('Calibration plan was not found or is outside your company/site access.');
    return plan;
  }

  private async getCalibrationRecord(user: RequestUser, recordId: string) {
    const record = await this.db.single<any>(this.applyPmCalibrationScope(this.db.from('mi_calibration_records').select('*, equipment:mi_equipment(*), plan:mi_calibration_plans(*)').eq('id', recordId), user, {}).maybeSingle());
    if (!record) throw new BadRequestException('Calibration record was not found or is outside your company/site access.');
    return record;
  }

  private decoratePmPlan(row: any) {
    return {
      ...row,
      planNumber: row.plan_number,
      planTitle: row.plan_title,
      equipmentTag: row.equipment?.equipment_tag ?? row.equipment?.tag ?? row.equipment_id,
      equipmentName: row.equipment?.equipment_name ?? row.equipment?.name ?? null,
      pmCategory: row.pm_category,
      pmTaskType: row.pm_task_type,
      approvalStatus: row.approval_status,
      revisionNumber: row.revision_number,
      nextDueDate: row.current_next_due_date,
      dueStatus: this.pmCalibrationDueStatus(row.current_next_due_date),
      schedulerStatus: row.current_scheduler_status
    };
  }

  private decorateCalibrationPlan(row: any) {
    return {
      ...row,
      planNumber: row.plan_number,
      planTitle: row.plan_title,
      equipmentTag: row.equipment?.equipment_tag ?? row.equipment?.tag ?? row.equipment_id,
      equipmentName: row.equipment?.equipment_name ?? row.equipment?.name ?? null,
      instrumentType: row.instrument_type,
      calibrationType: row.calibration_type,
      approvalStatus: row.approval_status,
      revisionNumber: row.revision_number,
      nextDueDate: row.current_next_due_date,
      dueStatus: this.pmCalibrationDueStatus(row.current_next_due_date),
      schedulerStatus: row.current_scheduler_status
    };
  }

  private pmSummary(plans: any[], records: any[], dueRows: any[]) {
    return {
      totalPlans: plans.length,
      activePlans: plans.filter((item) => item.status === 'Active').length,
      draftPlans: plans.filter((item) => item.status === 'Draft').length,
      dueSoon: dueRows.filter((item) => this.pmCalibrationDueStatus(item.current_next_due_date ?? item.nextDueDate) === 'Due Soon').length,
      overdue: dueRows.filter((item) => this.pmCalibrationDueStatus(item.current_next_due_date ?? item.nextDueDate) === 'Overdue').length,
      completedRecords: records.filter((item) => item.status === 'Approved' || item.result === 'Completed').length,
      failedRecords: records.filter((item) => /fail/i.test(String(item.result ?? ''))).length
    };
  }

  private pmRecordSummary(records: any[]) {
    return {
      totalRecords: records.length,
      draftRecords: records.filter((item) => item.status === 'Draft').length,
      submittedRecords: records.filter((item) => item.status === 'Submitted').length,
      approvedRecords: records.filter((item) => item.status === 'Approved').length,
      failedRecords: records.filter((item) => /fail/i.test(String(item.result ?? ''))).length
    };
  }

  private calibrationSummary(plans: any[], records: any[], dueRows: any[]) {
    return {
      totalPlans: plans.length,
      activePlans: plans.filter((item) => item.status === 'Active').length,
      dueSoon: dueRows.filter((item) => this.pmCalibrationDueStatus(item.current_next_due_date ?? item.nextDueDate) === 'Due Soon').length,
      overdue: dueRows.filter((item) => this.pmCalibrationDueStatus(item.current_next_due_date ?? item.nextDueDate) === 'Overdue').length,
      records: records.length,
      passed: records.filter((item) => /pass/i.test(String(item.result ?? ''))).length,
      failed: records.filter((item) => /fail|out of tolerance/i.test(String(item.result ?? item.as_left_result ?? item.as_found_result ?? ''))).length,
      missingCertificates: records.filter((item) => !item.calibration_certificate_document_id).length
    };
  }

  private calibrationRecordSummary(records: any[]) {
    return {
      totalRecords: records.length,
      submittedRecords: records.filter((item) => item.status === 'Submitted').length,
      approvedRecords: records.filter((item) => item.status === 'Approved').length,
      failedRecords: records.filter((item) => /fail/i.test(String(item.result ?? item.as_left_result ?? item.as_found_result ?? ''))).length,
      certificateMissing: records.filter((item) => !item.calibration_certificate_document_id).length
    };
  }

  private pmPlanActions(user: RequestUser, plan: any) {
    return this.workflowActions(user, plan, 'mechanical_integrity.pm_plan');
  }

  private calibrationPlanActions(user: RequestUser, plan: any) {
    return this.workflowActions(user, plan, 'mechanical_integrity.calibration_plan');
  }

  private recordActions(user: RequestUser, row: any, base: string) {
    const permissionRoot = base === 'pm_record' ? 'mechanical_integrity.pm_record' : 'mechanical_integrity.calibration_record';
    return this.workflowActions(user, row, permissionRoot);
  }

  private workflowActions(user: RequestUser, row: any, permissionRoot: string) {
    const can = (suffix: string) => user.isSuperAdmin || user.permissions.includes(`${permissionRoot}.${suffix}`);
    const readOnly = ['Approved', 'Archived'].includes(String(row.status));
    const make = (key: string, suffix: string, label: string) => ({
      key,
      label,
      permitted: can(suffix),
      disabled: !can(suffix) || (readOnly && !['export', 'view'].includes(suffix)),
      disabledReason: !can(suffix) ? `Missing permission: ${permissionRoot}.${suffix}` : readOnly && !['export', 'view'].includes(suffix) ? 'Approved/archived records are read-only; create a revision or return for correction.' : null
    });
    return [make('edit', 'edit', 'Edit'), make('submit', 'submit', 'Submit'), make('approve', 'approve', 'Approve'), make('reject', 'reject', 'Reject'), make('export', 'export', 'Export')];
  }

  private assertEditablePlan(row: any, label: string) {
    if (['Active', 'Approved', 'Archived'].includes(String(row.status)) || row.approval_status === 'Approved') throw new BadRequestException(`${label} is approved or archived. Create a controlled revision instead of editing the approved basis.`);
  }

  private assertEditableRecord(row: any, label: string) {
    if (['Approved', 'Archived'].includes(String(row.status))) throw new BadRequestException(`${label} is approved or archived and cannot be edited.`);
  }

  private async nextMiSequence(table: string, column: string, prefix: string, siteId: string, companyId: string) {
    const safeSite = String(siteId ?? 'SITE').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'SITE';
    const fullPrefix = `${prefix}-${safeSite}`;
    const rows = await this.db.many<any>(this.db.from(table).select(column).eq('company_id', companyId).eq('site_id', siteId).ilike(column, `${fullPrefix}-%`)).catch(() => []);
    return `${fullPrefix}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private pmPlanPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      planTitle: 'plan_title', planDescription: 'plan_description', pmCategory: 'pm_category', pmTaskType: 'pm_task_type', status: 'status', approvalStatus: 'approval_status',
      effectiveDate: 'effective_date', reviewDate: 'review_date', priority: 'priority', responsibleDepartmentId: 'responsible_department_id', responsibleTeamId: 'responsible_team_id',
      responsibleUserId: 'responsible_user_id', vendorRequired: 'vendor_required', vendorName: 'vendor_name', schedulerActive: 'scheduler_active', procedureDocumentId: 'procedure_document_id',
      requiredEvidence: 'required_evidence', requiredMeasurements: 'required_measurements', requiredPhotos: 'required_photos', requiredTools: 'required_tools_json', requiredSpares: 'required_spares_json',
      requiredConsumables: 'required_consumables_json', requiredShutdown: 'required_shutdown', onlineMaintenanceAllowed: 'online_maintenance_allowed', isolationRequired: 'isolation_required',
      lotoRequired: 'loto_required', ptwRequired: 'ptw_required', confinedSpaceRequired: 'confined_space_required', vendorReportRequired: 'vendor_report_required',
      supervisorVerificationRequired: 'supervisor_verification_required', esignatureRequired: 'esignature_required', acceptanceCriteria: 'acceptance_criteria', notes: 'notes'
    };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    return payload;
  }

  private async upsertPmSchedule(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getPmPlan(user, planId);
    const payload = {
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: planId,
      equipment_id: plan.equipment_id,
      scheduling_mode: body.schedulingMode ?? body.scheduling_mode ?? 'Fixed calendar interval',
      frequency_value: this.numberOrNull(body.frequencyValue ?? body.frequency_value),
      frequency_unit: body.frequencyUnit ?? body.frequency_unit ?? null,
      last_pm_date: body.lastPmDate ?? body.last_pm_date ?? null,
      manual_override_due_date: body.manualOverrideDueDate ?? body.manual_override_due_date ?? null,
      manual_override_reason: body.manualOverrideReason ?? body.manual_override_reason ?? null,
      due_soon_threshold_value: Number(body.dueSoonThresholdValue ?? body.due_soon_threshold_value ?? 30),
      due_soon_threshold_unit: body.dueSoonThresholdUnit ?? body.due_soon_threshold_unit ?? 'Days',
      critical_overdue_threshold_value: Number(body.criticalOverdueThresholdValue ?? body.critical_overdue_threshold_value ?? 30),
      critical_overdue_threshold_unit: body.criticalOverdueThresholdUnit ?? body.critical_overdue_threshold_unit ?? 'Days',
      occurrence_generation_window_value: Number(body.occurrenceGenerationWindowValue ?? body.occurrence_generation_window_value ?? 1),
      occurrence_generation_window_unit: body.occurrenceGenerationWindowUnit ?? body.occurrence_generation_window_unit ?? 'Years',
      scheduler_notes: body.schedulerNotes ?? body.scheduler_notes ?? null,
      updated_at: new Date().toISOString()
    };
    const existing = await this.db.single<any>(this.db.from('mi_pm_plan_schedules').select('id').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_pm_plan_schedules').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_pm_plan_schedules').insert(payload).select().single());
  }

  private async replacePmChecklist(user: RequestUser, planId: string, items: any[]) {
    const plan = await this.getPmPlan(user, planId);
    await this.db.many<any>(this.db.from('mi_pm_plan_checklist_items').delete().eq('plan_id', planId).select()).catch(() => []);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!(item.taskTitle ?? item.task_title ?? item.title)?.trim()) continue;
      await this.db.single(this.db.from('mi_pm_plan_checklist_items').insert({
        company_id: plan.company_id,
        site_id: plan.site_id,
        plan_id: planId,
        item_number: item.itemNumber ?? item.item_number ?? String(index + 1),
        section_title: item.sectionTitle ?? item.section_title ?? null,
        task_title: item.taskTitle ?? item.task_title ?? item.title,
        task_instruction: item.taskInstruction ?? item.task_instruction ?? item.instruction ?? null,
        response_type: item.responseType ?? item.response_type ?? 'Done/Not Done',
        acceptance_criteria: item.acceptanceCriteria ?? item.acceptance_criteria ?? null,
        evidence_required: !!(item.evidenceRequired ?? item.evidence_required),
        attachment_required: !!(item.attachmentRequired ?? item.attachment_required),
        required: item.required ?? true,
        sort_order: Number(item.sortOrder ?? item.sort_order ?? index),
        active: item.active ?? true
      }).select().single()).catch(() => null);
    }
  }

  private async transitionPmPlan(user: RequestUser, planId: string, patch: Record<string, any>, eventType: string, title: string, description?: string | null) {
    const before = await this.getPmPlan(user, planId);
    const row = await this.db.single<any>(this.db.from('mi_pm_plans').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select().single());
    await this.addMiHistory(user, before.equipment_id, eventType, title, description ?? null, before, row, 'PM Plan', planId);
    return this.pmPlanDetail(user, planId);
  }

  private async copyChildRows(table: string, key: string, fromId: string, toId: string) {
    const rows = await this.db.many<any>(this.db.from(table).select('*').eq(key, fromId)).catch(() => []);
    for (const row of rows) {
      const copy = { ...row, id: crypto.randomUUID(), [key]: toId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await this.db.single(this.db.from(table).insert(copy).select('id').single()).catch(() => null);
    }
  }

  private nextPmCalibrationDueDate(baseDate?: string | null, frequencyValue?: number | string | null, frequencyUnit?: string | null, manualOverride?: string | null) {
    if (manualOverride) return manualOverride;
    const value = this.numberOrNull(frequencyValue);
    if (!baseDate || !value || !frequencyUnit) return null;
    const date = new Date(baseDate);
    const unit = String(frequencyUnit).toLowerCase();
    if (unit.startsWith('day')) date.setDate(date.getDate() + value);
    else if (unit.startsWith('week')) date.setDate(date.getDate() + value * 7);
    else if (unit.startsWith('month')) date.setMonth(date.getMonth() + value);
    else if (unit.startsWith('year')) date.setFullYear(date.getFullYear() + value);
    else return null;
    return date.toISOString().slice(0, 10);
  }

  private pmCalibrationDueStatus(date?: string | null) {
    if (!date) return 'Not Scheduled';
    const today = Date.now();
    const value = new Date(date).getTime();
    if (value < today) return 'Overdue';
    if (value <= today + 30 * 86_400_000) return 'Due Soon';
    return 'Scheduled';
  }

  private async ensurePmOccurrence(user: RequestUser, plan: any, dueDate: string) {
    const existing = await this.db.single<any>(this.db.from('mi_pm_occurrences').select('id').eq('plan_id', plan.id).eq('due_date', dueDate).maybeSingle()).catch(() => null);
    if (existing) return existing;
    const row = await this.db.single<any>(this.db.from('mi_pm_occurrences').insert({ company_id: plan.company_id, site_id: plan.site_id, plan_id: plan.id, equipment_id: plan.equipment_id, occurrence_number: await this.nextMiSequence('mi_pm_occurrences', 'occurrence_number', 'MI-PMO', plan.site_id, plan.company_id), due_date: dueDate, due_basis: 'PM plan schedule', status: 'Scheduled' }).select().single());
    await this.addMiHistory(user, plan.equipment_id, 'PM_OCCURRENCE_GENERATED', 'PM occurrence generated', row.occurrence_number, null, row, 'PM Occurrence', row.id).catch(() => null);
    return row;
  }

  private async updateScheduleSummary(equipmentId: string, patch: Record<string, any>) {
    const existing = await this.db.single<any>(this.db.from('mi_equipment_schedule_summary').select('id').eq('equipment_id', equipmentId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_equipment_schedule_summary').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single()).catch(() => null);
    const equipment = await this.db.single<any>(this.db.from('mi_equipment').select('*').eq('id', equipmentId).maybeSingle()).catch(() => null);
    if (!equipment) return null;
    return this.db.single<any>(this.db.from('mi_equipment_schedule_summary').insert({ company_id: equipment.company_id, site_id: equipment.site_id, equipment_id: equipmentId, ...patch }).select().single()).catch(() => null);
  }

  private pmRecordPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = { result: 'result', pmDate: 'pm_date', technicianUserId: 'technician_user_id', technicianName: 'technician_name', vendorName: 'vendor_name', reviewerUserId: 'reviewer_user_id', shutdownRequired: 'shutdown_required', ptwId: 'ptw_id', lotoId: 'loto_id', procedureDocumentId: 'procedure_document_id', notes: 'notes' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    return payload;
  }

  private async seedPmRecordChecklist(record: any, planId?: string | null) {
    if (!planId) return;
    const items = await this.db.many<any>(this.db.from('mi_pm_plan_checklist_items').select('*').eq('plan_id', planId).order('sort_order', { ascending: true })).catch(() => []);
    for (const item of items) {
      await this.db.single(this.db.from('mi_pm_record_checklist_items').insert({ company_id: record.company_id, site_id: record.site_id, pm_record_id: record.id, plan_checklist_item_id: item.id, item_number: item.item_number, section_title: item.section_title, task_title: item.task_title, task_instruction: item.task_instruction, response_type: item.response_type, evidence_required: item.evidence_required, required: item.required, sort_order: item.sort_order }).select('id').single()).catch(() => null);
    }
  }

  private async replacePmRecordChecklist(record: any, items: any[]) {
    await this.db.many<any>(this.db.from('mi_pm_record_checklist_items').delete().eq('pm_record_id', record.id).select()).catch(() => []);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      await this.db.single(this.db.from('mi_pm_record_checklist_items').insert({ company_id: record.company_id, site_id: record.site_id, pm_record_id: record.id, plan_checklist_item_id: item.planChecklistItemId ?? item.plan_checklist_item_id ?? null, item_number: item.itemNumber ?? item.item_number ?? String(index + 1), section_title: item.sectionTitle ?? item.section_title ?? null, task_title: item.taskTitle ?? item.task_title ?? 'PM task', task_instruction: item.taskInstruction ?? item.task_instruction ?? null, response_type: item.responseType ?? item.response_type ?? 'Done/Not Done', response_value_json: item.responseValue ?? item.response_value_json ?? {}, pass_fail: item.passFail ?? item.pass_fail ?? null, comment: item.comment ?? null, evidence_required: !!(item.evidenceRequired ?? item.evidence_required), evidence_document_id: item.evidenceDocumentId ?? item.evidence_document_id ?? null, required: item.required ?? true, sort_order: Number(item.sortOrder ?? item.sort_order ?? index), completed_by: item.completedBy ?? item.completed_by ?? null, completed_at: item.completedAt ?? item.completed_at ?? null }).select('id').single()).catch(() => null);
    }
  }

  private async transitionPmRecord(user: RequestUser, recordId: string, patch: Record<string, any>, eventType: string, title: string, description?: string | null) {
    const before = await this.getPmRecord(user, recordId);
    const row = await this.db.single<any>(this.db.from('mi_pm_records').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', recordId).select().single());
    await this.addMiHistory(user, before.equipment_id, eventType, title, description ?? null, before, row, 'PM Record', recordId);
    return this.pmRecordDetail(user, recordId);
  }

  private async closePmOccurrence(record: any, userId: string) {
    if (!record.occurrence_id) return;
    await this.db.single(this.db.from('mi_pm_occurrences').update({ status: 'Completed', completed_record_id: record.id, completed_at: new Date().toISOString(), completed_by: userId, updated_at: new Date().toISOString() }).eq('id', record.occurrence_id).select('id').single()).catch(() => null);
  }

  private calibrationPlanPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = { planTitle: 'plan_title', planDescription: 'plan_description', instrumentType: 'instrument_type', calibrationType: 'calibration_type', measurementParameter: 'measurement_parameter', rangeLower: 'range_lower', rangeUpper: 'range_upper', rangeUnit: 'range_unit', toleranceType: 'tolerance_type', toleranceValue: 'tolerance_value', toleranceUnit: 'tolerance_unit', tolerancePercent: 'tolerance_percent', accuracyClass: 'accuracy_class', acceptanceCriteria: 'acceptance_criteria', adjustmentAllowed: 'adjustment_allowed', asFoundRequired: 'as_found_required', asLeftRequired: 'as_left_required', certificateRequired: 'certificate_required', referenceStandardRequired: 'reference_standard_required', referenceStandardCertificateRequired: 'reference_standard_certificate_required', procedureDocumentId: 'procedure_document_id', status: 'status', approvalStatus: 'approval_status', effectiveDate: 'effective_date', reviewDate: 'review_date', responsibleUserId: 'responsible_user_id', reviewerUserId: 'reviewer_user_id', schedulerActive: 'scheduler_active' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = ['range_lower', 'range_upper', 'tolerance_value', 'tolerance_percent'].includes(snake) ? this.numberOrNull(body[camel]) : body[camel];
      if (body[snake] !== undefined) payload[snake] = ['range_lower', 'range_upper', 'tolerance_value', 'tolerance_percent'].includes(snake) ? this.numberOrNull(body[snake]) : body[snake];
    }
    return payload;
  }

  private async upsertCalibrationSchedule(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getCalibrationPlan(user, planId);
    const payload = { company_id: plan.company_id, site_id: plan.site_id, plan_id: planId, equipment_id: plan.equipment_id, scheduling_mode: body.schedulingMode ?? body.scheduling_mode ?? 'Fixed calendar interval', frequency_value: this.numberOrNull(body.frequencyValue ?? body.frequency_value), frequency_unit: body.frequencyUnit ?? body.frequency_unit ?? null, last_calibration_date: body.lastCalibrationDate ?? body.last_calibration_date ?? null, manual_override_due_date: body.manualOverrideDueDate ?? body.manual_override_due_date ?? null, manual_override_reason: body.manualOverrideReason ?? body.manual_override_reason ?? null, due_soon_threshold_value: Number(body.dueSoonThresholdValue ?? body.due_soon_threshold_value ?? 30), due_soon_threshold_unit: body.dueSoonThresholdUnit ?? body.due_soon_threshold_unit ?? 'Days', critical_overdue_threshold_value: Number(body.criticalOverdueThresholdValue ?? body.critical_overdue_threshold_value ?? 30), critical_overdue_threshold_unit: body.criticalOverdueThresholdUnit ?? body.critical_overdue_threshold_unit ?? 'Days', occurrence_generation_window_value: Number(body.occurrenceGenerationWindowValue ?? body.occurrence_generation_window_value ?? 1), occurrence_generation_window_unit: body.occurrenceGenerationWindowUnit ?? body.occurrence_generation_window_unit ?? 'Years', scheduler_notes: body.schedulerNotes ?? body.scheduler_notes ?? null, updated_at: new Date().toISOString() };
    const existing = await this.db.single<any>(this.db.from('mi_calibration_plan_schedules').select('id').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_calibration_plan_schedules').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_calibration_plan_schedules').insert(payload).select().single());
  }

  private async replaceCalibrationPlanPoints(user: RequestUser, planId: string, points: any[]) {
    const plan = await this.getCalibrationPlan(user, planId);
    await this.db.many<any>(this.db.from('mi_calibration_plan_points').delete().eq('plan_id', planId).select()).catch(() => []);
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const input = this.numberOrNull(point.inputValue ?? point.input_value);
      const expected = this.numberOrNull(point.expectedOutput ?? point.expected_output);
      if (input === null || expected === null) continue;
      await this.db.single(this.db.from('mi_calibration_plan_points').insert({ company_id: plan.company_id, site_id: plan.site_id, plan_id: planId, point_number: point.pointNumber ?? point.point_number ?? String(index + 1), input_value: input, expected_output: expected, unit: point.unit ?? plan.range_unit ?? null, tolerance_type: point.toleranceType ?? point.tolerance_type ?? plan.tolerance_type, tolerance_value: this.numberOrNull(point.toleranceValue ?? point.tolerance_value ?? plan.tolerance_value), tolerance_unit: point.toleranceUnit ?? point.tolerance_unit ?? plan.tolerance_unit, tolerance_percent: this.numberOrNull(point.tolerancePercent ?? point.tolerance_percent ?? plan.tolerance_percent), required: point.required ?? true, sort_order: Number(point.sortOrder ?? point.sort_order ?? index) }).select('id').single()).catch(() => null);
    }
  }

  private async transitionCalibrationPlan(user: RequestUser, planId: string, patch: Record<string, any>, eventType: string, title: string, description?: string | null) {
    const before = await this.getCalibrationPlan(user, planId);
    const row = await this.db.single<any>(this.db.from('mi_calibration_plans').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', planId).select().single());
    await this.addMiHistory(user, before.equipment_id, eventType, title, description ?? null, before, row, 'Calibration Plan', planId);
    return this.calibrationPlanDetail(user, planId);
  }

  private async ensureCalibrationOccurrence(user: RequestUser, plan: any, dueDate: string) {
    const existing = await this.db.single<any>(this.db.from('mi_calibration_occurrences').select('id').eq('plan_id', plan.id).eq('due_date', dueDate).maybeSingle()).catch(() => null);
    if (existing) return existing;
    const row = await this.db.single<any>(this.db.from('mi_calibration_occurrences').insert({ company_id: plan.company_id, site_id: plan.site_id, plan_id: plan.id, equipment_id: plan.equipment_id, occurrence_number: await this.nextMiSequence('mi_calibration_occurrences', 'occurrence_number', 'MI-CALO', plan.site_id, plan.company_id), due_date: dueDate, due_basis: 'Calibration plan schedule', status: 'Scheduled' }).select().single());
    await this.addMiHistory(user, plan.equipment_id, 'CALIBRATION_OCCURRENCE_GENERATED', 'Calibration occurrence generated', row.occurrence_number, null, row, 'Calibration Occurrence', row.id).catch(() => null);
    return row;
  }

  private async seedCalibrationRecordPoints(record: any, planId?: string | null) {
    if (!planId) return;
    const points = await this.db.many<any>(this.db.from('mi_calibration_plan_points').select('*').eq('plan_id', planId).order('sort_order', { ascending: true })).catch(() => []);
    for (const point of points) {
      await this.db.single(this.db.from('mi_calibration_record_points').insert({ company_id: record.company_id, site_id: record.site_id, calibration_record_id: record.id, plan_point_id: point.id, point_number: point.point_number, input_value: point.input_value, expected_output: point.expected_output, unit: point.unit, tolerance_applied_json: this.calibrationTolerance(point) }).select('id').single()).catch(() => null);
    }
  }

  private calibrationRecordPayload(body: Record<string, any>, userId: string) {
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    const map: Record<string, string> = { calibrationDate: 'calibration_date', technicianUserId: 'technician_user_id', technicianName: 'technician_name', vendorOrLab: 'vendor_or_lab', reviewerUserId: 'reviewer_user_id', procedureDocumentId: 'procedure_document_id', referenceStandard: 'reference_standard', referenceStandardSerialNumber: 'reference_standard_serial_number', referenceStandardCertificateDocumentId: 'reference_standard_certificate_document_id', calibrationCertificateDocumentId: 'calibration_certificate_document_id', environmentalConditions: 'environmental_conditions', adjustmentPerformed: 'adjustment_performed', notes: 'notes', result: 'result' };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    return payload;
  }

  private async replaceCalibrationRecordPoints(record: any, points: any[]) {
    await this.db.many<any>(this.db.from('mi_calibration_record_points').delete().eq('calibration_record_id', record.id).select()).catch(() => []);
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const input = this.numberOrNull(point.inputValue ?? point.input_value);
      const expected = this.numberOrNull(point.expectedOutput ?? point.expected_output);
      if (input === null || expected === null) continue;
      await this.db.single(this.db.from('mi_calibration_record_points').insert({ company_id: record.company_id, site_id: record.site_id, calibration_record_id: record.id, plan_point_id: point.planPointId ?? point.plan_point_id ?? null, point_number: point.pointNumber ?? point.point_number ?? String(index + 1), input_value: input, expected_output: expected, as_found_output: this.numberOrNull(point.asFoundOutput ?? point.as_found_output), adjustment_performed: !!(point.adjustmentPerformed ?? point.adjustment_performed), as_left_output: this.numberOrNull(point.asLeftOutput ?? point.as_left_output), unit: point.unit ?? null, tolerance_applied_json: point.toleranceApplied ?? point.tolerance_applied_json ?? {}, notes: point.notes ?? null }).select('id').single()).catch(() => null);
    }
  }

  private calibrationTolerance(point: any) {
    const toleranceType = point.tolerance_type ?? point.tolerance_applied_json?.toleranceType ?? 'Absolute value';
    const expected = this.numberOrNull(point.expected_output) ?? 0;
    const value = this.numberOrNull(point.tolerance_value ?? point.tolerance_applied_json?.toleranceValue);
    const percent = this.numberOrNull(point.tolerance_percent ?? point.tolerance_applied_json?.tolerancePercent);
    let limit = value ?? 0;
    if (/span/i.test(String(toleranceType)) && percent !== null) {
      const span = Math.abs((this.numberOrNull(point.range_upper) ?? expected) - (this.numberOrNull(point.range_lower) ?? 0));
      limit = span * percent / 100;
    } else if (/reading/i.test(String(toleranceType)) && percent !== null) {
      limit = Math.abs(expected) * percent / 100;
    }
    return { toleranceType, toleranceValue: value, tolerancePercent: percent, limit, unit: point.tolerance_unit ?? point.unit ?? null };
  }

  private evaluateCalibrationPoint(output: any, expected: any, limit: number) {
    const measured = this.numberOrNull(output);
    const basis = this.numberOrNull(expected);
    if (measured === null || basis === null) return { error: null, result: 'Not Entered' };
    const error = measured - basis;
    return { error, result: Math.abs(error) <= Math.abs(limit) ? 'Pass' : 'Fail' };
  }

  private async transitionCalibrationRecord(user: RequestUser, recordId: string, patch: Record<string, any>, eventType: string, title: string, description?: string | null) {
    const before = await this.getCalibrationRecord(user, recordId);
    const row = await this.db.single<any>(this.db.from('mi_calibration_records').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', recordId).select().single());
    await this.addMiHistory(user, before.equipment_id, eventType, title, description ?? null, before, row, 'Calibration Record', recordId);
    return this.calibrationRecordDetail(user, recordId);
  }

  private async closeCalibrationOccurrence(record: any, userId: string) {
    if (!record.occurrence_id) return;
    await this.db.single(this.db.from('mi_calibration_occurrences').update({ status: 'Completed', completed_record_id: record.id, completed_at: new Date().toISOString(), completed_by: userId, updated_at: new Date().toISOString() }).eq('id', record.occurrence_id).select('id').single()).catch(() => null);
  }

  private distribution(rows: any[], selector: (item: any) => string) {
    const counts = new Map<string, number>();
    rows.forEach((item) => counts.set(selector(item), (counts.get(selector(item)) ?? 0) + 1));
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  }

  private dueStatus(date?: string | null) {
    if (!date) return 'Not configured';
    return this.isPast(date) ? 'Overdue' : 'Scheduled';
  }

  private isArchived(equipment: any) {
    return ['ARCHIVED', 'Archived', 'DECOMMISSIONED', 'Decommissioned'].includes(String(equipment.status ?? ''));
  }

  private fitness(item: any) {
    return item.fitnessStatus ?? (item.status === 'OUT_OF_SERVICE' ? 'Out of Service' : item.status === 'DECOMMISSIONED' ? 'Not Fit for Service' : 'Fit for Service');
  }

  private isPast(date?: string | null) {
    return !!date && new Date(date).getTime() < Date.now();
  }

  private isWithin(date: string | null | undefined, days: number, now: number) {
    if (!date) return false;
    const value = new Date(date).getTime();
    return value >= now && value <= now + days * 86_400_000;
  }

  private companyScope(user: RequestUser) {
    return user.activeCompanyId ?? user.companyIds?.[0] ?? user.tenantId;
  }

  private scopedMiRows(user: RequestUser, table: string, query: Record<string, string | undefined> = {}) {
    let request = this.db.from(table).select('*').eq('company_id', this.companyScope(user));
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? undefined;
    if (siteId) request = request.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds?.length) request = request.in('site_id', user.siteIds);
    return this.db.many<any>(request.limit(1000)).catch(() => []);
  }

  private applyInspectionPlanScope(request: any, user: RequestUser, query: Record<string, string | undefined>) {
    request = request.eq('company_id', this.companyScope(user));
    const siteId = query.siteId ?? user.selectedSiteId ?? undefined;
    if (siteId) request = request.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds.length) request = request.in('site_id', user.siteIds);
    return request;
  }

  private scopedInspectionPlans(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.db.from('mi_inspection_plans').select('*, equipment:mi_equipment(*)');
    request = this.applyInspectionPlanScope(request, user, query);
    if (query.status) request = request.eq('status', query.status);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    return this.db.many<any>(request).catch(() => []);
  }

  private async getInspectionPlanBase(user: RequestUser, planId: string) {
    const plan = await this.db.single<any>(this.applyInspectionPlanScope(this.db.from('mi_inspection_plans').select('*, equipment:mi_equipment(*)').eq('id', planId), user, {}).maybeSingle());
    if (!plan) throw new BadRequestException('Inspection plan was not found or is outside your company/site access.');
    return plan;
  }

  private validateInspectionPlanInput(body: Record<string, any>) {
    if (!(body.planTitle ?? body.plan_title)?.trim()) throw new BadRequestException('Plan title is required.');
    if (!(body.planType ?? body.plan_type)?.trim()) throw new BadRequestException('Plan type is required.');
    if (!(body.inspectionMethod ?? body.inspection_method)?.trim()) throw new BadRequestException('Inspection method is required.');
  }

  private inspectionPlanUpdatePayload(body: Record<string, any>, userId: string) {
    const map: Record<string, string> = {
      planTitle: 'plan_title',
      planDescription: 'plan_description',
      planType: 'plan_type',
      inspectionCategory: 'inspection_category',
      inspectionMethod: 'inspection_method',
      status: 'status',
      approvalStatus: 'approval_status',
      effectiveDate: 'effective_date',
      expiryReviewDate: 'expiry_review_date',
      reviewDate: 'expiry_review_date',
      responsibleDepartmentId: 'responsible_department_id',
      responsibleTeamId: 'responsible_team_id',
      responsibleUserId: 'responsible_user_id',
      vendorRequired: 'vendor_required',
      vendorName: 'vendor_name',
      priority: 'priority',
      criticalityBasis: 'criticality_basis',
      schedulerActive: 'scheduler_active'
    };
    const payload: Record<string, any> = { updated_by: userId, updated_at: new Date().toISOString() };
    for (const [camel, snake] of Object.entries(map)) {
      if (body[camel] !== undefined) payload[snake] = body[camel];
      if (body[snake] !== undefined) payload[snake] = body[snake];
    }
    return payload;
  }

  private async nextInspectionPlanNumber(equipment: any) {
    const companyId = equipment.company_id ?? equipment.companyId ?? 'company';
    const siteId = equipment.site_id ?? equipment.siteId ?? 'site';
    const prefix = `MI-IP-${String(siteId).slice(0, 6).toUpperCase()}`;
    const rows = await this.db.many<any>(this.db.from('mi_inspection_plans').select('plan_number').eq('company_id', companyId).eq('site_id', siteId).ilike('plan_number', `${prefix}-%`)).catch(() => []);
    return `${prefix}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private async upsertInspectionPlanScope(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getInspectionPlanBase(user, planId);
    const payload = {
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: planId,
      equipment_id: plan.equipment_id,
      scope_statement: body.scopeStatement ?? body.scope_statement ?? body.inspectionScope ?? null,
      inspection_boundaries: body.inspectionBoundaries ?? body.inspection_boundaries ?? null,
      included_components_json: body.includedComponents ?? body.included_components_json ?? [],
      excluded_components_json: body.excludedComponents ?? body.excluded_components_json ?? [],
      internal_inspection_required: !!(body.internalInspectionRequired ?? body.internal_inspection_required),
      external_inspection_required: !!(body.externalInspectionRequired ?? body.external_inspection_required),
      online_inspection_allowed: body.onlineInspectionAllowed ?? body.online_inspection_allowed ?? true,
      shutdown_required: !!(body.shutdownRequired ?? body.shutdown_required),
      entry_required: !!(body.entryRequired ?? body.entry_required),
      confined_space_required: !!(body.confinedSpaceRequired ?? body.confined_space_required),
      isolation_required: !!(body.isolationRequired ?? body.isolation_required),
      ptw_required: !!(body.ptwRequired ?? body.ptw_required),
      loto_required: !!(body.lotoRequired ?? body.loto_required),
      ndt_required: !!(body.ndtRequired ?? body.ndt_required),
      scaffolding_required: !!(body.scaffoldingRequired ?? body.scaffolding_required),
      insulation_removal_required: !!(body.insulationRemovalRequired ?? body.insulation_removal_required),
      cleaning_required: !!(body.cleaningRequired ?? body.cleaning_required),
      special_safety_precautions: body.specialSafetyPrecautions ?? body.special_safety_precautions ?? null,
      updated_at: new Date().toISOString()
    };
    const existing = await this.db.single<any>(this.db.from('mi_inspection_plan_scopes').select('id').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_inspection_plan_scopes').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_inspection_plan_scopes').insert(payload).select().single());
  }

  private async upsertInspectionPlanCmlScope(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getInspectionPlanBase(user, planId);
    const selected = body.selectedCmlIds ?? body.selected_cml_ids_json ?? [];
    if (Array.isArray(selected) && selected.length) await this.validateInspectionCmlScope(plan, selected);
    const payload = {
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: planId,
      equipment_id: plan.equipment_id,
      scope_mode: body.scopeMode ?? body.scope_mode ?? (Array.isArray(selected) && selected.length ? 'selected' : 'none'),
      include_all_active_cmls: !!(body.includeAllActiveCmls ?? body.include_all_active_cmls),
      component_type_filter: body.componentTypeFilter ?? body.component_type_filter ?? null,
      corrosion_zone_filter: body.corrosionZoneFilter ?? body.corrosion_zone_filter ?? null,
      damage_mechanism_filter: body.damageMechanismFilter ?? body.damage_mechanism_filter ?? null,
      alert_state_filter: body.alertStateFilter ?? body.alert_state_filter ?? null,
      selected_cml_ids_json: selected,
      selection_snapshot_json: await this.cmlSelectionSnapshot(plan.equipment_id, selected),
      updated_at: new Date().toISOString()
    };
    const existing = await this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').select('id').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_inspection_plan_cml_scope').insert(payload).select().single());
  }

  private async upsertInspectionPlanSchedule(user: RequestUser, planId: string, body: Record<string, any>) {
    const plan = await this.getInspectionPlanBase(user, planId);
    const payload: Record<string, any> = {
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: planId,
      equipment_id: plan.equipment_id,
      scheduling_mode: body.schedulingMode ?? body.scheduling_mode ?? 'Fixed calendar interval',
      frequency_value: this.numberOrNull(body.frequencyValue ?? body.frequency_value),
      frequency_unit: body.frequencyUnit ?? body.frequency_unit ?? null,
      last_inspection_date: body.lastInspectionDate ?? body.last_inspection_date ?? null,
      manual_override_due_date: body.manualOverrideDueDate ?? body.manual_override_due_date ?? null,
      manual_override_reason: body.manualOverrideReason ?? body.manual_override_reason ?? null,
      rule_id: body.ruleId ?? body.rule_id ?? null,
      remaining_life_source: body.remainingLifeSource ?? body.remaining_life_source ?? null,
      cml_scope_source: body.cmlScopeSource ?? body.cml_scope_source ?? null,
      governing_cml_id: body.governingCmlId ?? body.governing_cml_id ?? null,
      occurrence_generation_window_value: Number(body.occurrenceGenerationWindowValue ?? body.occurrence_generation_window_value ?? 1),
      occurrence_generation_window_unit: body.occurrenceGenerationWindowUnit ?? body.occurrence_generation_window_unit ?? 'Years',
      scheduler_notes: body.schedulerNotes ?? body.scheduler_notes ?? null,
      updated_at: new Date().toISOString()
    };
    if (payload.rule_id) {
      const rule = await this.db.single<any>(this.db.from('mi_inspection_schedule_rules').select('*').eq('company_id', plan.company_id).eq('id', payload.rule_id).maybeSingle());
      if (!rule) throw new BadRequestException('Scheduler rule must belong to the same company/site scope.');
      payload.rule_snapshot_json = rule;
    }
    const existing = await this.db.single<any>(this.db.from('mi_inspection_plan_schedules').select('id').eq('plan_id', planId).maybeSingle()).catch(() => null);
    if (existing) return this.db.single<any>(this.db.from('mi_inspection_plan_schedules').update(payload).eq('id', existing.id).select().single());
    return this.db.single<any>(this.db.from('mi_inspection_plan_schedules').insert(payload).select().single());
  }

  private async replaceInspectionChecklist(user: RequestUser, planId: string, items: any[]) {
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.db.many<any>(this.db.from('mi_inspection_plan_checklist_items').delete().eq('plan_id', planId).select()).catch(() => []);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!(item.itemTitle ?? item.item_title)?.trim()) continue;
      await this.db.single(this.db.from('mi_inspection_plan_checklist_items').insert({
        company_id: plan.company_id,
        site_id: plan.site_id,
        plan_id: planId,
        item_number: item.itemNumber ?? item.item_number ?? String(index + 1),
        section_title: item.sectionTitle ?? item.section_title ?? null,
        item_title: item.itemTitle ?? item.item_title,
        requirement_text: item.requirementText ?? item.requirement_text ?? item.requirement ?? null,
        response_type: item.responseType ?? item.response_type ?? 'Pass/Fail',
        acceptance_criteria: item.acceptanceCriteria ?? item.acceptance_criteria ?? null,
        evidence_required: !!(item.evidenceRequired ?? item.evidence_required),
        attachment_required: !!(item.attachmentRequired ?? item.attachment_required),
        required: item.required ?? true,
        sort_order: Number(item.sortOrder ?? item.sort_order ?? index),
        active: item.active ?? true
      }).select().single()).catch(() => null);
    }
  }

  private async replaceInspectionCriteria(user: RequestUser, planId: string, criteria: any[]) {
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.db.many<any>(this.db.from('mi_inspection_plan_acceptance_criteria').delete().eq('plan_id', planId).select()).catch(() => []);
    for (const criterion of criteria) {
      if (!(criterion.criterionType ?? criterion.criterion_type)?.trim()) continue;
      await this.db.single(this.db.from('mi_inspection_plan_acceptance_criteria').insert({
        company_id: plan.company_id,
        site_id: plan.site_id,
        plan_id: planId,
        criterion_type: criterion.criterionType ?? criterion.criterion_type,
        criterion_key: criterion.criterionKey ?? criterion.criterion_key ?? criterion.criterionType ?? criterion.criterion_type,
        operator: criterion.operator ?? null,
        value_numeric: this.numberOrNull(criterion.valueNumeric ?? criterion.value_numeric),
        value_text: criterion.valueText ?? criterion.value_text ?? null,
        unit: criterion.unit ?? null,
        severity_if_failed: criterion.severityIfFailed ?? criterion.severity_if_failed ?? null,
        create_deficiency_on_fail: !!(criterion.createDeficiencyOnFail ?? criterion.create_deficiency_on_fail),
        notes: criterion.notes ?? null
      }).select().single()).catch(() => null);
    }
  }

  private async replaceInspectionDocuments(user: RequestUser, planId: string, docs: any[]) {
    const plan = await this.getInspectionPlanBase(user, planId);
    await this.db.many<any>(this.db.from('mi_inspection_plan_documents').delete().eq('plan_id', planId).select()).catch(() => []);
    for (const doc of docs) {
      if (!doc.title?.trim()) continue;
      await this.db.single(this.db.from('mi_inspection_plan_documents').insert({
        company_id: plan.company_id,
        site_id: plan.site_id,
        plan_id: planId,
        document_id: doc.documentId ?? doc.document_id ?? null,
        file_id: doc.fileId ?? doc.file_id ?? null,
        document_type: doc.documentType ?? doc.document_type ?? 'Reference',
        title: doc.title,
        version: doc.version ?? null,
        status: doc.status ?? 'Linked',
        linked_by: user.id
      }).select().single()).catch(() => null);
    }
  }

  private async calculateInspectionDueDate(user: RequestUser, plan: any, schedule: any, cmlScope: any, schedulerRunId?: string) {
    const today = new Date();
    const candidates: Array<{ date: string; basis: string; source: string; cml?: any }> = [];
    const errors: string[] = [];
    const mode = String(schedule?.scheduling_mode ?? 'Not Configured');
    const lastDate = schedule?.last_inspection_date ? new Date(schedule.last_inspection_date) : plan.effective_date ? new Date(plan.effective_date) : plan.created_at ? new Date(plan.created_at) : null;
    if (schedule?.frequency_value && schedule?.frequency_unit && lastDate) {
      candidates.push({ date: this.addInterval(lastDate, Number(schedule.frequency_value), schedule.frequency_unit).toISOString().slice(0, 10), basis: 'Fixed calendar interval', source: 'fixed_interval' });
    }
    if (/remaining|half|cml|tml/i.test(`${mode} ${plan.plan_type}`)) {
      const governing = await this.governingCmlForPlan(plan, cmlScope);
      if (governing?.snapshot?.remaining_life_years !== null && governing?.snapshot?.remaining_life_years !== undefined && governing.latestDate) {
        const remaining = Number(governing.snapshot.remaining_life_years);
        candidates.push({ date: this.addYears(governing.latestDate, remaining).toISOString().slice(0, 10), basis: 'Remaining life based', source: 'remaining_life', cml: governing });
        candidates.push({ date: this.addYears(governing.latestDate, Math.max(remaining / 2, 0)).toISOString().slice(0, 10), basis: 'Half-life rule based', source: 'half_life', cml: governing });
      } else if (/remaining|half|cml|tml/i.test(mode)) {
        errors.push('Insufficient Data: CML/TML remaining-life calculation data is missing.');
      }
    }
    const rule = schedule?.rule ?? await this.matchInspectionRule(plan);
    if (rule?.maximum_interval_value && lastDate) {
      candidates.push({ date: this.addInterval(lastDate, Number(rule.maximum_interval_value), rule.maximum_interval_unit ?? 'Years').toISOString().slice(0, 10), basis: 'Company/site rule based', source: 'rule_based' });
    } else if (/company|site|rule|rbi/i.test(mode)) {
      errors.push('Scheduler Configuration Required: no active matching company/site rule was found.');
    }
    if (schedule?.manual_override_due_date && schedule?.manual_override_reason) candidates.push({ date: schedule.manual_override_due_date, basis: 'Manual override approved', source: 'manual_override' });
    const winner = candidates.filter((item) => item.date).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
    const days = winner ? this.daysBetween(today, new Date(winner.date)) : null;
    const dueStatus = winner ? this.inspectionDueStatus(days, rule) : errors.length ? 'Blocked' : 'Not Scheduled';
    const schedulerStatus = !schedule ? 'Not Configured' : errors.length ? (/insufficient/i.test(errors.join(' ')) ? 'Insufficient Data' : 'Blocked') : schedule.manual_override_due_date ? 'Manual Override' : winner ? 'Ready' : 'Not Configured';
    const governing = winner?.cml;
    return {
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: plan.id,
      equipment_id: plan.equipment_id,
      scheduler_run_id: schedulerRunId ?? null,
      fixed_interval_due_date: candidates.find((item) => item.source === 'fixed_interval')?.date ?? null,
      remaining_life_due_date: candidates.find((item) => item.source === 'remaining_life')?.date ?? null,
      half_life_due_date: candidates.find((item) => item.source === 'half_life')?.date ?? null,
      rule_based_due_date: candidates.find((item) => item.source === 'rule_based')?.date ?? null,
      rbi_due_date: null,
      manual_override_due_date: candidates.find((item) => item.source === 'manual_override')?.date ?? null,
      final_next_due_date: winner?.date ?? null,
      final_due_basis: winner?.basis ?? null,
      governing_cml_id: governing?.cml?.id ?? null,
      governing_cml_number: governing?.cml?.cml_number ?? null,
      governing_remaining_life_years: governing?.snapshot?.remaining_life_years ?? null,
      scheduler_status: schedulerStatus,
      due_status: dueStatus,
      days_until_due: days !== null && days >= 0 ? days : null,
      days_overdue: days !== null && days < 0 ? Math.abs(days) : null,
      calculation_inputs_json: { planId: plan.id, schedule, cmlScope, rule },
      calculation_result_json: { candidates, winner },
      scheduler_error: errors.join('; ') || null
    };
  }

  private inspectionDueStatus(days: number | null, rule: any) {
    if (days === null) return 'Not Scheduled';
    const dueSoon = Number(rule?.due_soon_threshold_value ?? 30);
    const critical = Number(rule?.critical_overdue_threshold_value ?? 30);
    if (days < -critical) return 'Critical Overdue';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due';
    if (days <= dueSoon) return 'Due Soon';
    return 'Not Due';
  }

  private daysBetween(a: Date, b: Date) {
    const start = new Date(a.toISOString().slice(0, 10));
    const end = new Date(b.toISOString().slice(0, 10));
    return Math.round((end.getTime() - start.getTime()) / 86_400_000);
  }

  private async governingCmlForPlan(plan: any, cmlScope: any) {
    let cmls = await this.db.many<any>(this.db.from('mi_cmls').select('*').eq('equipment_id', plan.equipment_id).eq('active', true)).catch(() => []);
    const selected = Array.isArray(cmlScope?.selected_cml_ids_json) ? cmlScope.selected_cml_ids_json : [];
    if (selected.length && !cmlScope?.include_all_active_cmls) cmls = cmls.filter((cml) => selected.includes(cml.id));
    if (cmlScope?.component_type_filter) cmls = cmls.filter((cml) => cml.component_type === cmlScope.component_type_filter);
    if (cmlScope?.damage_mechanism_filter) cmls = cmls.filter((cml) => cml.damage_mechanism === cmlScope.damage_mechanism_filter);
    const snapshots = await this.latestCmlSnapshots(plan.equipment_id);
    return cmls.map((cml) => ({ cml, snapshot: snapshots.get(cml.id), latestDate: snapshots.get(cml.id)?.latest_reading_date ? new Date(snapshots.get(cml.id).latest_reading_date) : null }))
      .filter((item) => item.snapshot?.remaining_life_years !== null && item.snapshot?.remaining_life_years !== undefined)
      .sort((a, b) => Number(a.snapshot.remaining_life_years) - Number(b.snapshot.remaining_life_years))[0] ?? null;
  }

  private async matchInspectionRule(plan: any) {
    const rules = await this.db.many<any>(this.db.from('mi_inspection_schedule_rules').select('*').eq('company_id', plan.company_id).eq('active', true)).catch(() => []);
    return rules.find((rule) => (rule.site_id === null || rule.site_id === plan.site_id) && (!rule.plan_type || rule.plan_type === plan.plan_type) && (!rule.inspection_method || rule.inspection_method === plan.inspection_method) && (!rule.equipment_type_key || rule.equipment_type_key === plan.equipment?.equipment_type_key)) ?? null;
  }

  private async generateInspectionOccurrence(user: RequestUser, plan: any, evaluation: any) {
    const dueDate = evaluation.final_next_due_date;
    if (!dueDate) return null;
    const existing = await this.db.single<any>(this.db.from('mi_inspection_schedule_occurrences').select('*').eq('plan_id', plan.id).eq('due_date', dueDate).maybeSingle()).catch(() => null);
    if (existing) return null;
    const open = await this.db.many<any>(this.db.from('mi_inspection_schedule_occurrences').select('*').eq('plan_id', plan.id).in('status', ['Scheduled', 'Due Soon', 'Due', 'Overdue'])).catch(() => []);
    for (const occurrence of open) {
      await this.db.single(this.db.from('mi_inspection_schedule_occurrences').update({ status: 'Superseded', updated_at: new Date().toISOString() }).eq('id', occurrence.id).select('id').single()).catch(() => null);
    }
    const occurrence = await this.db.single<any>(this.db.from('mi_inspection_schedule_occurrences').insert({
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: plan.id,
      equipment_id: plan.equipment_id,
      occurrence_number: `${plan.plan_number}-OCC-${String(open.length + 1).padStart(3, '0')}`,
      due_date: dueDate,
      due_basis: evaluation.final_due_basis,
      status: evaluation.due_status === 'Not Due' ? 'Scheduled' : evaluation.due_status,
      assigned_user_id: plan.responsible_user_id ?? null,
      assigned_team_id: plan.responsible_team_id ?? null,
      generated_by_scheduler_run_id: evaluation.scheduler_run_id ?? null,
      source_due_date_evaluation_id: evaluation.id ?? null,
      source_rule_id: evaluation.calculation_inputs_json?.rule?.id ?? null
    }).select().single());
    await this.addMiHistory(user, plan.equipment_id, 'INSPECTION_OCCURRENCE_GENERATED', 'Inspection occurrence generated', occurrence.occurrence_number, null, occurrence, 'Inspection Occurrence', occurrence.id);
    return occurrence;
  }

  private async validateInspectionCmlScope(plan: any, selected: string[]) {
    const cmls = await this.db.many<any>(this.db.from('mi_cmls').select('id').eq('equipment_id', plan.equipment_id).in('id', selected)).catch(() => []);
    if (cmls.length !== selected.length) throw new BadRequestException('Selected CML/TML points must belong to the same equipment.');
  }

  private async cmlSelectionSnapshot(equipmentId: string, selected: any[]) {
    if (!Array.isArray(selected) || !selected.length) return [];
    return this.db.many<any>(this.db.from('mi_cmls').select('id,cml_number,location_description,component_type,damage_mechanism,status,active').eq('equipment_id', equipmentId).in('id', selected)).catch(() => []);
  }

  private withInspectionPlanDerived(row: any) {
    return {
      ...row,
      planId: row.id,
      planNumber: row.plan_number,
      planTitle: row.plan_title,
      planType: row.plan_type,
      inspectionMethod: row.inspection_method,
      approvalStatus: row.approval_status,
      revisionNumber: row.revision_number,
      equipmentId: row.equipment_id,
      equipmentTag: row.equipment?.equipment_tag ?? row.equipment?.tag ?? null,
      equipmentName: row.equipment?.equipment_name ?? row.equipment?.name ?? null,
      equipmentType: row.equipment?.equipment_type_key ?? row.equipment?.equipment_category ?? null,
      nextDueDate: row.current_next_due_date,
      dueStatus: row.current_due_status,
      scheduleBasis: row.current_due_basis,
      schedulerStatus: row.current_scheduler_status,
      lastSchedulerRun: row.updated_at,
      readOnly: ['Archived', 'Superseded'].includes(row.status)
    };
  }

  private inspectionPlanValidation(plan: any, scope: any, cmlScope: any, checklist: any[], criteria: any[], schedule: any, evaluation: any) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!plan.plan_title) blockers.push('Plan title is required.');
    if (!plan.plan_type) blockers.push('Plan type is required.');
    if (!plan.inspection_method) blockers.push('Inspection method is required.');
    if (!scope?.scope_statement) warnings.push('Inspection scope statement is missing.');
    if (!criteria?.length) warnings.push('Acceptance criteria are missing.');
    if (!schedule?.scheduling_mode) blockers.push('Scheduling mode is required.');
    if (/fixed/i.test(String(schedule?.scheduling_mode ?? '')) && (!schedule.frequency_value || !schedule.frequency_unit)) blockers.push('Fixed interval schedule requires frequency value and unit.');
    if (/cml|tml|thickness/i.test(`${plan.plan_type} ${schedule?.scheduling_mode}`) && !cmlScope?.include_all_active_cmls && !(Array.isArray(cmlScope?.selected_cml_ids_json) && cmlScope.selected_cml_ids_json.length)) warnings.push('CML/TML scope is empty for a thickness/CML inspection plan.');
    if (evaluation?.scheduler_error) warnings.push(evaluation.scheduler_error);
    if (!checklist?.length) warnings.push('Checklist foundation has no items.');
    return { blockers, warnings, readyForReview: blockers.length === 0, readyForApproval: blockers.length === 0 && !evaluation?.scheduler_error };
  }

  private inspectionPlanActions(user: RequestUser, plan: any, evaluation: any) {
    const can = (permission: string) => user.permissions?.includes(permission) || user.isSuperAdmin;
    const readOnly = ['Archived', 'Superseded'].includes(plan.status);
    const action = (key: string, permission: string, disabledReason?: string | null) => ({ key, permitted: can(permission), disabled: !!disabledReason || !can(permission), disabledReason: !can(permission) ? 'Missing permission.' : disabledReason ?? null });
    return [
      action('edit', 'mechanical_integrity.inspection_plan.edit', readOnly ? 'Read-only plan.' : null),
      action('submit', 'mechanical_integrity.inspection_plan.submit', plan.status !== 'Draft' ? 'Only draft plans can be submitted.' : null),
      action('approve', 'mechanical_integrity.inspection_plan.approve', plan.approval_status !== 'Pending Review' ? 'Plan is not pending review.' : null),
      action('reject', 'mechanical_integrity.inspection_plan.reject', plan.approval_status !== 'Pending Review' ? 'Plan is not pending review.' : null),
      action('run-scheduler', 'mechanical_integrity.inspection_scheduler.run', evaluation?.scheduler_error ? evaluation.scheduler_error : null),
      action('manual-override', 'mechanical_integrity.inspection_scheduler.override'),
      action('archive', 'mechanical_integrity.inspection_plan.archive', readOnly ? 'Already read-only.' : null),
      action('export', 'mechanical_integrity.inspection_plan.export')
    ];
  }

  private clonePlanForRevision(plan: any) {
    const { id, equipment, created_at, updated_at, archived_at, archived_by, archive_reason, ...rest } = plan;
    return { ...rest, archived_at: null, archived_by: null, archive_reason: null };
  }

  private async copyInspectionPlanChildren(fromPlanId: string, toPlanId: string) {
    const tables = [
      'mi_inspection_plan_scopes',
      'mi_inspection_plan_cml_scope',
      'mi_inspection_plan_checklist_items',
      'mi_inspection_plan_acceptance_criteria',
      'mi_inspection_plan_schedules',
      'mi_inspection_plan_documents'
    ];
    for (const table of tables) {
      const rows = await this.db.many<any>(this.db.from(table).select('*').eq('plan_id', fromPlanId)).catch(() => []);
      for (const row of rows) {
        const { id, created_at, updated_at, ...copy } = row;
        await this.db.single(this.db.from(table).insert({ ...copy, id: crypto.randomUUID(), plan_id: toPlanId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select('id').single()).catch(() => null);
      }
    }
  }

  private createPlanRevisionEvent(user: RequestUser, plan: any, status: string, reason: string, before?: any, after?: any) {
    return this.db.single(this.db.from('mi_inspection_plan_revisions').insert({
      company_id: plan.company_id,
      site_id: plan.site_id,
      plan_id: plan.id,
      revision_number: plan.revision_number ?? 0,
      status,
      change_reason: reason,
      before_value_json: before ?? null,
      after_value_json: after ?? plan,
      submitted_by: status === 'Pending Review' ? user.id : null,
      submitted_at: status === 'Pending Review' ? new Date().toISOString() : null,
      reviewed_by: ['Approved', 'Rejected'].includes(status) ? user.id : null,
      reviewed_at: ['Approved', 'Rejected'].includes(status) ? new Date().toISOString() : null,
      approved_by: status === 'Approved' ? user.id : null,
      approved_at: status === 'Approved' ? new Date().toISOString() : null,
      rejected_by: status === 'Rejected' ? user.id : null,
      rejected_at: status === 'Rejected' ? new Date().toISOString() : null,
      rejection_reason: status === 'Rejected' ? reason : null
    }).select().single()).catch(() => null);
  }

  private schedulerRulePayload(user: RequestUser, body: Record<string, any>, update = false) {
    const payload: Record<string, any> = {
      company_id: this.companyScope(user),
      site_id: body.siteId ?? body.site_id ?? null,
      rule_name: body.ruleName ?? body.rule_name,
      rule_scope: body.ruleScope ?? body.rule_scope ?? 'company',
      equipment_type_key: body.equipmentTypeKey ?? body.equipment_type_key ?? null,
      plan_type: body.planType ?? body.plan_type ?? null,
      inspection_method: body.inspectionMethod ?? body.inspection_method ?? null,
      criticality_category: body.criticalityCategory ?? body.criticality_category ?? null,
      service_severity: body.serviceSeverity ?? body.service_severity ?? null,
      damage_mechanism: body.damageMechanism ?? body.damage_mechanism ?? null,
      maximum_interval_value: Number(body.maximumIntervalValue ?? body.maximum_interval_value),
      maximum_interval_unit: body.maximumIntervalUnit ?? body.maximum_interval_unit ?? 'Years',
      half_life_enabled: body.halfLifeEnabled ?? body.half_life_enabled ?? true,
      remaining_life_enabled: body.remainingLifeEnabled ?? body.remaining_life_enabled ?? true,
      fixed_interval_cap_enabled: body.fixedIntervalCapEnabled ?? body.fixed_interval_cap_enabled ?? true,
      rbi_modifier_enabled: body.rbiModifierEnabled ?? body.rbi_modifier_enabled ?? false,
      due_soon_threshold_value: Number(body.dueSoonThresholdValue ?? body.due_soon_threshold_value ?? 30),
      due_soon_threshold_unit: body.dueSoonThresholdUnit ?? body.due_soon_threshold_unit ?? 'Days',
      critical_overdue_threshold_value: Number(body.criticalOverdueThresholdValue ?? body.critical_overdue_threshold_value ?? 30),
      critical_overdue_threshold_unit: body.criticalOverdueThresholdUnit ?? body.critical_overdue_threshold_unit ?? 'Days',
      grace_period_value: Number(body.gracePeriodValue ?? body.grace_period_value ?? 0),
      grace_period_unit: body.gracePeriodUnit ?? body.grace_period_unit ?? 'Days',
      active: body.active ?? true,
      effective_date: body.effectiveDate ?? body.effective_date ?? new Date().toISOString().slice(0, 10),
      notes: body.notes ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    if (!update) payload.created_by = user.id;
    return payload;
  }

  private async addGlobalMiHistory(user: RequestUser, eventType: string, title: string, description: string, after: any) {
    const equipmentId = after?.equipment_id ?? after?.equipmentId ?? null;
    if (equipmentId) return this.addMiHistory(user, equipmentId, eventType, title, description, null, after, 'MechanicalIntegrity', after?.id ?? null);
    return this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: eventType, entityType: 'MechanicalIntegrity', entityId: after?.id ?? eventType, before: null, after: { after, description } as any });
  }

  async safeguardDashboard(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const [sifs, interlocks, alarms, tests, occurrences] = await Promise.all([
      this.safeguardSifRows(user, query),
      this.safeguardInterlockRows(user, query),
      this.safeguardAlarmRows(user, query),
      this.safeguardTestRows(user, query),
      this.safeguardOccurrenceRows(user, query)
    ]);
    const due = occurrences.filter((row) => ['Due Soon', 'Due'].includes(String(row.status)));
    const overdue = occurrences.filter((row) => /overdue/i.test(String(row.status)));
    const failed = tests.filter((row) => /failed|partial|device failed|logic failed|alarm failed|final element failed/i.test(String(row.final_result)));
    const bypassed = [
      ...sifs.filter((row) => Number(row.active_bypass_count ?? 0) || Number(row.active_inhibit_count ?? 0) || Number(row.active_override_count ?? 0)),
      ...interlocks.filter((row) => row.bypass_status || row.inhibit_status),
      ...alarms.filter((row) => row.shelved_suppressed_status)
    ];
    const summary = {
      totalSifs: sifs.length,
      activeSifs: sifs.filter((row) => ['Active', 'In Service'].includes(String(row.status))).length,
      sifsLinkedToLopaSil: sifs.filter((row) => row.lopa_sil?.length).length,
      targetSil1: sifs.filter((row) => this.targetSil(row) === 'SIL 1').length,
      targetSil2: sifs.filter((row) => this.targetSil(row) === 'SIL 2').length,
      targetSil3: sifs.filter((row) => this.targetSil(row) === 'SIL 3').length,
      targetSil4: sifs.filter((row) => this.targetSil(row) === 'SIL 4').length,
      proofTestsDueNext30Days: occurrences.filter((row) => row.safeguard_type === 'SIF' && this.isWithin(row.due_date, 30, Date.now())).length,
      proofTestsDueNext90Days: occurrences.filter((row) => row.safeguard_type === 'SIF' && this.isWithin(row.due_date, 90, Date.now())).length,
      overdueProofTests: overdue.filter((row) => row.safeguard_type === 'SIF').length,
      failedProofTests: failed.filter((row) => row.safeguard_type === 'SIF').length,
      totalInterlocks: interlocks.length,
      overdueInterlockTests: overdue.filter((row) => row.safeguard_type === 'Interlock').length,
      failedInterlockTests: failed.filter((row) => row.safeguard_type === 'Interlock').length,
      totalCriticalAlarms: alarms.length,
      overdueCriticalAlarmTests: overdue.filter((row) => row.safeguard_type === 'Critical Alarm').length,
      failedCriticalAlarmTests: failed.filter((row) => row.safeguard_type === 'Critical Alarm').length,
      activeBypassesOverridesInhibits: bypassed.length,
      expiredBypasses: 0,
      degradedSafeguards: sifs.filter((row) => row.degraded || row.status === 'Degraded' || row.status === 'Failed').length + interlocks.filter((row) => row.status === 'Failed').length + alarms.filter((row) => row.status === 'Failed').length,
      startupBlockedBySafeguardStatus: sifs.filter((row) => row.startup_blocked).length + interlocks.filter((row) => row.startup_blocked).length + alarms.filter((row) => row.startup_blocked).length,
      mocRequiredSafeguardChanges: tests.filter((row) => /engineering|review|required/i.test(String(row.final_result))).length
    };
    return {
      header: { title: 'SIS / SIF / Interlocks / Critical Alarms', subtitle: 'Manage safety instrumented safeguards, proof testing, alarm/interlock integrity, and readiness impact', activeSiteId: query.siteId ?? user.selectedSiteId ?? null, lastUpdated: new Date().toISOString() },
      summary,
      health: {
        due,
        overdue,
        failed,
        bypassed,
        lopaSilLinked: sifs.filter((row) => row.lopa_sil?.length),
        readinessImpact: [...sifs, ...interlocks, ...alarms].filter((row) => row.startup_blocked || row.degraded || row.status === 'Failed')
      },
      sifs: sifs.slice(0, 25),
      interlocks: interlocks.slice(0, 25),
      criticalAlarms: alarms.slice(0, 25),
      savedViews: ['All SIFs', 'Active SIFs', 'SIL 1', 'SIL 2', 'SIL 3', 'SIL 4', 'Proof Test Due Soon', 'Proof Test Overdue', 'Failed Proof Tests', 'Active Bypass / Inhibit', 'Degraded Safeguards', 'Linked to LOPA/SIL', 'Missing LOPA Link', 'Startup Blockers', 'MOC Required']
    };
  }

  async sifs(user: RequestUser, query: Record<string, string | undefined> = {}) {
    return this.paginatedSafeguardResponse(await this.safeguardSifRows(user, query), query, (rows) => ({
      total: rows.length,
      active: rows.filter((row) => ['Active', 'In Service'].includes(String(row.status))).length,
      due: rows.filter((row) => /due/i.test(String(row.due_status))).length,
      overdue: rows.filter((row) => /overdue/i.test(String(row.due_status))).length,
      failed: rows.filter((row) => row.last_test_result === 'Failed' || row.status === 'Failed').length
    }));
  }

  async createSif(user: RequestUser, body: Record<string, any>) {
    const equipment = body.protectedEquipmentId || body.protected_equipment_id ? await this.get(user, body.protectedEquipmentId ?? body.protected_equipment_id) : null;
    const siteId = equipment?.siteId ?? equipment?.site_id ?? body.siteId ?? body.site_id ?? user.selectedSiteId;
    if (!siteId) throw new BadRequestException('Site is required for SIF records.');
    const companyId = equipment?.companyId ?? equipment?.company_id ?? this.companyScope(user);
    const payload = this.sifPayload(user, body, companyId, siteId);
    this.validateSifPayload(payload, body);
    const sif = await this.db.single<any>(this.db.from('mi_sifs').insert(payload).select().single());
    if (equipment) await this.upsertSifProtection(user, sif, { ...body, protectedEquipmentId: equipment.id ?? equipment.equipmentId });
    await this.upsertSifChild('mi_sif_cause_effect', 'sif_id', sif, this.sifCauseEffectPayload(body));
    await this.upsertSifChild('mi_sif_architecture', 'sif_id', sif, this.sifArchitecturePayload(body));
    await this.upsertSifChild('mi_sif_sil_data', 'sif_id', sif, this.sifSilDataPayload(body));
    await this.upsertSifChild('mi_sif_test_requirements', 'sif_id', sif, this.sifTestRequirementPayload(body, sif));
    await this.updateSifReadiness(user, sif.id);
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sif.id, protected_equipment_id: equipment?.id ?? equipment?.equipmentId }, 'SIF_CREATED', 'SIF created', null, sif);
    return this.sifDetail(user, sif.id);
  }

  async sifDetail(user: RequestUser, sifId: string) {
    const sif = await this.getSif(user, sifId);
    const [protection, lopaSil, causeEffect, architecture, devices, silData, testRequirement, bypass, demands, tests, history, readiness] = await Promise.all([
      this.db.many<any>(this.db.from('mi_sif_protection_scope').select('*').eq('sif_id', sifId)).catch(() => []),
      this.db.many<any>(this.db.from('mi_sif_lopa_sil_links').select('*').eq('sif_id', sifId)).catch(() => []),
      this.db.single<any>(this.db.from('mi_sif_cause_effect').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('mi_sif_architecture').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.db.many<any>(this.db.from('mi_sif_devices').select('*').eq('sif_id', sifId)).catch(() => []),
      this.db.single<any>(this.db.from('mi_sif_sil_data').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('mi_sif_test_requirements').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.safeguardBypassFoundation(user, 'SIF', sifId).catch(() => null),
      this.safeguardDemands(user, 'SIF', sifId).catch(() => []),
      this.safeguardTests(user, { sifId }).then((x) => x.rows).catch(() => []),
      this.db.many<any>(this.db.from('mi_safeguard_history_events').select('*').eq('sif_id', sifId).order('created_at', { ascending: false }).limit(50)).catch(() => []),
      this.db.single<any>(this.db.from('mi_sif_readiness').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null)
    ]);
    return { sif: this.decorateSif(sif), protection, lopaSil, causeEffect, architecture, devices, silData, testRequirement, bypass, demands, tests, history, readiness, actions: this.safeguardActions(user, sif) };
  }

  async updateSif(user: RequestUser, sifId: string, body: Record<string, any>) {
    const before = await this.getSif(user, sifId);
    this.assertEditableSafeguard(before);
    const payload = this.sifPayload(user, body, before.company_id, before.site_id, true);
    this.validateSifPayload({ ...before, ...payload }, body);
    const after = await this.db.single<any>(this.db.from('mi_sifs').update(payload).eq('id', sifId).select().single());
    if (body.protectedEquipmentId || body.protected_equipment_id || body.hazardScenarioTitle) await this.upsertSifProtection(user, after, body);
    if (Object.keys(this.sifCauseEffectPayload(body)).length) await this.upsertSifChild('mi_sif_cause_effect', 'sif_id', after, this.sifCauseEffectPayload(body));
    if (Object.keys(this.sifArchitecturePayload(body)).length) await this.upsertSifChild('mi_sif_architecture', 'sif_id', after, this.sifArchitecturePayload(body));
    if (Object.keys(this.sifSilDataPayload(body)).length) await this.upsertSifChild('mi_sif_sil_data', 'sif_id', after, this.sifSilDataPayload(body));
    if (Object.keys(this.sifTestRequirementPayload(body, after)).length) await this.upsertSifChild('mi_sif_test_requirements', 'sif_id', after, this.sifTestRequirementPayload(body, after));
    await this.updateSifReadiness(user, sifId);
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIF_UPDATED', 'SIF updated', before, after);
    return this.sifDetail(user, sifId);
  }

  async archiveSif(user: RequestUser, sifId: string, reason?: string) {
    if (!reason?.trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.getSif(user, sifId);
    const after = await this.db.single<any>(this.db.from('mi_sifs').update({ status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', sifId).select().single());
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIF_ARCHIVED', 'SIF archived', before, after);
    return this.sifDetail(user, sifId);
  }

  async reactivateSif(user: RequestUser, sifId: string, reason?: string) {
    const before = await this.getSif(user, sifId);
    const after = await this.db.single<any>(this.db.from('mi_sifs').update({ status: 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', sifId).select().single());
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIF_REACTIVATED', reason ?? 'SIF reactivated', before, after);
    return this.sifDetail(user, sifId);
  }

  async sifDevices(user: RequestUser, sifId: string) {
    await this.getSif(user, sifId);
    return this.db.many<any>(this.db.from('mi_sif_devices').select('*').eq('sif_id', sifId).order('device_role'));
  }

  async addSifDevice(user: RequestUser, sifId: string, body: Record<string, any>) {
    const sif = await this.getSif(user, sifId);
    this.assertEditableSafeguard(sif);
    if (!body.deviceTag && !body.device_tag) throw new BadRequestException('Device tag is required.');
    if (!body.deviceRole && !body.device_role) throw new BadRequestException('Device role is required.');
    if (body.linkedEquipmentId || body.linked_equipment_id) await this.get(user, body.linkedEquipmentId ?? body.linked_equipment_id);
    const row = await this.db.single<any>(this.db.from('mi_sif_devices').insert({ ...this.sifDevicePayload(body), company_id: sif.company_id, site_id: sif.site_id, sif_id: sifId, created_by: user.id, updated_by: user.id }).select().single());
    await this.updateSifReadiness(user, sifId);
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIF_DEVICE_ADDED', 'SIF device added', null, row);
    return row;
  }

  async updateSifDevice(user: RequestUser, sifId: string, deviceId: string, body: Record<string, any>) {
    const sif = await this.getSif(user, sifId);
    this.assertEditableSafeguard(sif);
    const before = await this.db.single<any>(this.db.from('mi_sif_devices').select('*').eq('sif_id', sifId).eq('id', deviceId).maybeSingle());
    if (!before) throw new BadRequestException('SIF device was not found.');
    const after = await this.db.single<any>(this.db.from('mi_sif_devices').update({ ...this.sifDevicePayload(body), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', deviceId).select().single());
    await this.updateSifReadiness(user, sifId);
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIF_DEVICE_UPDATED', 'SIF device updated', before, after);
    return after;
  }

  async removeSifDevice(user: RequestUser, sifId: string, deviceId: string) {
    const sif = await this.getSif(user, sifId);
    this.assertEditableSafeguard(sif);
    const before = await this.db.single<any>(this.db.from('mi_sif_devices').delete().eq('sif_id', sifId).eq('id', deviceId).select().single());
    await this.updateSifReadiness(user, sifId);
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIF_DEVICE_REMOVED', 'SIF device removed', before, null);
    return { deleted: true, id: deviceId };
  }

  async sifLopaSil(user: RequestUser, sifId: string) { await this.getSif(user, sifId); return this.db.many<any>(this.db.from('mi_sif_lopa_sil_links').select('*').eq('sif_id', sifId)); }
  async upsertSifLopaSil(user: RequestUser, sifId: string, body: Record<string, any>) {
    const sif = await this.getSif(user, sifId);
    const payload = { ...this.sifLopaPayload(body), company_id: sif.company_id, site_id: sif.site_id, sif_id: sifId, updated_at: new Date().toISOString() };
    const existing = await this.db.single<any>(this.db.from('mi_sif_lopa_sil_links').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null);
    const row = existing ? await this.db.single<any>(this.db.from('mi_sif_lopa_sil_links').update(payload).eq('id', existing.id).select().single()) : await this.db.single<any>(this.db.from('mi_sif_lopa_sil_links').insert(payload).select().single());
    await this.updateSifReadiness(user, sifId);
    await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'LOPA_SIL_LINK_UPDATED', 'LOPA/SIL link updated', existing, row);
    return row;
  }
  async sifCauseEffect(user: RequestUser, sifId: string) { await this.getSif(user, sifId); return this.db.single<any>(this.db.from('mi_sif_cause_effect').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null); }
  async updateSifCauseEffect(user: RequestUser, sifId: string, body: Record<string, any>) { const sif = await this.getSif(user, sifId); const row = await this.upsertSifChild('mi_sif_cause_effect', 'sif_id', sif, this.sifCauseEffectPayload(body)); await this.updateSifReadiness(user, sifId); await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'CAUSE_EFFECT_CHANGED', 'Cause and effect changed', null, row); return row; }
  async sifSilData(user: RequestUser, sifId: string) { await this.getSif(user, sifId); return this.db.single<any>(this.db.from('mi_sif_sil_data').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null); }
  async updateSifSilData(user: RequestUser, sifId: string, body: Record<string, any>) { const sif = await this.getSif(user, sifId); const row = await this.upsertSifChild('mi_sif_sil_data', 'sif_id', sif, this.sifSilDataPayload(body)); await this.updateSifReadiness(user, sifId); await this.addSafeguardHistory(user, { safeguard_type: 'SIF', sif_id: sifId }, 'SIL_DATA_CHANGED', 'SIL data changed', null, row); return row; }

  async interlocks(user: RequestUser, query: Record<string, string | undefined> = {}) {
    return this.paginatedSafeguardResponse(await this.safeguardInterlockRows(user, query), query, (rows) => ({ total: rows.length, active: rows.filter((x) => x.status === 'Active').length, overdue: rows.filter((x) => /overdue/i.test(String(x.due_status))).length, failed: rows.filter((x) => x.last_test_result === 'Failed').length }));
  }
  async createInterlock(user: RequestUser, body: Record<string, any>) { return this.createSimpleSafeguard(user, 'Interlock', body); }
  async interlockDetail(user: RequestUser, interlockId: string) { return { interlock: this.decorateInterlock(await this.getInterlock(user, interlockId)), bypass: await this.safeguardBypassFoundation(user, 'Interlock', interlockId).catch(() => null), tests: (await this.safeguardTests(user, { interlockId })).rows, actions: this.safeguardActions(user, {}) }; }
  async updateInterlock(user: RequestUser, interlockId: string, body: Record<string, any>) { return this.updateSimpleSafeguard(user, 'Interlock', interlockId, body); }
  async archiveInterlock(user: RequestUser, interlockId: string, reason?: string) { return this.archiveSimpleSafeguard(user, 'Interlock', interlockId, reason); }
  async reactivateInterlock(user: RequestUser, interlockId: string, reason?: string) { return this.reactivateSimpleSafeguard(user, 'Interlock', interlockId, reason); }

  async criticalAlarms(user: RequestUser, query: Record<string, string | undefined> = {}) {
    return this.paginatedSafeguardResponse(await this.safeguardAlarmRows(user, query), query, (rows) => ({ total: rows.length, active: rows.filter((x) => x.status === 'Active').length, overdue: rows.filter((x) => /overdue/i.test(String(x.due_status))).length, failed: rows.filter((x) => x.last_test_result === 'Failed').length }));
  }
  async createCriticalAlarm(user: RequestUser, body: Record<string, any>) { return this.createSimpleSafeguard(user, 'Critical Alarm', body); }
  async criticalAlarmDetail(user: RequestUser, alarmId: string) { return { alarm: this.decorateAlarm(await this.getCriticalAlarm(user, alarmId)), bypass: await this.safeguardBypassFoundation(user, 'Critical Alarm', alarmId).catch(() => null), tests: (await this.safeguardTests(user, { alarmId })).rows, actions: this.safeguardActions(user, {}) }; }
  async updateCriticalAlarm(user: RequestUser, alarmId: string, body: Record<string, any>) { return this.updateSimpleSafeguard(user, 'Critical Alarm', alarmId, body); }
  async archiveCriticalAlarm(user: RequestUser, alarmId: string, reason?: string) { return this.archiveSimpleSafeguard(user, 'Critical Alarm', alarmId, reason); }
  async reactivateCriticalAlarm(user: RequestUser, alarmId: string, reason?: string) { return this.reactivateSimpleSafeguard(user, 'Critical Alarm', alarmId, reason); }

  async safeguardTests(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const rows = await this.safeguardTestRows(user, query);
    return this.paginatedSafeguardResponse(rows, query, (items) => ({ total: items.length, draft: items.filter((x) => x.status === 'Draft').length, pendingReview: items.filter((x) => x.status === 'Submitted for Review').length, approved: items.filter((x) => x.status === 'Approved').length, failed: items.filter((x) => /failed/i.test(String(x.final_result))).length }));
  }
  async createSafeguardTest(user: RequestUser, body: Record<string, any>) {
    const ref = await this.getSafeguardReference(user, body.safeguardType ?? body.safeguard_type, body.sifId ?? body.sif_id ?? body.interlockId ?? body.interlock_id ?? body.alarmId ?? body.alarm_id);
    const row = await this.db.single<any>(this.db.from('mi_safeguard_tests').insert({
      company_id: ref.company_id,
      site_id: ref.site_id,
      safeguard_type: ref.safeguard_type,
      sif_id: ref.sif_id,
      interlock_id: ref.interlock_id,
      alarm_id: ref.alarm_id,
      protected_equipment_id: ref.protected_equipment_id ?? body.protectedEquipmentId ?? body.protected_equipment_id ?? null,
      occurrence_id: body.occurrenceId ?? body.occurrence_id ?? null,
      test_record_number: body.testRecordNumber ?? body.test_record_number ?? await this.nextMiSequence('mi_safeguard_tests', 'test_record_number', 'MI-SGT', ref.site_id, ref.company_id),
      planned: body.planned ?? true,
      unplanned_reason: body.unplannedReason ?? body.unplanned_reason ?? null,
      test_date: body.testDate ?? body.test_date ?? new Date().toISOString().slice(0, 10),
      test_type: body.testType ?? body.test_type ?? 'Functional trip test',
      test_location: body.testLocation ?? body.test_location ?? null,
      online_offline_status: body.onlineOfflineStatus ?? body.online_offline_status ?? null,
      shutdown_required: body.shutdownRequired ?? body.shutdown_required ?? false,
      bypass_required: body.bypassRequired ?? body.bypass_required ?? false,
      ptw_id: body.ptwId ?? body.ptw_id ?? null,
      loto_id: body.lotoId ?? body.loto_id ?? null,
      technician_user_id: body.technicianUserId ?? body.technician_user_id ?? null,
      engineer_user_id: body.engineerUserId ?? body.engineer_user_id ?? null,
      reviewer_user_id: body.reviewerUserId ?? body.reviewer_user_id ?? null,
      vendor_name: body.vendorName ?? body.vendor_name ?? null,
      procedure_document_id: body.procedureDocumentId ?? body.procedure_document_id ?? null,
      notes: body.notes ?? null,
      bypass_used: body.bypassUsed ?? body.bypass_used ?? false,
      bypass_restored: body.bypassRestored ?? body.bypass_restored ?? true,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.addSafeguardHistory(user, row, 'SAFEGUARD_TEST_CREATED', 'Safeguard test created', null, row);
    return this.safeguardTestDetail(user, row.id);
  }
  async safeguardTestDetail(user: RequestUser, testId: string) { const test = await this.getSafeguardTest(user, testId); return { test, steps: await this.safeguardTestSteps(user, testId), evaluation: await this.latestSafeguardEvaluation(testId), actions: this.safeguardTestActions(user, test) }; }
  async updateSafeguardTest(user: RequestUser, testId: string, body: Record<string, any>) { const before = await this.getSafeguardTest(user, testId); this.assertEditableTest(before); const after = await this.db.single<any>(this.db.from('mi_safeguard_tests').update(this.safeguardTestUpdatePayload(body, user)).eq('id', testId).select().single()); await this.addSafeguardHistory(user, after, 'SAFEGUARD_TEST_UPDATED', 'Safeguard test updated', before, after); return this.safeguardTestDetail(user, testId); }
  async safeguardTestSteps(user: RequestUser, testId: string) { await this.getSafeguardTest(user, testId); return this.db.many<any>(this.db.from('mi_safeguard_test_steps').select('*').eq('test_id', testId).order('step_number')); }
  async addSafeguardTestStep(user: RequestUser, testId: string, body: Record<string, any>) { const test = await this.getSafeguardTest(user, testId); this.assertEditableTest(test); const row = await this.db.single<any>(this.db.from('mi_safeguard_test_steps').insert({ ...this.safeguardStepPayload(body), company_id: test.company_id, site_id: test.site_id, test_id: testId }).select().single()); await this.addSafeguardHistory(user, test, 'SAFEGUARD_TEST_STEP_ADDED', 'Test step added', null, row); return row; }
  async updateSafeguardTestStep(user: RequestUser, testId: string, stepId: string, body: Record<string, any>) { const test = await this.getSafeguardTest(user, testId); this.assertEditableTest(test); const before = await this.db.single<any>(this.db.from('mi_safeguard_test_steps').select('*').eq('test_id', testId).eq('id', stepId).maybeSingle()); const after = await this.db.single<any>(this.db.from('mi_safeguard_test_steps').update({ ...this.safeguardStepPayload(body), updated_at: new Date().toISOString() }).eq('id', stepId).select().single()); await this.addSafeguardHistory(user, test, 'SAFEGUARD_TEST_STEP_UPDATED', 'Test step updated', before, after); return after; }
  async removeSafeguardTestStep(user: RequestUser, testId: string, stepId: string) { const test = await this.getSafeguardTest(user, testId); this.assertEditableTest(test); const before = await this.db.single<any>(this.db.from('mi_safeguard_test_steps').delete().eq('test_id', testId).eq('id', stepId).select().single()); await this.addSafeguardHistory(user, test, 'SAFEGUARD_TEST_STEP_REMOVED', 'Test step removed', before, null); return { deleted: true, id: stepId }; }
  async evaluateSafeguardTest(user: RequestUser, testId: string) { const test = await this.getSafeguardTest(user, testId); const steps = await this.safeguardTestSteps(user, testId); const evaluation = this.evaluateSafeguardSteps(test, steps); const row = await this.db.single<any>(this.db.from('mi_safeguard_test_evaluations').insert({ ...evaluation, company_id: test.company_id, site_id: test.site_id, test_id: testId, safeguard_type: test.safeguard_type, sif_id: test.sif_id, interlock_id: test.interlock_id, alarm_id: test.alarm_id, evaluated_by: user.id }).select().single()); await this.db.single(this.db.from('mi_safeguard_tests').update({ final_result: row.final_result, evaluation_status: 'Evaluated', updated_at: new Date().toISOString(), updated_by: user.id }).eq('id', testId).select('id').single()); await this.addSafeguardHistory(user, test, 'SAFEGUARD_TEST_EVALUATED', 'Safeguard test evaluated', test, row); return row; }
  async submitSafeguardTest(user: RequestUser, testId: string) { const test = await this.getSafeguardTest(user, testId); this.assertEditableTest(test); const evaluation = await this.evaluateSafeguardTest(user, testId); if (evaluation.failed_steps_count && !test.notes) throw new BadRequestException('Failed safeguard tests require notes or finding/repair context before submit.'); const after = await this.db.single<any>(this.db.from('mi_safeguard_tests').update({ status: 'Submitted for Review', review_status: 'Pending Review', submitted_by: user.id, submitted_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select().single()); await this.addSafeguardHistory(user, after, 'SAFEGUARD_TEST_SUBMITTED', 'Safeguard test submitted', test, after); return this.safeguardTestDetail(user, testId); }
  async approveSafeguardTest(user: RequestUser, testId: string, body: Record<string, any>) { const test = await this.getSafeguardTest(user, testId); const evaluation = await this.latestSafeguardEvaluation(testId) ?? await this.evaluateSafeguardTest(user, testId); if (test.bypass_used && !test.bypass_restored) throw new BadRequestException('Test cannot be approved because bypass/inhibit was not restored.'); const after = await this.db.single<any>(this.db.from('mi_safeguard_tests').update({ status: 'Approved', review_status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), notes: body.notes ?? test.notes, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select().single()); await this.markSafeguardEvaluationOfficial(testId); await this.applyApprovedSafeguardTest(user, after, evaluation); await this.addSafeguardHistory(user, after, 'SAFEGUARD_TEST_APPROVED', 'Safeguard test approved', test, after); return this.safeguardTestDetail(user, testId); }
  async rejectSafeguardTest(user: RequestUser, testId: string, body: Record<string, any>) { if (!body.reason && !body.rejectionReason) throw new BadRequestException('Rejection reason is required.'); const test = await this.getSafeguardTest(user, testId); const after = await this.db.single<any>(this.db.from('mi_safeguard_tests').update({ status: 'Rejected', review_status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: body.reason ?? body.rejectionReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select().single()); await this.addSafeguardHistory(user, after, 'SAFEGUARD_TEST_REJECTED', 'Safeguard test rejected', test, after); return this.safeguardTestDetail(user, testId); }
  async returnSafeguardTest(user: RequestUser, testId: string, body: Record<string, any>) { if (!body.reason && !body.returnReason) throw new BadRequestException('Return reason is required.'); const test = await this.getSafeguardTest(user, testId); const after = await this.db.single<any>(this.db.from('mi_safeguard_tests').update({ status: 'Returned for Correction', review_status: 'Returned', returned_by: user.id, returned_at: new Date().toISOString(), return_reason: body.reason ?? body.returnReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', testId).select().single()); await this.addSafeguardHistory(user, after, 'SAFEGUARD_TEST_RETURNED', 'Safeguard test returned for correction', test, after); return this.safeguardTestDetail(user, testId); }

  async recalculateSafeguardSchedule(user: RequestUser, safeguardType: string, id: string) { const ref = await this.getSafeguardReference(user, safeguardType, id); const due = this.nextDueFromFrequency(new Date(), 1, 'Years'); const status = this.safeguardDueStatus(due); await this.updateSafeguardScheduleFields(ref, due, status); const occurrence = await this.ensureSafeguardOccurrence(user, ref, due, 'Manual schedule recalculation'); return { dueDate: due, dueStatus: status, occurrence }; }
  async runSafeguardScheduler(user: RequestUser, query: Record<string, any> = {}) { const sifs = await this.safeguardSifRows(user, query); const interlocks = await this.safeguardInterlockRows(user, query); const alarms = await this.safeguardAlarmRows(user, query); const created: any[] = []; for (const row of [...sifs.map((x) => ({ ...x, safeguard_type: 'SIF', sif_id: x.id })), ...interlocks.map((x) => ({ ...x, safeguard_type: 'Interlock', interlock_id: x.id })), ...alarms.map((x) => ({ ...x, safeguard_type: 'Critical Alarm', alarm_id: x.id }))]) { const due = row.next_test_due_date ?? this.nextDueFromFrequency(new Date(row.last_test_date ?? row.created_at ?? Date.now()), 1, 'Years'); if (due) created.push(await this.ensureSafeguardOccurrence(user, row, due, 'Scheduler run')); } return { status: 'Completed', generated: created.filter(Boolean).length, occurrences: created.filter(Boolean) }; }
  async safeguardOccurrences(user: RequestUser, query: Record<string, string | undefined> = {}) { return this.paginatedSafeguardResponse(await this.safeguardOccurrenceRows(user, query), query, (rows) => ({ total: rows.length, overdue: rows.filter((x) => /overdue/i.test(String(x.status))).length })); }
  async createSafeguardTestFromOccurrence(user: RequestUser, occurrenceId: string) { const occurrence = await this.getSafeguardOccurrence(user, occurrenceId); return this.createSafeguardTest(user, { safeguardType: occurrence.safeguard_type, sifId: occurrence.sif_id, interlockId: occurrence.interlock_id, alarmId: occurrence.alarm_id, occurrenceId, testDate: new Date().toISOString().slice(0, 10), testType: occurrence.safeguard_type === 'SIF' ? 'Full loop proof test' : 'Functional trip test' }); }
  async completeSafeguardOccurrence(user: RequestUser, occurrenceId: string, body: Record<string, any>) { const before = await this.getSafeguardOccurrence(user, occurrenceId); const after = await this.db.single<any>(this.db.from('mi_safeguard_occurrences').update({ status: 'Completed', completed_test_id: body.testId ?? body.test_id ?? null, completed_at: new Date().toISOString(), completed_by: user.id, updated_at: new Date().toISOString() }).eq('id', occurrenceId).select().single()); await this.addSafeguardHistory(user, after, 'SAFEGUARD_OCCURRENCE_COMPLETED', 'Safeguard occurrence completed', before, after); return after; }

  async safeguardDemands(user: RequestUser, safeguardType: string, id: string) { const ref = await this.getSafeguardReference(user, safeguardType, id); return this.db.many<any>(this.applySafeguardScope(this.db.from('mi_safeguard_demands').select('*'), user, {}).eq(this.refColumn(ref.safeguard_type), id).order('event_datetime', { ascending: false })).catch(() => []); }
  async createSafeguardDemand(user: RequestUser, safeguardType: string, id: string, body: Record<string, any>) { const ref = await this.getSafeguardReference(user, safeguardType, id); if (!body.eventDatetime && !body.event_datetime) throw new BadRequestException('Demand event date/time is required.'); const row = await this.db.single<any>(this.db.from('mi_safeguard_demands').insert({ company_id: ref.company_id, site_id: ref.site_id, safeguard_type: ref.safeguard_type, sif_id: ref.sif_id, interlock_id: ref.interlock_id, alarm_id: ref.alarm_id, demand_event_number: body.demandEventNumber ?? body.demand_event_number ?? await this.nextMiSequence('mi_safeguard_demands', 'demand_event_number', 'MI-SGD', ref.site_id, ref.company_id), event_datetime: body.eventDatetime ?? body.event_datetime, demand_type: body.demandType ?? body.demand_type ?? 'Actual demand', actual_trip: body.actualTrip ?? body.actual_trip ?? false, spurious_trip: body.spuriousTrip ?? body.spurious_trip ?? false, successful_action: body.successfulAction ?? body.successful_action ?? false, failed_action: body.failedAction ?? body.failed_action ?? false, process_condition: body.processCondition ?? body.process_condition ?? null, cause: body.cause ?? null, consequence_prevented: body.consequencePrevented ?? body.consequence_prevented ?? null, linked_incident_id: body.linkedIncidentId ?? body.linked_incident_id ?? null, event_log_document_id: body.eventLogDocumentId ?? body.event_log_document_id ?? null, investigation_required: body.investigationRequired ?? body.investigation_required ?? false, notes: body.notes ?? null, created_by: user.id }).select().single()); await this.addSafeguardHistory(user, row, row.failed_action ? 'FAILED_DEMAND_RECORDED' : 'DEMAND_RECORDED', row.failed_action ? 'Failed demand recorded' : 'Demand event recorded', null, row); return row; }
  async getSafeguardDemand(user: RequestUser, safeguardType: string, id: string, demandId: string) { await this.getSafeguardReference(user, safeguardType, id); const row = await this.db.single<any>(this.applySafeguardScope(this.db.from('mi_safeguard_demands').select('*'), user, {}).eq('id', demandId).maybeSingle()); if (!row) throw new BadRequestException('Demand event was not found.'); return row; }
  async updateSafeguardDemand(user: RequestUser, safeguardType: string, id: string, demandId: string, body: Record<string, any>) { const before = await this.getSafeguardDemand(user, safeguardType, id, demandId); const after = await this.db.single<any>(this.db.from('mi_safeguard_demands').update({ ...this.safeSnakePayload(body), updated_at: new Date().toISOString() }).eq('id', demandId).select().single()); await this.addSafeguardHistory(user, after, 'DEMAND_UPDATED', 'Demand event updated', before, after); return after; }

  async safeguardBypassFoundation(user: RequestUser, safeguardType: string, id: string) { const ref = await this.getSafeguardReference(user, safeguardType, id); return this.db.single<any>(this.applySafeguardScope(this.db.from('mi_safeguard_bypass_foundation').select('*'), user, {}).eq(this.refColumn(ref.safeguard_type), id).maybeSingle()).catch(() => null); }
  async updateSafeguardBypassFoundation(user: RequestUser, safeguardType: string, id: string, body: Record<string, any>) { const ref = await this.getSafeguardReference(user, safeguardType, id); const existing = await this.safeguardBypassFoundation(user, safeguardType, id); const payload = { ...this.safeSnakePayload(body), company_id: ref.company_id, site_id: ref.site_id, safeguard_type: ref.safeguard_type, sif_id: ref.sif_id, interlock_id: ref.interlock_id, alarm_id: ref.alarm_id, updated_at: new Date().toISOString() }; const row = existing ? await this.db.single<any>(this.db.from('mi_safeguard_bypass_foundation').update(payload).eq('id', existing.id).select().single()) : await this.db.single<any>(this.db.from('mi_safeguard_bypass_foundation').insert(payload).select().single()); await this.addSafeguardHistory(user, ref, 'BYPASS_FOUNDATION_UPDATED', 'Bypass/inhibit/override foundation updated', existing, row); return row; }

  async equipmentSafeguards(user: RequestUser, equipmentId: string) { await this.get(user, equipmentId); const [sifs, interlocks, alarms, tests] = await Promise.all([this.safeguardSifRows(user, { equipmentId }), this.safeguardInterlockRows(user, { equipmentId }), this.safeguardAlarmRows(user, { equipmentId }), this.safeguardTestRows(user, { equipmentId })]); return { sifs, interlocks, criticalAlarms: alarms, tests, summary: { linkedSifCount: sifs.length, linkedInterlockCount: interlocks.length, linkedCriticalAlarmCount: alarms.length, proofTestsDue: [...sifs, ...interlocks, ...alarms].filter((x) => /due/i.test(String(x.due_status))).length, proofTestsOverdue: [...sifs, ...interlocks, ...alarms].filter((x) => /overdue/i.test(String(x.due_status))).length, failedSafeguardTests: tests.filter((x) => /failed/i.test(String(x.final_result))).length, activeBypassInhibitOverride: sifs.reduce((sum, x) => sum + Number(x.active_bypass_count ?? 0) + Number(x.active_inhibit_count ?? 0) + Number(x.active_override_count ?? 0), 0), degradedSafeguards: [...sifs, ...interlocks, ...alarms].filter((x) => x.degraded || x.status === 'Failed' || x.status === 'Degraded').length, highestSil: this.highestSil(sifs), lopaSilLinkedSafeguards: sifs.filter((x) => x.lopa_sil?.length).length, startupBlockers: [...sifs, ...interlocks, ...alarms].filter((x) => x.startup_blocked).length, lastSafeguardTestResult: tests[0]?.final_result ?? null } }; }

  safeguardsDue(user: RequestUser, query: Record<string, string | undefined> = {}) { return this.safeguardOccurrences(user, { ...query, status: 'Due Soon' }); }
  safeguardsOverdue(user: RequestUser, query: Record<string, string | undefined> = {}) { return this.safeguardOccurrences(user, { ...query, status: 'Overdue' }); }
  async safeguardsFailed(user: RequestUser, query: Record<string, string | undefined> = {}) { return this.paginatedSafeguardResponse((await this.safeguardTestRows(user, query)).filter((x) => /failed/i.test(String(x.final_result))), query, (rows) => ({ total: rows.length })); }
  async safeguardsBypassed(user: RequestUser, query: Record<string, string | undefined> = {}) { const rows = await this.db.many<any>(this.applySafeguardScope(this.db.from('mi_safeguard_bypass_foundation').select('*'), user, query)).catch(() => []); return this.paginatedSafeguardResponse(rows.filter((x) => Number(x.active_bypass_count ?? 0) || Number(x.active_inhibit_count ?? 0) || Number(x.active_override_count ?? 0)), query, (items) => ({ total: items.length })); }

  sifImportTemplate(_user: RequestUser) { return Promise.resolve({ fileName: 'sif-import-template.csv', content: this.csv([], ['sif_tag','sif_number','sif_description','sif_type','sis_system_name','site','unit','area','protected_equipment_tag','hazard_scenario','safe_state','trip_action','target_sil','achieved_sil','lopa_scenario_number','proof_test_frequency','last_proof_test_date','next_proof_test_due','responsible_engineer','status']) }); }
  interlockImportTemplate(_user: RequestUser) { return Promise.resolve({ fileName: 'interlock-import-template.csv', content: this.csv([], ['interlock_tag','interlock_description','interlock_type','protected_equipment_tag','cause_description','effect_action','process_variable','setpoint','setpoint_unit','test_frequency','last_test_date','next_test_due','safety_critical','status']) }); }
  criticalAlarmImportTemplate(_user: RequestUser) { return Promise.resolve({ fileName: 'critical-alarm-import-template.csv', content: this.csv([], ['alarm_tag','alarm_description','alarm_type','protected_equipment_tag','process_variable','setpoint','setpoint_unit','priority','operator_response_time','required_operator_action','test_frequency','last_test_date','next_test_due','safety_critical','status']) }); }
  safeguardTestImportTemplate(_user: RequestUser) { return Promise.resolve({ fileName: 'safeguard-test-import-template.csv', content: this.csv([], ['safeguard_type','safeguard_tag','test_date','test_type','result','technician','reviewer','bypass_used','bypass_restored','failed_steps_count','notes']) }); }
  async importSafeguards(user: RequestUser, importType: string, body: Record<string, any>) { const rows = Array.isArray(body.rows) ? body.rows : []; const job = await this.db.single<any>(this.db.from('mi_safeguard_import_jobs').insert({ company_id: this.companyScope(user), site_id: body.siteId ?? user.selectedSiteId ?? null, import_type: importType, file_name: body.fileName ?? `${importType.toLowerCase().replace(/\s+/g, '-')}-import.csv`, total_rows: rows.length, status: 'Uploaded', uploaded_by: user.id }).select().single()); for (let index = 0; index < rows.length; index++) await this.db.single(this.db.from('mi_safeguard_import_rows').insert({ job_id: job.id, row_number: index + 1, raw_data_json: rows[index], normalized_data_json: rows[index], validation_status: 'Pending', validation_errors_json: [] }).select('id').single()).catch(() => null); await this.addSafeguardHistory(user, { company_id: this.companyScope(user), site_id: body.siteId ?? user.selectedSiteId, safeguard_type: importType, id: job.id }, 'SAFEGUARD_IMPORT_CREATED', 'Safeguard import job created', null, job); return job; }
  async exportSifs(user: RequestUser, query: Record<string, string | undefined>) { const rows = await this.safeguardSifRows(user, query); return { fileName: 'sifs.csv', content: this.csv(rows, ['sif_tag','sif_number','sif_description','sif_type','status','target_sil','achieved_sil','due_status','last_test_result']) }; }
  async exportSif(user: RequestUser, sifId: string) { const detail = await this.sifDetail(user, sifId); return { fileName: `${detail.sif.sif_tag ?? 'sif'}-summary.csv`, content: this.csv([detail.sif], ['sif_tag','sif_number','sif_description','sif_type','status','due_status','last_test_result']) }; }
  async exportInterlocks(user: RequestUser, query: Record<string, string | undefined>) { const rows = await this.safeguardInterlockRows(user, query); return { fileName: 'interlocks.csv', content: this.csv(rows, ['interlock_tag','interlock_description','interlock_type','status','due_status','last_test_result']) }; }
  async exportCriticalAlarms(user: RequestUser, query: Record<string, string | undefined>) { const rows = await this.safeguardAlarmRows(user, query); return { fileName: 'critical-alarms.csv', content: this.csv(rows, ['alarm_tag','alarm_description','alarm_type','priority','status','due_status','last_test_result']) }; }
  async exportSafeguardTests(user: RequestUser, query: Record<string, string | undefined>) { const rows = await this.safeguardTestRows(user, query); return { fileName: 'safeguard-tests.csv', content: this.csv(rows, ['test_record_number','safeguard_type','test_date','test_type','status','review_status','final_result']) }; }
  async exportSafeguardTest(user: RequestUser, testId: string) { const detail = await this.safeguardTestDetail(user, testId); return { fileName: `${detail.test.test_record_number ?? 'safeguard-test'}.csv`, content: this.csv([detail.test, ...detail.steps], ['test_record_number','step_number','device_tag','device_role','test_instruction','expected_response','actual_response','pass_fail','final_result']) }; }

  safeguardLookups(_user: RequestUser) {
    return Promise.resolve({
      sifTypes: ['High pressure trip','Low pressure trip','High temperature trip','Low temperature trip','High level trip','Low level trip','Flow trip','Gas detection trip','Fire detection trip','ESD function','Burner management function','Compressor trip','Pump trip','Reactor shutdown','Custom'],
      sifStatuses: ['Draft','Active','In Service','Out of Service','Under Test','Under Maintenance','Bypassed','Inhibited','Overridden','Degraded','Failed','Startup Blocked','Archived','Decommissioned'],
      silLevels: ['SIL 1','SIL 2','SIL 3','SIL 4','Not SIL-rated','Not evaluated'],
      sifArchitectures: ['1oo1','1oo2','2oo2','2oo3','1oo2D','Custom'],
      sifDeviceTypes: ['Pressure transmitter','Temperature transmitter','Flow transmitter','Level transmitter','Gas detector','Flame detector','Analyzer','Switch','Manual push button','ESD station','Custom'],
      sifDeviceRoles: ['Sensor','Initiator','Logic Solver','Final Element','Alarm','Interlock'],
      interlockTypes: ['Process interlock','Equipment protection interlock','Safety interlock','Permissive','Trip','Shutdown logic','Start permissive','ESD interlock','BMS interlock','Custom'],
      alarmTypes: ['Critical process alarm','Safety-critical alarm','Environmental alarm','Fire/gas alarm','Equipment protection alarm','Operator response alarm','Custom'],
      alarmPriorities: ['Critical','High','Medium','Low','Configurable'],
      safeguardTestTypes: ['Full loop proof test','Partial proof test','Sensor proof test','Logic solver test','Final element test','Functional trip test','Stroke test','Alarm response test','Interlock functional test','Custom'],
      safeguardTestResults: ['Passed','Passed With Restrictions','Failed','Partial Failure','Device Failed','Logic Failed','Final Element Failed','Alarm Failed','Engineering Review Required','Not Completed'],
      demandTypes: ['Actual demand','Spurious trip','Test demand','Manual activation','Process upset','Emergency activation']
    });
  }

  private async safeguardSifRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.applySafeguardScope(this.db.from('mi_sifs').select('*, protection:mi_sif_protection_scope(*), lopa_sil:mi_sif_lopa_sil_links(*), sil_data:mi_sif_sil_data(*), test_requirement:mi_sif_test_requirements(*)'), user, query);
    if (query.status) request = request.eq('status', query.status);
    if (query.targetSil) request = request.eq('mi_sif_sil_data.target_sil', query.targetSil);
    if (query.equipmentId) request = request.eq('mi_sif_protection_scope.protected_equipment_id', query.equipmentId);
    if (query.search) request = request.or(`sif_tag.ilike.%${this.cleanSearch(query.search)}%,sif_number.ilike.%${this.cleanSearch(query.search)}%,sif_description.ilike.%${this.cleanSearch(query.search)}%`);
    const rows = await this.db.many<any>(request.order('updated_at', { ascending: false })).catch(() => []);
    return rows.map((row) => this.decorateSif(row));
  }

  private async safeguardInterlockRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.applySafeguardScope(this.db.from('mi_interlocks').select('*'), user, query);
    if (query.status) request = request.eq('status', query.status);
    if (query.equipmentId) request = request.eq('protected_equipment_id', query.equipmentId);
    if (query.search) request = request.or(`interlock_tag.ilike.%${this.cleanSearch(query.search)}%,interlock_description.ilike.%${this.cleanSearch(query.search)}%`);
    const rows = await this.db.many<any>(request.order('updated_at', { ascending: false })).catch(() => []);
    return rows.map((row) => this.decorateInterlock(row));
  }

  private async safeguardAlarmRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.applySafeguardScope(this.db.from('mi_critical_alarms').select('*'), user, query);
    if (query.status) request = request.eq('status', query.status);
    if (query.equipmentId) request = request.eq('protected_equipment_id', query.equipmentId);
    if (query.search) request = request.or(`alarm_tag.ilike.%${this.cleanSearch(query.search)}%,alarm_description.ilike.%${this.cleanSearch(query.search)}%`);
    const rows = await this.db.many<any>(request.order('updated_at', { ascending: false })).catch(() => []);
    return rows.map((row) => this.decorateAlarm(row));
  }

  private async safeguardTestRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.applySafeguardScope(this.db.from('mi_safeguard_tests').select('*'), user, query);
    if (query.safeguardType) request = request.eq('safeguard_type', query.safeguardType);
    if (query.sifId) request = request.eq('sif_id', query.sifId);
    if (query.interlockId) request = request.eq('interlock_id', query.interlockId);
    if (query.alarmId) request = request.eq('alarm_id', query.alarmId);
    if (query.equipmentId) request = request.eq('protected_equipment_id', query.equipmentId);
    if (query.status) request = request.eq('status', query.status);
    if (query.result) request = request.eq('final_result', query.result);
    if (query.search) request = request.or(`test_record_number.ilike.%${this.cleanSearch(query.search)}%,test_type.ilike.%${this.cleanSearch(query.search)}%`);
    return this.db.many<any>(request.order('test_date', { ascending: false })).catch(() => []);
  }

  private async safeguardOccurrenceRows(user: RequestUser, query: Record<string, string | undefined> = {}) {
    let request = this.applySafeguardScope(this.db.from('mi_safeguard_occurrences').select('*'), user, query);
    if (query.status) request = request.eq('status', query.status);
    if (query.safeguardType) request = request.eq('safeguard_type', query.safeguardType);
    return this.db.many<any>(request.order('due_date', { ascending: true })).catch(() => []);
  }

  private paginatedSafeguardResponse(rows: any[], query: Record<string, string | undefined>, summaryFactory: (rows: any[]) => any) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const from = (page - 1) * limit;
    return { rows: rows.slice(from, from + limit), page, limit, total: rows.length, summary: summaryFactory(rows), lastUpdated: new Date().toISOString() };
  }

  private applySafeguardScope(request: any, user: RequestUser, query: Record<string, string | undefined>) {
    request = request.eq('company_id', this.companyScope(user));
    const siteId = query.siteId ?? user.selectedSiteId ?? undefined;
    if (siteId) request = request.eq('site_id', siteId);
    else if (!user.corporateView && user.siteIds?.length) request = request.in('site_id', user.siteIds);
    return request;
  }

  private async getSif(user: RequestUser, sifId: string) {
    const row = await this.db.single<any>(this.applySafeguardScope(this.db.from('mi_sifs').select('*').eq('id', sifId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('SIF was not found or is outside your company/site access.');
    return row;
  }

  private async getInterlock(user: RequestUser, interlockId: string) {
    const row = await this.db.single<any>(this.applySafeguardScope(this.db.from('mi_interlocks').select('*').eq('id', interlockId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Interlock was not found or is outside your company/site access.');
    return row;
  }

  private async getCriticalAlarm(user: RequestUser, alarmId: string) {
    const row = await this.db.single<any>(this.applySafeguardScope(this.db.from('mi_critical_alarms').select('*').eq('id', alarmId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Critical alarm was not found or is outside your company/site access.');
    return row;
  }

  private async getSafeguardTest(user: RequestUser, testId: string) {
    const row = await this.db.single<any>(this.applySafeguardScope(this.db.from('mi_safeguard_tests').select('*').eq('id', testId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Safeguard test was not found or is outside your company/site access.');
    return row;
  }

  private async getSafeguardOccurrence(user: RequestUser, occurrenceId: string) {
    const row = await this.db.single<any>(this.applySafeguardScope(this.db.from('mi_safeguard_occurrences').select('*').eq('id', occurrenceId), user, {}).maybeSingle());
    if (!row) throw new BadRequestException('Safeguard occurrence was not found or is outside your company/site access.');
    return row;
  }

  private async getSafeguardReference(user: RequestUser, safeguardType: string, id: string) {
    if (!safeguardType || !id) throw new BadRequestException('Safeguard type and reference are required.');
    if (/sif/i.test(safeguardType)) {
      const sif = await this.getSif(user, id);
      const protection = await this.db.single<any>(this.db.from('mi_sif_protection_scope').select('*').eq('sif_id', id).maybeSingle()).catch(() => null);
      return { ...sif, safeguard_type: 'SIF', sif_id: id, interlock_id: null, alarm_id: null, protected_equipment_id: protection?.protected_equipment_id ?? null };
    }
    if (/interlock/i.test(safeguardType)) {
      const row = await this.getInterlock(user, id);
      return { ...row, safeguard_type: 'Interlock', sif_id: null, interlock_id: id, alarm_id: null, protected_equipment_id: row.protected_equipment_id ?? null };
    }
    const row = await this.getCriticalAlarm(user, id);
    return { ...row, safeguard_type: 'Critical Alarm', sif_id: null, interlock_id: null, alarm_id: id, protected_equipment_id: row.protected_equipment_id ?? null };
  }

  private sifPayload(user: RequestUser, body: Record<string, any>, companyId: string, siteId: string, update = false) {
    const payload: Record<string, any> = {
      company_id: companyId,
      site_id: siteId,
      department_id: body.departmentId ?? body.department_id ?? null,
      unit_id: body.unitId ?? body.unit_id ?? null,
      area_id: body.areaId ?? body.area_id ?? null,
      sif_tag: body.sifTag ?? body.sif_tag,
      sif_number: body.sifNumber ?? body.sif_number ?? null,
      sif_description: body.sifDescription ?? body.sif_description ?? null,
      sif_type: body.sifType ?? body.sif_type ?? 'Custom',
      sis_system_name: body.sisSystemName ?? body.sis_system_name ?? null,
      srs_document_id: body.srsDocumentId ?? body.srs_document_id ?? null,
      status: body.status ?? 'Draft',
      lifecycle_phase: body.lifecyclePhase ?? body.lifecycle_phase ?? 'Design',
      owner_department_id: body.ownerDepartmentId ?? body.owner_department_id ?? null,
      responsible_engineer_id: body.responsibleEngineerId ?? body.responsible_engineer_id ?? null,
      operations_owner_id: body.operationsOwnerId ?? body.operations_owner_id ?? null,
      maintenance_owner_id: body.maintenanceOwnerId ?? body.maintenance_owner_id ?? null,
      vendor_name: body.vendorName ?? body.vendor_name ?? null,
      installation_date: body.installationDate ?? body.installation_date ?? null,
      commissioning_date: body.commissioningDate ?? body.commissioning_date ?? null,
      safety_critical: body.safetyCritical ?? body.safety_critical ?? true,
      psm_critical: body.psmCritical ?? body.psm_critical ?? true,
      startup_blocker_potential: body.startupBlockerPotential ?? body.startup_blocker_potential ?? true,
      notes: body.notes ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    if (!update) payload.created_by = user.id;
    return payload;
  }

  private validateSifPayload(payload: Record<string, any>, body: Record<string, any>) {
    if (!payload.sif_tag?.trim()) throw new BadRequestException('SIF tag is required.');
    if (['Active', 'In Service'].includes(String(payload.status))) {
      if (!(body.protectedEquipmentId ?? body.protected_equipment_id)) throw new BadRequestException('Active SIF requires protected equipment.');
      if (!(body.safeStateDescription ?? body.safe_state_description ?? body.safeState ?? body.safe_state)) throw new BadRequestException('Active SIF requires safe state.');
      if (!(body.tripActionSummary ?? body.trip_action_summary ?? body.finalAction ?? body.final_action)) throw new BadRequestException('Active SIF requires trip action.');
      if (!(body.frequencyValue ?? body.frequency_value ?? body.proofTestFrequency)) throw new BadRequestException('Active SIF requires proof test frequency.');
    }
  }

  private async upsertSifProtection(user: RequestUser, sif: any, body: Record<string, any>) {
    const equipmentId = body.protectedEquipmentId ?? body.protected_equipment_id;
    const equipment = equipmentId ? await this.get(user, equipmentId) : null;
    const payload = {
      company_id: sif.company_id,
      site_id: sif.site_id,
      sif_id: sif.id,
      protected_equipment_id: equipmentId ?? null,
      protected_equipment_tag: equipment?.tag ?? equipment?.equipment_tag ?? body.protectedEquipmentTag ?? body.protected_equipment_tag ?? null,
      protected_equipment_type: equipment?.type ?? body.protectedEquipmentType ?? body.protected_equipment_type ?? null,
      protected_equipment_criticality: equipment?.criticality ?? body.protectedEquipmentCriticality ?? body.protected_equipment_criticality ?? null,
      process_unit_area: body.processUnitArea ?? body.process_unit_area ?? null,
      hazard_scenario_title: body.hazardScenarioTitle ?? body.hazard_scenario_title ?? null,
      hazard_scenario_description: body.hazardScenarioDescription ?? body.hazard_scenario_description ?? null,
      initiating_event: body.initiatingEvent ?? body.initiating_event ?? null,
      cause_of_demand: body.causeOfDemand ?? body.cause_of_demand ?? null,
      consequence_if_failed: body.consequenceIfFailed ?? body.consequence_if_failed ?? null,
      process_safety_consequence: body.processSafetyConsequence ?? body.process_safety_consequence ?? null,
      environmental_consequence: body.environmentalConsequence ?? body.environmental_consequence ?? null,
      personnel_safety_consequence: body.personnelSafetyConsequence ?? body.personnel_safety_consequence ?? null,
      startup_impact: body.startupImpact ?? body.startup_impact ?? null,
      protected_system_boundary: body.protectedSystemBoundary ?? body.protected_system_boundary ?? null,
      safe_state_description: body.safeStateDescription ?? body.safe_state_description ?? body.safeState ?? body.safe_state ?? null,
      trip_action_summary: body.tripActionSummary ?? body.trip_action_summary ?? null,
      required_response_time: body.requiredResponseTime ?? body.required_response_time ?? null,
      response_time_unit: body.responseTimeUnit ?? body.response_time_unit ?? null,
      demand_mode: body.demandMode ?? body.demand_mode ?? 'Not evaluated',
      updated_at: new Date().toISOString()
    };
    const existing = await this.db.single<any>(this.db.from('mi_sif_protection_scope').select('*').eq('sif_id', sif.id).maybeSingle()).catch(() => null);
    return existing ? this.db.single<any>(this.db.from('mi_sif_protection_scope').update(payload).eq('id', existing.id).select().single()) : this.db.single<any>(this.db.from('mi_sif_protection_scope').insert(payload).select().single());
  }

  private async upsertSifChild(table: string, fk: string, sif: any, payload: Record<string, any>) {
    const clean = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    if (!Object.keys(clean).length) return null;
    const existing = await this.db.single<any>(this.db.from(table).select('*').eq(fk, sif.id).maybeSingle()).catch(() => null);
    const row = { ...clean, company_id: sif.company_id, site_id: sif.site_id, [fk]: sif.id, updated_at: new Date().toISOString() };
    return existing ? this.db.single<any>(this.db.from(table).update(row).eq('id', existing.id).select().single()) : this.db.single<any>(this.db.from(table).insert(row).select().single());
  }

  private sifCauseEffectPayload(body: Record<string, any>) { return this.safeSnakePayload(body, ['initiatingCause','processVariable','sourceTag','setpoint','setpointUnit','tripCondition','alarmTripPriority','timeDelay','timeDelayUnit','votingLogic','resetType','finalAction','equipmentShutdown','valveCloseOpen','pumpTrip','compressorTrip','esdActivation','alarmActivation','interlockActivation','isolationAction','safeState','operatorActionRequired','causeEffectDocumentId']); }
  private sifArchitecturePayload(body: Record<string, any>) { return this.safeSnakePayload(body, ['architectureType','votingArrangement','sensorVoting','logicSolverVoting','finalElementVoting','redundancy','commonCauseConsiderations','diagnosticCoverage','proofTestCoverage','bypassPhilosophy','resetPhilosophy','manualResetRequired','automaticResetAllowed','tripEnergyState','failSafeState','notes']); }
  private sifSilDataPayload(body: Record<string, any>) { return this.safeSnakePayload(body, ['targetSil','achievedSil','requiredRrf','achievedRrf','pfdAvg','demandRate','proofTestIntervalValue','proofTestIntervalUnit','proofTestCoverage','missionTime','diagnosticCoverage','safeFailureFraction','hardwareFaultTolerance','verificationDocumentId','lastVerificationDate','nextReviewDue','verificationStatus','notes']); }
  private sifTestRequirementPayload(body: Record<string, any>, sif: any) { return { proof_test_required: body.proofTestRequired ?? body.proof_test_required ?? undefined, proof_test_type: body.proofTestType ?? body.proof_test_type ?? undefined, frequency_value: body.frequencyValue ?? body.frequency_value ?? body.proofTestFrequency ?? undefined, frequency_unit: body.frequencyUnit ?? body.frequency_unit ?? undefined, interval_source: body.intervalSource ?? body.interval_source ?? undefined, last_test_date: body.lastTestDate ?? body.last_test_date ?? undefined, next_test_due_date: body.nextTestDueDate ?? body.next_test_due_date ?? this.nextDueFromFrequency(new Date(body.lastTestDate ?? body.last_test_date ?? sif.commissioning_date ?? Date.now()), Number(body.frequencyValue ?? body.frequency_value ?? body.proofTestFrequency ?? 0), body.frequencyUnit ?? body.frequency_unit ?? 'Years'), due_status: this.safeguardDueStatus(body.nextTestDueDate ?? body.next_test_due_date), test_procedure_document_id: body.testProcedureDocumentId ?? body.test_procedure_document_id ?? undefined, acceptance_criteria_json: body.acceptanceCriteriaJson ?? body.acceptance_criteria_json ?? undefined, proof_test_coverage: body.proofTestCoverage ?? body.proof_test_coverage ?? undefined, online_test_allowed: body.onlineTestAllowed ?? body.online_test_allowed ?? undefined, shutdown_required: body.shutdownRequired ?? body.shutdown_required ?? undefined, bypass_required: body.bypassRequired ?? body.bypass_required ?? undefined, ptw_required: body.ptwRequired ?? body.ptw_required ?? undefined, loto_required: body.lotoRequired ?? body.loto_required ?? undefined, review_required: body.reviewRequired ?? body.review_required ?? undefined, e_signature_required: body.eSignatureRequired ?? body.e_signature_required ?? undefined, report_required: body.reportRequired ?? body.report_required ?? undefined, scheduler_active: body.schedulerActive ?? body.scheduler_active ?? undefined, manual_override_due_date: body.manualOverrideDueDate ?? body.manual_override_due_date ?? undefined, manual_override_reason: body.manualOverrideReason ?? body.manual_override_reason ?? undefined }; }
  private sifLopaPayload(body: Record<string, any>) { return this.safeSnakePayload(body, ['lopaScenarioId','lopaScenarioNumber','silAssessmentId','iplIdentifier','creditedAsIpl','targetSil','achievedSil','requiredRrf','achievedRrf','pfdAvg','proofTestIntervalValue','proofTestIntervalUnit','demandRate','iplIndependenceNotes','iplEffectivenessNotes','verificationStatus','verificationDocumentId']); }
  private sifDevicePayload(body: Record<string, any>) { return this.safeSnakePayload(body, ['deviceTag','deviceRole','deviceType','linkedEquipmentId','measurementParameter','rangeLower','rangeUpper','rangeUnit','setpoint','tripPoint','alarmPoint','calibrationPlanId','lastCalibrationDate','nextCalibrationDue','deviceStatus','bypassStatus','inhibitStatus','failureStatus','proofTestIncluded','notes']); }

  private async createSimpleSafeguard(user: RequestUser, type: 'Interlock' | 'Critical Alarm', body: Record<string, any>) {
    const equipmentId = body.protectedEquipmentId ?? body.protected_equipment_id;
    const equipment = equipmentId ? await this.get(user, equipmentId) : null;
    const siteId = equipment?.siteId ?? equipment?.site_id ?? body.siteId ?? body.site_id ?? user.selectedSiteId;
    if (!siteId) throw new BadRequestException('Site is required.');
    const table = type === 'Interlock' ? 'mi_interlocks' : 'mi_critical_alarms';
    const payload = type === 'Interlock' ? this.interlockPayload(user, body, this.companyScope(user), siteId) : this.alarmPayload(user, body, this.companyScope(user), siteId);
    if (type === 'Interlock' && !payload.interlock_tag?.trim()) throw new BadRequestException('Interlock tag is required.');
    if (type === 'Critical Alarm' && !payload.alarm_tag?.trim()) throw new BadRequestException('Critical alarm tag is required.');
    const row = await this.db.single<any>(this.db.from(table).insert(payload).select().single());
    await this.addSafeguardHistory(user, { ...row, safeguard_type: type, [type === 'Interlock' ? 'interlock_id' : 'alarm_id']: row.id }, `${type.toUpperCase().replace(/\s+/g, '_')}_CREATED`, `${type} created`, null, row);
    return type === 'Interlock' ? this.interlockDetail(user, row.id) : this.criticalAlarmDetail(user, row.id);
  }

  private async updateSimpleSafeguard(user: RequestUser, type: 'Interlock' | 'Critical Alarm', id: string, body: Record<string, any>) {
    const before = type === 'Interlock' ? await this.getInterlock(user, id) : await this.getCriticalAlarm(user, id);
    this.assertEditableSafeguard(before);
    const table = type === 'Interlock' ? 'mi_interlocks' : 'mi_critical_alarms';
    const payload = type === 'Interlock' ? this.interlockPayload(user, body, before.company_id, before.site_id, true) : this.alarmPayload(user, body, before.company_id, before.site_id, true);
    const after = await this.db.single<any>(this.db.from(table).update(payload).eq('id', id).select().single());
    await this.addSafeguardHistory(user, { ...after, safeguard_type: type, [type === 'Interlock' ? 'interlock_id' : 'alarm_id']: id }, `${type.toUpperCase().replace(/\s+/g, '_')}_UPDATED`, `${type} updated`, before, after);
    return type === 'Interlock' ? this.interlockDetail(user, id) : this.criticalAlarmDetail(user, id);
  }

  private async archiveSimpleSafeguard(user: RequestUser, type: 'Interlock' | 'Critical Alarm', id: string, reason?: string) {
    if (!reason?.trim()) throw new BadRequestException('Archive reason is required.');
    const table = type === 'Interlock' ? 'mi_interlocks' : 'mi_critical_alarms';
    const before = type === 'Interlock' ? await this.getInterlock(user, id) : await this.getCriticalAlarm(user, id);
    const after = await this.db.single<any>(this.db.from(table).update({ status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', id).select().single());
    await this.addSafeguardHistory(user, { ...after, safeguard_type: type, [type === 'Interlock' ? 'interlock_id' : 'alarm_id']: id }, `${type.toUpperCase().replace(/\s+/g, '_')}_ARCHIVED`, `${type} archived`, before, after);
    return after;
  }

  private async reactivateSimpleSafeguard(user: RequestUser, type: 'Interlock' | 'Critical Alarm', id: string, reason?: string) {
    const table = type === 'Interlock' ? 'mi_interlocks' : 'mi_critical_alarms';
    const before = type === 'Interlock' ? await this.getInterlock(user, id) : await this.getCriticalAlarm(user, id);
    const after = await this.db.single<any>(this.db.from(table).update({ status: 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('id', id).select().single());
    await this.addSafeguardHistory(user, { ...after, safeguard_type: type, [type === 'Interlock' ? 'interlock_id' : 'alarm_id']: id }, `${type.toUpperCase().replace(/\s+/g, '_')}_REACTIVATED`, reason ?? `${type} reactivated`, before, after);
    return after;
  }

  private interlockPayload(user: RequestUser, body: Record<string, any>, companyId: string, siteId: string, update = false) {
    const payload: Record<string, any> = { company_id: companyId, site_id: siteId, department_id: body.departmentId ?? body.department_id ?? null, unit_id: body.unitId ?? body.unit_id ?? null, area_id: body.areaId ?? body.area_id ?? null, interlock_tag: body.interlockTag ?? body.interlock_tag, interlock_description: body.interlockDescription ?? body.interlock_description ?? null, interlock_type: body.interlockType ?? body.interlock_type ?? 'Process interlock', protected_equipment_id: body.protectedEquipmentId ?? body.protected_equipment_id ?? null, cause_description: body.causeDescription ?? body.cause_description ?? null, effect_action: body.effectAction ?? body.effect_action ?? null, process_variable: body.processVariable ?? body.process_variable ?? null, setpoint: body.setpoint ?? null, setpoint_unit: body.setpointUnit ?? body.setpoint_unit ?? null, trip_condition: body.tripCondition ?? body.trip_condition ?? null, reset_method: body.resetMethod ?? body.reset_method ?? null, logic_location: body.logicLocation ?? body.logic_location ?? null, dcs_plc_reference: body.dcsPlcReference ?? body.dcs_plc_reference ?? null, safety_critical: body.safetyCritical ?? body.safety_critical ?? false, psm_critical: body.psmCritical ?? body.psm_critical ?? false, linked_sif_id: body.linkedSifId ?? body.linked_sif_id ?? null, linked_lopa_scenario_id: body.linkedLopaScenarioId ?? body.linked_lopa_scenario_id ?? null, test_frequency_value: body.testFrequencyValue ?? body.test_frequency_value ?? null, test_frequency_unit: body.testFrequencyUnit ?? body.test_frequency_unit ?? null, last_test_date: body.lastTestDate ?? body.last_test_date ?? null, next_test_due_date: body.nextTestDueDate ?? body.next_test_due_date ?? null, due_status: this.safeguardDueStatus(body.nextTestDueDate ?? body.next_test_due_date), last_test_result: body.lastTestResult ?? body.last_test_result ?? null, bypass_status: body.bypassStatus ?? body.bypass_status ?? null, inhibit_status: body.inhibitStatus ?? body.inhibit_status ?? null, status: body.status ?? 'Active', responsible_engineer_id: body.responsibleEngineerId ?? body.responsible_engineer_id ?? null, updated_by: user.id, updated_at: new Date().toISOString() };
    if (!update) payload.created_by = user.id;
    return payload;
  }

  private alarmPayload(user: RequestUser, body: Record<string, any>, companyId: string, siteId: string, update = false) {
    const payload: Record<string, any> = { company_id: companyId, site_id: siteId, department_id: body.departmentId ?? body.department_id ?? null, unit_id: body.unitId ?? body.unit_id ?? null, area_id: body.areaId ?? body.area_id ?? null, alarm_tag: body.alarmTag ?? body.alarm_tag, alarm_description: body.alarmDescription ?? body.alarm_description ?? null, alarm_type: body.alarmType ?? body.alarm_type ?? 'Critical process alarm', protected_equipment_id: body.protectedEquipmentId ?? body.protected_equipment_id ?? null, process_variable: body.processVariable ?? body.process_variable ?? null, setpoint: body.setpoint ?? null, setpoint_unit: body.setpointUnit ?? body.setpoint_unit ?? null, priority: body.priority ?? 'High', consequence_of_missed_alarm: body.consequenceOfMissedAlarm ?? body.consequence_of_missed_alarm ?? null, operator_response_time: body.operatorResponseTime ?? body.operator_response_time ?? null, response_time_unit: body.responseTimeUnit ?? body.response_time_unit ?? null, required_operator_action: body.requiredOperatorAction ?? body.required_operator_action ?? null, rationalization_document_id: body.rationalizationDocumentId ?? body.rationalization_document_id ?? null, alarm_philosophy_document_id: body.alarmPhilosophyDocumentId ?? body.alarm_philosophy_document_id ?? null, dcs_plc_reference: body.dcsPlcReference ?? body.dcs_plc_reference ?? null, safety_critical: body.safetyCritical ?? body.safety_critical ?? false, psm_critical: body.psmCritical ?? body.psm_critical ?? false, linked_sif_id: body.linkedSifId ?? body.linked_sif_id ?? null, linked_interlock_id: body.linkedInterlockId ?? body.linked_interlock_id ?? null, linked_lopa_scenario_id: body.linkedLopaScenarioId ?? body.linked_lopa_scenario_id ?? null, test_frequency_value: body.testFrequencyValue ?? body.test_frequency_value ?? null, test_frequency_unit: body.testFrequencyUnit ?? body.test_frequency_unit ?? null, last_test_date: body.lastTestDate ?? body.last_test_date ?? null, next_test_due_date: body.nextTestDueDate ?? body.next_test_due_date ?? null, due_status: this.safeguardDueStatus(body.nextTestDueDate ?? body.next_test_due_date), last_test_result: body.lastTestResult ?? body.last_test_result ?? null, shelved_suppressed_status: body.shelvedSuppressedStatus ?? body.shelved_suppressed_status ?? null, status: body.status ?? 'Active', responsible_engineer_id: body.responsibleEngineerId ?? body.responsible_engineer_id ?? null, updated_by: user.id, updated_at: new Date().toISOString() };
    if (!update) payload.created_by = user.id;
    return payload;
  }

  private safeSnakePayload(body: Record<string, any>, keys?: string[]) {
    const source = keys ?? Object.keys(body);
    const payload: Record<string, any> = {};
    for (const key of source) {
      const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      const value = body[key] ?? body[snake];
      if (value !== undefined) payload[snake] = value;
    }
    return payload;
  }

  private decorateSif(row: any) { return { ...row, safeguardType: 'SIF', sifTag: row.sif_tag, description: row.sif_description, targetSil: this.targetSil(row), achievedSil: row.sil_data?.[0]?.achieved_sil ?? row.achieved_sil, proofTestStatus: row.due_status, linkedLopaSil: !!row.lopa_sil?.length, startupImpact: row.startup_blocked ? 'Startup Blocked' : 'No Blocker' }; }
  private decorateInterlock(row: any) { return { ...row, safeguardType: 'Interlock', tag: row.interlock_tag, description: row.interlock_description, proofTestStatus: row.due_status, startupImpact: row.startup_blocked ? 'Startup Blocked' : 'No Blocker' }; }
  private decorateAlarm(row: any) { return { ...row, safeguardType: 'Critical Alarm', tag: row.alarm_tag, description: row.alarm_description, proofTestStatus: row.due_status, startupImpact: row.startup_blocked ? 'Startup Blocked' : 'No Blocker' }; }
  private targetSil(row: any) { return row.target_sil ?? row.sil_data?.[0]?.target_sil ?? row.lopa_sil?.[0]?.target_sil ?? 'Not evaluated'; }
  private highestSil(rows: any[]) { return rows.map((x) => this.targetSil(x)).filter(Boolean).sort().reverse()[0] ?? null; }
  private refColumn(type: string) { return /sif/i.test(type) ? 'sif_id' : /interlock/i.test(type) ? 'interlock_id' : 'alarm_id'; }
  private assertEditableSafeguard(row: any) { if (['Archived', 'Decommissioned'].includes(String(row.status))) throw new BadRequestException('Archived/decommissioned safeguard records are read-only.'); }
  private assertEditableTest(row: any) { if (['Approved', 'Superseded', 'Archived'].includes(String(row.status))) throw new BadRequestException('Approved, superseded, and archived safeguard tests are locked.'); }
  private nextDueFromFrequency(start: Date, value: number, unit: string) { if (!value || value <= 0) return null; return this.addInterval(start, value, unit).toISOString().slice(0, 10); }
  private safeguardDueStatus(date?: string | null) { if (!date) return 'Not Scheduled'; const days = this.daysBetween(new Date(), new Date(date)); if (days < 0) return 'Overdue'; if (days === 0) return 'Due'; if (days <= 30) return 'Due Soon'; return 'Not Due'; }

  private safeguardStepPayload(body: Record<string, any>) {
    return { step_number: body.stepNumber ?? body.step_number ?? 1, device_tag: body.deviceTag ?? body.device_tag ?? null, device_role: body.deviceRole ?? body.device_role ?? null, test_instruction: body.testInstruction ?? body.test_instruction ?? null, expected_response: body.expectedResponse ?? body.expected_response ?? null, actual_response: body.actualResponse ?? body.actual_response ?? null, pass_fail: body.passFail ?? body.pass_fail ?? 'Not Tested', response_time: body.responseTime ?? body.response_time ?? null, response_time_unit: body.responseTimeUnit ?? body.response_time_unit ?? null, setpoint_verified: body.setpointVerified ?? body.setpoint_verified ?? false, trip_point_verified: body.tripPointVerified ?? body.trip_point_verified ?? false, reset_verified: body.resetVerified ?? body.reset_verified ?? false, evidence_required: body.evidenceRequired ?? body.evidence_required ?? false, evidence_document_id: body.evidenceDocumentId ?? body.evidence_document_id ?? null, comment: body.comment ?? null, finding_created: body.findingCreated ?? body.finding_created ?? false, required: body.required ?? true };
  }

  private safeguardTestUpdatePayload(body: Record<string, any>, user: RequestUser) {
    return { ...this.safeSnakePayload(body, ['testDate','testType','testLocation','onlineOfflineStatus','shutdownRequired','bypassRequired','ptwId','lotoId','technicianUserId','engineerUserId','reviewerUserId','vendorName','procedureDocumentId','notes','bypassUsed','bypassType','bypassStartTime','bypassEndTime','bypassAuthorizedBy','temporaryMitigationUsed','bypassRestored','restorationVerifiedBy','restorationTime']), updated_by: user.id, updated_at: new Date().toISOString() };
  }

  private evaluateSafeguardSteps(test: any, steps: any[]) {
    const required = steps.filter((step) => step.required);
    const failed = steps.filter((step) => /fail/i.test(String(step.pass_fail)));
    const incomplete = required.filter((step) => !['Pass', 'Passed', 'Fail', 'Failed'].includes(String(step.pass_fail)));
    const evidenceMissing = required.some((step) => step.evidence_required && !step.evidence_document_id);
    const result = incomplete.length ? 'Not Completed' : failed.length ? (failed.some((x) => /logic/i.test(String(x.device_role)) || /logic/i.test(String(x.pass_fail))) ? 'Logic Failed' : failed.some((x) => /alarm/i.test(String(x.device_role))) ? 'Alarm Failed' : failed.some((x) => /final/i.test(String(x.device_role))) ? 'Final Element Failed' : 'Failed') : evidenceMissing ? 'Engineering Review Required' : 'Passed';
    return { all_required_steps_passed: !incomplete.length && !failed.length, required_response_achieved: !failed.length && !incomplete.length, trip_action_achieved: !failed.length && !incomplete.length, alarm_annunciated: !failed.some((x) => /alarm/i.test(String(x.device_role))), final_element_safe_state: !failed.some((x) => /final/i.test(String(x.device_role))), reset_behavior_correct: required.every((x) => x.reset_verified || !/reset/i.test(String(x.test_instruction))), response_time_within_limit: true, evidence_complete: !evidenceMissing, bypass_restored: !test.bypass_used || !!test.bypass_restored, final_result: result, failed_steps_count: failed.length, evaluation_inputs_json: { test, steps }, evaluation_outputs_json: { result, failedSteps: failed.length }, evaluation_error: incomplete.length ? 'Required steps incomplete.' : null };
  }

  private latestSafeguardEvaluation(testId: string) { return this.db.single<any>(this.db.from('mi_safeguard_test_evaluations').select('*').eq('test_id', testId).order('evaluated_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null); }
  private markSafeguardEvaluationOfficial(testId: string) { return this.db.single(this.db.from('mi_safeguard_test_evaluations').update({ official: true }).eq('test_id', testId).select('id').limit(1).single()).catch(() => null); }
  private async applyApprovedSafeguardTest(user: RequestUser, test: any, evaluation: any) {
    const due = this.nextDueFromFrequency(new Date(test.test_date), 1, 'Years');
    const failed = /failed/i.test(String(evaluation.final_result));
    if (test.sif_id) { await this.db.single(this.db.from('mi_sifs').update({ last_test_date: test.test_date, next_test_due_date: due, due_status: this.safeguardDueStatus(due), last_test_result: evaluation.final_result, degraded: failed, startup_blocked: failed, status: failed ? 'Failed' : 'Active', updated_at: new Date().toISOString() }).eq('id', test.sif_id).select('id').single()).catch(() => null); await this.updateSifReadiness(user, test.sif_id); }
    if (test.interlock_id) await this.db.single(this.db.from('mi_interlocks').update({ last_test_date: test.test_date, next_test_due_date: due, due_status: this.safeguardDueStatus(due), last_test_result: evaluation.final_result, startup_blocked: failed, status: failed ? 'Failed' : 'Active', updated_at: new Date().toISOString() }).eq('id', test.interlock_id).select('id').single()).catch(() => null);
    if (test.alarm_id) await this.db.single(this.db.from('mi_critical_alarms').update({ last_test_date: test.test_date, next_test_due_date: due, due_status: this.safeguardDueStatus(due), last_test_result: evaluation.final_result, startup_blocked: failed, status: failed ? 'Failed' : 'Active', updated_at: new Date().toISOString() }).eq('id', test.alarm_id).select('id').single()).catch(() => null);
    if (failed) await this.addSafeguardHistory(user, test, 'FAILED_SAFEGUARD_DETECTED', 'Failed safeguard detected', null, evaluation);
  }

  private async updateSafeguardScheduleFields(ref: any, due: string | null, status: string) {
    const update = { next_test_due_date: due, due_status: status, updated_at: new Date().toISOString() };
    const table = ref.sif_id ? 'mi_sifs' : ref.interlock_id ? 'mi_interlocks' : 'mi_critical_alarms';
    const id = ref.sif_id ?? ref.interlock_id ?? ref.alarm_id;
    await this.db.single(this.db.from(table).update(update).eq('id', id).select('id').single()).catch(() => null);
  }

  private async ensureSafeguardOccurrence(user: RequestUser, ref: any, dueDate: string | null, dueBasis: string) {
    if (!dueDate) return null;
    const existing = await this.db.single<any>(this.db.from('mi_safeguard_occurrences').select('*').eq(this.refColumn(ref.safeguard_type), ref.sif_id ?? ref.interlock_id ?? ref.alarm_id).eq('due_date', dueDate).maybeSingle()).catch(() => null);
    if (existing) return existing;
    const row = await this.db.single<any>(this.db.from('mi_safeguard_occurrences').insert({ company_id: ref.company_id, site_id: ref.site_id, safeguard_type: ref.safeguard_type, sif_id: ref.sif_id ?? null, interlock_id: ref.interlock_id ?? null, alarm_id: ref.alarm_id ?? null, occurrence_number: await this.nextMiSequence('mi_safeguard_occurrences', 'occurrence_number', 'MI-SGO', ref.site_id, ref.company_id), due_date: dueDate, due_basis: dueBasis, status: this.safeguardDueStatus(dueDate), assigned_user_id: ref.responsible_engineer_id ?? null }).select().single());
    await this.addSafeguardHistory(user, row, 'SAFEGUARD_OCCURRENCE_GENERATED', 'Safeguard occurrence generated', null, row);
    return row;
  }

  private async updateSifReadiness(user: RequestUser, sifId: string) {
    const sif = await this.getSif(user, sifId);
    const [protection, cause, devices, sil, requirement] = await Promise.all([
      this.db.single<any>(this.db.from('mi_sif_protection_scope').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('mi_sif_cause_effect').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.db.many<any>(this.db.from('mi_sif_devices').select('*').eq('sif_id', sifId)).catch(() => []),
      this.db.single<any>(this.db.from('mi_sif_sil_data').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('mi_sif_test_requirements').select('*').eq('sif_id', sifId).maybeSingle()).catch(() => null)
    ]);
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!protection?.protected_equipment_id) blockers.push('Protected equipment is missing.');
    if (!protection?.hazard_scenario_title) warnings.push('Hazard scenario is missing.');
    if (!protection?.safe_state_description) blockers.push('Safe state is missing.');
    if (!protection?.trip_action_summary && !cause?.final_action) blockers.push('Trip/final action is missing.');
    if (!cause?.process_variable || !cause?.trip_condition) warnings.push('Cause and effect data is incomplete.');
    if (!devices.some((d) => /sensor|initiator/i.test(String(d.device_role)))) warnings.push('No SIF initiator/sensor is configured.');
    if (!devices.some((d) => /final/i.test(String(d.device_role)))) warnings.push('No SIF final element is configured.');
    if (sil?.target_sil && sil?.achieved_sil && Number(String(sil.achieved_sil).replace(/\D/g, '')) < Number(String(sil.target_sil).replace(/\D/g, ''))) blockers.push('Achieved SIL is below target SIL.');
    if (!requirement?.frequency_value && ['Active', 'In Service'].includes(String(sif.status))) blockers.push('Active SIF requires proof test configuration.');
    if (sif.due_status === 'Overdue') blockers.push('Proof test is overdue.');
    if (sif.last_test_result && /failed/i.test(String(sif.last_test_result))) blockers.push('Last proof test failed.');
    if (Number(sif.active_bypass_count ?? 0) || Number(sif.active_inhibit_count ?? 0) || Number(sif.active_override_count ?? 0)) blockers.push('Active bypass/inhibit/override exists.');
    const readiness = blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready';
    const row = await this.db.single<any>(this.db.from('mi_sif_readiness').upsert({ company_id: sif.company_id, site_id: sif.site_id, sif_id: sifId, readiness_status: readiness, startup_blocked: blockers.length > 0, blockers_json: blockers, warnings_json: warnings, missing_required_data_json: blockers.concat(warnings), last_evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'sif_id' }).select().single()).catch(() => null);
    await this.db.single(this.db.from('mi_sifs').update({ readiness_status: readiness, startup_blocked: blockers.length > 0, readiness_blockers_json: blockers, updated_at: new Date().toISOString() }).eq('id', sifId).select('id').single()).catch(() => null);
    return row;
  }

  private safeguardActions(user: RequestUser, row: any) {
    const has = (permission: string) => user.isSuperAdmin || user.permissions?.includes(permission);
    const readOnly = ['Archived', 'Decommissioned'].includes(String(row.status));
    return [
      { key: 'edit', permitted: has('mechanical_integrity.sif.edit'), disabled: readOnly || !has('mechanical_integrity.sif.edit'), disabledReason: readOnly ? 'Archived/decommissioned records are read-only.' : !has('mechanical_integrity.sif.edit') ? 'Missing permission.' : null },
      { key: 'create-test', permitted: has('mechanical_integrity.safeguard_test.create'), disabled: !has('mechanical_integrity.safeguard_test.create'), disabledReason: !has('mechanical_integrity.safeguard_test.create') ? 'Missing permission.' : null },
      { key: 'export', permitted: has('mechanical_integrity.sif.export'), disabled: !has('mechanical_integrity.sif.export'), disabledReason: !has('mechanical_integrity.sif.export') ? 'Missing permission.' : null }
    ];
  }

  private safeguardTestActions(user: RequestUser, test: any) {
    const has = (permission: string) => user.isSuperAdmin || user.permissions?.includes(permission);
    const locked = ['Approved', 'Superseded', 'Archived'].includes(String(test.status));
    return [
      { key: 'edit', permitted: has('mechanical_integrity.safeguard_test.edit'), disabled: locked || !has('mechanical_integrity.safeguard_test.edit'), disabledReason: locked ? 'Approved/superseded tests are locked.' : !has('mechanical_integrity.safeguard_test.edit') ? 'Missing permission.' : null },
      { key: 'submit', permitted: has('mechanical_integrity.safeguard_test.submit'), disabled: locked || !has('mechanical_integrity.safeguard_test.submit'), disabledReason: locked ? 'Approved/superseded tests are locked.' : !has('mechanical_integrity.safeguard_test.submit') ? 'Missing permission.' : null },
      { key: 'approve', permitted: has('mechanical_integrity.safeguard_test.approve'), disabled: test.status !== 'Submitted for Review' || !has('mechanical_integrity.safeguard_test.approve'), disabledReason: test.status !== 'Submitted for Review' ? 'Test is not submitted for review.' : !has('mechanical_integrity.safeguard_test.approve') ? 'Missing permission.' : null }
    ];
  }

  private async addSafeguardHistory(user: RequestUser, ref: any, eventType: string, title: string, before?: any, after?: any) {
    await this.db.single(this.db.from('mi_safeguard_history_events').insert({ company_id: ref.company_id ?? this.companyScope(user), site_id: ref.site_id ?? user.selectedSiteId ?? null, safeguard_type: ref.safeguard_type ?? null, sif_id: ref.sif_id ?? null, interlock_id: ref.interlock_id ?? null, alarm_id: ref.alarm_id ?? null, test_id: ref.test_id ?? ref.id ?? null, protected_equipment_id: ref.protected_equipment_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: user.id, source_module: 'MechanicalIntegrity', source_record_id: ref.id ?? ref.sif_id ?? ref.interlock_id ?? ref.alarm_id ?? ref.test_id ?? null }).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: eventType, entityType: 'MechanicalIntegritySafeguard', entityId: ref.id ?? ref.sif_id ?? ref.interlock_id ?? ref.alarm_id ?? ref.test_id ?? eventType, before: before as any, after: after as any }).catch(() => null);
  }

  private sortColumn(value?: string) {
    if (['tag', 'name', 'status', 'criticality', 'updatedAt', 'createdAt'].includes(value ?? '')) return value!;
    return 'tag';
  }

  private cleanSearch(value: string) {
    return value.replace(/[%(),]/g, '').trim();
  }

  private csv(rows: any[], columns: string[]) {
    return [columns.join(','), ...rows.map((row) => columns.map((column) => JSON.stringify(row[column] ?? '')).join(','))].join('\n');
  }

  private writeMiAudit(user: RequestUser, equipmentId: string, action: string, before: any, after: any, reason: string) {
    return this.audit.write({ tenantId: user.tenantId, actorId: user.id, action, entityType: 'MechanicalIntegrityEquipment', entityId: equipmentId, before: before as any, after: { after, reason } as any });
  }

  private async addMiHistory(user: RequestUser, equipmentId: string, eventType: string, title: string, description?: string | null, before?: any, after?: any, sourceType?: string | null, sourceId?: string | null) {
    const equipment = await this.get(user, equipmentId).catch(() => null);
    if (equipment?.siteId) {
      await this.db.single(this.db.from('mi_equipment_history_events').insert({
        id: crypto.randomUUID(),
        equipment_id: equipmentId,
        company_id: equipment.companyId ?? user.activeCompanyId ?? user.companyIds[0] ?? user.tenantId,
        site_id: equipment.siteId,
        event_type: eventType,
        event_title: title,
        event_description: description ?? null,
        before_value_json: before ?? null,
        after_value_json: after ?? null,
        source_module: sourceType ?? 'MechanicalIntegrity',
        source_record_id: sourceId ?? equipmentId,
        actor_user_id: user.id
      }).select().single()).catch(() => null);
    }
    await this.db.single(this.db.from('EquipmentTimelineEvent').insert({
      id: crypto.randomUUID(),
      tenantId: user.tenantId,
      equipmentId,
      eventType,
      title,
      description: description ?? null,
      actorName: user.id,
      occurredAt: new Date().toISOString(),
      sourceType: sourceType ?? 'MechanicalIntegrity',
      sourceId: sourceId ?? equipmentId
    }).select().single());
  }
}

function defaultEquipmentTypes() {
  return [
    'Pressure vessel', 'Storage tank', 'Piping circuit', 'Pump', 'Compressor', 'Heat exchanger', 'Boiler', 'Reactor', 'PSV / relief device', 'SIS / SIF component', 'Interlock', 'Critical alarm', 'ESD system', 'Fire protection system', 'Gas detector', 'Electrical equipment', 'Instrument', 'Rotating equipment', 'Static equipment', 'Other'
  ].map((type) => ({ type_key: type.toLowerCase().replace(/[^a-z0-9]+/g, '_'), type_name: type, category: type }));
}
