import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiRoot = resolve(root, "apps/api/src/audit-compliance");
const appRoot = resolve(root, "apps/web/src/app/(app)/audit-compliance");
const migration = resolve(root, "supabase/migrations/20260730003000_audit_review_approval_phase10.sql");

describe("Audit Review & Approval Phase 10", () => {
  it("adds review approval database tables, indexes, RLS, settings, and tenant-safe permissions", () => {
    const sql = readFileSync(migration, "utf8");
    for (const table of [
      "audit_approval_packages",
      "audit_approval_stages",
      "audit_approval_participants",
      "audit_approval_decisions",
      "audit_approval_conditions",
      "audit_approval_validation_results",
      "audit_approval_evidence_links",
      "audit_approval_rules",
      "audit_approval_rule_stages",
      "audit_approval_esignature_links",
      "audit_approval_escalations",
      "audit_approval_staleness_events",
      "audit_approval_history_events",
      "audit_approval_settings",
    ]) expect(sql).toContain(table);
    expect(sql).toContain("enable row level security");
    expect(sql).toContain('for tenant_row in select id from public."Tenant"');
    expect(sql).toContain("audit.review.package.create");
    expect(sql).toContain("audit.review.esign");
    expect(sql).toContain("audit.review.settings.edit");
  });

  it("registers backend routes and architecture extension points", () => {
    for (const file of [
      "audit-review-approval.service.ts",
      "audit-review-history.service.ts",
      "audit-review-dashboard.service.ts",
      "audit-review-inbox.service.ts",
      "audit-approval-package.service.ts",
      "audit-approval-snapshot.service.ts",
      "audit-approval-validation.service.ts",
      "audit-approval-stale-detection.service.ts",
      "audit-approval-decision.service.ts",
      "audit-approval-condition.service.ts",
      "audit-approval-esignature.service.ts",
      "audit-review-global-workflow-adapter.service.ts",
      "audit-review-esignature-adapter.service.ts",
      "audit-review-standards-mapping-adapter.service.ts",
      "audit-review-report-adapter.service.ts",
    ]) expect(existsSync(resolve(apiRoot, file))).toBe(true);
    const controller = readFileSync(resolve(apiRoot, "audit-compliance.controller.ts"), "utf8");
    for (const route of [
      "review-approval/dashboard",
      "review-approval/inbox",
      "review-approval/my-submissions",
      "review-approval/packages",
      "review-approval/packages/:approvalId/submit",
      "review-approval/packages/:approvalId/approve",
      "review-approval/packages/:approvalId/approve-with-conditions",
      "review-approval/packages/:approvalId/e-sign",
      "review-approval/packages/:approvalId/conditions/:conditionId/verify",
      "review-approval/rules/:ruleId/activate",
      "programs/:programId/submit-review",
      "standards-mapping/:mappingId/review",
      "lookups/approval-package-statuses",
    ]) expect(controller).toContain(route);
  });

  it("adds PDF-required frontend routes, components, hooks, services, schemas, and active sidebar entry", () => {
    for (const file of [
      "AuditReviewDashboardPage.tsx",
      "AuditReviewInboxPage.tsx",
      "AuditApprovalListPage.tsx",
      "AuditApprovalPackageDetailPage.tsx",
      "AuditReviewRulesPage.tsx",
      "AuditReviewRuleFormPage.tsx",
      "AuditApprovalPackageTable.tsx",
      "AuditReviewSummaryCards.tsx",
      "AuditApprovalWorkflowTimeline.tsx",
      "AuditApprovalValidationPanel.tsx",
      "AuditApprovalStaleWarningPanel.tsx",
      "tabs/ApprovalOverviewTab.tsx",
      "tabs/ApprovalDecisionsTab.tsx",
      "tabs/ApprovalEsignaturesTab.tsx",
      "AuditApproveDialog.tsx",
      "AuditApproveWithConditionsDialog.tsx",
      "AuditRejectDialog.tsx",
      "AuditReturnDialog.tsx",
    ]) expect(existsSync(resolve(__dirname, file))).toBe(true);
    for (const file of [
      "useAuditReviewDashboard.ts",
      "useAuditReviewInbox.ts",
      "useAuditApprovalPackages.ts",
      "useAuditApprovalPackageDetail.ts",
      "useAuditApprovalMutations.ts",
      "useAuditReviewRules.ts",
      "useAuditApprovalValidation.ts",
      "useAuditApprovalConditions.ts",
      "useAuditApprovalLookups.ts",
    ]) expect(existsSync(resolve(root, "apps/web/src/features/audit/hooks", file))).toBe(true);
    for (const file of [
      "audit-review.service.ts",
      "audit-approval-package.service.ts",
      "audit-approval-decision.service.ts",
      "audit-review-rule.service.ts",
      "audit-approval-validation.service.ts",
      "audit-approval-condition.service.ts",
    ]) expect(existsSync(resolve(root, "apps/web/src/features/audit/services", file))).toBe(true);
    for (const route of [
      "review-approval/page.tsx",
      "review-approval/dashboard/page.tsx",
      "review-approval/inbox/page.tsx",
      "review-approval/my-submissions/page.tsx",
      "review-approval/stale/page.tsx",
      "review-approval/validation-failures/page.tsx",
      "review-approval/packages/[approvalId]/review/page.tsx",
      "review-approval/packages/[approvalId]/e-signatures/page.tsx",
      "review-approval/rules/[ruleId]/edit/page.tsx",
      "programs/[programId]/review/page.tsx",
      "standards-mapping/[mappingId]/review/page.tsx",
      "sites/[siteId]/review-approval/page.tsx",
    ]) expect(existsSync(resolve(appRoot, route))).toBe(true);
    const sidebar = readFileSync(resolve(root, "apps/web/src/features/audit/AuditSidebar.tsx"), "utf8");
    expect(sidebar).toContain('["/audit-compliance/review-approval", "Review & Approval", false]');
  });
});
