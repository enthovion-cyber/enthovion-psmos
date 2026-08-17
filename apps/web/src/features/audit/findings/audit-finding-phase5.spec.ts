import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiRoot = resolve(root, "apps/api/src/audit-compliance");
const migration = resolve(root, "supabase/migrations/20260729230000_audit_finding_register_phase5.sql");

describe("Audit Finding Register Phase 5", () => {
  it("adds the required backend tables, RLS, and permissions", () => {
    const sql = readFileSync(migration, "utf8");
    for (const table of [
      "audit_findings",
      "audit_finding_sources",
      "audit_finding_standard_links",
      "audit_finding_module_links",
      "audit_finding_evidence_links",
      "audit_finding_ownership_records",
      "audit_finding_review_records",
      "audit_finding_duplicate_checks",
      "audit_finding_capa_foundation_links",
      "audit_finding_status_transitions",
      "audit_finding_history_events",
      "audit_finding_settings",
    ]) expect(sql).toContain(table);
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("audit.finding.convert_from_field");
  });

  it("registers formal finding services and API routes", () => {
    expect(existsSync(resolve(apiRoot, "audit-finding.service.ts"))).toBe(true);
    expect(existsSync(resolve(apiRoot, "audit-finding-history.service.ts"))).toBe(true);
    const controller = readFileSync(resolve(apiRoot, "audit-compliance.controller.ts"), "utf8");
    for (const route of [
      'findings/dashboard',
      'findings/register',
      'findings/:findingId/confirm',
      'findings/:findingId/check-duplicates',
      'execution/:executionId/field-findings/:fieldFindingId/convert',
      'execution/:executionId/responses/:responseId/create-finding',
    ]) expect(controller).toContain(route);
  });

  it("adds the requested frontend route and component structure", () => {
    for (const file of [
      "AuditFindingDashboardPage.tsx",
      "AuditFindingRegisterPage.tsx",
      "AuditFindingFormPage.tsx",
      "AuditFindingForm.tsx",
      "AuditFindingConvertFromFieldPage.tsx",
      "AuditFindingDetailPage.tsx",
      "tabs/FindingOverviewTab.tsx",
      "tabs/FindingSourceTab.tsx",
      "tabs/FindingClassificationTab.tsx",
      "tabs/FindingEvidenceTab.tsx",
      "tabs/FindingOwnershipTab.tsx",
      "tabs/FindingReviewTab.tsx",
      "tabs/FindingCapaFoundationTab.tsx",
      "tabs/FindingHistoryTab.tsx",
      "sections/FindingIdentitySection.tsx",
      "sections/FindingSourceSection.tsx",
      "sections/FindingScopeSection.tsx",
      "sections/FindingClassificationSection.tsx",
      "sections/FindingStandardModuleSection.tsx",
      "sections/FindingEvidenceSection.tsx",
      "sections/FindingOwnershipDueDateSection.tsx",
      "sections/FindingCapaReadinessSection.tsx",
    ]) expect(existsSync(resolve(__dirname, file))).toBe(true);
  });
});
