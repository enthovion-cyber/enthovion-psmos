"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditReportTemplateForm } from "./AuditReportTemplateForm";
export function AuditReportTemplateFormPage({ edit }: { edit?: boolean }) {
  const params = useParams<{ templateId?: string }>();
  return <AuditLayout><div className="space-y-5"><AuditHeader title={edit ? "Edit Audit Report Template" : "New Audit Report Template"} subtitle="Create or update backend templates with section schema, redaction rules, formats, and approval status." actionHref="/audit-compliance/reports/templates" actionLabel="Templates" /><AuditReportTemplateForm templateId={params.templateId} /></div></AuditLayout>;
}
