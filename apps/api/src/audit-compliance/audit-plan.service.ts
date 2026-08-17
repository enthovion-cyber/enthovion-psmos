import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { AuditProgramService } from "./audit-program.service";
import { AuditPlanConflictService } from "./audit-plan-conflict.service";
import { AuditPlanHistoryService } from "./audit-plan-history.service";
import { AuditPlanReadinessService } from "./audit-plan-readiness.service";
import { AuditPlanSettingsService } from "./audit-plan-settings.service";
import { AuditPlanIamAdapterService } from "./audit-plan-iam-adapter.service";
import { AuditPlanNotificationAdapterService } from "./audit-plan-notification-adapter.service";

type Row = Record<string, any>;

@Injectable()
export class AuditPlanService {
  constructor(
    private readonly db: SupabaseService,
    private readonly programs: AuditProgramService,
    private readonly readiness: AuditPlanReadinessService,
    private readonly conflicts: AuditPlanConflictService,
    private readonly history: AuditPlanHistoryService,
    private readonly settings: AuditPlanSettingsService,
    private readonly iam: AuditPlanIamAdapterService,
    private readonly notifications: AuditPlanNotificationAdapterService,
  ) {}

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(500, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db
      .from("audit_plans")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId && !user.corporateView) {
      this.assertSite(user, siteId);
      request = request.eq("site_id", siteId);
    }
    if (query.planStatus) request = request.eq("plan_status", query.planStatus);
    if (query.scheduleStatus)
      request = request.eq("schedule_status", query.scheduleStatus);
    if (query.readinessHealth)
      request = request.eq("readiness_health", query.readinessHealth);
    if (query.conflictStatus)
      request = request.eq("conflict_status", query.conflictStatus);
    if (query.programId) request = request.eq("program_id", query.programId);
    if (query.auditType) request = request.eq("audit_type", query.auditType);
    if (query.criticality)
      request = request.eq("criticality", query.criticality);
    if (query.leadAuditorUserId)
      request = request.eq("lead_auditor_user_id", query.leadAuditorUserId);
    if (query.from) request = request.gte("planned_start_at", query.from);
    if (query.to) request = request.lte("planned_end_at", query.to);
    if (query.search)
      request = request.or(
        `plan_code.ilike.%${this.safeSearch(query.search)}%,plan_title.ilike.%${this.safeSearch(query.search)}%`,
      );
    const sort = String(query.sort ?? "updated_at.desc").split(".");
    request = request
      .order(sort[0] ?? "updated_at", { ascending: sort[1] === "asc" })
      .range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await request;
    if (error) throw new BadRequestException(error.message);
    const rows = await Promise.all(
      (data ?? []).map((row: Row) => this.enrich(row)),
    );
    return {
      rows,
      total: count ?? rows.length,
      page,
      limit,
      summary: this.summaryFrom(rows),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, {
      ...query,
      page: 1,
      limit: 500,
    });
    const rows = register.rows;
    const now = Date.now();
    const upcoming = rows
      .filter(
        (p) =>
          p.planned_start_at && new Date(p.planned_start_at).getTime() >= now,
      )
      .sort((a, b) =>
        String(a.planned_start_at).localeCompare(String(b.planned_start_at)),
      )
      .slice(0, 10);
    return {
      summary: this.summaryFrom(rows),
      upcoming,
      overdue: rows.filter((p) => p.schedule_status === "Overdue"),
      conflicts: rows.filter((p) => p.conflict_status !== "No Conflict"),
      readinessGaps: rows.filter((p) => !p.ready_for_checklist),
      byStatus: this.group(rows, "plan_status"),
      bySite: this.group(rows, "site_id"),
      byAuditType: this.group(rows, "audit_type"),
      byCriticality: this.group(rows, "criticality"),
      auditorWorkload: this.group(rows, "lead_auditor_user_id"),
      recent: [...rows]
        .sort((a, b) =>
          String(b.updated_at).localeCompare(String(a.updated_at)),
        )
        .slice(0, 10),
    };
  }

  async calendar(user: RequestUser, query: Row = {}) {
    const from =
      query.from ?? new Date(Date.now() - 31 * 86400000).toISOString();
    const to = query.to ?? new Date(Date.now() + 180 * 86400000).toISOString();
    const result = await this.register(user, {
      ...query,
      from,
      to,
      page: 1,
      limit: 100,
      sort: "planned_start_at.asc",
    });
    return {
      view: query.view ?? "month",
      from,
      to,
      items: result.rows.map((p) => ({
        id: p.id,
        title: p.plan_title,
        planCode: p.plan_code,
        program: p.program,
        siteId: p.site_id,
        start: p.planned_start_at,
        end: p.planned_end_at,
        leadAuditor: p.leadAuditor,
        status: p.plan_status,
        scheduleStatus: p.schedule_status,
        criticality: p.criticality,
        conflictStatus: p.conflict_status,
        readinessHealth: p.readiness_health,
      })),
    };
  }

  async context(user: RequestUser) {
    const [base, register, settings] = await Promise.all([
      this.programs.context(user),
      this.programs.register(user, { page: 1, limit: 200 }),
      this.settings.get(user),
    ]);
    return {
      ...base,
      programs: register.rows.filter((program: Row) =>
        ["Active", "Approved", "Ready For Scheduling"].includes(
          program.program_status,
        ),
      ),
      settings,
      planLookups: this.lookups(),
    };
  }

  async detail(user: RequestUser, planId: string) {
    const plan = await this.plan(user, planId);
    return this.enrich(plan, true);
  }

  async create(user: RequestUser, dto: Row) {
    this.validateIdentity(dto);
    const siteId = dto.siteId ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    await Promise.all([
      dto.leadAuditorUserId
        ? this.iam.user(user, dto.leadAuditorUserId, siteId)
        : null,
      dto.ownerUserId ? this.iam.user(user, dto.ownerUserId, siteId) : null,
      dto.reviewerUserId
        ? this.iam.user(user, dto.reviewerUserId, siteId)
        : null,
    ]);
    const settings = await this.settings.get(user, siteId);
    const program = dto.programId
      ? await this.programRow(user, dto.programId)
      : null;
    if (!program && !dto.standaloneAudit)
      throw new BadRequestException(
        "Select an active Audit Program or mark this plan as a standalone audit.",
      );
    if (!program && !settings.allow_standalone_audits)
      throw new ForbiddenException(
        "Company policy does not allow standalone audit plans.",
      );
    if (!program && !String(dto.standaloneReason ?? "").trim())
      throw new BadRequestException("Standalone audit reason is required.");
    const now = new Date().toISOString();
    const row = this.planPayload(user, dto, {
      id: crypto.randomUUID(),
      site_id: siteId,
      program_id: program?.id ?? null,
      program_snapshot_json: program ? await this.programSnapshot(program) : {},
      created_by: user.id,
      created_at: now,
    });
    const saved = await this.db.single<Row>(
      this.db.from("audit_plans").insert(row).select().single(),
    );
    if (program && dto.copyProgramConfiguration !== false)
      await this.copyProgramConfiguration(user, saved, program.id);
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId: saved.id,
      siteId,
      type: "Created",
      title: "Audit plan created",
      after: saved,
    });
    await this.readiness.run(saved);
    return this.detail(user, saved.id);
  }

  async update(user: RequestUser, planId: string, dto: Row) {
    const before = await this.plan(user, planId);
    this.assertMutable(before);
    if (dto.siteId) this.assertSite(user, dto.siteId);
    const patch = this.planPayload(user, dto, before);
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_plans")
        .update(patch)
        .eq("company_id", user.tenantId)
        .eq("id", planId)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId,
      siteId: saved.site_id,
      type: "Updated",
      title: "Audit plan updated",
      before,
      after: saved,
    });
    await this.readiness.run(saved);
    return this.detail(user, planId);
  }

  async transition(
    user: RequestUser,
    planId: string,
    action: string,
    dto: Row = {},
  ) {
    const plan = await this.plan(user, planId);
    const now = new Date().toISOString();
    let patch: Row = {};
    if (action === "schedule") {
      const result = await this.readiness.run(plan);
      await this.conflicts.detect(plan);
      const refreshed = await this.plan(user, planId);
      const blocking = result.blockers.filter(
        (b: Row) => b.check_key !== "conflicts",
      );
      if (blocking.length)
        throw new BadRequestException(
          `Scheduling blocked: ${blocking.map((b: Row) => b.check_label).join(", ")}`,
        );
      if (refreshed.conflict_status === "Hard Conflict")
        throw new BadRequestException(
          "Scheduling blocked by a hard conflict. Resolve or override it first.",
        );
      patch = {
        plan_status: "Scheduled",
        schedule_status: this.scheduleStatus(refreshed),
        scheduled_by: user.id,
        scheduled_at: now,
      };
    } else if (action === "reschedule") {
      this.reason(dto);
      if (!dto.plannedStartAt || !dto.plannedEndAt)
        throw new BadRequestException(
          "New planned start and end dates are required.",
        );
      this.validateDates(dto);
      patch = {
        planned_start_at: dto.plannedStartAt,
        planned_end_at: dto.plannedEndAt,
        schedule_status: "Rescheduled",
        plan_status: "Scheduled",
        updated_by: user.id,
      };
    } else if (action === "postpone") {
      this.reason(dto);
      patch = {
        plan_status: "Postponed",
        schedule_status: "Postponed",
        postponed_by: user.id,
        postponed_at: now,
        postpone_reason: dto.reason,
      };
    } else if (action === "cancel") {
      this.reason(dto);
      patch = {
        plan_status: "Cancelled",
        schedule_status: "Cancelled",
        cancelled_by: user.id,
        cancelled_at: now,
        cancel_reason: dto.reason,
      };
    } else if (action === "archive") {
      this.reason(dto);
      patch = {
        plan_status: "Archived",
        archived_by: user.id,
        archived_at: now,
        archive_reason: dto.reason,
      };
    } else if (action === "reactivate")
      patch = {
        plan_status: "Draft",
        schedule_status: "Not Scheduled",
        archived_by: null,
        archived_at: null,
        archive_reason: null,
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
      };
    else if (action === "submit-review") {
      if (!plan.reviewer_user_id)
        throw new BadRequestException(
          "A reviewer must be assigned before submitting the plan.",
        );
      patch = { plan_status: "Pending Approval" };
    } else throw new BadRequestException("Unsupported plan transition.");
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_plans")
        .update({ ...patch, updated_by: user.id, updated_at: now })
        .eq("company_id", user.tenantId)
        .eq("id", planId)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId,
      siteId: saved.site_id,
      type: action,
      title: `Audit plan ${action.replace("-", " ")}`,
      description: dto.reason,
      before: plan,
      after: saved,
    });
    if (action === "submit-review")
      await this.db.single<Row>(
        this.db
          .from("audit_plan_review_records")
          .insert({
            company_id: user.tenantId,
            site_id: saved.site_id,
            plan_id: planId,
            review_status: "Pending",
            submitted_by: user.id,
            submitted_at: now,
          })
          .select()
          .single(),
      );
    if (
      [
        "schedule",
        "reschedule",
        "postpone",
        "cancel",
        "submit-review",
      ].includes(action)
    )
      await this.notifications.planEvent({
        tenantId: user.tenantId,
        siteId: saved.site_id,
        planId,
        planCode: saved.plan_code,
        planTitle: saved.plan_title,
        eventType: action,
        message: `Audit plan ${saved.plan_code} was ${action.replace("-", " ")}.`,
        recipientIds: [
          saved.lead_auditor_user_id,
          saved.owner_user_id,
          saved.reviewer_user_id,
        ],
        criticality: saved.criticality,
      });
    return this.detail(user, planId);
  }

  async reviewDecision(
    user: RequestUser,
    planId: string,
    decision: "approve" | "reject",
    dto: Row = {},
  ) {
    const plan = await this.plan(user, planId);
    if (plan.plan_status !== "Pending Approval")
      throw new BadRequestException("This plan is not pending approval.");
    if (decision === "reject") this.reason(dto);
    const readiness = await this.readiness.run(plan);
    if (decision === "approve" && readiness.blockers.length)
      throw new BadRequestException(
        `Approval blocked: ${readiness.blockers.map((item: Row) => item.check_label).join(", ")}`,
      );
    const now = new Date().toISOString();
    const review = await this.db.single<Row>(
      this.db
        .from("audit_plan_review_records")
        .update({
          review_status: decision === "approve" ? "Approved" : "Rejected",
          reviewed_by: user.id,
          reviewed_at: now,
          review_comment: dto.comment ?? dto.reason ?? null,
          updated_at: now,
        })
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .eq("review_status", "Pending")
        .select()
        .single(),
    );
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_plans")
        .update({
          plan_status:
            decision === "approve" ? "Approved" : "Planning In Progress",
          updated_by: user.id,
          updated_at: now,
        })
        .eq("company_id", user.tenantId)
        .eq("id", planId)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId,
      siteId: plan.site_id,
      type: decision === "approve" ? "Plan Approved" : "Plan Rejected",
      title: `Audit plan ${decision === "approve" ? "approved" : "rejected"}`,
      description: dto.comment ?? dto.reason,
      before: plan,
      after: { plan: saved, review },
    });
    return this.detail(user, planId);
  }

  async childRows(user: RequestUser, planId: string, kind: string) {
    await this.plan(user, planId);
    return this.db.many<Row>(
      this.db
        .from(this.childTable(kind))
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .order("created_at"),
    );
  }
  async saveChild(
    user: RequestUser,
    planId: string,
    kind: string,
    dto: Row,
    childId?: string,
  ) {
    const plan = await this.plan(user, planId);
    this.assertMutable(plan);
    const table = this.childTable(kind);
    const payload = this.childPayload(kind, dto, {
      id: childId ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: plan.site_id,
      plan_id: planId,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const saved = childId
      ? await this.db.single<Row>(
          this.db
            .from(table)
            .update(payload)
            .eq("company_id", user.tenantId)
            .eq("plan_id", planId)
            .eq("id", childId)
            .select()
            .single(),
        )
      : await this.db.single<Row>(
          this.db.from(table).insert(payload).select().single(),
        );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId,
      siteId: plan.site_id,
      type: `${kind} Updated`,
      title: `Audit plan ${kind} updated`,
      after: saved,
    });
    await this.readiness.run(plan);
    return saved;
  }
  async deleteChild(
    user: RequestUser,
    planId: string,
    kind: string,
    childId: string,
    dto: Row,
  ) {
    const plan = await this.plan(user, planId);
    this.assertMutable(plan);
    this.reason(dto);
    const removed = await this.db.single<Row>(
      this.db
        .from(this.childTable(kind))
        .delete()
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .eq("id", childId)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId,
      siteId: plan.site_id,
      type: `${kind} Removed`,
      title: `Audit plan ${kind} removed`,
      description: dto.reason,
      before: removed,
    });
    await this.readiness.run(plan);
    return { success: true };
  }

  async readinessFor(user: RequestUser, planId: string, run = false) {
    const plan = await this.plan(user, planId);
    if (run) return this.readiness.run(plan);
    const checks = await this.childRows(user, planId, "readiness");
    return {
      health: plan.readiness_health,
      readyForChecklist: plan.ready_for_checklist,
      checks,
      blockers: checks.filter(
        (c) => c.blocking && c.check_status !== "Complete",
      ),
    };
  }
  async conflictsFor(user: RequestUser, planId: string, detect = false) {
    const plan = await this.plan(user, planId);
    return detect
      ? this.conflicts.detect(plan)
      : this.childRows(user, planId, "conflicts");
  }
  async resolveConflict(
    user: RequestUser,
    planId: string,
    conflictId: string,
    dto: Row,
    override = false,
  ) {
    this.reason(dto);
    const plan = await this.plan(user, planId);
    const row = await this.db.single<Row>(
      this.db
        .from("audit_plan_conflicts")
        .update({
          conflict_status: override ? "Override Approved" : "Resolved",
          override_approved: override,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_reason: dto.reason,
        })
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .eq("id", conflictId)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      planId,
      siteId: plan.site_id,
      type: override ? "Conflict Override" : "Conflict Resolved",
      title: row.title,
      description: dto.reason,
      after: row,
    });
    await this.readiness.run(plan);
    return row;
  }

  async generateFromProgram(user: RequestUser, programId: string, dto: Row) {
    const program = await this.programRow(user, programId);
    const count = Math.min(24, Math.max(1, Number(dto.count ?? 1)));
    const baseDate = new Date(dto.plannedStartAt ?? Date.now());
    if (Number.isNaN(baseDate.getTime()))
      throw new BadRequestException("A valid planned start date is required.");
    const job = await this.db.single<Row>(
      this.db
        .from("audit_plan_generation_jobs")
        .insert({
          company_id: user.tenantId,
          site_id: dto.siteId ?? program.site_id,
          program_id: programId,
          job_status: "Running",
          created_by: user.id,
          request_json: dto,
        })
        .select()
        .single(),
    );
    const created: Row[] = [];
    try {
      for (let index = 0; index < count; index += 1) {
        const start = new Date(baseDate);
        start.setMonth(
          start.getMonth() + index * Number(dto.intervalMonths ?? 12),
        );
        const end = new Date(
          start.getTime() + Number(dto.durationDays ?? 1) * 86400000,
        );
        created.push(
          await this.create(user, {
            programId,
            siteId: dto.siteId ?? program.site_id,
            planCode: `${dto.planCodePrefix ?? program.program_code}-${start.getFullYear()}-${String(index + 1).padStart(2, "0")}`,
            planTitle:
              dto.planTitle ??
              `${program.program_title} - ${start.getFullYear()}`,
            auditType: program.audit_type,
            planCategory: dto.planCategory ?? "Program Audit",
            criticality: program.criticality,
            plannedStartAt: start.toISOString(),
            plannedEndAt: end.toISOString(),
            leadAuditorUserId: dto.leadAuditorUserId,
            ownerUserId: dto.ownerUserId ?? program.owner_user_id,
            reviewerUserId: dto.reviewerUserId ?? program.reviewer_user_id,
            copyProgramConfiguration: true,
          }),
        );
      }
      await this.db.single<Row>(
        this.db
          .from("audit_plan_generation_jobs")
          .update({
            job_status: "Completed",
            result_json: {
              createdCount: created.length,
              createdPlanIds: created.map((entry) => entry.plan.id),
            },
            completed_at: new Date().toISOString(),
          })
          .eq("company_id", user.tenantId)
          .eq("id", job.id)
          .select()
          .single(),
      );
    } catch (error) {
      await this.db.many<Row>(
        this.db
          .from("audit_plan_generation_jobs")
          .update({
            job_status: "Failed",
            result_json: {
              createdCount: created.length,
              createdPlanIds: created.map((entry) => entry.plan.id),
            },
            error_message:
              error instanceof Error
                ? error.message
                : "Plan generation failed.",
            completed_at: new Date().toISOString(),
          })
          .eq("company_id", user.tenantId)
          .eq("id", job.id),
      );
      throw error;
    }
    return { jobId: job.id, createdCount: created.length, plans: created };
  }

  async historyRows(user: RequestUser, planId?: string) {
    let q: any = this.db
      .from("audit_plan_history_events")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);
    if (planId) q = q.eq("plan_id", planId);
    const { data, count, error } = await q
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  }
  async generationJobs(user: RequestUser) {
    return {
      rows: await this.db.many<Row>(
        this.db
          .from("audit_plan_generation_jobs")
          .select("*")
          .eq("company_id", user.tenantId)
          .order("created_at", { ascending: false })
          .limit(100),
      ),
    };
  }
  async generationJob(user: RequestUser, jobId: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_plan_generation_jobs")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", jobId)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Generation job not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  async scopedPlans(
    user: RequestUser,
    scope: "unit_id" | "area_id",
    value: string,
    query: Row = {},
  ) {
    const scopes = await this.db.many<Row>(
      this.db
        .from("audit_plan_scopes")
        .select("plan_id")
        .eq("company_id", user.tenantId)
        .eq(scope, value),
    );
    const ids = [...new Set(scopes.map((row) => row.plan_id))];
    if (!ids.length)
      return {
        rows: [],
        total: 0,
        page: 1,
        limit: Number(query.limit ?? 25),
        summary: this.summaryFrom([]),
      };
    const result = await this.register(user, { ...query, page: 1, limit: 100 });
    const rows = result.rows.filter((row) => ids.includes(row.id));
    return {
      ...result,
      rows,
      total: rows.length,
      summary: this.summaryFrom(rows),
    };
  }

  lookups() {
    return {
      planStatuses: [
        "Draft",
        "Planning In Progress",
        "Scheduled",
        "Pending Approval",
        "Approved",
        "Ready For Checklist",
        "Checklist In Progress Foundation",
        "Ready For Execution Foundation",
        "In Execution Foundation",
        "Completed Foundation",
        "Overdue",
        "Postponed",
        "Cancelled",
        "Superseded",
        "Archived",
      ],
      scheduleStatuses: [
        "Not Scheduled",
        "Scheduled",
        "Upcoming",
        "Due Soon",
        "Due Today",
        "Overdue",
        "Rescheduled",
        "Postponed",
        "Cancelled",
        "Completed Foundation",
      ],
      readinessStatuses: [
        "Complete",
        "Missing Program",
        "Missing Scope",
        "Missing Standards",
        "Missing Modules",
        "Missing Team",
        "Missing Lead Auditor",
        "Missing Dates",
        "Pending Approval",
        "Conflict Detected",
        "Ready For Checklist",
      ],
      conflictStatuses: [
        "No Conflict",
        "Potential Conflict",
        "Hard Conflict",
        "Needs Review",
        "Resolved",
        "Override Approved",
      ],
      auditModes: [
        "Onsite",
        "Remote",
        "Hybrid",
        "Desktop Review",
        "Field Verification",
        "Interview-Based",
        "Document Review",
        "System Review",
      ],
      planCategories: [
        "Program Audit",
        "Recurring Audit",
        "One-Time Audit",
        "Triggered Audit",
        "Follow-Up Audit",
        "Regulatory Audit",
        "Corporate Audit",
        "Custom",
      ],
      teamRoles: [
        "Lead Auditor",
        "Co-Auditor",
        "Technical Expert",
        "Process Safety Engineer",
        "HSE Representative",
        "Operations Representative",
        "Maintenance Representative",
        "Site Representative",
        "Unit Representative",
        "Contractor Representative",
        "Observer",
        "Approver",
        "Custom",
      ],
    };
  }

  private async plan(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_plans")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Audit plan not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  private async programRow(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_programs")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Audit Program not found.");
    if (
      !["Active", "Approved", "Ready For Scheduling"].includes(
        row.program_status,
      )
    )
      throw new BadRequestException(
        `Audit Program must be active or approved. Current status: ${row.program_status}.`,
      );
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  private async enrich(plan: Row, full = false) {
    const [program, scopes, standards, modules, team] = await Promise.all([
      plan.program_id
        ? this.db
            .single<Row>(
              this.db
                .from("audit_programs")
                .select(
                  "id,program_code,program_title,program_status,owner_user_id",
                )
                .eq("company_id", plan.company_id)
                .eq("id", plan.program_id)
                .maybeSingle(),
            )
            .catch(() => null)
        : null,
      this.rows("audit_plan_scopes", plan),
      this.rows("audit_plan_standards", plan),
      this.rows("audit_plan_modules", plan),
      this.rows("audit_plan_team_members", plan),
    ]);
    const derived = {
      ...plan,
      schedule_status: this.scheduleStatus(plan),
      program,
      scopes: scopes.map((row) => this.present(row)),
      standards: standards.map((row) => this.present(row)),
      modules: modules.map((row) => this.present(row)),
      team: team.map((row) => this.present(row)),
      durationDays:
        plan.planned_start_at && plan.planned_end_at
          ? Math.max(
              1,
              Math.ceil(
                (new Date(plan.planned_end_at).getTime() -
                  new Date(plan.planned_start_at).getTime()) /
                  86400000,
              ),
            )
          : null,
      daysUntilAudit: plan.planned_start_at
        ? Math.ceil(
            (new Date(plan.planned_start_at).getTime() - Date.now()) / 86400000,
          )
        : null,
    };
    if (!full) return derived;
    const [scheduleEvents, readinessChecks, conflicts, reviews, history] =
      await Promise.all([
        this.rows("audit_plan_schedule_events", plan),
        this.rows("audit_plan_readiness_checks", plan),
        this.rows("audit_plan_conflicts", plan),
        this.rows("audit_plan_review_records", plan),
        this.rows("audit_plan_history_events", plan),
      ]);
    return {
      plan: derived,
      scheduleEvents,
      readinessChecks,
      conflicts,
      reviews,
      history,
    };
  }
  private rows(table: string, plan: Row) {
    return this.db.many<Row>(
      this.db
        .from(table)
        .select("*")
        .eq("company_id", plan.company_id)
        .eq(
          table === "audit_plan_history_events" ? "plan_id" : "plan_id",
          plan.id,
        ),
    );
  }
  private async programSnapshot(program: Row) {
    const [scopes, standards, modules] = await Promise.all(
      [
        "audit_program_scopes",
        "audit_program_standards",
        "audit_program_modules",
      ].map((table) =>
        this.db.many<Row>(
          this.db
            .from(table)
            .select("*")
            .eq("company_id", program.company_id)
            .eq("program_id", program.id)
            .is("removed_at", null),
        ),
      ),
    );
    return {
      program: {
        id: program.id,
        code: program.program_code,
        title: program.program_title,
        status: program.program_status,
        ownerUserId: program.owner_user_id,
        criticality: program.criticality,
        auditType: program.audit_type,
      },
      scopes,
      standards,
      modules,
      capturedAt: new Date().toISOString(),
    };
  }
  private async copyProgramConfiguration(
    user: RequestUser,
    plan: Row,
    programId: string,
  ) {
    const snapshot =
      plan.program_snapshot_json ??
      (await this.programSnapshot(await this.programRow(user, programId)));
    const common = {
      company_id: user.tenantId,
      site_id: plan.site_id,
      plan_id: plan.id,
      created_by: user.id,
    };
    if (snapshot.scopes?.length)
      await this.db.many(
        this.db
          .from("audit_plan_scopes")
          .insert(
            snapshot.scopes.map((x: Row) => ({
              ...common,
              id: crypto.randomUUID(),
              scope_type: x.scope_type,
              site_scope_id: x.site_scope_id,
              unit_id: x.unit_id,
              area_id: x.area_id,
              department_id: x.department_id,
              equipment_id: x.equipment_id,
              process_system: x.process_system,
              contractor_company_id: x.contractor_company_id,
              worker_role_scope: x.worker_role_scope,
              scope_description: x.scope_description,
              exclusions: x.exclusions,
              scope_justification: x.scope_justification,
              source_from_program: true,
            })),
          )
          .select(),
      );
    if (snapshot.standards?.length)
      await this.db.many(
        this.db
          .from("audit_plan_standards")
          .insert(
            snapshot.standards.map((x: Row) => ({
              ...common,
              id: crypto.randomUUID(),
              standard_name: x.standard_name,
              jurisdiction: x.jurisdiction,
              clause_reference: x.clause_reference,
              requirement_category: x.requirement_category,
              applicability: x.applicability,
              mandatory: x.mandatory,
              evidence_expectation: x.evidence_expectation,
              notes: x.notes,
              source_from_program: true,
            })),
          )
          .select(),
      );
    if (snapshot.modules?.length)
      await this.db.many(
        this.db
          .from("audit_plan_modules")
          .insert(
            snapshot.modules.map((x: Row) => ({
              ...common,
              id: crypto.randomUUID(),
              module_key: x.module_key,
              module_name: x.module_name,
              coverage_level: x.coverage_level,
              coverage_reason: x.coverage_reason,
              evidence_source: x.evidence_source,
              required: x.required,
              notes: x.notes,
              source_from_program: true,
            })),
          )
          .select(),
      );
  }
  private planPayload(user: RequestUser, dto: Row, base: Row) {
    this.validateDates(dto);
    return this.compact({
      ...base,
      plan_code: dto.planCode ?? dto.plan_code ?? base.plan_code,
      plan_title: dto.planTitle ?? dto.plan_title ?? base.plan_title,
      description: dto.description ?? base.description,
      audit_type: dto.auditType ?? dto.audit_type ?? base.audit_type,
      plan_category:
        dto.planCategory ?? dto.plan_category ?? base.plan_category,
      criticality: dto.criticality ?? base.criticality,
      plan_status:
        dto.planStatus ?? dto.plan_status ?? base.plan_status ?? "Draft",
      schedule_status:
        dto.scheduleStatus ??
        dto.schedule_status ??
        base.schedule_status ??
        "Not Scheduled",
      standalone_audit:
        dto.standaloneAudit ??
        dto.standalone_audit ??
        base.standalone_audit ??
        false,
      standalone_reason:
        dto.standaloneReason ?? dto.standalone_reason ?? base.standalone_reason,
      audit_objective:
        dto.auditObjective ?? dto.audit_objective ?? base.audit_objective,
      audit_criteria:
        dto.auditCriteria ?? dto.audit_criteria ?? base.audit_criteria,
      planned_start_at:
        dto.plannedStartAt ?? dto.planned_start_at ?? base.planned_start_at,
      planned_end_at:
        dto.plannedEndAt ?? dto.planned_end_at ?? base.planned_end_at,
      timezone: dto.timezone ?? base.timezone ?? "UTC",
      audit_location:
        dto.auditLocation ?? dto.audit_location ?? base.audit_location,
      audit_mode: dto.auditMode ?? dto.audit_mode ?? base.audit_mode,
      pre_audit_meeting_at: dto.preAuditMeetingAt ?? base.pre_audit_meeting_at,
      opening_meeting_at: dto.openingMeetingAt ?? base.opening_meeting_at,
      closing_meeting_at: dto.closingMeetingAt ?? base.closing_meeting_at,
      checklist_due_at: dto.checklistDueAt ?? base.checklist_due_at,
      report_due_at: dto.reportDueAt ?? base.report_due_at,
      reminder_days_before_audit:
        dto.reminderDaysBeforeAudit ?? base.reminder_days_before_audit ?? 7,
      grace_period_days: dto.gracePeriodDays ?? base.grace_period_days ?? 0,
      lead_auditor_user_id: dto.leadAuditorUserId ?? base.lead_auditor_user_id,
      owner_user_id: dto.ownerUserId ?? base.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? base.reviewer_user_id,
      notes: dto.notes ?? base.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
  }
  private childPayload(kind: string, dto: Row, base: Row) {
    if (kind === "scope")
      return this.compact({
        ...base,
        scope_type: dto.scopeType,
        site_scope_id: dto.siteScopeId,
        unit_id: dto.unitId,
        area_id: dto.areaId,
        department_id: dto.departmentId,
        equipment_id: dto.equipmentId,
        process_system: dto.processSystem,
        contractor_company_id: dto.contractorCompanyId,
        worker_role_scope: dto.workerRoleScope,
        scope_description: dto.scopeDescription,
        exclusions: dto.exclusions,
        scope_justification: dto.scopeJustification,
        source_from_program: dto.sourceFromProgram ?? false,
      });
    if (kind === "standards")
      return this.compact({
        ...base,
        standard_name: dto.standardName,
        jurisdiction: dto.jurisdiction,
        clause_reference: dto.clauseReference,
        requirement_category: dto.requirementCategory,
        applicability: dto.applicability,
        mandatory: dto.mandatory ?? true,
        evidence_expectation: dto.evidenceExpectation,
        source_from_program: dto.sourceFromProgram ?? false,
        notes: dto.notes,
      });
    if (kind === "modules")
      return this.compact({
        ...base,
        module_key: dto.moduleKey,
        module_name: dto.moduleName,
        coverage_level: dto.coverageLevel,
        coverage_reason: dto.coverageReason,
        evidence_source: dto.evidenceSource,
        required: dto.required ?? true,
        source_from_program: dto.sourceFromProgram ?? false,
        notes: dto.notes,
      });
    if (kind === "team")
      return this.compact({
        ...base,
        user_id: dto.userId,
        team_role: dto.teamRole,
        responsibility: dto.responsibility,
        required: dto.required ?? false,
        qualification_status: dto.qualificationStatus,
        availability_status: dto.availabilityStatus,
        notes: dto.notes,
      });
    if (kind === "schedule-events")
      return this.compact({
        ...base,
        event_type: dto.eventType,
        start_at: dto.startAt,
        end_at: dto.endAt,
        timezone: dto.timezone ?? "UTC",
        location: dto.location,
        notes: dto.notes,
      });
    return { ...base, ...dto };
  }
  private childTable(kind: string) {
    const map: Row = {
      scope: "audit_plan_scopes",
      standards: "audit_plan_standards",
      modules: "audit_plan_modules",
      team: "audit_plan_team_members",
      "schedule-events": "audit_plan_schedule_events",
      readiness: "audit_plan_readiness_checks",
      conflicts: "audit_plan_conflicts",
    };
    if (!map[kind])
      throw new BadRequestException("Unsupported audit plan section.");
    return map[kind];
  }
  private validateIdentity(dto: Row) {
    const fields: Array<[string, string]> = [
      ["planTitle", "Plan title"],
      ["planCode", "Plan code"],
      ["auditType", "Audit type"],
      ["criticality", "Criticality"],
    ];
    const missing = fields
      .filter(([key]) => !String(dto[key] ?? "").trim())
      .map(([, label]) => label);
    if (missing.length)
      throw new BadRequestException(
        `Missing required fields: ${missing.join(", ")}.`,
      );
  }
  private validateDates(dto: Row) {
    const start = dto.plannedStartAt ?? dto.planned_start_at;
    const end = dto.plannedEndAt ?? dto.planned_end_at;
    const report = dto.reportDueAt ?? dto.report_due_at;
    if (start && end && new Date(end) < new Date(start))
      throw new BadRequestException(
        "Planned end date must be on or after planned start date.",
      );
    if (end && report && new Date(report) < new Date(end))
      throw new BadRequestException(
        "Report due date must be on or after the planned audit end date.",
      );
  }
  private assertSite(user: RequestUser, siteId: string) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return;
    if (!user.siteIds.includes(siteId))
      throw new ForbiddenException(
        "You do not have access to the selected site.",
      );
  }
  private assertMutable(plan: Row) {
    if (
      ["Cancelled", "Archived", "Completed Foundation", "Superseded"].includes(
        plan.plan_status,
      )
    )
      throw new BadRequestException(
        `${plan.plan_status} audit plans are read-only. Reactivate or reopen through the controlled workflow.`,
      );
  }
  private reason(dto: Row) {
    if (!String(dto.reason ?? "").trim())
      throw new BadRequestException("A reason is required for this action.");
  }
  private scheduleStatus(plan: Row) {
    if (plan.plan_status === "Cancelled") return "Cancelled";
    if (plan.plan_status === "Postponed") return "Postponed";
    if (plan.plan_status === "Completed Foundation")
      return "Completed Foundation";
    if (!plan.planned_start_at) return "Not Scheduled";
    const start = new Date(plan.planned_start_at);
    const end = new Date(plan.planned_end_at ?? plan.planned_start_at);
    const now = new Date();
    if (end < now) return "Overdue";
    const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
    if (days < 0) return "Scheduled";
    if (days === 0) return "Due Today";
    if (days <= 14) return "Due Soon";
    return "Upcoming";
  }
  private summaryFrom(rows: Row[]) {
    const count = (test: (p: Row) => boolean) => rows.filter(test).length;
    return {
      totalPlans: rows.length,
      draft: count((p) => p.plan_status === "Draft"),
      scheduled: count((p) => p.plan_status === "Scheduled"),
      upcoming: count((p) =>
        ["Upcoming", "Due Soon", "Due Today"].includes(p.schedule_status),
      ),
      overdue: count((p) => p.schedule_status === "Overdue"),
      postponed: count((p) => p.plan_status === "Postponed"),
      cancelled: count((p) => p.plan_status === "Cancelled"),
      archived: count((p) => p.plan_status === "Archived"),
      readyForChecklist: count((p) => p.ready_for_checklist),
      missingConfiguration: count((p) => !p.ready_for_checklist),
      conflicts: count((p) => p.conflict_status !== "No Conflict"),
      pendingApproval: count((p) => p.plan_status === "Pending Approval"),
      generatedFromPrograms: count((p) => Boolean(p.program_id)),
      standalone: count((p) => p.standalone_audit),
      safetyCritical: count((p) => p.criticality === "Safety-Critical"),
      regulatoryCritical: count((p) => p.criticality === "Regulatory-Critical"),
      psmCritical: count((p) => p.criticality === "PSM-Critical"),
    };
  }
  private group(rows: Row[], key: string) {
    return Object.entries(
      rows.reduce((acc: Row, row) => {
        const value = String(row[key] ?? "Unassigned");
        acc[value] = (acc[value] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([label, value]) => ({ label, value }));
  }
  private safeSearch(value: unknown) {
    return String(value)
      .replace(/[,%()]/g, " ")
      .trim();
  }
  private compact(value: Row) {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined),
    );
  }
  private present(row: Row) {
    return Object.entries(row).reduce<Row>((result, [key, value]) => {
      result[key] = value;
      result[
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
      ] = value;
      return result;
    }, {});
  }
}
