"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditReportGenerateWizard } from "./AuditReportGenerateWizard";
export function AuditReportGeneratePage() {
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Generate Audit Report" subtitle="Create a backend-controlled audit report from real source records, immutable source snapshots, selected sections, evidence package settings, approval/access rules, and export formats." actionHref="/audit-compliance/reports" actionLabel="Reports" /><AuditReportGenerateWizard /></div></AuditLayout>;
}
