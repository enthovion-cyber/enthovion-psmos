import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";

type Row = Record<string, any>;
type PsmElementScore = Row & {
  id: string;
  element_id: string;
  element_name: string;
  element_code?: string | null;
  score_value: number | null;
  element_status: string;
  critical_item_count: number;
  overdue_action_count: number;
  missing_evidence_count: number;
  pending_approval_count: number;
  stale_record_count: number;
  aggregation_run_id: string | null;
  calculated_at: string | null;
  source_trace_json?: unknown;
};
@Injectable()
export class ExecutivePsmElementService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
  ) {}
  async dashboard(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.dashboard.view");
    const rows: Row[] = await this.scores(user, query);
    const counts = (status: string) =>
      rows.filter((r: Row) => r.element_status === status).length;
    const ranked = rows
      .filter((r: Row) => typeof r.score_value === "number")
      .sort((a: Row, b: Row) => Number(a.score_value) - Number(b.score_value));
    return {
      summary: {
        totalElements: rows.length,
        healthyElements: counts("Healthy"),
        monitorElements: counts("Monitor"),
        attentionRequiredElements: counts("Attention Required"),
        highRiskElements: counts("High Risk"),
        criticalElements: counts("Critical"),
        incompleteElements: counts("Incomplete Data"),
        restrictedElements: counts("Restricted"),
        sourceUnavailableElements: counts("Source Unavailable"),
        criticalElementGaps: rows.reduce(
          (n, r) => n + Number(r.critical_item_count ?? 0),
          0,
        ),
        overdueElementActions: rows.reduce(
          (n, r) => n + Number(r.overdue_action_count ?? 0),
          0,
        ),
        staleElementRecords: rows.reduce(
          (n, r) => n + Number(r.stale_record_count ?? 0),
          0,
        ),
        missingEvidence: rows.reduce(
          (n, r) => n + Number(r.missing_evidence_count ?? 0),
          0,
        ),
        pendingElementApprovals: rows.reduce(
          (n, r) => n + Number(r.pending_approval_count ?? 0),
          0,
        ),
        worstElement: ranked[0]?.element_name ?? null,
        bestElement: ranked.at(-1)?.element_name ?? null,
        lastCalculated:
          rows
            .map((r: Row) => r.calculated_at)
            .sort()
            .at(-1) ?? null,
      },
      scorecards: rows,
      gaps: await this.gaps(user, query),
      snapshots: (await this.snapshots(user, query)).rows.slice(0, 8),
    };
  }
  async elements(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.register.view");
    let request: any = this.db
      .from("executive_psm_elements")
      .select("*", { count: "exact" })
      .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
      .is("archived_at", null)
      .eq("active", true)
      .order("display_order");
    if (query.category)
      request = request.eq("element_category", query.category);
    const { data, count, error } = await request.range(
      Number(query.offset ?? 0),
      Number(query.offset ?? 0) + Math.min(100, Number(query.limit ?? 50)) - 1,
    );
    if (error)
      throw new BadRequestException(
        "PSM element registry is unavailable. Apply the Executive KPI Phase 4 migration.",
      );
    const scores = await this.scores(user, query);
    return {
      rows: (data ?? []).map((element: Row) => ({
        ...element,
        ...(scores.find((score) => score.element_id === element.id) ??
          this.emptyScore(element)),
      })),
      total: count ?? 0,
    };
  }
  async detail(user: RequestUser, id: string, query: Row = {}) {
    this.require(user, "executive.psm_element.detail.view");
    const element = await this.element(user, id);
    const score =
      (await this.scores(user, query)).find((item) => item.element_id === id) ??
      this.emptyScore(element);
    const [modules, kpis, factors, gaps, history] = await Promise.all([
      this.mappings(user, { elementId: id }),
      this.kpiMappings(user, { elementId: id }),
      this.db
        .many<Row>(
          this.db
            .from("executive_psm_element_score_factors")
            .select("*")
            .eq("element_score_id", score.id),
        )
        .catch(() => []),
      this.gaps(user, { ...query, elementId: id }),
      this.historyRows(user, id),
    ]);
    return {
      element,
      score,
      modules,
      kpis,
      factors,
      gaps,
      history,
      sourceTrace: await this.trace(user, score.id),
    };
  }
  async create(user: RequestUser, dto: Row) {
    this.require(user, "executive.psm_element.create");
    if (
      !String(dto.elementCode ?? dto.element_code ?? "").trim() ||
      !String(dto.elementName ?? dto.element_name ?? "").trim()
    )
      throw new BadRequestException("Element code and name are required.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_elements")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          element_code: String(dto.elementCode ?? dto.element_code).trim(),
          element_name: String(dto.elementName ?? dto.element_name).trim(),
          element_description:
            dto.elementDescription ?? dto.element_description ?? null,
          element_category:
            dto.elementCategory ?? dto.element_category ?? "Custom",
          display_order: Number(dto.displayOrder ?? 999),
          system_defined: false,
          active: true,
          required_foundation: Boolean(dto.requiredFoundation),
          notes: dto.notes ?? null,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_CREATED",
      "Custom PSM element created",
      row.id,
      { element: row },
    );
    return row;
  }
  async update(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.psm_element.edit");
    const before = await this.element(user, id);
    const fields: Record<string, string> = {
      elementName: "element_name",
      element_name: "element_name",
      elementDescription: "element_description",
      element_description: "element_description",
      elementCategory: "element_category",
      element_category: "element_category",
      displayOrder: "display_order",
      display_order: "display_order",
      active: "active",
      requiredFoundation: "required_foundation",
      required_foundation: "required_foundation",
      notes: "notes",
    };
    const data = Object.fromEntries(
      Object.entries(fields)
        .filter(([key]) => dto[key] !== undefined)
        .map(([key, column]) => [column, dto[key]]),
    );
    const after = await this.db.single<Row>(
      this.db
        .from("executive_psm_elements")
        .update({
          ...data,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", before.company_id)
        .select("*")
        .single(),
    );
    await this.write(user, "PSM_ELEMENT_UPDATED", "PSM element updated", id, {
      before,
      after,
    });
    return after;
  }
  async archive(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.psm_element.archive");
    const element = await this.element(user, id);
    if (element.system_defined)
      throw new BadRequestException(
        "System-defined PSM elements cannot be archived.",
      );
    if (!String(dto.reason ?? "").trim())
      throw new BadRequestException("Archive reason is required.");
    const after = await this.db.single<Row>(
      this.db
        .from("executive_psm_elements")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user.id,
          archive_reason: dto.reason,
          active: false,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_ARCHIVED",
      "Custom PSM element archived",
      id,
      { reason: dto.reason },
    );
    return after;
  }
  async recalculate(user: RequestUser, id: string, query: Row = {}) {
    this.require(user, "executive.psm_element.score.recalculate");
    const element = await this.element(user, id);
    return this.calculate(user, element, query, true);
  }
  async mappings(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.mapping.view");
    return this.mappingsForCalculation(user, query);
  }
  async createMapping(user: RequestUser, dto: Row) {
    this.require(user, "executive.psm_element.mapping.edit");
    await this.element(user, String(dto.elementId));
    if (!String(dto.sourceModule ?? "").trim())
      throw new BadRequestException("A source module is required.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_module_mappings")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: dto.siteId ?? null,
          element_id: dto.elementId,
          source_module: dto.sourceModule,
          source_module_label: dto.sourceModuleLabel ?? dto.sourceModule,
          mapping_type: dto.mappingType ?? "Health Score",
          weight: dto.weight ?? null,
          required_for_score: Boolean(dto.requiredForScore),
          required_permission: dto.requiredPermission ?? null,
          active: true,
          notes: dto.notes ?? null,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_MAPPING_CREATED",
      "PSM element module mapping created",
      row.id,
      { mapping: row },
    );
    return row;
  }
  async updateMapping(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.psm_element.mapping.edit");
    const after = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_module_mappings")
        .update({
          ...dto,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_MAPPING_UPDATED",
      "PSM element module mapping updated",
      id,
      { mapping: after },
    );
    return after;
  }
  async kpiMappings(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.kpi_mapping.view");
    let request: any = this.db
      .from("executive_psm_element_kpi_mappings")
      .select("*")
      .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
      .is("archived_at", null)
      .eq("active", true);
    if (query.elementId) request = request.eq("element_id", query.elementId);
    return this.db.many<Row>(request).catch(() => []);
  }
  async createKpiMapping(user: RequestUser, dto: Row) {
    this.require(user, "executive.psm_element.kpi_mapping.edit");
    await this.element(user, String(dto.elementId));
    if (!String(dto.kpiCode ?? "").trim())
      throw new BadRequestException("KPI code is required.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_kpi_mappings")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: dto.siteId ?? null,
          element_id: dto.elementId,
          kpi_definition_id: dto.kpiDefinitionId ?? null,
          kpi_code: dto.kpiCode,
          source_module: dto.sourceModule ?? null,
          contribution_type: dto.contributionType ?? "Score",
          weight: dto.weight ?? null,
          penalty_config_json: dto.penaltyConfig ?? null,
          required_for_score: Boolean(dto.requiredForScore),
          active: true,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_KPI_MAPPING_CREATED",
      "PSM element KPI mapping created",
      row.id,
      { mapping: row },
    );
    return row;
  }
  async updateKpiMapping(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.psm_element.kpi_mapping.edit");
    const allowed = [
      "site_id",
      "kpi_definition_id",
      "kpi_code",
      "source_module",
      "contribution_type",
      "weight",
      "penalty_config_json",
      "required_for_score",
      "active",
    ];
    const update = Object.fromEntries(
      allowed
        .filter((key) => dto[key] !== undefined)
        .map((key) => [key, dto[key]]),
    );
    const before = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_kpi_mappings")
        .select("*")
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .maybeSingle(),
    );
    if (!before)
      throw new NotFoundException("PSM element KPI mapping was not found.");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_kpi_mappings")
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
    await this.write(
      user,
      "PSM_ELEMENT_KPI_MAPPING_UPDATED",
      "PSM element KPI mapping updated",
      id,
      { before, mapping: row },
    );
    return row;
  }
  async scores(user: RequestUser, query: Row = {}): Promise<PsmElementScore[]> {
    this.require(user, "executive.psm_element.score.view");
    const elements = await this.registry(user);
    const scope = {
      ...query,
      siteId: query.siteId ?? query.site_id ?? user.selectedSiteId ?? null,
      unitId: query.unitId ?? query.unit_id ?? null,
    };
    return Promise.all(
      elements.map((element) => this.latestScore(user, element, scope)),
    ) as Promise<PsmElementScore[]>;
  }
  async heatmap(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.heatmap.view");
    const scores = await this.scores(user, query);
    return {
      cells: scores.map((score) => ({
        elementId: score.element_id,
        elementName: score.element_name,
        scope: query.siteId ? "Site" : "Company",
        score: score.score_value,
        status: score.element_status,
        criticalCount: score.critical_item_count,
        overdueCount: score.overdue_action_count,
        missingEvidenceCount: score.missing_evidence_count,
        staleCount: score.stale_record_count,
        lastCalculated: score.calculated_at,
        restricted: score.element_status === "Restricted",
        drilldownRoute: `/executive/psm-elements/${score.element_id}`,
      })),
    };
  }
  async breakdown(user: RequestUser, type: "site" | "unit", query: Row = {}) {
    this.require(user, `executive.psm_element.${type}_breakdown.view`);
    const table = type === "site" ? "Site" : "Unit";
    const rows = await this.db
      .many<Row>(this.db.from(table).select("*").eq("tenantId", user.tenantId))
      .catch(() => []);
    const requestedId = type === "site" ? query.siteId : query.unitId;
    const allowed = rows.filter(
      (row) =>
        this.allowed(user, type === "site" ? row.id : row.siteId) &&
        (!requestedId || row.id === requestedId),
    );
    return Promise.all(
      allowed.map(async (row) => {
        const scores = await this.scores(user, {
          ...query,
          [type === "site" ? "siteId" : "unitId"]: row.id,
          siteId: type === "unit" ? row.siteId : row.id,
        });
        const numeric = scores
          .filter((score) => typeof score.score_value === "number")
          .sort((a, b) => Number(a.score_value) - Number(b.score_value));
        return {
          id: row.id,
          label: row.name ?? row.code ?? row.id,
          siteId: row.siteId ?? row.id,
          scores,
          overallScore: numeric.length
            ? Math.round(
                numeric.reduce((n, score) => n + Number(score.score_value), 0) /
                  numeric.length,
              )
            : null,
          weakestElement: numeric[0]?.element_name ?? null,
          strongestElement: numeric.at(-1)?.element_name ?? null,
          criticalElementCount: scores.filter(
            (s) => s.element_status === "Critical",
          ).length,
          dataQuality: numeric.length ? "Current" : "Insufficient Data",
        };
      }),
    );
  }
  async gaps(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.gap.view");
    let request: any = this.db
      .from("executive_psm_element_gaps")
      .select("*")
      .eq("company_id", user.tenantId)
      .is("resolved_at", null)
      .order("severity", { ascending: false });
    if (query.siteId) request = request.eq("site_id", query.siteId);
    if (query.elementId) request = request.eq("element_id", query.elementId);
    const rows = await this.db.many<Row>(request).catch(() => []);
    return rows
      .filter((row) => this.allowed(user, row.site_id))
      .map((row) =>
        row.restricted &&
        !this.can(user, "executive.psm_element.restricted_trace.view")
          ? {
              ...row,
              gap_title: "Restricted source record",
              source_record_id: null,
              source_snapshot_json: null,
            }
          : row,
      );
  }
  async snapshots(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.psm_element.snapshot.view");
    let request: any = this.db
      .from("executive_psm_element_snapshots")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId)
      .is("archived_at", null)
      .order("generated_at", { ascending: false });
    if (query.siteId) request = request.eq("site_id", query.siteId);
    const { data, count } = await request.range(
      Number(query.offset ?? 0),
      Number(query.offset ?? 0) + Math.min(Number(query.limit ?? 50), 100) - 1,
    );
    return {
      rows: (data ?? []).filter((row: Row) => this.allowed(user, row.site_id)),
      total: count ?? 0,
    };
  }
  async snapshot(user: RequestUser, dto: Row) {
    this.require(user, "executive.psm_element.snapshot.create");
    const scores = await this.scores(user, dto);
    if (!scores.length)
      throw new BadRequestException(
        "No permitted PSM element scores are available for a snapshot.",
      );
    const count = (status: string) =>
      scores.filter((score) => score.element_status === status).length;
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_snapshots")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: dto.siteId ?? null,
          unit_id: dto.unitId ?? null,
          snapshot_code: `PE-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          snapshot_title: dto.title ?? "PSM element scoring snapshot",
          snapshot_type: dto.snapshotType ?? "Manual",
          scope_type: dto.unitId ? "unit" : dto.siteId ? "site" : "company",
          scope_record_id: dto.unitId ?? dto.siteId ?? null,
          aggregation_run_id:
            scores.find((score) => score.aggregation_run_id)
              ?.aggregation_run_id ?? null,
          element_count: scores.length,
          healthy_count: count("Healthy"),
          monitor_count: count("Monitor"),
          attention_required_count: count("Attention Required"),
          high_risk_count: count("High Risk"),
          critical_count: count("Critical"),
          incomplete_count: count("Incomplete Data"),
          restricted_count: count("Restricted"),
          score_summary_json: scores.map((s) => ({
            elementId: s.element_id,
            score: s.score_value,
            status: s.element_status,
          })),
          gap_summary_json: {
            critical: scores.reduce(
              (n, s) => n + Number(s.critical_item_count),
              0,
            ),
          },
          action_summary_json: {
            overdue: scores.reduce(
              (n, s) => n + Number(s.overdue_action_count),
              0,
            ),
          },
          evidence_summary_json: {
            missing: scores.reduce(
              (n, s) => n + Number(s.missing_evidence_count),
              0,
            ),
          },
          approval_summary_json: {
            pending: scores.reduce(
              (n, s) => n + Number(s.pending_approval_count),
              0,
            ),
          },
          calculation_method_snapshot_json: {
            source: "Phase 2 aggregation mappings",
          },
          source_trace_summary_json: this.can(
            user,
            "executive.psm_element.restricted_trace.view",
          )
            ? scores.map((s) => s.source_trace_json)
            : null,
          generated_by: user.id,
          generated_at: new Date().toISOString(),
          stale_status: "Current",
        })
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_SNAPSHOT_CREATED",
      "PSM element snapshot created",
      row.id,
      { snapshot: row },
    );
    return row;
  }
  async snapshotDetail(user: RequestUser, id: string) {
    this.require(user, "executive.psm_element.snapshot.view");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_snapshots")
        .select("*")
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .maybeSingle(),
    );
    if (!row || !this.allowed(user, row.site_id))
      throw new NotFoundException("PSM element snapshot was not found.");
    return this.can(user, "executive.psm_element.restricted_trace.view")
      ? row
      : {
          ...row,
          source_trace_summary_json: null,
          restricted_count: Number(row.restricted_count ?? 0),
        };
  }
  async archiveSnapshot(user: RequestUser, id: string, dto: Row) {
    this.require(user, "executive.psm_element.snapshot.archive");
    const reason = String(dto.reason ?? "").trim();
    if (!reason)
      throw new BadRequestException("An archive reason is required.");
    const before = await this.snapshotDetail(user, id);
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_snapshots")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user.id,
          archive_reason: reason,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_SNAPSHOT_ARCHIVED",
      "PSM element snapshot archived",
      id,
      { before, snapshot: row, reason },
    );
    return row;
  }
  async refreshAfterAggregation(user: RequestUser, query: Row = {}) {
    const settings = await this.db
      .single<Row>(
        this.db
          .from("executive_kpi_settings")
          .select(
            "auto_recalculate_elements_after_aggregation,enable_psm_element_scoring",
          )
          .eq("company_id", user.tenantId)
          .maybeSingle(),
      )
      .catch(() => null);
    if (
      settings?.enable_psm_element_scoring === false ||
      settings?.auto_recalculate_elements_after_aggregation === false
    )
      return [];
    const elements = await this.registry(user);
    return Promise.all(
      elements.map((element) => this.calculate(user, element, query, true)),
    );
  }
  async settings(user: RequestUser) {
    this.require(user, "executive.psm_element.view");
    return this.db
      .single<Row>(
        this.db
          .from("executive_kpi_settings")
          .select("*")
          .eq("company_id", user.tenantId)
          .maybeSingle(),
      )
      .catch(() => null);
  }
  async updateSettings(user: RequestUser, dto: Row) {
    this.require(user, "executive.psm_element.settings.edit");
    const allowed = [
      "enable_psm_element_scoring",
      "enable_psm_element_heatmap",
      "enable_psm_element_snapshots",
      "minimum_modules_for_element_score",
      "hide_restricted_element_scores",
      "show_restricted_element_placeholder",
      "allow_company_custom_psm_elements",
      "auto_recalculate_elements_after_aggregation",
      "psm_element_score_method",
      "psm_element_snapshot_enabled",
      "psm_element_critical_gap_penalty",
      "psm_element_overdue_action_penalty",
      "psm_element_missing_evidence_penalty",
      "psm_element_stale_record_penalty",
      "psm_element_pending_approval_penalty",
    ];
    const update = Object.fromEntries(
      allowed
        .filter((key) => dto[key] !== undefined)
        .map((key) => [key, dto[key]]),
    );
    const row = await this.db.single<Row>(
      this.db
        .from("executive_kpi_settings")
        .upsert(
          {
            company_id: user.tenantId,
            ...update,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id" },
        )
        .select("*")
        .single(),
    );
    await this.write(
      user,
      "PSM_ELEMENT_SETTINGS_UPDATED",
      "PSM element scoring settings updated",
      user.tenantId,
      update,
    );
    return row;
  }
  lookups() {
    return {
      "psm-element-categories": [
        "Information",
        "Hazard Analysis",
        "Operations",
        "People",
        "Integrity",
        "Governance",
        "Compliance",
        "Custom",
      ],
      "psm-element-statuses": [
        "Healthy",
        "Monitor",
        "Attention Required",
        "High Risk",
        "Critical",
        "Incomplete Data",
        "Restricted",
        "Source Unavailable",
        "Not Configured",
      ],
      "psm-element-score-factors": [
        "Critical Items",
        "Overdue Actions",
        "Pending Approvals",
        "Stale Records",
        "Data Completeness",
        "Source Availability",
      ],
      "psm-element-mapping-types": [
        "Health Score",
        "KPI",
        "Gap",
        "Evidence",
        "Approval",
      ],
      "psm-element-gap-types": [
        "Critical Item",
        "Overdue Action",
        "Stale Record",
        "Missing Evidence",
        "Pending Approval",
      ],
    };
  }
  private async calculate(
    user: RequestUser,
    element: Row,
    query: Row,
    save: boolean,
  ) {
    const mappings = await this.mappingsForCalculation(user, {
      elementId: element.id,
    });
    const scope = {
      siteId: query.siteId ?? null,
      unitId: query.unitId ?? null,
    };
    const run = await this.latestRun(user, scope);
    const modules = run
      ? await this.db.many<Row>(
          this.db
            .from("executive_module_health_results")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("aggregation_run_id", run.id),
        )
      : [];
    const matched = modules.filter((module) =>
      mappings.some((mapping) => mapping.source_module === module.module_key),
    );
    const required = mappings.filter((mapping) => mapping.required_for_score);
    const unavailable = required.filter(
      (mapping) =>
        !matched.some((module) => module.module_key === mapping.source_module),
    );
    const restricted = matched.filter(
      (module) => module.adapter_status === "permission_restricted",
    );
    const critical = matched.reduce(
      (n, module) => n + Number(module.critical_item_count ?? 0),
      0,
    );
    const overdue = matched.reduce(
      (n, module) => n + Number(module.overdue_item_count ?? 0),
      0,
    );
    const pending = matched.reduce(
      (n, module) => n + Number(module.pending_approval_count ?? 0),
      0,
    );
    const stale = matched.reduce(
      (n, module) => n + Number(module.stale_record_count ?? 0),
      0,
    );
    const scores = matched
      .map((m) => Number(m.health_score_foundation))
      .filter(Number.isFinite);
    const base = scores.length
      ? scores.reduce((n, value) => n + value, 0) / scores.length
      : null;
    const status =
      restricted.length &&
      !this.can(user, "executive.psm_element.restricted_trace.view")
        ? "Restricted"
        : !mappings.length
          ? "Not Configured"
          : !run
            ? "Source Unavailable"
            : unavailable.length
              ? "Incomplete Data"
              : base === null
                ? "Insufficient Data"
                : this.status(base);
    const score = [
      "Restricted",
      "Not Configured",
      "Source Unavailable",
      "Incomplete Data",
      "Insufficient Data",
    ].includes(status)
      ? null
      : Math.round(base!);
    const factors = [
      {
        key: "base_module_health",
        title: "Mapped module health",
        value: base,
        status: base === null ? "Unavailable" : "Available",
        weight: 1,
      },
      {
        key: "critical_items",
        title: "Critical open items",
        value: critical,
        status: "Available",
        weight: null,
      },
      {
        key: "overdue_actions",
        title: "Overdue actions",
        value: overdue,
        status: "Available",
        weight: null,
      },
      {
        key: "pending_approvals",
        title: "Pending approvals",
        value: pending,
        status: "Available",
        weight: null,
      },
      {
        key: "stale_records",
        title: "Stale records",
        value: stale,
        status: "Available",
        weight: null,
      },
    ];
    const record = {
      id: crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: scope.siteId,
      unit_id: scope.unitId,
      element_id: element.id,
      element_code: element.element_code,
      aggregation_run_id: run?.id ?? null,
      scope_type: scope.unitId ? "unit" : scope.siteId ? "site" : "company",
      scope_record_id: scope.unitId ?? scope.siteId ?? null,
      score_value: score,
      element_status: status,
      threshold_status: status,
      confidence_status:
        score === null
          ? "Low"
          : matched.length >= Math.max(1, required.length)
            ? "High"
            : "Medium",
      data_quality_status: run
        ? unavailable.length
          ? "Partial"
          : "Current"
        : "No Aggregation",
      critical_item_count: critical,
      high_risk_item_count: matched.reduce(
        (n, m) => n + Number(m.high_risk_item_count ?? 0),
        0,
      ),
      overdue_action_count: overdue,
      missing_evidence_count: 0,
      pending_approval_count: pending,
      stale_record_count: stale,
      restricted_record_count: matched.reduce(
        (n, m) => n + Number(m.restricted_record_count ?? 0),
        0,
      ),
      excluded_record_count: 0,
      source_module_count: matched.length,
      unavailable_module_count: unavailable.length,
      insufficient_data_count: base === null ? 1 : 0,
      score_factor_summary_json: factors,
      calculation_method_snapshot_json: {
        method: "mapped Phase 2 module health average",
        requiredModules: required.map((m) => m.source_module),
        unavailableModules: unavailable.map((m) => m.source_module),
      },
      source_trace_json: this.can(
        user,
        "executive.psm_element.restricted_trace.view",
      )
        ? matched.map((m) => m.source_trace_json)
        : null,
      calculated_by: user.id,
      calculated_at: new Date().toISOString(),
    };
    if (!save) return { ...record, element_name: element.element_name };
    let previousRequest: any = this.db
      .from("executive_psm_element_scores")
      .select("id")
      .eq("company_id", user.tenantId)
      .eq("element_id", element.id);
    previousRequest = scope.unitId
      ? previousRequest.eq("unit_id", scope.unitId)
      : scope.siteId
        ? previousRequest.eq("site_id", scope.siteId).is("unit_id", null)
        : previousRequest.is("site_id", null).is("unit_id", null);
    const previous = await this.db.many<Row>(previousRequest);
    const previousIds = previous.map((row) => row.id).filter(Boolean);
    if (previousIds.length) {
      await this.db
        .from("executive_psm_element_gaps")
        .delete()
        .in("element_score_id", previousIds);
      await this.db
        .from("executive_psm_element_scores")
        .delete()
        .in("id", previousIds);
    }
    const saved = await this.db.single<Row>(
      this.db
        .from("executive_psm_element_scores")
        .insert(record)
        .select("*")
        .single(),
    );
    if (factors.length)
      await this.db.many(
        this.db
          .from("executive_psm_element_score_factors")
          .insert(
            factors.map((factor) => ({
              id: crypto.randomUUID(),
              company_id: user.tenantId,
              site_id: scope.siteId,
              element_score_id: saved.id,
              factor_key: factor.key,
              factor_title: factor.title,
              factor_value: factor.value,
              factor_status: factor.status,
              factor_weight: factor.weight,
              source_count: matched.length,
              explanation_json: { source: "Phase 2 module health result" },
            })),
          )
          .select("id"),
      );
    const sourceRows = matched.map((module) => ({
      id: crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: scope.siteId,
      unit_id: scope.unitId,
      element_score_id: saved.id,
      element_id: element.id,
      source_module: module.module_key,
      source_record_type: "ExecutiveModuleHealth",
      source_record_id: module.id,
      source_title: module.module_label,
      contribution_type: "Health Score",
      included: true,
      excluded_reason: null,
      restricted: module.adapter_status === "permission_restricted",
      severity: module.module_health_status,
      status: module.adapter_status,
      drilldown_route: `/executive/module-health/${module.module_key}`,
      source_snapshot_json: module.source_trace_json,
    }));
    if (sourceRows.length)
      await this.db.many(
        this.db
          .from("executive_psm_element_source_records")
          .insert(sourceRows)
          .select("id"),
      );
    const gaps = matched.flatMap((module) =>
      [
        {
          title: `${module.module_label}: critical open items`,
          type: "Critical Item",
          count: Number(module.critical_item_count ?? 0),
          severity: "Critical",
        },
        {
          title: `${module.module_label}: overdue actions`,
          type: "Overdue Action",
          count: Number(module.overdue_item_count ?? 0),
          severity: "High",
        },
      ]
        .filter((gap) => gap.count > 0)
        .map((gap) => ({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: scope.siteId,
          unit_id: scope.unitId,
          element_id: element.id,
          element_score_id: saved.id,
          gap_title: gap.title,
          gap_type: gap.type,
          source_module: module.module_key,
          source_record_type: "ExecutiveModuleHealth",
          source_record_id: module.id,
          severity: gap.severity,
          gap_status: "Open",
          restricted: module.adapter_status === "permission_restricted",
          source_snapshot_json: { count: gap.count },
        })),
    );
    if (gaps.length)
      await this.db.many(
        this.db.from("executive_psm_element_gaps").insert(gaps).select("id"),
      );
    await this.write(
      user,
      "PSM_ELEMENT_RECALCULATED",
      "PSM element score recalculated",
      element.id,
      { score: saved },
    );
    return { ...saved, element_name: element.element_name };
  }
  private async latestScore(user: RequestUser, element: Row, query: Row) {
    let request: any = this.db
      .from("executive_psm_element_scores")
      .select("*")
      .eq("company_id", user.tenantId)
      .eq("element_id", element.id)
      .order("calculated_at", { ascending: false })
      .limit(1);
    request = query.unitId
      ? request.eq("unit_id", query.unitId)
      : query.siteId
        ? request.eq("site_id", query.siteId).is("unit_id", null)
        : request.is("site_id", null).is("unit_id", null);
    const saved = await this.db
      .single<Row>(request.maybeSingle())
      .catch(() => null);
    return saved
      ? {
          ...saved,
          element_name: element.element_name,
          element_code: element.element_code,
          element_category: element.element_category,
        }
      : this.calculate(user, element, query, false);
  }
  private async registry(user: RequestUser) {
    return this.db
      .many<Row>(
        this.db
          .from("executive_psm_elements")
          .select("*")
          .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
          .eq("active", true)
          .is("archived_at", null)
          .order("display_order"),
      )
      .catch(() => []);
  }
  private async mappingsForCalculation(user: RequestUser, query: Row = {}) {
    let request: any = this.db
      .from("executive_psm_element_module_mappings")
      .select("*")
      .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
      .is("archived_at", null)
      .eq("active", true);
    if (query.elementId) request = request.eq("element_id", query.elementId);
    return this.db
      .many<Row>(request.order("source_module_label"))
      .catch(() => []);
  }
  private async element(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("executive_psm_elements")
        .select("*")
        .eq("id", id)
        .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("PSM element was not found.");
    return row;
  }
  private async latestRun(user: RequestUser, scope: Row) {
    let request: any = this.db
      .from("executive_kpi_aggregation_runs")
      .select("*")
      .eq("company_id", user.tenantId)
      .in("run_status", ["Completed", "Completed With Warnings"])
      .order("completed_at", { ascending: false })
      .limit(1);
    request = scope.siteId
      ? request.eq("site_id", scope.siteId)
      : request.is("site_id", null);
    request = scope.unitId
      ? request.eq("unit_id", scope.unitId)
      : request.is("unit_id", null);
    return this.db.single<Row>(request.maybeSingle()).catch(() => null);
  }
  private async trace(user: RequestUser, scoreId: string) {
    if (!this.can(user, "executive.psm_element.source_trace.view")) return [];
    const rows = await this.db.many<Row>(
      this.db
        .from("executive_psm_element_source_records")
        .select("*")
        .eq("element_score_id", scoreId),
    );
    return this.can(user, "executive.psm_element.restricted_trace.view")
      ? rows
      : rows.map((row) =>
          row.restricted
            ? {
                ...row,
                source_record_id: null,
                source_snapshot_json: null,
                source_title: "Restricted source record",
              }
            : row,
        );
  }
  private async historyRows(user: RequestUser, id: string) {
    return this.db
      .many<Row>(
        this.db
          .from("executive_psm_element_history_events")
          .select("*")
          .eq("company_id", user.tenantId)
          .eq("element_id", id)
          .order("created_at", { ascending: false }),
      )
      .catch(() => []);
  }
  private emptyScore(element: Row) {
    return {
      id: `unavailable-${element.id}`,
      element_id: element.id,
      element_name: element.element_name,
      element_code: element.element_code,
      element_category: element.element_category,
      score_value: null,
      element_status: "Source Unavailable",
      data_quality_status: "No Aggregation",
      critical_item_count: 0,
      overdue_action_count: 0,
      missing_evidence_count: 0,
      pending_approval_count: 0,
      stale_record_count: 0,
      aggregation_run_id: null,
      calculated_at: null,
      sourceTrace: [],
    };
  }
  private status(score: number) {
    return score < 40
      ? "Critical"
      : score < 60
        ? "High Risk"
        : score < 75
          ? "Attention Required"
          : score < 90
            ? "Monitor"
            : "Healthy";
  }
  private allowed(user: RequestUser, siteId?: string | null) {
    return (
      !siteId ||
      Boolean(
        user.corporateView ||
        user.isCompanyAdmin ||
        user.isSuperAdmin ||
        user.siteIds.includes(siteId),
      )
    );
  }
  private can(user: RequestUser, key: string) {
    return Boolean(
      user.isCompanyAdmin ||
      user.isSuperAdmin ||
      user.permissions.includes(key),
    );
  }
  private require(user: RequestUser, key: string) {
    if (!this.can(user, key))
      throw new ForbiddenException(`Missing required permission: ${key}`);
  }
  private async write(
    user: RequestUser,
    type: string,
    title: string,
    entityId: string,
    after: Row,
  ) {
    await this.audit
      .write({
        tenantId: user.tenantId,
        actorId: user.id,
        action: type,
        entityType: "ExecutivePsmElement",
        entityId,
        after,
        metadata: { sourceModule: "Executive KPI Dashboard Phase 4" },
      })
      .catch(() => null);
    await this.db
      .single(
        this.db
          .from("executive_psm_element_history_events")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: user.selectedSiteId ?? null,
            event_type: type,
            event_title: title,
            after_value_json: after,
            actor_user_id: user.id,
            source_module: "Executive KPI Dashboard",
            source_record_id: entityId,
          })
          .select("id")
          .single(),
      )
      .catch(() => null);
  }
}
