"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditButton, AuditCard } from "../shared/AuditUi";
import { validateAuditReportDraft } from "../schemas/audit-report.schema";
import { useAuditReportMutations } from "../hooks/useAuditReportMutations";
import { useAuditReportTemplates } from "../hooks/useAuditReportTemplates";
import { ReportApprovalAccessSection } from "./sections/ReportApprovalAccessSection";
import { ReportEvidencePackageSection } from "./sections/ReportEvidencePackageSection";
import { ReportFormatExportSection } from "./sections/ReportFormatExportSection";
import { ReportIdentitySection } from "./sections/ReportIdentitySection";
import { ReportSectionsIncludedSection } from "./sections/ReportSectionsIncludedSection";
import { ReportSourceSelectionSection } from "./sections/ReportSourceSelectionSection";
import { ReportTypeTemplateSection } from "./sections/ReportTypeTemplateSection";
import { ReportValidationReadinessSection } from "./sections/ReportValidationReadinessSection";

export function AuditReportGenerateWizard() {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, unknown>>({ sourceModule: "program", reportType: "Program Summary", formats: ["PDF"], approvalRequired: true });
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const templates = useAuditReportTemplates();
  const mutations = useAuditReportMutations();
  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));
  const missing = validateAuditReportDraft(draft);
  const disabledReason = missing.length ? `Missing required fields: ${missing.join(", ")}` : "";
  const generatePreview = () => mutations.preview.mutate(draft, { onSuccess: (data) => { setPreview(data); setError(""); }, onError: (err) => setError((err as Error).message) });
  const generate = () => mutations.generate.mutate(draft, { onSuccess: (data) => router.push(`/audit-compliance/reports/${data.report.id}`), onError: (err) => setError((err as Error).message) });
  return <div className="space-y-5">
    <AuditCard title="Report Identity"><ReportIdentitySection value={draft} set={set} /></AuditCard>
    <AuditCard title="Source Selection"><ReportSourceSelectionSection value={draft} set={set} /></AuditCard>
    <AuditCard title="Type / Template"><ReportTypeTemplateSection value={draft} set={set} templates={templates.data?.rows ?? []} /></AuditCard>
    <AuditCard title="Sections Included"><ReportSectionsIncludedSection value={draft} set={set} /></AuditCard>
    <AuditCard title="Evidence Package"><ReportEvidencePackageSection value={draft} set={set} /></AuditCard>
    <AuditCard title="Format / Export"><ReportFormatExportSection value={draft} set={set} /></AuditCard>
    <AuditCard title="Approval / Access"><ReportApprovalAccessSection value={draft} set={set} /></AuditCard>
    <AuditCard title="Validation / Readiness Preview"><ReportValidationReadinessSection preview={preview} /></AuditCard>
    {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
    <div className="flex flex-wrap justify-end gap-2"><AuditButton variant="secondary" onClick={generatePreview} disabled={Boolean(disabledReason) || mutations.preview.isPending} title={disabledReason || "Generate backend preview"}>{mutations.preview.isPending ? "Generating preview..." : "Generate Preview"}</AuditButton><AuditButton onClick={generate} disabled={Boolean(disabledReason) || mutations.generate.isPending} title={disabledReason || "Create report and run backend generation"}>{mutations.generate.isPending ? "Generating..." : "Create + Generate"}</AuditButton></div>
  </div>;
}
