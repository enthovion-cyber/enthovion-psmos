import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActionsService } from "../actions/actions.service";
import { AuditService } from "../audit/audit.service";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WorkflowsService } from "../workflows/workflows.service";
import { ExecutiveAggregationService } from "./executive-aggregation.service";

type Row = Record<string, any>;
@Injectable()
export class ExecutiveManagementReviewService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly scopeService: ExecutiveAggregationService,
    private readonly actions: ActionsService,
    private readonly notifications: NotificationsService,
    private readonly workflows: WorkflowsService,
  ) {}
  async dashboard(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.dashboard.view");
    const scope = this.scopeService.scope(user, q);
    const [
      cycles,
      meetings,
      agenda,
      packages,
      minutes,
      decisions,
      commitments,
      risks,
      escalations,
    ] = await Promise.all([
      this.listTable(user, "executive_management_review_cycles", q, scope),
      this.listTable(user, "executive_management_review_meetings", q, scope),
      this.listTable(
        user,
        "executive_management_review_agenda_items",
        q,
        scope,
      ),
      this.listTable(user, "executive_management_review_packages", q, scope),
      this.listTable(user, "executive_management_review_minutes", q, scope),
      this.listTable(user, "executive_management_decisions", q, scope),
      this.listTable(user, "executive_management_commitments", q, scope),
      this.db
        .many<Row>(
          this.db
            .from("executive_risk_cases")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("case_status", "Open")
            .limit(50),
        )
        .catch(() => []),
      this.db
        .many<Row>(
          this.db
            .from("executive_escalations")
            .select("*")
            .eq("company_id", user.tenantId)
            .in("escalation_status", ["Active", "Acknowledged"])
            .limit(50),
        )
        .catch(() => []),
    ]);
    const now = Date.now();
    const overdue = (rows: Row[], date: string, status: string) =>
      rows.filter(
        (r: Row) =>
          r[date] &&
          new Date(r[date]).getTime() < now &&
          !/closed|completed|cancelled/i.test(String(r[status] ?? "")),
      ).length;
    return {
      scope,
      generatedAt: new Date().toISOString(),
      summary: {
        totalReviewCycles: cycles.total,
        activeReviewCycles: cycles.rows.filter((r: Row) =>
          [
            "Active",
            "Awaiting Review",
            "Under Review",
            "Follow-Up In Progress",
          ].includes(r.cycle_status),
        ).length,
        upcomingReviewMeetings: meetings.rows.filter(
          (r: Row) =>
            new Date(r.scheduled_start_at).getTime() >= now &&
            !/cancelled|completed/i.test(r.meeting_status),
        ).length,
        overdueReviewMeetings: overdue(
          meetings.rows,
          "scheduled_end_at",
          "meeting_status",
        ),
        meetingsCompleted: meetings.rows.filter(
          (r: Row) => r.meeting_status === "Completed",
        ).length,
        minutesPendingApproval: minutes.rows.filter(
          (r: Row) => r.minutes_status === "Pending Approval",
        ).length,
        approvedManagementReviews: minutes.rows.filter(
          (r: Row) => r.minutes_status === "Approved",
        ).length,
        openAgendaItems: agenda.rows.filter(
          (r: Row) =>
            !["Completed", "Deferred", "Carried Forward"].includes(
              r.agenda_status,
            ),
        ).length,
        criticalAgendaItems: agenda.rows.filter((r: Row) =>
          /critical/i.test(String(r.criticality)),
        ).length,
        pendingExecutiveDecisions: decisions.rows.filter((r: Row) =>
          /draft|pending/i.test(String(r.decision_status)),
        ).length,
        activeManagementCommitments: commitments.rows.filter(
          (r: Row) =>
            !["Closed", "Completed", "Cancelled"].includes(r.commitment_status),
        ).length,
        overdueManagementCommitments: overdue(
          commitments.rows,
          "effective_due_at",
          "commitment_status",
        ),
        criticalRiskCasesPendingReview: risks.length,
        escalationsRequiringManagementDecisions: escalations.length,
        reviewPackagesReady: packages.rows.filter(
          (r: Row) => r.readiness_status === "Ready",
        ).length,
        reviewPackagesWithWarnings: packages.rows.filter(
          (r: Row) => r.readiness_status === "Ready With Warnings",
        ).length,
        staleReviewPackages: packages.rows.filter(
          (r: Row) => r.stale_status === "Stale",
        ).length,
      },
      nextMeeting:
        meetings.rows
          .filter((r: Row) => new Date(r.scheduled_start_at).getTime() >= now)
          .sort((a: Row, b: Row) =>
            String(a.scheduled_start_at).localeCompare(
              String(b.scheduled_start_at),
            ),
          )[0] ?? null,
      upcomingMeetings: meetings.rows.slice(0, 10),
      criticalRisks: risks.slice(0, 10),
      escalations: escalations.slice(0, 10),
      pendingDecisions: decisions.rows
        .filter((r: Row) => /draft|pending/i.test(String(r.decision_status)))
        .slice(0, 10),
      openCommitments: commitments.rows
        .filter(
          (r: Row) =>
            !["Closed", "Completed", "Cancelled"].includes(r.commitment_status),
        )
        .slice(0, 10),
    };
  }
  async cycles(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.cycle.view");
    return this.listTable(
      user,
      "executive_management_review_cycles",
      q,
      this.scopeService.scope(user, q),
      "cycle_status",
    );
  }
  async createCycle(user: RequestUser, d: Row) {
    this.require(user, "executive.management_review.cycle.create");
    this.scopeService.scope(user, { siteId: d.siteId });
    if (
      !d.title ||
      !d.cycleType ||
      !d.governanceLevel ||
      !d.reportingStart ||
      !d.reportingEnd ||
      !d.ownerId
    )
      throw new BadRequestException(
        "Title, type, governance level, reporting period, and owner are required.",
      );
    if (new Date(d.reportingEnd) < new Date(d.reportingStart))
      throw new BadRequestException(
        "Reporting end must be on or after the reporting start.",
      );
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_cycles")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: d.siteId ?? user.selectedSiteId ?? null,
          cycle_code: `MRC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          cycle_title: d.title,
          cycle_type: d.cycleType,
          governance_level: d.governanceLevel,
          reporting_period_start: d.reportingStart,
          reporting_period_end: d.reportingEnd,
          planned_review_date: d.plannedReviewDate ?? null,
          required_completion_date: d.requiredCompletionDate ?? null,
          review_frequency: d.frequency ?? "Ad Hoc",
          owner_user_id: d.ownerId,
          sponsor_user_id: d.sponsorId ?? null,
          coordinator_user_id: d.coordinatorId ?? null,
          notes: d.notes ?? null,
          scope_json: d.scope ?? {},
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "CYCLE_CREATED",
      "Management review cycle created",
      { review_cycle_id: row.id, after: row },
    );
    return row;
  }
  async cycle(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.cycle.view");
    const row = await this.one(user, "executive_management_review_cycles", id);
    const [meetings, decisions, commitments, history] = await Promise.all([
      this.db.many<Row>(
        this.db
          .from("executive_management_review_meetings")
          .select("*")
          .eq("review_cycle_id", id)
          .eq("company_id", user.tenantId),
      ),
      this.db.many<Row>(
        this.db
          .from("executive_management_decisions")
          .select("*")
          .eq("review_cycle_id", id)
          .eq("company_id", user.tenantId),
      ),
      this.db.many<Row>(
        this.db
          .from("executive_management_commitments")
          .select("*")
          .eq("review_cycle_id", id)
          .eq("company_id", user.tenantId),
      ),
      this.historyRows(user, { review_cycle_id: id }),
    ]);
    return { cycle: row, meetings, decisions, commitments, history };
  }
  async transitionCycle(
    user: RequestUser,
    id: string,
    action: "activate" | "complete" | "reopen" | "archive",
    d: Row,
  ) {
    const perms: Record<string, string> = {
      activate: "executive.management_review.cycle.activate",
      complete: "executive.management_review.cycle.complete",
      reopen: "executive.management_review.cycle.reopen",
      archive: "executive.management_review.cycle.archive",
    };
    this.require(user, perms[action]!);
    const before = await this.one(
      user,
      "executive_management_review_cycles",
      id,
    );
    if (action === "archive" && !String(d.reason ?? "").trim())
      throw new BadRequestException("An archive reason is required.");
    if (action === "complete") {
      const open = await this.db.many<Row>(
        this.db
          .from("executive_management_commitments")
          .select("id")
          .eq("company_id", user.tenantId)
          .eq("review_cycle_id", id)
          .not("commitment_status", "in", "(Closed,Completed,Cancelled)"),
      );
      if (open.length && !String(d.completionSummary ?? "").trim())
        throw new BadRequestException(
          "Completion with open commitments requires a documented summary.",
        );
    }
    const update =
      action === "activate"
        ? { cycle_status: "Active", activated_at: new Date().toISOString() }
        : action === "complete"
          ? {
              cycle_status: "Completed",
              completed_at: new Date().toISOString(),
              completed_by: user.id,
              completion_summary: d.completionSummary ?? null,
            }
          : action === "reopen"
            ? {
                cycle_status: "Active",
                archived_at: null,
                archive_reason: null,
              }
            : {
                cycle_status: "Archived",
                archived_at: new Date().toISOString(),
                archived_by: user.id,
                archive_reason: d.reason,
              };
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_cycles")
        .update({
          ...update,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      `CYCLE_${action.toUpperCase()}`,
      `Management review cycle ${action}d`,
      { review_cycle_id: id, before, after },
    );
    return after;
  }
  async meetings(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.meeting.view");
    return this.listTable(
      user,
      "executive_management_review_meetings",
      q,
      this.scopeService.scope(user, q),
      "meeting_status",
    );
  }
  async createMeeting(user: RequestUser, d: Row) {
    this.require(user, "executive.management_review.meeting.create");
    const cycle = await this.one(
      user,
      "executive_management_review_cycles",
      String(d.cycleId),
    );
    if (!d.title || !d.chairpersonId || !d.startAt || !d.endAt || !d.timezone)
      throw new BadRequestException(
        "Cycle, title, chairperson, start/end time, and timezone are required.",
      );
    if (new Date(d.endAt) <= new Date(d.startAt))
      throw new BadRequestException("Meeting end must be after its start.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_meetings")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: cycle.site_id,
          review_cycle_id: cycle.id,
          meeting_code: `MRM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          meeting_title: d.title,
          meeting_type: d.meetingType ?? cycle.cycle_type,
          chairperson_user_id: d.chairpersonId,
          secretary_user_id: d.secretaryId ?? null,
          coordinator_user_id:
            d.coordinatorId ?? cycle.coordinator_user_id ?? null,
          executive_sponsor_user_id:
            d.sponsorId ?? cycle.sponsor_user_id ?? null,
          scheduled_start_at: d.startAt,
          scheduled_end_at: d.endAt,
          timezone: d.timezone,
          meeting_mode: d.mode ?? "Virtual",
          location: d.location ?? null,
          preparation_due_at: d.preparationDueAt ?? null,
          rsvp_due_at: d.rsvpDueAt ?? null,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "MEETING_CREATED",
      "Management review meeting created",
      { review_cycle_id: cycle.id, meeting_id: row.id, after: row },
    );
    return row;
  }
  async meeting(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.meeting.view");
    const row = await this.one(
      user,
      "executive_management_review_meetings",
      id,
    );
    const [participants, agenda, packages, minutes, readiness, history] =
      await Promise.all([
        this.db.many<Row>(
          this.db
            .from("executive_management_review_participants")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("meeting_id", id),
        ),
        this.db.many<Row>(
          this.db
            .from("executive_management_review_agenda_items")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("meeting_id", id)
            .order("agenda_order"),
        ),
        this.db.many<Row>(
          this.db
            .from("executive_management_review_packages")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("meeting_id", id),
        ),
        this.db.many<Row>(
          this.db
            .from("executive_management_review_minutes")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("meeting_id", id),
        ),
        this.readiness(user, { meetingId: id }),
        this.historyRows(user, { meeting_id: id }),
      ]);
    return {
      meeting: row,
      participants,
      agenda,
      packages,
      minutes,
      readiness,
      history,
    };
  }
  async meetingTransition(
    user: RequestUser,
    id: string,
    action: "schedule" | "start" | "adjourn" | "complete" | "cancel",
    d: Row,
  ) {
    const map: Record<string, string> = {
      schedule: "executive.management_review.meeting.schedule",
      start: "executive.management_review.meeting.start",
      adjourn: "executive.management_review.meeting.adjourn",
      complete: "executive.management_review.meeting.complete",
      cancel: "executive.management_review.meeting.cancel",
    };
    this.require(user, map[action]!);
    const before = await this.one(
      user,
      "executive_management_review_meetings",
      id,
    );
    if (action === "cancel" && !String(d.reason ?? "").trim())
      throw new BadRequestException("Cancellation reason is required.");
    if (action === "start") {
      const r = await this.readiness(user, { meetingId: id });
      if (r.blockerCount > 0)
        throw new BadRequestException(
          "Meeting readiness blockers must be resolved before starting.",
        );
    }
    const now = new Date().toISOString();
    const patch =
      action === "schedule"
        ? { meeting_status: "Scheduled" }
        : action === "start"
          ? { meeting_status: "In Progress", started_at: now }
          : action === "adjourn"
            ? { meeting_status: "Adjourned", adjourned_at: now }
            : action === "complete"
              ? { meeting_status: "Completed", completed_at: now }
              : {
                  meeting_status: "Cancelled",
                  cancelled_at: now,
                  cancellation_reason: d.reason,
                };
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_meetings")
        .update({ ...patch, updated_by: user.id, updated_at: now })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      `MEETING_${action.toUpperCase()}`,
      `Meeting ${action}d`,
      { meeting_id: id, before, after },
    );
    return after;
  }
  async addParticipant(user: RequestUser, meetingId: string, d: Row) {
    this.require(user, "executive.management_review.meeting.edit");
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      meetingId,
    );
    if (!d.userId || !d.role)
      throw new BadRequestException("User and participant role are required.");
    const member = await this.db.single<Row>(
      this.db
        .from("User")
        .select("id,tenantId,status")
        .eq("id", d.userId)
        .maybeSingle(),
    );
    if (
      !member ||
      member.tenantId !== user.tenantId ||
      member.status !== "ACTIVE"
    )
      throw new BadRequestException(
        "Participant must be an active user in this company.",
      );
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_participants")
        .upsert(
          {
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: meeting.site_id,
            meeting_id: meetingId,
            user_id: d.userId,
            participant_role: d.role,
            required: Boolean(d.required),
            invitation_status: "Sent",
            invited_by: user.id,
            invited_at: new Date().toISOString(),
          },
          { onConflict: "meeting_id,user_id" },
        )
        .select("*")
        .single(),
    );
    await this.notifications
      .notifyUser({
        tenantId: user.tenantId,
        companyId: user.tenantId,
        userId: d.userId,
        siteId: meeting.site_id,
        type: "executive.management_review.invited",
        module: "executive",
        title: "Management review invitation",
        message: meeting.meeting_title,
        relatedRecordId: meetingId,
        relatedRecordType: "ManagementReviewMeeting",
        relatedUrl: `/executive/management-review/meetings/${meetingId}`,
        priority: "Normal",
      })
      .catch(() => null);
    await this.history(
      user,
      "PARTICIPANT_INVITED",
      "Meeting participant invited",
      { meeting_id: meetingId, after: row },
    );
    return row;
  }
  async attendance(user: RequestUser, meetingId: string, d: Row) {
    this.require(user, "executive.management_review.meeting.record_attendance");
    const participant = await this.db.single<Row>(
      this.db
        .from("executive_management_review_participants")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("meeting_id", meetingId)
        .eq("id", d.participantId)
        .maybeSingle(),
    );
    if (!participant)
      throw new NotFoundException("Meeting participant was not found.");
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_participants")
        .update({
          attendance_status: d.attendanceStatus,
          attendance_recorded_by: user.id,
          attendance_recorded_at: new Date().toISOString(),
          apology_note: d.apologyNote ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", participant.id)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "ATTENDANCE_RECORDED",
      "Meeting attendance recorded",
      { meeting_id: meetingId, after },
    );
    return after;
  }
  async agenda(user: RequestUser, meetingId: string) {
    this.require(user, "executive.management_review.agenda.view");
    await this.one(user, "executive_management_review_meetings", meetingId);
    return this.db.many<Row>(
      this.db
        .from("executive_management_review_agenda_items")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("meeting_id", meetingId)
        .order("agenda_order"),
    );
  }
  async addAgenda(user: RequestUser, meetingId: string, d: Row) {
    this.require(user, "executive.management_review.agenda.create");
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      meetingId,
    );
    if (!d.title || !d.category)
      throw new BadRequestException("Agenda title and category are required.");
    if (d.criticalRiskCaseId)
      await this.one(user, "executive_risk_cases", d.criticalRiskCaseId);
    if (d.escalationId)
      await this.one(user, "executive_escalations", d.escalationId);
    const count = (await this.agenda(user, meetingId)).length;
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_agenda_items")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: meeting.site_id,
          meeting_id: meetingId,
          agenda_code: `AGI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          agenda_category: d.category,
          agenda_title: d.title,
          agenda_description: d.description ?? null,
          agenda_order: Number(d.order ?? count + 1),
          presenter_user_id: d.presenterId ?? null,
          owner_user_id: d.ownerId ?? null,
          source_module: d.sourceModule ?? null,
          source_record_type: d.sourceRecordType ?? null,
          source_record_id: d.sourceRecordId ?? null,
          critical_risk_case_id: d.criticalRiskCaseId ?? null,
          escalation_id: d.escalationId ?? null,
          universal_action_id: d.actionId ?? null,
          decision_required: Boolean(d.decisionRequired),
          criticality: d.criticality ?? null,
          priority: d.priority ?? null,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "AGENDA_ITEM_CREATED",
      "Management review agenda item created",
      { meeting_id: meetingId, agenda_item_id: row.id, after: row },
    );
    return row;
  }
  async readiness(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.readiness.view");
    const meetingId = q.meetingId ?? null;
    const meeting = meetingId
      ? await this.one(user, "executive_management_review_meetings", meetingId)
      : null;
    const participants = meeting
      ? await this.db.many<Row>(
          this.db
            .from("executive_management_review_participants")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("meeting_id", meeting.id),
        )
      : [];
    const agenda = meeting ? await this.agenda(user, meeting.id) : [];
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (meeting && meeting.meeting_status !== "Scheduled")
      blockers.push("Meeting has not been scheduled.");
    if (meeting && !agenda.length) blockers.push("Meeting agenda is empty.");
    if (
      meeting &&
      participants
        .filter((p) => p.required)
        .some(
          (p) =>
            p.invitation_status !== "Sent" &&
            p.invitation_status !== "Accepted",
        )
    )
      blockers.push("Required participants have not been invited.");
    if (meeting && agenda.some((a) => a.decision_required && !a.owner_user_id))
      warnings.push(
        "One or more decision-required agenda items have no owner.",
      );
    const status = blockers.length
      ? "Blocked"
      : warnings.length
        ? "Ready With Warnings"
        : "Ready";
    const result = {
      meetingId: meeting?.id ?? null,
      readinessStatus: status,
      blockerCount: blockers.length,
      warningCount: warnings.length,
      missingRequiredDataCount: blockers.length,
      staleSourceCount: 0,
      restrictedConflictCount: 0,
      blockers,
      warnings,
    };
    if (meeting)
      await this.db
        .single(
          this.db
            .from("executive_management_review_readiness_results")
            .insert({
              id: crypto.randomUUID(),
              company_id: user.tenantId,
              site_id: meeting.site_id,
              meeting_id: meeting.id,
              review_cycle_id: meeting.review_cycle_id,
              readiness_status: status,
              result_details_json: result,
              blocker_count: blockers.length,
              warning_count: warnings.length,
              missing_required_data_count: blockers.length,
              checked_by: user.id,
            })
            .select("id")
            .single(),
        )
        .catch(() => null);
    return result;
  }
  async packages(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.package.view");
    return this.listTable(
      user,
      "executive_management_review_packages",
      q,
      this.scopeService.scope(user, q),
      "package_status",
    );
  }
  async createPackage(user: RequestUser, d: Row) {
    this.require(user, "executive.management_review.package.create");
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      String(d.meetingId),
    );
    if (!d.title) throw new BadRequestException("Package title is required.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_packages")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: meeting.site_id,
          meeting_id: meeting.id,
          review_cycle_id: meeting.review_cycle_id,
          package_code: `MRP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          package_title: d.title,
          package_type: d.packageType ?? "Management Review",
          confidentiality_level: d.confidentialityLevel ?? "Internal",
          section_config_json: d.sectionConfig ?? {},
          included_modules_json: d.includedModules ?? [],
          excluded_modules_json: d.excludedModules ?? [],
          restricted_modules_json: d.restrictedModules ?? [],
          created_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "PACKAGE_CREATED",
      "Management review package created",
      {
        review_cycle_id: meeting.review_cycle_id,
        meeting_id: meeting.id,
        package_id: row.id,
        after: row,
      },
    );
    return row;
  }
  async package(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.package.view");
    const row = await this.one(
      user,
      "executive_management_review_packages",
      id,
    );
    await this.db
      .single(
        this.db
          .from("executive_management_review_package_access_events")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: row.site_id,
            package_id: id,
            accessed_by: user.id,
            access_type: "View",
          })
          .select("id")
          .single(),
      )
      .catch(() => null);
    const versions = await this.packageVersions(user, id);
    const versionIds = versions.map((version) => version.id);
    const [sources, readiness, history] = await Promise.all([
      versionIds.length
        ? this.db.many<Row>(
            this.db
              .from("executive_management_review_package_sources")
              .select("*")
              .eq("company_id", user.tenantId)
              .in("package_version_id", versionIds),
          )
        : Promise.resolve([]),
      this.validatePackage(user, id),
      this.historyRows(user, { package_id: id }),
    ]);
    return { package: row, versions, sources, readiness, history };
  }
  async packageVersions(user: RequestUser, id: string) {
    await this.one(user, "executive_management_review_packages", id);
    return this.db.many<Row>(
      this.db
        .from("executive_management_review_package_versions")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("package_id", id)
        .order("version_number", { ascending: false }),
    );
  }
  async packageAccessLog(user: RequestUser, id: string) {
    await this.one(user, "executive_management_review_packages", id);
    return this.db.many<Row>(
      this.db
        .from("executive_management_review_package_access_events")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("package_id", id)
        .order("accessed_at", { ascending: false }),
    );
  }
  async validatePackage(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.readiness.view");
    const pack = await this.one(
      user,
      "executive_management_review_packages",
      id,
    );
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      pack.meeting_id,
    );
    const meetingReadiness = await this.readiness(user, {
      meetingId: meeting.id,
    });
    const blockers = [...meetingReadiness.blockers];
    const warnings = [...meetingReadiness.warnings];
    if (!pack.package_title) blockers.push("Package title is missing.");
    const status = blockers.length
      ? "Blocked"
      : warnings.length
        ? "Ready With Warnings"
        : "Ready";
    const result = {
      packageId: id,
      readinessStatus: status,
      blockerCount: blockers.length,
      warningCount: warnings.length,
      blockers,
      warnings,
    };
    await this.db.single(
      this.db
        .from("executive_management_review_packages")
        .update({
          readiness_status: status,
          readiness_results_json: result,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("id")
        .single(),
    );
    return result;
  }
  async generatePackage(user: RequestUser, id: string, d: Row = {}) {
    this.require(
      user,
      d.regenerate
        ? "executive.management_review.package.regenerate"
        : "executive.management_review.package.generate",
    );
    const pack = await this.one(
      user,
      "executive_management_review_packages",
      id,
    );
    if (pack.locked_at)
      throw new BadRequestException(
        "An official package is immutable. Create a replacement package instead.",
      );
    const check = await this.validatePackage(user, id);
    if (check.blockerCount)
      throw new BadRequestException(
        `Package cannot be generated: ${check.blockers.join(" ")}`,
      );
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      pack.meeting_id,
    );
    const [agenda, risks, escalations] = await Promise.all([
      this.agenda(user, meeting.id),
      this.db
        .many<Row>(
          this.db
            .from("executive_risk_cases")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("case_status", "Open"),
        )
        .catch(() => []),
      this.db
        .many<Row>(
          this.db
            .from("executive_escalations")
            .select("*")
            .eq("company_id", user.tenantId)
            .in("escalation_status", ["Active", "Acknowledged"]),
        )
        .catch(() => []),
    ]);
    const version = Number(pack.current_version_number ?? 0) + 1;
    const snapshot = {
      meeting,
      agenda,
      criticalRisks: risks,
      escalations,
      generatedAt: new Date().toISOString(),
    };
    const versionRow = await this.db.single<Row>(
      this.db
        .from("executive_management_review_package_versions")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: pack.site_id,
          package_id: id,
          version_number: version,
          version_status: "Generated",
          source_snapshot_json: snapshot,
          manifest_json: {
            agendaItems: agenda.length,
            criticalRiskCases: risks.length,
            escalations: escalations.length,
          },
          content_config_snapshot_json: pack.section_config_json ?? {},
          generated_by: user.id,
          version_reason:
            d.reason ??
            (d.regenerate
              ? "Regenerated package"
              : "Initial package generation"),
        })
        .select("*")
        .single(),
    );
    const sourceRows = [
      ...agenda
        .filter((a) => a.source_record_id)
        .map((a) => ({
          source_module: a.source_module ?? "Executive",
          source_record_type: a.source_record_type ?? "Agenda Item",
          source_record_id: a.source_record_id,
          source_snapshot_json: a,
        })),
      ...risks.map((r) => ({
        source_module: r.source_module ?? "Executive",
        source_record_type: "Critical Risk Case",
        source_record_id: r.id,
        source_snapshot_json: r,
      })),
      ...escalations.map((e) => ({
        source_module: "Executive",
        source_record_type: "Escalation",
        source_record_id: e.id,
        source_snapshot_json: e,
      })),
    ];
    for (const source of sourceRows)
      await this.db.single(
        this.db
          .from("executive_management_review_package_sources")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: pack.site_id,
            package_version_id: versionRow.id,
            source_module: source.source_module,
            source_record_type: source.source_record_type,
            source_record_id: source.source_record_id,
            source_snapshot_json: source.source_snapshot_json,
            source_freshness_status: "Current",
          })
          .select("id")
          .single(),
      );
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_packages")
        .update({
          package_status: "Generated",
          current_version_number: version,
          source_count: sourceRows.length,
          generated_by: user.id,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "PACKAGE_GENERATED",
      "Management review package version generated",
      {
        review_cycle_id: pack.review_cycle_id,
        meeting_id: pack.meeting_id,
        package_id: id,
        before: pack,
        after,
      },
    );
    return { package: after, version: versionRow, readiness: check };
  }
  async publishPackage(user: RequestUser, id: string, d: Row = {}) {
    this.require(user, "executive.management_review.package.publish");
    const before = await this.one(
      user,
      "executive_management_review_packages",
      id,
    );
    if (before.package_status !== "Generated")
      throw new BadRequestException(
        "Generate a package version before publishing.",
      );
    const readiness = await this.validatePackage(user, id);
    if (readiness.blockerCount)
      throw new BadRequestException(
        "Resolve package readiness blockers before publishing.",
      );
    const now = new Date().toISOString();
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_packages")
        .update({
          package_status: "Published",
          published_by: user.id,
          published_at: now,
          locked_by: user.id,
          locked_at: now,
          updated_at: now,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "PACKAGE_PUBLISHED",
      "Management review package published and locked",
      {
        review_cycle_id: after.review_cycle_id,
        meeting_id: after.meeting_id,
        package_id: id,
        before,
        after,
      },
    );
    return after;
  }
  async minutes(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.minutes.view");
    return this.listTable(
      user,
      "executive_management_review_minutes",
      q,
      this.scopeService.scope(user, q),
      "minutes_status",
    );
  }
  async createMinutes(user: RequestUser, meetingId: string, d: Row = {}) {
    this.require(user, "executive.management_review.minutes.create");
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      meetingId,
    );
    if (["Draft", "Scheduled"].includes(meeting.meeting_status))
      throw new BadRequestException(
        "Minutes can be created only after a meeting has started.",
      );
    const existing = await this.db.single<Row>(
      this.db
        .from("executive_management_review_minutes")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("meeting_id", meetingId)
        .maybeSingle(),
    );
    if (existing) return existing;
    const [participants, agenda, decisions, commitments] = await Promise.all([
      this.db.many<Row>(
        this.db
          .from("executive_management_review_participants")
          .select("*")
          .eq("meeting_id", meetingId)
          .eq("company_id", user.tenantId),
      ),
      this.agenda(user, meetingId),
      this.db.many<Row>(
        this.db
          .from("executive_management_decisions")
          .select("*")
          .eq("meeting_id", meetingId)
          .eq("company_id", user.tenantId),
      ),
      this.db.many<Row>(
        this.db
          .from("executive_management_commitments")
          .select("*")
          .eq("meeting_id", meetingId)
          .eq("company_id", user.tenantId),
      ),
    ]);
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_minutes")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: meeting.site_id,
          meeting_id: meetingId,
          minutes_code: `MRMIN-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          summary: d.summary ?? null,
          attendance_snapshot_json: participants,
          agenda_summary_json: agenda,
          decision_summary_json: decisions,
          commitment_summary_json: commitments,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    const version = await this.db.single<Row>(
      this.db
        .from("executive_management_review_minutes_versions")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: meeting.site_id,
          minutes_id: row.id,
          version_number: 1,
          content_snapshot_json: row,
          generated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.db.single(
      this.db
        .from("executive_management_review_minutes")
        .update({ current_version_number: 1 })
        .eq("id", row.id)
        .select("id")
        .single(),
    );
    await this.history(
      user,
      "MINUTES_CREATED",
      "Management review minutes draft created",
      {
        review_cycle_id: meeting.review_cycle_id,
        meeting_id: meetingId,
        minutes_id: row.id,
        after: { ...row, version },
      },
    );
    return row;
  }
  async submitMinutes(user: RequestUser, id: string, d: Row = {}) {
    this.require(user, "executive.management_review.minutes.submit");
    const before = await this.one(
      user,
      "executive_management_review_minutes",
      id,
    );
    if (before.minutes_status !== "Draft")
      throw new BadRequestException("Only draft minutes can be submitted.");
    if (!String(d.summary ?? before.summary ?? "").trim())
      throw new BadRequestException(
        "Minutes summary is required before submission.",
      );
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_minutes")
        .update({
          summary: d.summary ?? before.summary,
          minutes_status: "Pending Approval",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "MINUTES_SUBMITTED",
      "Management review minutes submitted for approval",
      { minutes_id: id, meeting_id: after.meeting_id, before, after },
    );
    return after;
  }
  async decisions(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.decision.view");
    return this.listTable(
      user,
      "executive_management_decisions",
      q,
      this.scopeService.scope(user, q),
      "decision_status",
    );
  }
  async createDecision(user: RequestUser, d: Row) {
    this.require(user, "executive.management_review.decision.create");
    if (
      !d.summary ||
      !d.rationale ||
      !d.type ||
      !d.meetingId ||
      !d.decisionMakerId
    )
      throw new BadRequestException(
        "Meeting, decision maker, type, summary, and rationale are required.",
      );
    const meeting = await this.one(
      user,
      "executive_management_review_meetings",
      d.meetingId,
    );
    const decisionMaker = await this.db.single<Row>(
      this.db
        .from("User")
        .select("id,tenantId,status")
        .eq("id", d.decisionMakerId)
        .maybeSingle(),
    );
    if (
      !decisionMaker ||
      decisionMaker.tenantId !== user.tenantId ||
      decisionMaker.status !== "ACTIVE"
    )
      throw new BadRequestException(
        "Decision maker must be an active user in this company.",
      );
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_decisions")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: meeting.site_id,
          decision_code: `MRD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          review_cycle_id: meeting.review_cycle_id,
          meeting_id: meeting.id,
          agenda_item_id: d.agendaItemId ?? null,
          decision_title: d.title ?? d.summary,
          decision_type: d.type,
          decision_summary: d.summary,
          decision_rationale: d.rationale,
          decision_maker_user_id: d.decisionMakerId,
          decision_status: "Draft",
          decision_at: new Date().toISOString(),
          follow_up_owner_user_id: d.ownerId ?? null,
          due_at: d.dueAt ?? null,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single(),
    );
    for (const link of Array.isArray(d.sourceLinks) ? d.sourceLinks : [])
      await this.db.single(
        this.db
          .from("executive_management_decision_source_links")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: meeting.site_id,
            decision_id: row.id,
            source_module: link.sourceModule,
            source_record_type: link.sourceRecordType,
            source_record_id: link.sourceRecordId,
            relationship_type: link.relationshipType ?? "Informed By",
            linked_by: user.id,
          })
          .select("id")
          .single(),
      );
    await this.history(
      user,
      "DECISION_CREATED",
      "Management decision drafted",
      {
        review_cycle_id: meeting.review_cycle_id,
        meeting_id: meeting.id,
        decision_id: row.id,
        after: row,
      },
    );
    return row;
  }
  async commitments(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.commitment.view");
    return this.listTable(
      user,
      "executive_management_commitments",
      q,
      this.scopeService.scope(user, q),
      "commitment_status",
    );
  }
  async createCommitment(user: RequestUser, d: Row) {
    this.require(user, "executive.management_review.commitment.create");
    if (!d.title || !d.description || !d.ownerId)
      throw new BadRequestException(
        "Commitment title, description, and owner are required.",
      );
    const meeting = d.meetingId
      ? await this.one(
          user,
          "executive_management_review_meetings",
          d.meetingId,
        )
      : null;
    const decision = d.decisionId
      ? await this.one(user, "executive_management_decisions", d.decisionId)
      : null;
    const siteId =
      meeting?.site_id ?? decision?.site_id ?? user.selectedSiteId ?? null;
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_commitments")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: siteId,
          commitment_code: `MRCMT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          commitment_title: d.title,
          commitment_description: d.description,
          decision_id: decision?.id ?? null,
          meeting_id: meeting?.id ?? null,
          review_cycle_id:
            meeting?.review_cycle_id ?? decision?.review_cycle_id ?? null,
          owner_user_id: d.ownerId,
          accountable_executive_user_id: d.accountableExecutiveId ?? null,
          priority: d.priority ?? "Medium",
          criticality: d.criticality ?? null,
          original_due_at: d.dueAt ?? null,
          effective_due_at: d.dueAt ?? null,
          verification_required: Boolean(d.verificationRequired),
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "COMMITMENT_CREATED",
      "Management commitment created",
      {
        review_cycle_id: row.review_cycle_id,
        meeting_id: row.meeting_id,
        decision_id: row.decision_id,
        commitment_id: row.id,
        after: row,
      },
    );
    return row;
  }
  async createCommitmentAction(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.commitment.assign");
    const before = await this.one(user, "executive_management_commitments", id);
    if (before.universal_action_id)
      throw new BadRequestException(
        "This commitment is already linked to a Universal Action.",
      );
    if (!before.effective_due_at)
      throw new BadRequestException(
        "A commitment due date is required before creating an action.",
      );
    const action = await this.actions.create(user.tenantId, user.id, {
      title: before.commitment_title,
      description: before.commitment_description,
      sourceModule: "EXECUTIVE_MANAGEMENT_REVIEW",
      sourceRecordId: id,
      sourceType: "Management Commitment",
      siteId: before.site_id ?? undefined,
      ownerId: before.owner_user_id,
      priority: this.actionPriority(before.priority),
      dueDate: before.effective_due_at,
      evidenceRequired: Boolean(before.verification_required),
      verificationRequired: Boolean(before.verification_required),
    });
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_commitments")
        .update({
          universal_action_id: action.id,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "COMMITMENT_ACTION_CREATED",
      "Universal Action created for management commitment",
      { commitment_id: id, before, after },
    );
    return { commitment: after, action };
  }
  async carryForward(user: RequestUser, id: string, d: Row) {
    this.require(user, "executive.management_review.commitment.carry_forward");
    const commitment = await this.one(
      user,
      "executive_management_commitments",
      id,
    );
    if (!d.reason)
      throw new BadRequestException("A carry-forward reason is required.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_carry_forward_items")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: commitment.site_id,
          source_cycle_id: commitment.review_cycle_id,
          source_meeting_id: commitment.meeting_id,
          source_decision_id: commitment.decision_id,
          source_commitment_id: id,
          source_record_type: "Management Commitment",
          source_record_id: id,
          target_cycle_id: d.targetCycleId ?? null,
          target_meeting_id: d.targetMeetingId ?? null,
          carry_forward_reason: d.reason,
          carried_forward_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "COMMITMENT_CARRIED_FORWARD",
      "Management commitment carried forward",
      {
        review_cycle_id: commitment.review_cycle_id,
        meeting_id: commitment.meeting_id,
        commitment_id: id,
        after: row,
      },
    );
    return row;
  }
  async historyFeed(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.history.view");
    this.scopeService.scope(user, q);
    return this.historyRows(user, q);
  }
  async templates(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.agenda.template.manage");
    const scope = this.scopeService.scope(user, q);
    let req: any = this.db
      .from("executive_management_review_agenda_templates")
      .select("*")
      .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
      .eq("active", true)
      .order("template_title");
    if (scope.siteId)
      req = req.or(`site_id.is.null,site_id.eq.${scope.siteId}`);
    return this.db.many<Row>(req);
  }
  async saveTemplate(user: RequestUser, d: Row, id?: string) {
    this.require(user, "executive.management_review.agenda.template.manage");
    const scope = this.scopeService.scope(user, { siteId: d.siteId });
    if (!d.title || !d.code)
      throw new BadRequestException("Template code and title are required.");
    const values = {
      company_id: user.tenantId,
      site_id: d.siteId ?? scope.siteId ?? null,
      template_code: d.code,
      template_title: d.title,
      review_type: d.reviewType ?? null,
      governance_level: d.governanceLevel ?? null,
      sections_json: Array.isArray(d.sections) ? d.sections : [],
      active: d.active !== false,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const row = id
      ? await this.db.single<Row>(
          this.db
            .from("executive_management_review_agenda_templates")
            .update(values)
            .eq("id", id)
            .eq("company_id", user.tenantId)
            .select("*")
            .single(),
        )
      : await this.db.single<Row>(
          this.db
            .from("executive_management_review_agenda_templates")
            .insert({
              id: crypto.randomUUID(),
              ...values,
              template_version: 1,
              created_by: user.id,
            })
            .select("*")
            .single(),
        );
    await this.history(
      user,
      id ? "AGENDA_TEMPLATE_UPDATED" : "AGENDA_TEMPLATE_CREATED",
      `Agenda template ${id ? "updated" : "created"}`,
      { after: row },
    );
    return row;
  }
  async settings(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.settings.view");
    const scope = this.scopeService.scope(user, q);
    return this.db
      .single<Row>(
        this.db
          .from("executive_management_review_settings")
          .select("*")
          .eq("company_id", user.tenantId)
          .eq("site_id", scope.siteId ?? null)
          .maybeSingle(),
      )
      .catch(() => null);
  }
  async saveSettings(user: RequestUser, d: Row) {
    this.require(user, "executive.management_review.settings.edit");
    const scope = this.scopeService.scope(user, { siteId: d.siteId });
    const existing = await this.settings(user, { siteId: scope.siteId });
    const values = {
      id: existing?.id ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: scope.siteId ?? null,
      default_cycle_workflow_template_id:
        d.defaultCycleWorkflowTemplateId ??
        existing?.default_cycle_workflow_template_id ??
        null,
      minutes_workflow_template_id:
        d.minutesWorkflowTemplateId ??
        existing?.minutes_workflow_template_id ??
        null,
      decision_workflow_template_id:
        d.decisionWorkflowTemplateId ??
        existing?.decision_workflow_template_id ??
        null,
      minimum_package_freshness_hours: Number(
        d.minimumPackageFreshnessHours ??
          existing?.minimum_package_freshness_hours ??
          24,
      ),
      require_minutes_approval:
        d.requireMinutesApproval ?? existing?.require_minutes_approval ?? true,
      require_decision_approval:
        d.requireDecisionApproval ??
        existing?.require_decision_approval ??
        true,
      allow_package_publish_with_warnings:
        d.allowPackagePublishWithWarnings ??
        existing?.allow_package_publish_with_warnings ??
        false,
      reminder_days_before_due: Number(
        d.reminderDaysBeforeDue ?? existing?.reminder_days_before_due ?? 7,
      ),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const row = await this.db.single<Row>(
      this.db
        .from("executive_management_review_settings")
        .upsert(values, { onConflict: "company_id,site_id" })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "MANAGEMENT_REVIEW_SETTINGS_UPDATED",
      "Management review settings updated",
      { after: row },
    );
    return row;
  }
  async calendar(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.meeting.view");
    const rows = (await this.meetings(user, { ...q, limit: 100 })).rows;
    return rows
      .filter(
        (row: Row) =>
          !["Cancelled", "Completed"].includes(String(row.meeting_status)),
      )
      .map((row: Row) => ({
        id: row.id,
        title: row.meeting_title,
        startAt: row.scheduled_start_at,
        endAt: row.scheduled_end_at,
        status: row.meeting_status,
        route: `/executive/management-review/meetings/${row.id}`,
      }));
  }
  async rescheduleMeeting(user: RequestUser, id: string, d: Row) {
    this.require(user, "executive.management_review.meeting.reschedule");
    const before = await this.one(
      user,
      "executive_management_review_meetings",
      id,
    );
    if (!d.startAt || !d.endAt || !String(d.reason ?? "").trim())
      throw new BadRequestException(
        "New start/end time and a reschedule reason are required.",
      );
    if (new Date(d.endAt) <= new Date(d.startAt))
      throw new BadRequestException("Meeting end must be after its start.");
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_meetings")
        .update({
          scheduled_start_at: d.startAt,
          scheduled_end_at: d.endAt,
          meeting_status: "Scheduled",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    const participants = await this.db.many<Row>(
      this.db
        .from("executive_management_review_participants")
        .select("user_id")
        .eq("company_id", user.tenantId)
        .eq("meeting_id", id),
    );
    await Promise.all(
      participants.map((p) =>
        this.notifications
          .notifyUser({
            tenantId: user.tenantId,
            companyId: user.tenantId,
            userId: p.user_id,
            siteId: after.site_id,
            type: "executive.management_review.rescheduled",
            module: "executive",
            title: "Management review rescheduled",
            message: String(d.reason),
            relatedRecordId: id,
            relatedRecordType: "ManagementReviewMeeting",
            relatedUrl: `/executive/management-review/meetings/${id}`,
            priority: "Normal",
          })
          .catch(() => null),
      ),
    );
    await this.history(
      user,
      "MEETING_RESCHEDULED",
      "Management review meeting rescheduled",
      { review_cycle_id: after.review_cycle_id, meeting_id: id, before, after },
    );
    return after;
  }
  async submitDecision(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.decision.submit");
    const before = await this.one(user, "executive_management_decisions", id);
    if (before.decision_status !== "Draft")
      throw new BadRequestException("Only draft decisions can be submitted.");
    const settings = await this.settings(user, { siteId: before.site_id });
    let workflowId: string | null = null;
    if (settings?.require_decision_approval) {
      if (!before.site_id)
        throw new BadRequestException(
          "A site-scoped workflow is required to submit this decision.",
        );
      const instance = await this.workflows.startWorkflow(
        user.tenantId,
        user.id,
        {
          module: "executive_management_review",
          recordId: id,
          recordNumber: before.decision_code,
          siteId: before.site_id,
          companyId: user.tenantId,
          workflowTemplateId:
            settings.decision_workflow_template_id ?? undefined,
          contextData: {
            recordType: "ManagementDecision",
            decisionType: before.decision_type,
            priority: before.priority ?? null,
          },
        },
        {
          allowedSiteIds: user.siteIds,
          selectedSiteId: user.selectedSiteId ?? null,
          corporateView: Boolean(user.corporateView),
        },
      );
      workflowId = instance.id;
    }
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_decisions")
        .update({
          decision_status: settings?.require_decision_approval
            ? "Pending Approval"
            : "Approved",
          workflow_instance_id: workflowId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "DECISION_SUBMITTED",
      "Management decision submitted for governance approval",
      {
        review_cycle_id: after.review_cycle_id,
        meeting_id: after.meeting_id,
        decision_id: id,
        before,
        after,
      },
    );
    return after;
  }
  async requestMinutesApproval(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.minutes.submit");
    const before = await this.one(
      user,
      "executive_management_review_minutes",
      id,
    );
    const settings = await this.settings(user, { siteId: before.site_id });
    if (!settings?.require_minutes_approval)
      return this.submitMinutes(user, id, { summary: before.summary });
    if (!before.site_id)
      throw new BadRequestException(
        "A site-scoped workflow is required for minutes approval.",
      );
    const instance = await this.workflows.startWorkflow(
      user.tenantId,
      user.id,
      {
        module: "executive_management_review",
        recordId: id,
        recordNumber: before.minutes_code,
        siteId: before.site_id,
        companyId: user.tenantId,
        workflowTemplateId: settings.minutes_workflow_template_id ?? undefined,
        contextData: {
          recordType: "ManagementReviewMinutes",
          meetingId: before.meeting_id,
        },
      },
      {
        allowedSiteIds: user.siteIds,
        selectedSiteId: user.selectedSiteId ?? null,
        corporateView: Boolean(user.corporateView),
      },
    );
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_minutes")
        .update({
          minutes_status: "Pending Approval",
          workflow_instance_id: instance.id,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "MINUTES_APPROVAL_REQUESTED",
      "Management review minutes sent to Workflow Engine",
      { minutes_id: id, meeting_id: after.meeting_id, before, after },
    );
    return after;
  }
  async context(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.view");
    const scope = this.scopeService.scope(user, q);
    let cycleQuery: any = this.db
      .from("executive_management_review_cycles")
      .select("id,cycle_code,cycle_title,cycle_type,site_id")
      .eq("company_id", user.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    let meetingQuery: any = this.db
      .from("executive_management_review_meetings")
      .select("id,meeting_code,meeting_title,review_cycle_id,site_id")
      .eq("company_id", user.tenantId)
      .order("scheduled_start_at", { ascending: false })
      .limit(100);
    if (scope.siteId) {
      cycleQuery = cycleQuery.eq("site_id", scope.siteId);
      meetingQuery = meetingQuery.eq("site_id", scope.siteId);
    }
    const [users, cycles, meetings, templates, settings] = await Promise.all([
      this.db
        .many<Row>(
          this.db
            .from("User")
            .select("id,displayName,email,title,status")
            .eq("tenantId", user.tenantId)
            .eq("status", "ACTIVE")
            .order("displayName"),
        )
        .catch(() => []),
      this.db.many<Row>(cycleQuery).catch(() => []),
      this.db.many<Row>(meetingQuery).catch(() => []),
      this.templates(user, q).catch(() => []),
      this.settings(user, { siteId: scope.siteId }).catch(() => null),
    ]);
    return {
      scope,
      users,
      cycles,
      meetings,
      templates,
      settings,
      workflowConfigurationNotice:
        "Workflow approvals require an active Executive Management Review workflow template for this site.",
    };
  }

  async singleDecision(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.decision.view");
    const decision = await this.one(user, "executive_management_decisions", id);
    const [commitments, history] = await Promise.all([
      this.db
        .many<Row>(
          this.db
            .from("executive_management_commitments")
            .select("*")
            .eq("decision_id", id)
            .eq("company_id", user.tenantId)
        )
        .catch(() => []),
      this.historyRows(user, { decision_id: id }),
    ]);
    return { decision, commitments, history };
  }

  async singleCommitment(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.commitment.view");
    const commitment = await this.one(
      user,
      "executive_management_commitments",
      id
    );
    const [decision, history] = await Promise.all([
      commitment.decision_id
        ? this.db
            .single<Row>(
              this.db
                .from("executive_management_decisions")
                .select("*")
                .eq("id", commitment.decision_id)
                .eq("company_id", user.tenantId)
                .maybeSingle()
            )
            .catch(() => null)
        : Promise.resolve(null),
      this.historyRows(user, { commitment_id: id }),
    ]);
    return { commitment, decision, history };
  }

  async singleMinutes(user: RequestUser, id: string) {
    this.require(user, "executive.management_review.minutes.view");
    const minutes = await this.one(
      user,
      "executive_management_review_minutes",
      id
    );
    const [meeting, versions, history] = await Promise.all([
      minutes.meeting_id
        ? this.db
            .single<Row>(
              this.db
                .from("executive_management_review_meetings")
                .select("*")
                .eq("id", minutes.meeting_id)
                .eq("company_id", user.tenantId)
                .maybeSingle()
            )
            .catch(() => null)
        : Promise.resolve(null),
      this.db
        .many<Row>(
          this.db
            .from("executive_management_review_minutes_versions")
            .select("*")
            .eq("minutes_id", id)
            .eq("company_id", user.tenantId)
            .order("version_number", { ascending: false })
        )
        .catch(() => []),
      this.historyRows(user, { minutes_id: id }),
    ]);
    return { minutes, meeting, versions, history };
  }

  async followUp(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.commitment.view");
    const scope = this.scopeService.scope(user, q);
    const commitmentsResult = await this.commitments(user, {
      ...q,
      limit: 100,
    });
    const now = Date.now();
    const rows = commitmentsResult.rows;

    const overdue = rows.filter(
      (r: any) =>
        r.effective_due_at &&
        new Date(r.effective_due_at).getTime() < now &&
        !/completed|closed|cancelled|verified/i.test(
          String(r.commitment_status ?? "")
        )
    );
    const pendingVerification = rows.filter(
      (r: any) => r.commitment_status === "Pending Verification"
    );
    const open = rows.filter(
      (r: any) =>
        !/completed|closed|cancelled|verified/i.test(
          String(r.commitment_status ?? "")
        )
    );

    const aging = {
      under7Days: 0,
      sevenTo14Days: 0,
      fifteenTo30Days: 0,
      over30Days: 0,
    };
    for (const item of overdue) {
      const days = Math.floor(
        (now - new Date(item.effective_due_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (days < 7) aging.under7Days++;
      else if (days <= 14) aging.sevenTo14Days++;
      else if (days <= 30) aging.fifteenTo30Days++;
      else aging.over30Days++;
    }

    return {
      scope,
      totalCommitments: rows.length,
      openCommitments: open.length,
      overdueCommitments: overdue.length,
      pendingVerificationCount: pendingVerification.length,
      aging,
      rows,
    };
  }

  async carriedForwardList(user: RequestUser, q: Row = {}) {
    this.require(user, "executive.management_review.commitment.view");
    const scope = this.scopeService.scope(user, q);
    return this.listTable(
      user,
      "executive_management_review_carry_forward_items",
      q,
      scope
    );
  }

  async assignCommitment(
    user: RequestUser,
    id: string,
    ownerId: string,
    note?: string
  ) {
    this.require(user, "executive.management_review.commitment.assign");
    const before = await this.one(user, "executive_management_commitments", id);
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_commitments")
        .update({
          owner_user_id: ownerId,
          commitment_status: "Assigned",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(
      user,
      "COMMITMENT_ASSIGNED",
      `Commitment reassigned to user ${ownerId}`,
      {
        commitment_id: id,
        before,
        after,
      }
    );
    return after;
  }

  async requestCommitmentVerification(
    user: RequestUser,
    id: string,
    verifierId?: string,
    criteria?: string
  ) {
    this.require(user, "executive.management_review.commitment.verify");
    const before = await this.one(user, "executive_management_commitments", id);
    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_commitments")
        .update({
          verification_required: true,
          verification_status: "Pending Verification",
          commitment_status: "Pending Verification",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(
      user,
      "COMMITMENT_VERIFICATION_REQUESTED",
      "Verification requested for commitment",
      {
        commitment_id: id,
        before,
        after,
      }
    );
    return after;
  }

  async updateCycle(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.management_review.cycle.edit");
    const before = await this.one(user, "executive_management_review_cycles", id);
    const updateData: Row = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (dto.title) updateData.cycle_title = dto.title;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.plannedReviewDate) updateData.planned_review_date = dto.plannedReviewDate;
    if (dto.requiredCompletionDate) updateData.required_completion_date = dto.requiredCompletionDate;

    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_cycles")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(user, "CYCLE_UPDATED", "Management review cycle updated", {
      review_cycle_id: id,
      before,
      after,
    });
    return after;
  }

  async updateMeeting(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.management_review.meeting.edit");
    const before = await this.one(user, "executive_management_review_meetings", id);
    const updateData: Row = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (dto.title) updateData.meeting_title = dto.title;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.mode) updateData.meeting_mode = dto.mode;
    if (dto.chairpersonId) updateData.chairperson_user_id = dto.chairpersonId;
    if (dto.secretaryId !== undefined) updateData.secretary_user_id = dto.secretaryId;

    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_meetings")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(user, "MEETING_UPDATED", "Management review meeting updated", {
      meeting_id: id,
      before,
      after,
    });
    return after;
  }

  async updateDecision(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.management_review.decision.edit");
    const before = await this.one(user, "executive_management_decisions", id);
    const updateData: Row = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (dto.title) updateData.decision_title = dto.title;
    if (dto.description) updateData.decision_description = dto.description;
    if (dto.rationale !== undefined) updateData.decision_rationale = dto.rationale;
    if (dto.status) updateData.decision_status = dto.status;
    if (dto.dueAt !== undefined) updateData.due_at = dto.dueAt;

    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_decisions")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(user, "DECISION_UPDATED", "Management decision updated", {
      decision_id: id,
      before,
      after,
    });
    return after;
  }

  async updateCommitment(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.management_review.commitment.create");
    const before = await this.one(user, "executive_management_commitments", id);
    const updateData: Row = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (dto.title) updateData.commitment_title = dto.title;
    if (dto.description) updateData.commitment_description = dto.description;
    if (dto.status) updateData.commitment_status = dto.status;
    if (dto.dueAt !== undefined) updateData.effective_due_at = dto.dueAt;
    if (dto.priority) updateData.priority = dto.priority;

    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_commitments")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(user, "COMMITMENT_UPDATED", "Management commitment updated", {
      commitment_id: id,
      before,
      after,
    });
    return after;
  }

  async updateMinutes(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.management_review.minutes.edit");
    const before = await this.one(user, "executive_management_review_minutes", id);
    const updateData: Row = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (dto.summary !== undefined) updateData.summary = dto.summary;
    if (dto.status) updateData.minutes_status = dto.status;

    const after = await this.db.single<Row>(
      this.db
        .from("executive_management_review_minutes")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single()
    );
    await this.history(user, "MINUTES_UPDATED", "Meeting minutes updated", {
      minutes_id: id,
      before,
      after,
    });
    return after;
  }

  lookups(kind?: string) {
    const data: Record<string, string[]> = {
      "management-review-types": [
        "Corporate Management Review",
        "Company Management Review",
        "Site Management Review",
        "Department Management Review",
        "Unit Management Review",
        "Special Critical Risk Review",
        "Extraordinary Review",
        "Post-Incident Management Review",
        "Post-Audit Management Review",
        "Regulatory Compliance Management Review",
        "Custom",
      ],
      "management-review-cycle-statuses": [
        "Draft",
        "Planned",
        "Active",
        "Awaiting Review",
        "Under Review",
        "Follow-Up In Progress",
        "Completed",
        "Completed With Open Commitments",
        "Cancelled",
        "Archived",
      ],
      "management-review-meeting-statuses": [
        "Draft",
        "Scheduled",
        "Preparing",
        "Ready",
        "Ready With Warnings",
        "In Progress",
        "Adjourned",
        "Minutes Draft",
        "Minutes Under Approval",
        "Completed",
        "Completed With Open Follow-Up",
        "Cancelled",
        "Archived",
      ],
      "management-review-agenda-categories": [
        "Opening and Attendance",
        "Review of Previous Meeting Minutes",
        "Status of Previous Management Commitments",
        "Executive PSM Health Overview",
        "Site/Unit Performance",
        "PSM Element Health",
        "Critical Risk Review",
        "Safety-Critical Barrier Issues",
        "Overdue Critical Actions",
        "Open Escalations",
        "Incident Performance",
        "Mechanical Integrity",
        "PHA / HAZOP / LOPA / SIL",
        "MOC / PSSR",
        "PSI Readiness",
        "Training & Competency",
        "PTW / Isolation Performance",
        "Audit Findings",
        "Regulatory Compliance",
        "CAPA Effectiveness",
        "Repeated Issues and Trends",
        "Resource and Budget Requirements",
        "Significant Regulatory Changes",
        "Management Decisions",
        "New Commitments and Owners",
        "Carried-Forward Items",
        "Next Review Date",
        "Closing Summary",
      ],
      "management-review-agenda-statuses": [
        "Draft",
        "Ready",
        "Presented",
        "Discussed",
        "Decision Required",
        "Decision Recorded",
        "Deferred",
        "Carried Forward",
        "Closed for Meeting",
        "Removed With Reason",
      ],
      "management-review-readiness-statuses": [
        "Ready",
        "Ready With Warnings",
        "Not Ready",
        "Missing Required Inputs",
        "Package Not Prepared",
        "Critical Source Unavailable",
        "Approval Pending",
        "Stale Package",
        "Restricted Data Conflict",
        "Data Insufficient",
      ],
      "management-review-decision-types": [
        "Direct Corrective Action",
        "Require Root Cause Investigation",
        "Request Technical Risk Assessment",
        "Allocate Resources",
        "Request Budget Proposal",
        "Prioritize Maintenance Work",
        "Request Training Intervention",
        "Initiate MOC Review",
        "Require PSSR Follow-Up",
        "Request PHA/LOPA Review",
        "Request MI Inspection/Verification",
        "Request Regulatory Compliance Review",
        "Request Audit Follow-Up",
        "Require CAPA Effectiveness Review",
        "Escalate to Higher Management",
        "Assign Management Commitment",
        "Approve Governance Recommendation",
        "Defer With Justification",
        "Request Independent Verification",
        "Request Additional Evidence",
        "Refer to Formal Risk Acceptance Workflow",
        "Other",
      ],
      "management-review-decision-statuses": [
        "Proposed",
        "Recorded",
        "Pending Validation",
        "Pending Approval",
        "Returned for Revision",
        "Approved",
        "Approved With Conditions",
        "Active",
        "Implementation In Progress",
        "Implementation Verified",
        "Completed",
        "Deferred",
        "Superseded",
        "Withdrawn With Reason",
      ],
      "management-review-commitment-statuses": [
        "Draft",
        "Assigned",
        "Accepted",
        "In Progress",
        "Awaiting Information",
        "Overdue",
        "Pending Verification",
        "Verified",
        "Completed",
        "Reopened",
        "Cancelled With Reason",
        "Superseded",
      ],
      "management-review-minutes-statuses": [
        "Draft",
        "Under Review",
        "Returned for Correction",
        "Pending Approval",
        "Approved",
        "Approved With Conditions",
        "Locked",
        "Superseded",
        "Archived",
      ],
      "management-review-package-statuses": [
        "Draft",
        "Collecting Sources",
        "Validation Pending",
        "Ready With Warnings",
        "Not Ready",
        "Prepared",
        "Pending Approval",
        "Approved",
        "Published",
        "Locked",
        "Stale",
        "Superseded",
        "Archived",
      ],
      "management-review-attendance-statuses": [
        "Present",
        "Absent",
        "Apology Received",
        "Joined Late",
        "Left Early",
        "Not Recorded",
      ],
    };
    return kind ? data[kind] ?? [] : data;
  }
  private async listTable(
    user: RequestUser,
    table: string,
    q: Row,
    scope: Row,
    status?: string,
  ) {
    let req: any = this.db
      .from(table)
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId)
      .order("created_at", { ascending: false });
    if (scope.siteId) req = req.eq("site_id", scope.siteId);
    if (status && q.status) req = req.eq(status, q.status);
    const limit = Math.min(Math.max(Number(q.limit ?? 50), 1), 100),
      offset = Math.max(Number(q.offset ?? 0), 0);
    const { data, count, error } = await req.range(offset, offset + limit - 1);
    if (error)
      throw new BadRequestException(
        `Management review data is unavailable. Apply the Phase 6 migration.`,
      );
    return { rows: data ?? [], total: count ?? 0, limit, offset };
  }
  private async one(user: RequestUser, table: string, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from(table)
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row)
      throw new NotFoundException("Management review record was not found.");
    this.scopeService.scope(user, { siteId: row.site_id });
    return row;
  }
  private async history(
    user: RequestUser,
    type: string,
    title: string,
    refs: Row,
  ) {
    await this.audit
      .write({
        tenantId: user.tenantId,
        actorId: user.id,
        action: type,
        entityType: "ExecutiveManagementReview",
        entityId: String(
          refs.package_id ??
            refs.meeting_id ??
            refs.review_cycle_id ??
            refs.decision_id ??
            refs.commitment_id ??
            user.tenantId,
        ),
        before: refs.before ?? null,
        after: refs.after ?? null,
        metadata: { sourceModule: "Executive KPI Dashboard Phase 6" },
      })
      .catch(() => null);
    await Promise.resolve(
      this.db.single(
        this.db
          .from("executive_management_review_history_events")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: user.selectedSiteId ?? null,
            event_type: type,
            event_title: title,
            review_cycle_id: refs.review_cycle_id ?? null,
            meeting_id: refs.meeting_id ?? null,
            agenda_item_id: refs.agenda_item_id ?? null,
            package_id: refs.package_id ?? null,
            minutes_id: refs.minutes_id ?? null,
            decision_id: refs.decision_id ?? null,
            commitment_id: refs.commitment_id ?? null,
            before_value_json: refs.before ?? null,
            after_value_json: refs.after ?? null,
            actor_user_id: user.id,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single(),
      )
    ).catch(() => null);
  }
  private async historyRows(user: RequestUser, q: Row) {
    let req: any = this.db
      .from("executive_management_review_history_events")
      .select("*")
      .eq("company_id", user.tenantId)
      .order("created_at", { ascending: false });
    for (const [key, value] of Object.entries(q))
      if (value) req = req.eq(key, value);
    return this.db.many<Row>(req);
  }
  private actionPriority(
    value: unknown,
  ): "LOW" | "MEDIUM" | "HIGH" | "SAFETY_CRITICAL" {
    const key = String(value ?? "").toUpperCase();
    return key === "CRITICAL" || key === "SAFETY_CRITICAL"
      ? "SAFETY_CRITICAL"
      : key === "HIGH"
        ? "HIGH"
        : key === "LOW"
          ? "LOW"
          : "MEDIUM";
  }
  private can(user: RequestUser, p: string) {
    return Boolean(
      user.isCompanyAdmin || user.isSuperAdmin || user.permissions.includes(p),
    );
  }
  private require(user: RequestUser, p: string) {
    if (!this.can(user, p))
      throw new ForbiddenException(`Missing required permission: ${p}`);
  }
}
