import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { auditExecutionEvidenceSchema } from "../schemas/audit-execution-evidence.schema";
import { auditExecutionResponseSchema } from "../schemas/audit-execution-response.schema";
import { auditExecutionStartSchema } from "../schemas/audit-execution.schema";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "../../../..");
const repoRoot = resolve(webRoot, "../..");

describe("Audit execution Phase 4 integration", () => {
  it("keeps PDF-required API routes and history/readiness hooks wired", () => {
    const controller = read("apps/api/src/audit-compliance/audit-compliance.controller.ts");
    for (const route of [
      'execution/dashboard',
      'execution/register',
      'execution/start-from-plan',
      'plans/:planId/start-execution',
      'execution/:executionId/workspace',
      'execution/:executionId/checklist/items/:itemId/response',
      'execution/:executionId/evidence',
      'execution/:executionId/field-notes',
      'execution/:executionId/field-findings',
      'execution/:executionId/interviews',
      'execution/:executionId/walkthroughs',
      'execution/:executionId/readiness/run',
      'execution/:executionId/history',
    ]) {
      expect(controller).toContain(route);
    }
    const service = read("apps/api/src/audit-compliance/audit-execution.service.ts");
    expect(service).toContain("runReadiness");
    expect(service).toContain("saveResponse");
    expect(service).toContain("saveFinding");
    expect(service).toContain("AuditExecutionHistoryService");
  });

  it("keeps PDF-required tables, RLS, and tenant permission seeding in the migration", () => {
    const migration = read("supabase/migrations/20260729220000_audit_execution_field_findings_phase4.sql");
    for (const table of [
      "audit_executions",
      "audit_execution_sections",
      "audit_execution_items",
      "audit_execution_responses",
      "audit_execution_evidence_links",
      "audit_field_notes",
      "audit_field_findings",
      "audit_execution_interviews",
      "audit_execution_walkthroughs",
      "audit_execution_readiness_checks",
      "audit_execution_validation_results",
      "audit_execution_activity_events",
      "audit_execution_history_events",
      "audit_execution_settings",
    ]) {
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("tenantId");
    expect(migration).toContain("siteIds");
    expect(migration).toContain("foreach tenant_id in array(select id from public.\"Tenant\")");
  });

  it("validates execution start, response, and evidence inputs before API mutation", () => {
    expect(auditExecutionStartSchema.safeParse({ executionTitle: "Run", executionCode: "EX-1", executionMode: "Onsite", leadAuditorUserId: "u1", planId: "p1" }).success).toBe(true);
    expect(auditExecutionStartSchema.safeParse({ executionTitle: "Run", executionCode: "EX-1", executionMode: "Onsite", leadAuditorUserId: "u1" }).success).toBe(false);
    expect(auditExecutionResponseSchema.safeParse({ responseStatus: "Answered", complianceResult: "Non-Compliant" }).success).toBe(false);
    expect(auditExecutionEvidenceSchema.safeParse({ evidenceTitle: "Photo", evidenceType: "Storage File", storageFileId: "file1" }).success).toBe(true);
  });

  it("keeps execution frontend route and component structure present", () => {
    for (const path of [
      "apps/web/src/app/(app)/audit-compliance/execution/page.tsx",
      "apps/web/src/app/(app)/audit-compliance/execution/[executionId]/workspace/page.tsx",
      "apps/web/src/features/audit/execution/AuditExecutionDashboardPage.tsx",
      "apps/web/src/features/audit/execution/AuditExecutionRegisterPage.tsx",
      "apps/web/src/features/audit/execution/AuditExecutionStartFromPlanPage.tsx",
      "apps/web/src/features/audit/execution/tabs/ExecutionChecklistTab.tsx",
      "apps/web/src/features/audit/execution/tabs/ExecutionFieldFindingsTab.tsx",
      "apps/web/src/features/audit/execution/workspace/ExecutionResponseForm.tsx",
    ]) {
      expect(read(path).length).toBeGreaterThan(100);
    }
  });
});

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}
