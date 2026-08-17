"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditButton, AuditCard, AuditErrorState } from "../shared/AuditUi";
import { useAuditFindingLookups } from "../hooks/useAuditFindingLookups";
import { useAuditFindingMutations } from "../hooks/useAuditFindingMutations";
import type { AuditFindingDetail } from "../types/audit-finding.types";
import { FindingCapaReadinessSection } from "./sections/FindingCapaReadinessSection";
import { FindingClassificationSection } from "./sections/FindingClassificationSection";
import { FindingEvidenceSection } from "./sections/FindingEvidenceSection";
import { FindingIdentitySection } from "./sections/FindingIdentitySection";
import { FindingOwnershipDueDateSection } from "./sections/FindingOwnershipDueDateSection";
import { FindingScopeSection } from "./sections/FindingScopeSection";
import { FindingSourceSection } from "./sections/FindingSourceSection";
import { FindingStandardModuleSection } from "./sections/FindingStandardModuleSection";

const steps = [
  "Finding Identity",
  "Source Link",
  "Scope",
  "Classification",
  "Standard / Module Mapping",
  "Evidence",
  "Ownership / Due Date",
  "CAPA Readiness Foundation",
  "Review & Save",
];

export function AuditFindingForm({ detail }: { detail?: AuditFindingDetail }) {
  const router = useRouter();
  const context = useAuditFindingLookups();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const initial = useMemo(() => detail ? {
    findingTitle: detail.finding.finding_title,
    findingCode: detail.finding.finding_code,
    findingDescription: detail.finding.finding_description ?? "",
    findingType: detail.finding.finding_type,
    findingStatus: detail.finding.finding_status,
    severity: detail.finding.severity ?? "",
    priority: detail.finding.priority ?? "",
    riskPotential: detail.finding.risk_potential ?? "",
    criticality: detail.finding.criticality,
    safetyCritical: detail.finding.safety_critical,
    regulatoryCritical: detail.finding.regulatory_critical,
    psmCritical: detail.finding.psm_critical,
    immediateConcern: detail.finding.immediate_concern,
    stopWorkRecommended: detail.finding.stop_work_recommended,
    repeatFinding: detail.finding.repeat_finding,
    ownerUserId: detail.finding.owner_user_id ?? "",
    reviewerUserId: detail.finding.reviewer_user_id ?? "",
    dueDate: detail.finding.due_date ?? "",
    dueDateBasis: detail.finding.due_date_basis ?? "",
    capaRequired: detail.finding.capa_required,
  } : { findingType: "Observation", findingStatus: "Draft", criticality: "Medium", sourceType: "Manual Finding" }, [detail]);
  const [form, setFormState] = useState<Record<string, any>>(initial);
  const mutations = useAuditFindingMutations(detail?.finding.id);
  const setForm = (patch: Record<string, any>) => setFormState((current) => ({ ...current, ...patch }));
  const errors = validate(form);
  const save = async () => {
    setMessage(null);
    try {
      const saved = detail ? await mutations.update.mutateAsync(form) : await mutations.create.mutateAsync(form);
      setMessage("Finding saved.");
      router.push(`/audit-compliance/findings/${saved.finding.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save audit finding.");
    }
  };
  if (context.error) return <AuditErrorState message={context.error} onRetry={() => context.refetch()} />;
  const body = [
    <FindingIdentitySection key="identity" form={form} setForm={setForm} />,
    <FindingSourceSection key="source" form={form} setForm={setForm} context={context.data ?? undefined} />,
    <FindingScopeSection key="scope" form={form} setForm={setForm} context={context.data ?? undefined} />,
    <FindingClassificationSection key="classification" form={form} setForm={setForm} />,
    <FindingStandardModuleSection key="standards" form={form} setForm={setForm} context={context.data ?? undefined} />,
    <FindingEvidenceSection key="evidence" form={form} setForm={setForm} />,
    <FindingOwnershipDueDateSection key="ownership" form={form} setForm={setForm} context={context.data ?? undefined} />,
    <FindingCapaReadinessSection key="capa" form={form} setForm={setForm} />,
    <ReviewStep key="review" form={form} errors={errors} />,
  ][step];
  return (
    <div className="space-y-4">
      <AuditCard title="Create / edit finding wizard" subtitle="Each step maps directly to the Phase 5 PDF and saves through the backend formal finding APIs.">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${step === index ? "border-primary bg-primary/10 text-primary" : "border-[var(--psm-line)] text-[var(--psm-muted)]"}`}>{index + 1}. {label}</button>)}
        </div>
      </AuditCard>
      <AuditCard title={steps[step]}>{body}</AuditCard>
      {message ? <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-fg)]">{message}</div> : null}
      <div className="flex flex-wrap justify-between gap-3">
        <AuditButton variant="secondary" disabled={step === 0} title={step === 0 ? "Already on first step" : "Back"} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</AuditButton>
        <div className="flex flex-wrap gap-2">
          <AuditButton variant="secondary" href="/audit-compliance/findings">Cancel</AuditButton>
          {step < steps.length - 1 ? <AuditButton disabled={step === 0 && !form.findingTitle} title={step === 0 && !form.findingTitle ? "Finding title is required before continuing." : "Continue"} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Next</AuditButton> : null}
          <AuditButton disabled={Boolean(errors.length) || mutations.create.isPending || mutations.update.isPending} title={errors[0] ?? "Save finding"} onClick={save}>{mutations.create.isPending || mutations.update.isPending ? "Saving..." : detail ? "Save Changes" : "Create Finding"}</AuditButton>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form, errors }: { form: Record<string, any>; errors: string[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
        <h3 className="font-semibold text-[var(--psm-fg)]">Summary</h3>
        <dl className="mt-3 grid gap-2 text-sm">
          {["findingTitle","sourceType","findingType","severity","criticality","priority","ownerUserId","dueDate","capaRequired"].map((key) => <div key={key} className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">{key}</dt><dd className="text-right text-[var(--psm-fg)]">{String(form[key] ?? "-")}</dd></div>)}
        </dl>
      </div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
        <h3 className="font-semibold text-[var(--psm-fg)]">Missing required data</h3>
        {errors.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-danger">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p className="mt-3 text-sm text-emerald-600">Required create fields are complete. Backend will still enforce source/scope/permission/readiness rules.</p>}
      </div>
    </div>
  );
}

function validate(form: Record<string, any>) {
  const errors: string[] = [];
  if (!form.findingTitle) errors.push("Finding title is required.");
  if ((form.sourceType ?? "Manual Finding") === "Manual Finding" && !form.manualSourceReason && !form.sourceDescription) errors.push("Manual source reason or source description is required.");
  return errors;
}
