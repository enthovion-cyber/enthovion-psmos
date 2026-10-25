import { describe, expect, it, vi } from "vitest";
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutiveAggregationService } from "../src/executive/executive-aggregation.service.ts";

const user = {
  id: "user-1",
  tenantId: "company-1",
  selectedSiteId: null,
  siteIds: [],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: ["executive.aggregation.history.view"],
} as any;

function service() {
  return new ExecutiveAggregationService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
}

describe("ExecutiveAggregationService dashboard output", () => {
  it("returns a complete empty dashboard contract when no run exists", async () => {
    const subject = service();
    vi.spyOn(subject as any, "latest").mockResolvedValue(null);

    const result = await subject.dashboard(user);

    expect(result.header.status).toBe("Incomplete Data");
    expect(result).toMatchObject({
      summaryCards: [],
      criticalAlerts: [],
      openCriticalActions: [],
      pendingApprovals: [],
      staleRecords: [],
      regulatoryAuditCompliance: [],
      incidentMiTraining: [],
      managementReview: [],
      recentSnapshot: null,
    });
  });

  it("normalizes persisted aggregation records for the real-data overview", async () => {
    const subject = service();
    vi.spyOn(subject as any, "runRecord").mockResolvedValue({
      id: "run-1",
      site_id: null,
      started_at: "2026-10-18T08:00:00.000Z",
      completed_at: "2026-10-18T08:01:00.000Z",
    });
    vi.spyOn(subject as any, "sitePerformanceFromResults").mockResolvedValue(
      [],
    );
    vi.spyOn(subject as any, "rows").mockImplementation(
      (...args: any[]) => {
        const table = args[1];
        if (table === "executive_module_health_results") {
          return Promise.resolve([
            {
              id: "health-1",
              module_key: "incident",
              module_label: "Incident Management",
              module_health_status: "attention_required",
              adapter_status: "connected_with_warnings",
              health_score_foundation: 72,
              critical_item_count: 1,
              overdue_item_count: 1,
              pending_approval_count: 1,
              stale_record_count: 1,
              restricted_record_count: 0,
              warning_count: 1,
              error_count: 0,
              calculated_at: "2026-10-18T08:01:00.000Z",
              source_trace_json: {
                overdueItems: [
                  {
                    title: "Overdue investigation",
                    sourceRecordId: "action-1",
                  },
                ],
                pendingApprovals: [
                  { title: "Approval required", sourceRecordId: "approval-1" },
                ],
                staleRecords: [
                  {
                    title: "Stale incident",
                    sourceRecordId: "incident-1",
                    restricted: true,
                  },
                ],
              },
            },
          ]);
        }
        if (table === "executive_critical_alerts") {
          return Promise.resolve([
            {
              alert_title: "High-potential incident",
              source_module: "incident",
              source_record_id: "incident-2",
              severity: "critical",
              alert_reason: "Critical source record",
              alert_status: "Open",
              restricted: false,
            },
          ]);
        }
        return Promise.resolve([]);
      },
    );

    const result = await subject.detail(user, "run-1");

    expect(result.dashboard.criticalAlerts[0]).toMatchObject({
      title: "High-potential incident",
      sourceModule: "incident",
      sourceRecord: "incident-2",
      status: "Critical",
    });
    expect(result.dashboard.openCriticalActions).toHaveLength(1);
    expect(result.dashboard.pendingApprovals).toHaveLength(1);
    expect(result.dashboard.staleRecords[0]?.sourceRecord).toBeNull();
    expect(result.dashboard.header).toMatchObject({
      criticalAlertsCount: 1,
      overdueActionCount: 1,
      pendingApprovalCount: 1,
      staleCriticalRecordCount: 1,
      dataQualityStatus: "Connected With Warnings",
    });
    expect(result.dashboard.incidentMiTraining).toHaveLength(1);
  });
});
