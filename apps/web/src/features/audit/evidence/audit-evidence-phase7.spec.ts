import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiRoot = resolve(root, "apps/api/src/audit-compliance");
const appRoot = resolve(root, "apps/web/src/app/(app)/audit-compliance");
const migration = resolve(root, "supabase/migrations/20260729234500_audit_evidence_collection_phase7.sql");

describe("Audit Evidence Collection Phase 7", () => {
  it("adds Evidence Collection tables, indexes, RLS, and tenant-safe permissions", () => {
    const sql = readFileSync(migration, "utf8");
    for (const table of [
      "audit_evidence_records",
      "audit_evidence_requirements",
      "audit_evidence_links",
      "audit_evidence_requests",
      "audit_evidence_request_submissions",
      "audit_evidence_reviews",
      "audit_evidence_chain_of_custody_events",
      "audit_evidence_access_events",
      "audit_evidence_gaps",
      "audit_evidence_package_foundations",
      "audit_evidence_package_items",
      "audit_evidence_history_events",
      "audit_evidence_settings",
    ]) expect(sql).toContain(table);
    expect(sql).toContain("enable row level security");
    expect(sql).toContain('"tenantId"');
    expect(sql).toContain("audit.evidence.view");
    expect(sql).toContain("audit.evidence.package.prepare");
  });

  it("registers Evidence backend services and API routes", () => {
    for (const file of [
      "audit-evidence.service.ts",
      "audit-evidence-history.service.ts",
      "audit-evidence-upload.service.ts",
      "audit-evidence-link.service.ts",
      "audit-evidence-request.service.ts",
      "audit-evidence-review.service.ts",
      "audit-evidence-gap.service.ts",
      "audit-evidence-package-foundation.service.ts",
      "audit-evidence-access.service.ts",
      "audit-evidence-storage-adapter.service.ts",
      "audit-evidence-document-control-adapter.service.ts",
    ]) expect(existsSync(resolve(apiRoot, file))).toBe(true);
    const controller = readFileSync(resolve(apiRoot, "audit-compliance.controller.ts"), "utf8");
    for (const route of [
      "evidence/dashboard",
      "evidence/register",
      "evidence/requirements",
      "evidence/requests",
      "evidence/gaps",
      "evidence/packages",
      "evidence/access-log",
      "evidence/:evidenceId/review",
      "programs/:programId/evidence",
      "execution/:executionId/responses/:responseId/evidence",
      "capa/:capaId/actions/:actionId/evidence",
    ]) expect(controller).toContain(route);
  });

  it("adds PDF-required Evidence frontend routes, components, hooks, schemas, and active sidebar entry", () => {
    for (const file of [
      "AuditEvidenceDashboardPage.tsx",
      "AuditEvidenceSummaryCards.tsx",
      "AuditEvidenceRegisterPage.tsx",
      "AuditEvidenceTable.tsx",
      "AuditEvidenceMobileCards.tsx",
      "AuditEvidenceFilters.tsx",
      "AuditEvidenceFormPage.tsx",
      "AuditEvidenceForm.tsx",
      "AuditEvidenceDetailPage.tsx",
      "AuditEvidenceRequirementPage.tsx",
      "AuditEvidenceRequestPage.tsx",
      "AuditEvidenceGapPage.tsx",
      "AuditEvidencePackageFoundationPage.tsx",
      "AuditEvidenceAccessLogPage.tsx",
      "sections/EvidenceIdentitySection.tsx",
      "sections/EvidenceSourceObjectSection.tsx",
      "tabs/EvidenceOverviewTab.tsx",
      "tabs/EvidenceReviewTab.tsx",
      "tabs/EvidenceHistoryTab.tsx",
    ]) expect(existsSync(resolve(__dirname, file))).toBe(true);
    for (const file of [
      "useAuditEvidenceDashboard.ts",
      "useAuditEvidence.ts",
      "useAuditEvidenceDetail.ts",
      "useAuditEvidenceMutations.ts",
      "useAuditEvidenceUpload.ts",
      "useAuditEvidenceRequirements.ts",
      "useAuditEvidenceRequests.ts",
      "useAuditEvidenceReview.ts",
      "useAuditEvidenceGaps.ts",
      "useAuditEvidencePackages.ts",
      "useAuditEvidenceAccessLog.ts",
      "useAuditEvidenceLookups.ts",
    ]) expect(existsSync(resolve(root, "apps/web/src/features/audit/hooks", file))).toBe(true);
    for (const route of [
      "evidence/page.tsx",
      "evidence/dashboard/page.tsx",
      "evidence/register/page.tsx",
      "evidence/new/page.tsx",
      "evidence/requests/page.tsx",
      "evidence/requests/new/page.tsx",
      "evidence/requirements/page.tsx",
      "evidence/gaps/page.tsx",
      "evidence/[evidenceId]/review/page.tsx",
      "programs/[programId]/evidence/page.tsx",
      "execution/[executionId]/responses/[responseId]/evidence/page.tsx",
      "capa/[capaId]/actions/[actionId]/evidence/page.tsx",
    ]) expect(existsSync(resolve(appRoot, route))).toBe(true);
    const sidebar = readFileSync(resolve(root, "apps/web/src/features/audit/AuditSidebar.tsx"), "utf8");
    expect(sidebar).toContain('["/audit-compliance/evidence", "Evidence Collection", false]');
  });
});
