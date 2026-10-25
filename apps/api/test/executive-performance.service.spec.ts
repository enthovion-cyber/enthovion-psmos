import { describe, expect, it, vi } from "vitest";
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutivePerformanceService } from "../src/executive/executive-performance.service.ts";

const user = {
  id: "user-1",
  tenantId: "company-1",
  selectedSiteId: null,
  siteIds: [],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: [
    "executive.performance.view",
    "executive.performance.dashboard.view",
    "executive.performance.company.view",
    "executive.performance.site.view",
    "executive.performance.unit.view",
    "executive.performance.compare.view",
    "executive.performance.heatmap.view",
    "executive.performance.ranking.view",
    "executive.performance.drilldown.view",
    "executive.performance.snapshot.view",
  ],
} as any;

function createService() {
  const mockDb = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    single: vi.fn().mockImplementation((val) => val),
    many: vi.fn().mockResolvedValue([]),
  } as any;

  const mockAudit = { log: vi.fn() } as any;
  const mockAggregation = { run: vi.fn() } as any;

  return new ExecutivePerformanceService(mockDb, mockAudit, mockAggregation);
}

describe("ExecutivePerformanceService", () => {
  it("computes dashboard summary and company scope contract", async () => {
    const service = createService();
    vi.spyOn(service as any, "company").mockResolvedValue({
      id: "scope-1",
      company_id: "company-1",
      scope_type: "company",
      scope_label: "Corporate Enterprise",
      performance_score_foundation: 88,
      performance_status: "Healthy",
      data_quality_status: "Current",
      critical_alert_count: 2,
      overdue_action_count: 5,
      pending_approval_count: 3,
      stale_record_count: 1,
      unavailable_module_count: 0,
      aggregation_run_id: "run-100",
    });

    vi.spyOn(service as any, "scopes").mockResolvedValue({
      rows: [
        {
          id: "site-perf-1",
          site_id: "site-1",
          scope_label: "Jurong Chemical",
          performance_score_foundation: 91,
          performance_status: "Healthy",
        },
        {
          id: "site-perf-2",
          site_id: "site-2",
          scope_label: "Texas Refinery",
          performance_score_foundation: 85,
          performance_status: "Healthy",
        },
      ],
      total: 2,
    });

    const result = await service.dashboard(user);

    expect(result.summary.sitesMonitored).toBe(2);
    expect(result.summary.activeAlerts).toBe(2);
    expect(result.summary.overdueActions).toBe(5);
    expect(result.company.performance_score_foundation).toBe(88);
    expect(result.sites).toHaveLength(2);
  });

  it("handles scope comparison and ranking generation", async () => {
    const service = createService();
    vi.spyOn(service as any, "scopes").mockResolvedValue({
      rows: [
        {
          id: "perf-1",
          site_id: "site-1",
          scope_record_id: "site-1",
          scope_label: "Site Alpha",
          performance_score_foundation: 92,
          performance_status: "Healthy",
          data_quality_status: "Current",
          source_trace_json: {},
        },
        {
          id: "perf-2",
          site_id: "site-2",
          scope_record_id: "site-2",
          scope_label: "Site Beta",
          performance_score_foundation: 74,
          performance_status: "Monitor",
          data_quality_status: "Current",
          source_trace_json: {},
        },
      ],
      total: 2,
    });

    const mockDbSingle = vi.spyOn((service as any).db, "single").mockResolvedValue({
      id: "comp-set-1",
      comparison_title: "Site performance comparison",
      comparison_type: "Performance Score",
    });

    vi.spyOn((service as any).db, "many").mockResolvedValue([{ id: "rank-1" }, { id: "rank-2" }]);
    vi.spyOn(service as any, "history").mockResolvedValue(undefined);

    const result = await service.compare(user, { scopeType: "site" });

    expect(result.rows).toHaveLength(2);
    expect(result.rankings).toHaveLength(2);
    expect(result.rankings[0].rank_position).toBe(1);
    expect(result.rankings[0].ranking_value).toBe(92);
    expect(result.rankings[1].rank_position).toBe(2);
    expect(result.rankings[1].ranking_value).toBe(74);
  });

  it("calculates heatmap cells across scopes and modules", async () => {
    const service = createService();
    vi.spyOn(service as any, "compare").mockResolvedValue({
      comparison: { id: "comp-heatmap-1" },
      rows: [
        {
          scope_type: "site",
          scope_record_id: "site-1",
          scope_label: "Site Alpha",
          site_id: "site-1",
          moduleScorecards: [
            {
              module_key: "psi",
              module_label: "Process Safety Info",
              module_health_score_foundation: 95,
              module_health_status: "healthy",
              restricted_record_count: 0,
            },
            {
              module_key: "mi",
              module_label: "Mechanical Integrity",
              module_health_score_foundation: 80,
              module_health_status: "monitor",
              restricted_record_count: 0,
            },
          ],
        },
      ],
    });

    vi.spyOn((service as any).db, "many").mockResolvedValue([{ id: "cell-1" }, { id: "cell-2" }]);

    const result = await service.heatmap(user, { scopeType: "site" });

    expect(result.cells).toHaveLength(2);
    expect(result.cells[0].column_key).toBe("psi");
    expect(result.cells[0].cell_value).toBe(95);
    expect(result.cells[1].column_key).toBe("mi");
    expect(result.cells[1].cell_value).toBe(80);
  });

  it("handles drilldown navigation hierarchy", async () => {
    const service = createService();
    vi.spyOn(service as any, "company").mockResolvedValue({
      id: "company-scope-1",
      scope_type: "company",
      scope_label: "Company",
      sourceTrace: [{ id: "trace-1" }],
    });

    vi.spyOn(service as any, "children").mockResolvedValue([
      { id: "site-1", label: "Plant Jurong", scopeType: "site", route: "/executive/performance/sites/site-1" },
      { id: "site-2", label: "Plant Texas", scopeType: "site", route: "/executive/performance/sites/site-2" },
    ]);

    const result = await service.drilldown(user, { scopeType: "company" });

    expect(result.scope.scope_type).toBe("company");
    expect(result.children).toHaveLength(2);
  });
});
