"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditButton, AuditCard, AuditErrorState } from "../shared/AuditUi";
import { useAuditCapaLookups } from "../hooks/useAuditCapaLookups";
import { useAuditCapaMutations } from "../hooks/useAuditCapaMutations";
import type { AuditCapaDetail } from "../types/audit-capa.types";
import { validateAuditCapa } from "../schemas/audit-capa.schema";
import { CapaCauseFoundationSection } from "./sections/CapaCauseFoundationSection";
import { CapaContainmentSection } from "./sections/CapaContainmentSection";
import { CapaCorrectiveActionsSection } from "./sections/CapaCorrectiveActionsSection";
import { CapaEffectivenessSection } from "./sections/CapaEffectivenessSection";
import { CapaIdentitySection } from "./sections/CapaIdentitySection";
import { CapaOwnershipDueDateSection } from "./sections/CapaOwnershipDueDateSection";
import { CapaPreventiveActionsSection } from "./sections/CapaPreventiveActionsSection";
import { CapaSourceFindingsSection } from "./sections/CapaSourceFindingsSection";
import { CapaVerificationRulesSection } from "./sections/CapaVerificationRulesSection";

const steps = ["CAPA Identity","Source Finding(s)","Root / Cause Foundation","Immediate Containment","Corrective Actions","Preventive Actions","Verification Rules","Effectiveness Check","Ownership / Due Dates","Review & Save"];

