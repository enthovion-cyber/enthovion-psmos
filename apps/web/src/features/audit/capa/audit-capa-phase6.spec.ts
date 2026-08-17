import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiRoot = resolve(root, "apps/api/src/audit-compliance");
const appRoot = resolve(root, "apps/web/src/app/(app)/audit-compliance");
const migration = resolve(root, "supabase/migrations/20260729233000_audit_capa_action_phase6.sql");

describe("Audit CAPA / Action Integration Phase 6", () => {
  it("adds CAPA tables, RLS, indexes, and tenant-safe permissions", () => {
    const sql = readFileSync(migration, "utf8");
    for (const table of [
      "audit_capa_packages",
      "audit_capa_finding_links",
      "audit_capa_actions",
      "audit_capa_containment_records",
      "audit_capa_action_evidence_links",
      "audit_capa_verification_records",
      "audit_capa_effectiveness_checks",
      "audit_capa_closure_readiness_checks",
      "audit_capa_action_sync_events",
      "audit_capa_status_transitions",
      "audit_capa_history_events",
      "audit_capa_settings",
    ]) expect(sql).toContain(table);
    expect(sql).toContain("enable row level security");
    expect(sql).toContain('"tenantId"');
    expect(sql).toContain("audit.capa.action.verify");
    expect(sql).toContain("audit.capa.closure_readiness.run");
  });

  it("registers CAPA backend services and API routes", () => {
    for (const file of [
      "audit-capa.service.ts",
      "audit-capa-history.service.ts",
      "audit-capa-action.service.ts",
      "audit-capa-verification.service.ts",
      "audit-capa-effectiveness.service.ts",
      "audit-capa-closure-readiness.service.ts",
      "audit-capa-action-engine-adapter.service.ts",
    ]) expect(existsSync(resolve(apiRoot, file))).toBe(true);
    const controller = readFileSync(resolve(apiRoot, "audit-compliance.controller.ts"), "utf8");
    for (const route of [
      "capa/dashboard",
      "capa/register",
      "capa/:capaId/run-closure-readiness",
      "capa/:capaId/actions/:capaActionId/verify",
      "findings/:findingId/create-capa",
      "findings/:findingId/closure-readiness",
      "programs/:programId/capa",
    ]) expect(controller).toContain(route);
  });

  it("adds the requested frontend CAPA routes, tabs, and activated sidebar entry", () => {
    for (const file of [
      "AuditCapaDashboardPage.tsx",
      "AuditCapaRegisterPage.tsx",
      "AuditCapaFormPage.tsx",
      "AuditCapaCreateFromFindingPage.tsx",
      "AuditCapaDetailPage.tsx",
      "AuditCapaActionTable.tsx",
      "tabs/CapaOverviewTab.tsx",
      "tabs/CapaFindingsTab.tsx",
      "tabs/CapaActionsTab.tsx",
      "tabs/CapaContainmentTab.tsx",
      "tabs/CapaEvidenceTab.tsx",
      "tabs/CapaVerificationTab.tsx",
      "tabs/CapaEffectivenessTab.tsx",
      "tabs/CapaClosureReadinessTab.tsx",
      "tabs/CapaHistoryTab.tsx",
      "sections/CapaIdentitySection.tsx",
      "sections/CapaSourceFindingsSection.tsx",
      "sections/CapaCorrectiveActionsSection.tsx",
      "sections/CapaPreventiveActionsSection.tsx",
    ]) expect(existsSync(resolve(__dirname, file))).toBe(true);
    for (const route of [
      "capa/page.tsx",
      "capa/dashboard/page.tsx",
      "capa/new/page.tsx",
      "capa/[capaId]/actions/page.tsx",
      "capa/[capaId]/closure-readiness/page.tsx",
      "findings/[findingId]/create-capa/page.tsx",
    ]) expect(existsSync(resolve(appRoot, route))).toBe(true);
    const sidebar = readFileSync(resolve(root, "apps/web/src/features/audit/AuditSidebar.tsx"), "utf8");
    expect(sidebar).toContain('["/audit-compliance/capa", "CAPA / Action Integration", false]');
  });
});
