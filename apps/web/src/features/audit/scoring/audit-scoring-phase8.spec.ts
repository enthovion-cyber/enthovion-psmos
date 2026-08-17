import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiRoot = resolve(root, "apps/api/src/audit-compliance");
const appRoot = resolve(root, "apps/web/src/app/(app)/audit-compliance");
const migration = resolve(root, "supabase/migrations/20260730001000_audit_compliance_scoring_phase8.sql");

describe("Audit Compliance Scoring Phase 8", () => {
  it("adds scoring DB tables, indexes, RLS, and tenant-safe permissions", () => {
    const sql = readFileSync(migration, "utf8");
    for (const table of [
      "audit_scoring_models",
      "audit_scoring_rules",
      "audit_score_runs",
      "audit_score_components",
      "audit_score_rule_results",
      "audit_score_input_records",
      "audit_score_adjustments",
      "audit_score_verification_records",
      "audit_score_staleness_events",
      "audit_score_snapshots",
      "audit_score_history_events",
      "audit_scoring_settings",
    ]) expect(sql).toContain(table);
    expect(sql).toContain("enable row level security");
    expect(sql).toContain('"tenantId"');
    expect(sql).toContain("audit.scoring.run.create");
    expect(sql).toContain("audit.scoring.traceability.view");
  });

  it("registers scoring backend services, APIs, source routes, and lookups", () => {
    for (const file of [
      "audit-scoring.service.ts",
      "audit-scoring-history.service.ts",
      "audit-scoring-dashboard.service.ts",
      "audit-score-register.service.ts",
      "audit-score-run.service.ts",
      "audit-score-calculation.service.ts",
      "audit-score-evidence-evaluator.service.ts",
      "audit-score-finding-evaluator.service.ts",
      "audit-score-capa-evaluator.service.ts",
      "audit-score-explainability.service.ts",
      "audit-score-traceability.service.ts",
      "audit-score-adjustment.service.ts",
      "audit-scoring-model.service.ts",
      "audit-scoring-rule.service.ts",
      "audit-scoring-tenant-scope.service.ts",
      "audit-scoring-evidence-adapter.service.ts",
      "audit-scoring-psi-adapter.service.ts",
    ]) expect(existsSync(resolve(apiRoot, file))).toBe(true);
    const controller = readFileSync(resolve(apiRoot, "audit-compliance.controller.ts"), "utf8");
    for (const route of [
      "scoring/dashboard",
      "scoring/register",
      "scoring/runs",
      "scoring/runs/:runId/explainability",
      "scoring/runs/:runId/traceability",
      "scoring/models/:modelId/rules",
      "scoring/runs/:runId/adjustments",
      "programs/:programId/scoring/run",
      "execution/:executionId/scoring/run",
      "findings/:findingId/scoring-impact",
      "evidence/:evidenceId/scoring-impact",
      "lookups/score-adjustment-types",
    ]) expect(controller).toContain(route);
  });

  it("adds PDF-required scoring frontend routes, components, hooks, schemas, and active sidebar entry", () => {
    for (const file of [
      "AuditScoringDashboardPage.tsx",
      "AuditScoringSummaryCards.tsx",
      "AuditScoreRegisterPage.tsx",
      "AuditScoreTable.tsx",
      "AuditScoreMobileCards.tsx",
      "AuditScoreFilters.tsx",
      "AuditScoringModelRegistryPage.tsx",
      "AuditScoringModelFormPage.tsx",
      "AuditScoringRuleBuilder.tsx",
      "AuditScoringRuleTable.tsx",
      "AuditScoreRunFormPage.tsx",
      "AuditScoreRunDetailPage.tsx",
      "tabs/ScoreInputSnapshotTab.tsx",
      "tabs/ScoreResultsTab.tsx",
      "tabs/ScoreExplainabilityTab.tsx",
      "tabs/ScoreTraceabilityTab.tsx",
      "AuditScoreCriticalBlockersPanel.tsx",
      "AuditScoreEvidenceImpactPanel.tsx",
      "AuditScoreFindingImpactPanel.tsx",
      "AuditScoreCapaImpactPanel.tsx",
    ]) expect(existsSync(resolve(__dirname, file))).toBe(true);
    for (const file of [
      "useAuditScoringDashboard.ts",
      "useAuditScores.ts",
      "useAuditScoreRunDetail.ts",
      "useAuditScoreRunMutations.ts",
      "useAuditScoringModels.ts",
      "useAuditScoringRules.ts",
      "useAuditScoreExplainability.ts",
      "useAuditScoreTraceability.ts",
      "useAuditScoreAdjustments.ts",
      "useAuditScoringLookups.ts",
    ]) expect(existsSync(resolve(root, "apps/web/src/features/audit/hooks", file))).toBe(true);
    for (const route of [
      "scoring/page.tsx",
      "scoring/dashboard/page.tsx",
      "scoring/register/page.tsx",
      "scoring/models/page.tsx",
      "scoring/models/new/page.tsx",
      "scoring/runs/new/page.tsx",
      "scoring/runs/[runId]/input-snapshot/page.tsx",
      "scoring/runs/[runId]/explainability/page.tsx",
      "scoring/stale/page.tsx",
      "programs/[programId]/scoring/page.tsx",
      "plans/[planId]/scoring/page.tsx",
      "execution/[executionId]/scoring/page.tsx",
      "findings/[findingId]/scoring-impact/page.tsx",
      "capa/[capaId]/scoring-impact/page.tsx",
      "evidence/[evidenceId]/scoring-impact/page.tsx",
    ]) expect(existsSync(resolve(appRoot, route))).toBe(true);
    const sidebar = readFileSync(resolve(root, "apps/web/src/features/audit/AuditSidebar.tsx"), "utf8");
    expect(sidebar).toContain('["/audit-compliance/scoring", "Compliance Scoring", false]');
  });
});