export function AuditCapaForm({ detail, findingId }: { detail?: AuditCapaDetail | undefined; findingId?: string | undefined }) {
  const router = useRouter();
  const context = useAuditCapaLookups();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const initial = useMemo(() => detail ? {
    capaTitle: detail.capa.capa_title,
    capaCode: detail.capa.capa_code,
    capaDescription: detail.capa.capa_description ?? "",
    capaCategory: detail.capa.capa_category,
    capaStatus: detail.capa.capa_status,
    criticality: detail.capa.criticality,
    priority: detail.capa.priority ?? "Medium",
    primaryFindingId: detail.capa.primary_finding_id ?? "",
    suspectedCause: detail.capa.suspected_cause ?? "",
    causeCategory: detail.capa.cause_category ?? "",
    systemWeakness: detail.capa.system_weakness ?? "",
    rcaRequired: detail.capa.rca_required,
    rcaMethod: detail.capa.rca_method ?? "",
    capaOwnerUserId: detail.capa.capa_owner_user_id ?? "",
    reviewerUserId: detail.capa.reviewer_user_id ?? "",
    escalationOwnerUserId: detail.capa.escalation_owner_user_id ?? "",
    overallDueDate: detail.capa.overall_due_date ?? "",
    correctiveActions: detail.actions.filter((a) => a.action_type === "Corrective Action").map(toActionForm),
    preventiveActions: detail.actions.filter((a) => a.action_type === "Preventive Action" || a.action_type === "Systemic Action").map(toActionForm),
    containment: detail.containment[0] ? toContainmentForm(detail.containment[0]) : {},
    verification: detail.verification[0] ?? {},
    effectiveness: detail.effectiveness[0] ?? {},
  } : {
    primaryFindingId: findingId ?? "",
    capaCategory: "Audit Finding CAPA",
    capaStatus: "Draft",
    criticality: "Medium",
    priority: "Medium",
    correctiveActions: [],
    preventiveActions: [],
    containment: {},
    verification: { verificationRequired: true, verificationMethod: "Document Review" },
    effectiveness: { effectivenessRequired: false },
  }, [detail, findingId]);
  const [form, setFormState] = useState<Record<string, any>>(initial);
  const mutations = useAuditCapaMutations(detail?.capa.id);
  const setForm = (patch: Record<string, any>) => setFormState((current) => ({ ...current, ...patch }));
  const errors = validateAuditCapa(form);
  const save = async (open = false) => {
    setMessage(null);
    try {
      const payload = { ...form, capaStatus: open ? "Open" : form.capaStatus };
      const saved = detail ? await mutations.update.mutateAsync(payload) : form.primaryFindingId ? await mutations.createFromFinding.mutateAsync({ findingId: form.primaryFindingId, payload }) : await mutations.create.mutateAsync(payload);
      setMessage(open ? "CAPA saved and opened." : "CAPA draft saved.");
      router.push(`/audit-compliance/capa/${saved.capa.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save CAPA.");
    }
  };
  if (context.error) return <AuditErrorState message={context.error} onRetry={() => context.refetch()} />;
  const ctx = context.data ?? undefined;
  const section = [
    <CapaIdentitySection key="identity" form={form} setForm={setForm} context={ctx} />,
    <CapaSourceFindingsSection key="source" form={form} setForm={setForm} context={ctx} />,
    <CapaCauseFoundationSection key="cause" form={form} setForm={setForm} context={ctx} />,
    <CapaContainmentSection key="containment" form={form} setForm={setForm} context={ctx} />,
    <CapaCorrectiveActionsSection key="corrective" form={form} setForm={setForm} context={ctx} />,
    <CapaPreventiveActionsSection key="preventive" form={form} setForm={setForm} context={ctx} />,
    <CapaVerificationRulesSection key="verification" form={form} setForm={setForm} context={ctx} />,
    <CapaEffectivenessSection key="effectiveness" form={form} setForm={setForm} context={ctx} />,
    <CapaOwnershipDueDateSection key="ownership" form={form} setForm={setForm} context={ctx} />,
    <ReviewStep key="review" form={form} errors={errors} />,
  ][step];
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.createFromFinding.isPending || mutations.transition.isPending;
  return (
    <div className="space-y-4">
      <AuditCard title="CAPA create/edit wizard" subtitle="Draft can save partial data. Open CAPA and action creation are still validated by backend scope, permissions, source-finding, owner, due-date, and readiness rules.">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${step === index ? "border-primary bg-primary/10 text-primary" : "border-[var(--psm-line)] text-[var(--psm-muted)]"}`}>{index + 1}. {label}</button>)}
        </div>
      </AuditCard>
      <AuditCard title={steps[step]}>{section}</AuditCard>
      {message ? <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-fg)]">{message}</div> : null}
      <div className="flex flex-wrap justify-between gap-3">
        <AuditButton variant="secondary" disabled={step === 0} title={step === 0 ? "Already on first step" : "Back"} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</AuditButton>
        <div className="flex flex-wrap gap-2">
          <AuditButton variant="secondary" href="/audit-compliance/capa">Cancel</AuditButton>
          {step < steps.length - 1 ? <AuditButton disabled={step === 0 && !form.capaTitle} title={step === 0 && !form.capaTitle ? "CAPA title is required before continuing." : "Continue"} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Next</AuditButton> : null}
          <AuditButton disabled={busy || !form.capaTitle} title={!form.capaTitle ? "CAPA title is required." : "Save draft"} onClick={() => save(false)}>{busy ? "Saving..." : "Save Draft"}</AuditButton>
          <AuditButton disabled={busy || Boolean(errors.length)} title={errors[0] ?? "Open CAPA"} onClick={() => save(true)}>{busy ? "Saving..." : "Open CAPA"}</AuditButton>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form, errors }: { form: Record<string, any>; errors: string[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">Review summary</h3><dl className="mt-3 grid gap-2 text-sm">{["capaTitle","primaryFindingId","capaCategory","criticality","priority","capaOwnerUserId","overallDueDate"].map((key) => <div key={key} className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">{key}</dt><dd className="text-right text-[var(--psm-fg)]">{String(form[key] ?? "-")}</dd></div>)}</dl></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><h3 className="font-semibold text-[var(--psm-fg)]">Missing required data</h3>{errors.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-danger">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p className="mt-3 text-sm text-emerald-600">Required open fields are complete. Backend will still enforce source scope, action owner/due date, Action Engine mapping, and closure readiness rules.</p>}</div>
    </div>
  );
}

function toActionForm(row: Record<string, any>) {
  return { actionTitle: row.action_title, actionDescription: row.action_description, actionType: row.action_type, ownerUserId: row.owner_user_id, dueDate: row.due_date, priority: row.priority, evidenceRequired: row.evidence_required, verificationRequired: row.verification_required, effectivenessRequired: row.effectiveness_required, completionCriteria: row.completion_criteria, linkedModule: row.linked_module };
}

function toContainmentForm(row: Record<string, any>) {
  return { containmentRequired: row.containment_required, containmentDescription: row.containment_description, containmentOwnerUserId: row.containment_owner_user_id, containmentDueDate: row.containment_due_date, evidenceRequired: row.evidence_required, stopWorkRecommendation: row.stop_work_recommendation, interimControlDescription: row.interim_control_description };
}
