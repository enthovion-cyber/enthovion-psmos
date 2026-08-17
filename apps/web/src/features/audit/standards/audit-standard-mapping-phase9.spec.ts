import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiRoot = resolve(root, "apps/api/src/audit-compliance");
const appRoot = resolve(root, "apps/web/src/app/(app)/audit-compliance");
const migration = resolve(root, "supabase/migrations/20260730002000_audit_standard_mapping_phase9.sql");

describe("Audit Regulatory / Standard Mapping Phase 9", () => {
  it("adds standards mapping DB tables, RLS, indexes, and tenant-safe permissions", () => {
    const sql = readFileSync(migration, "utf8");
    for (const table of [
      "audit_standards",
      "audit_standard_clauses",
      "audit_standard_mappings",
      "audit_standard_mapping_links",
      "audit_standard_coverage_records",
      "audit_standard_mapping_gaps",
      "audit_standard_mapping_overrides",
      "audit_standard_traceability_snapshots",
      "audit_standard_mapping_staleness_events",
      "audit_standard_mapping_history_events",
      "audit_standard_mapping_settings",
    ]) expect(sql).toContain(table);
    expect(sql).toContain("enable row level security");
    expect(sql).toContain('for tenant_row in select id from public."Tenant"');
    expect(sql).toContain("audit.standards_mapping.mapping.create");
    expect(sql).toContain("audit.standards_mapping.traceability.view");
  });

  it("registers standards mapping backend services and API routes", () => {
    for (const file of [
      "audit-standard-mapping.service.ts",
      "audit-standard-history.service.ts",
      "audit-standard-dashboard.service.ts",
      "audit-standard-register.service.ts",
      "audit-standard.service.ts",
      "audit-standard-clause.service.ts",
      "audit-standard-coverage.service.ts",
      "audit-standard-gap.service.ts",
      "audit-standard-traceability.service.ts",
      "audit-standard-regulatory-register-adapter.service.ts",
      "audit-standard-scoring-adapter.service.ts",
      "audit-standard-lopa-adapter.service.ts",
    ]) expect(existsSync(resolve(apiRoot, file))).toBe(true);
    const controller = readFileSync(resolve(apiRoot, "audit-compliance.controller.ts"), "utf8");
    for (const route of [
      "standards-mapping/dashboard",
      "standards-mapping/register",
      "standards-mapping/standards",
      "standards-mapping/clauses",
      "standards-mapping/coverage-matrix",
      "standards-mapping/traceability",
      "standards-mapping/gaps",
      "standards-mapping/:mappingId/link",
      "standards-mapping/:mappingId/generate-traceability-snapshot",
      "programs/:programId/standards-mapping",
      "scoring/runs/:runId/standards-mapping",
    ]) expect(controller).toContain(route);
  });

  it("adds PDF-required frontend routes, components, hooks, schemas, and active sidebar entry", () => {
    for (const file of [
      "AuditStandardsDashboardPage.tsx",
      "AuditStandardsSummaryCards.tsx",
      "AuditStandardRegisterPage.tsx",
      "AuditStandardTable.tsx",
      "AuditStandardMobileCards.tsx",
      "AuditStandardFilters.tsx",
      "AuditStandardFormPage.tsx",
      "AuditStandardForm.tsx",
      "AuditClauseRegisterPage.tsx",
      "AuditClauseTable.tsx",
      "AuditClauseFormPage.tsx",
      "AuditClauseForm.tsx",
      "AuditMappingRegisterPage.tsx",
      "AuditMappingTable.tsx",
      "AuditMappingMobileCards.tsx",
      "AuditMappingFilters.tsx",
      "AuditMappingFormPage.tsx",
      "AuditMappingForm.tsx",
      "sections/StandardClauseSelectionSection.tsx",
      "sections/MappingSourceAuditObjectSection.tsx",
      "sections/MappingApplicabilityScopeSection.tsx",
      "sections/MappingModuleSection.tsx",
      "sections/MappingEvidenceSection.tsx",
      "sections/MappingFindingCapaSection.tsx",
      "sections/MappingScoringSection.tsx",
      "sections/MappingCoverageHealthSection.tsx",
      "AuditMappingDetailPage.tsx",
      "AuditMappingDetailHeader.tsx",
      "tabs/MappingOverviewTab.tsx",
      "tabs/MappingSourceTab.tsx",
      "tabs/MappingLinkedRecordsTab.tsx",
      "tabs/MappingCoverageTab.tsx",
      "tabs/MappingEvidenceTab.tsx",
      "tabs/MappingFindingsTab.tsx",
      "tabs/MappingCapaTab.tsx",
      "tabs/MappingScoringTab.tsx",
      "tabs/MappingTraceabilityTab.tsx",
      "tabs/MappingHistoryTab.tsx",
      "AuditCoverageMatrixPage.tsx",
      "AuditCoverageMatrixTable.tsx",
      "AuditStandardTraceabilityPage.tsx",
      "AuditTraceabilityGraph.tsx",
      "AuditMappingGapPage.tsx",
      "AuditMappingGapTable.tsx",
      "AuditMappingGapPanel.tsx",
      "AuditMappingHealthPanel.tsx",
      "AuditMappingRecalculateDialog.tsx",
      "AuditMappingVerifyDialog.tsx",
      "AuditMappingOverrideDialog.tsx",
    ]) expect(existsSync(resolve(__dirname, file))).toBe(true);
    for (const file of [
      "useAuditStandardsDashboard.ts",
      "useAuditStandards.ts",
      "useAuditClauses.ts",
      "useAuditMappings.ts",
      "useAuditMappingDetail.ts",
      "useAuditMappingMutations.ts",
      "useAuditCoverageMatrix.ts",
      "useAuditMappingGaps.ts",
      "useAuditStandardTraceability.ts",
      "useAuditStandardLookups.ts",
    ]) expect(existsSync(resolve(root, "apps/web/src/features/audit/hooks", file))).toBe(true);
    for (const file of [
      "audit-standard.service.ts",
      "audit-clause.service.ts",
      "audit-mapping.service.ts",
      "audit-coverage.service.ts",
      "audit-mapping-gap.service.ts",
    ]) expect(existsSync(resolve(root, "apps/web/src/features/audit/services", file))).toBe(true);
    for (const route of [
      "standards-mapping/page.tsx",
      "standards-mapping/dashboard/page.tsx",
      "standards-mapping/register/page.tsx",
      "standards-mapping/standards/page.tsx",
      "standards-mapping/clauses/page.tsx",
      "standards-mapping/coverage-matrix/page.tsx",
      "standards-mapping/gaps/page.tsx",
      "standards-mapping/traceability/page.tsx",
      "standards-mapping/[mappingId]/overview/page.tsx",
      "standards-mapping/[mappingId]/history/page.tsx",
      "programs/[programId]/standards-mapping/page.tsx",
      "scoring/runs/[runId]/standards-mapping/page.tsx",
    ]) expect(existsSync(resolve(appRoot, route))).toBe(true);
    const sidebar = readFileSync(resolve(root, "apps/web/src/features/audit/AuditSidebar.tsx"), "utf8");
    expect(sidebar).toContain('"Standards / Regulatory Mapping",\n    false');
  });
});
