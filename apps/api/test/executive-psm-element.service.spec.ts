import { describe, expect, it, vi } from "vitest";
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutivePsmElementService } from "../src/executive/executive-psm-element.service.ts";

const user = {
  id: "user-1",
  tenantId: "company-1",
  companyIds: ["company-1"],
  selectedSiteId: null,
  siteIds: [],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: [
    "executive.psm_element.view",
    "executive.psm_element.dashboard.view",
    "executive.psm_element.register.view",
    "executive.psm_element.detail.view",
    "executive.psm_element.create",
    "executive.psm_element.edit",
    "executive.psm_element.archive",
    "executive.psm_element.score.view",
    "executive.psm_element.score.recalculate",
    "executive.psm_element.mapping.view",
    "executive.psm_element.mapping.edit",
    "executive.psm_element.kpi_mapping.view",
    "executive.psm_element.kpi_mapping.edit",
    "executive.psm_element.heatmap.view",
    "executive.psm_element.site_breakdown.view",
    "executive.psm_element.unit_breakdown.view",
    "executive.psm_element.gap.view",
    "executive.psm_element.source_trace.view",
    "executive.psm_element.snapshot.view",
    "executive.psm_element.snapshot.create",
  ],
} as any;

function createService() {
  let lastInserted: any = null;
  const mockDb = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation((data) => {
      lastInserted = Array.isArray(data) ? data[0] : data;
      return mockDb;
    }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    single: vi.fn().mockImplementation((val) => {
      const result = lastInserted ?? (val && typeof val === "object" && "id" in val ? val : { id: "snap-1", ...val });
      return Promise.resolve(result);
    }),
    many: vi.fn().mockResolvedValue([
      { id: "site-1", name: "Texas Refinery", tenantId: "company-1", siteId: "site-1" },
    ]),
  } as any;

  const mockAudit = { write: vi.fn().mockResolvedValue({}) } as any;

  return new ExecutivePsmElementService(mockDb, mockAudit);
}

describe("ExecutivePsmElementService", () => {
  it("generates element dashboard summary and rankings accurately", async () => {
    const service = createService();
    vi.spyOn(service as any, "scores").mockResolvedValue([
      {
        id: "score-1",
        element_id: "psm-psi",
        element_name: "Process Safety Information",
        element_code: "PSI",
        score_value: 92,
        element_status: "Healthy",
        critical_item_count: 0,
        overdue_action_count: 1,
        missing_evidence_count: 0,
        pending_approval_count: 0,
        stale_record_count: 0,
        calculated_at: new Date().toISOString(),
      },
      {
        id: "score-2",
        element_id: "psm-mi",
        element_name: "Mechanical Integrity",
        element_code: "MI",
        score_value: 65,
        element_status: "Attention Required",
        critical_item_count: 2,
        overdue_action_count: 4,
        missing_evidence_count: 1,
        pending_approval_count: 2,
        stale_record_count: 1,
        calculated_at: new Date().toISOString(),
      },
    ]);
    vi.spyOn(service as any, "gaps").mockResolvedValue([]);
    vi.spyOn(service as any, "snapshots").mockResolvedValue({ rows: [], total: 0 });

    const dashboard = await service.dashboard(user, {});
    expect(dashboard.summary.totalElements).toBe(2);
    expect(dashboard.summary.healthyElements).toBe(1);
    expect(dashboard.summary.attentionRequiredElements).toBe(1);
    expect(dashboard.summary.bestElement).toBe("Process Safety Information");
    expect(dashboard.summary.worstElement).toBe("Mechanical Integrity");
    expect(dashboard.summary.criticalElementGaps).toBe(2);
    expect(dashboard.summary.overdueElementActions).toBe(5);
  });

  it("calculates element heatmap matrix with proper cell metadata", async () => {
    const service = createService();
    vi.spyOn(service as any, "scores").mockResolvedValue([
      {
        id: "score-1",
        element_id: "psm-psi",
        element_name: "Process Safety Information",
        element_code: "PSI",
        score_value: 88,
        element_status: "Healthy",
        critical_item_count: 0,
        overdue_action_count: 0,
      },
    ]);

    const heatmap = await service.heatmap(user, {});
    expect(heatmap.cells).toHaveLength(1);
    expect(heatmap.cells[0]?.elementName).toBe("Process Safety Information");
    expect(heatmap.cells[0]?.score).toBe(88);
    expect(heatmap.cells[0]?.status).toBe("Healthy");
    expect(heatmap.cells[0]?.drilldownRoute).toContain("psm-psi");
  });

  it("extracts site and unit element breakdown comparisons", async () => {
    const service = createService();
    vi.spyOn(service as any, "scores").mockResolvedValue([
      {
        id: "score-1",
        element_id: "psm-moc",
        element_name: "Management of Change",
        element_code: "MOC",
        score_value: 78,
        element_status: "Monitor",
        critical_item_count: 1,
        overdue_action_count: 2,
      },
    ]);

    const breakdown = await service.breakdown(user, "site", { siteId: "site-1" });
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]?.siteId).toBe("site-1");
    expect(breakdown[0]?.scores).toHaveLength(1);
    expect(breakdown[0]?.criticalElementCount).toBe(0);
  });

  it("creates immutable governance element snapshot", async () => {
    const service = createService();
    vi.spyOn(service as any, "scores").mockResolvedValue([
      {
        id: "score-1",
        element_id: "psm-psi",
        element_name: "Process Safety Information",
        element_code: "PSI",
        score_value: 90,
        element_status: "Healthy",
      },
    ]);
    vi.spyOn(service as any, "gaps").mockResolvedValue([]);

    const snapshot = await service.snapshot(user, {
      title: "Q3 Governance Audit",
      scopeType: "company",
    });

    expect(snapshot.snapshot_title).toBe("Q3 Governance Audit");
    expect(snapshot.snapshot_code).toMatch(/^PE-\d{4}-[A-Z0-9]+$/);
    expect(snapshot.element_count).toBe(1);
    expect(snapshot.healthy_count).toBe(1);
  });
});
