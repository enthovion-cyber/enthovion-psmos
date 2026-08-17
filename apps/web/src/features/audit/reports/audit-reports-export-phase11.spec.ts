import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { auditReportRequiredFields, validateAuditReportDraft } from "../schemas/audit-report.schema";

const root = join(process.cwd(), "src");

describe("Audit Reports / Export Phase 11", () => {
  it("keeps required create/generate validation fields explicit", () => {
    expect(auditReportRequiredFields).toEqual(["sourceModule", "sourceRecordId", "reportTitle", "reportType"]);
    expect(validateAuditReportDraft({ sourceModule: "program" })).toContain("sourceRecordId");
  });

  it("contains the PDF-required report component and route files", () => {
    [
      "features/audit/reports/AuditReportsDashboardPage.tsx",
      "features/audit/reports/AuditReportRegisterPage.tsx",
      "features/audit/reports/AuditReportGenerateWizard.tsx",
      "features/audit/reports/AuditReportDetailPage.tsx",
      "features/audit/reports/tabs/ReportOverviewTab.tsx",
      "features/audit/reports/tabs/ReportFilesTab.tsx",
      "features/audit/reports/tabs/ReportHistoryTab.tsx",
      "app/(app)/audit-compliance/reports/page.tsx",
      "app/(app)/audit-compliance/reports/generate/page.tsx",
      "app/(app)/audit-compliance/reports/templates/page.tsx",
      "app/(app)/audit-compliance/reports/jobs/page.tsx",
      "app/(app)/audit-compliance/reports/packages/page.tsx",
      "app/(app)/audit-compliance/reports/access-log/page.tsx",
    ].forEach((file) => expect(existsSync(join(root, file)), file).toBe(true));
  });
});
