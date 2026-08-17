"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState, Field, formatAuditError, inputClass } from "../shared/AuditUi";
import { useAuditExecutionLookups } from "../hooks/useAuditExecutionLookups";
import { useAuditExecutionMutations } from "../hooks/useAuditExecutionMutations";

export function AuditExecutionStartFromPlanPage({ planId }: { planId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const effectivePlanId = planId ?? params.get("planId") ?? "";
  const lookups = useAuditExecutionLookups();
  const mutations = useAuditExecutionMutations();
  const [form, setForm] = useState<Record<string, string>>({ planId: effectivePlanId, executionMode: "Onsite" });
  const selectedPlan = useMemo(() => lookups.data?.plans?.find((plan: any) => plan.id === form.planId), [lookups.data?.plans, form.planId]);
  const selectedChecklist = useMemo(() => lookups.data?.checklists?.find((item: any) => item.id === form.checklistId), [lookups.data?.checklists, form.checklistId]);
  if (lookups.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (lookups.error || !lookups.data) return <AuditLayout><AuditErrorState message={lookups.error} onRetry={() => lookups.refetch()} /></AuditLayout>;
  const disabledReason = !form.executionTitle ? "Execution title is required." : !form.executionCode ? "Execution code is required." : !form.executionMode ? "Execution mode is required." : !form.leadAuditorUserId ? "Lead auditor is required." : !form.planId && !form.checklistId ? "Select an approved plan or checklist." : "";
  const submit = () => {
    if (disabledReason) return;
    const payload = { ...form, siteId: form.siteId || selectedPlan?.site_id };
    const request = form.planId ? mutations.startFromPlan.mutateAsync({ planId: form.planId, payload }) : mutations.create.mutateAsync(payload);
    request.then((detail) => router.push(`/audit-compliance/execution/${detail.execution.id}/workspace`)).catch(() => null);
  };
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Start Audit Execution" subtitle="Start from an approved audit plan/checklist with immutable plan, checklist, scope, and team snapshots." actionHref="/audit-compliance/execution" />
        <AuditCard title="Execution source" subtitle="Real backend plan and checklist options only. If plan policy blocks standalone execution, the backend will reject standalone starts.">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Approved plan"><select className={inputClass()} value={form.planId ?? ""} onChange={(event) => set("planId", event.target.value)}><option value="">Standalone / checklist only</option>{lookups.data.plans?.map((plan: any) => <option key={plan.id} value={plan.id}>{plan.plan_code} - {plan.plan_title}</option>)}</select></Field>
            <Field label="Checklist"><select className={inputClass()} value={form.checklistId ?? selectedPlan?.checklist_id ?? ""} onChange={(event) => set("checklistId", event.target.value)} disabled={Boolean(form.planId)} title={form.planId ? "Plan checklist is selected by the approved plan assignment." : undefined}><option value="">Select checklist</option>{lookups.data.checklists?.map((checklist: any) => <option key={checklist.id} value={checklist.id}>{checklist.checklist_code} - {checklist.checklist_title}</option>)}</select></Field>
            <Field label="Execution code"><input className={inputClass()} value={form.executionCode ?? ""} onChange={(event) => set("executionCode", event.target.value)} placeholder="AUD-EXEC-2026-000001" /></Field>
            <Field label="Execution title"><input className={inputClass()} value={form.executionTitle ?? selectedPlan?.plan_title ?? selectedChecklist?.checklist_title ?? ""} onChange={(event) => set("executionTitle", event.target.value)} placeholder="Field execution title" /></Field>
            <Field label="Mode"><select className={inputClass()} value={form.executionMode ?? ""} onChange={(event) => set("executionMode", event.target.value)}>{lookups.data.lookups?.executionModes?.map((mode: string) => <option key={mode}>{mode}</option>)}</select></Field>
            <Field label="Lead auditor"><select className={inputClass()} value={form.leadAuditorUserId ?? selectedPlan?.lead_auditor_user_id ?? ""} onChange={(event) => set("leadAuditorUserId", event.target.value)}><option value="">Select lead auditor</option>{lookups.data.users?.map((user: any) => <option key={user.id} value={user.id}>{user.name ?? user.email} - {user.email}</option>)}</select></Field>
            <Field label="Site"><select className={inputClass()} value={form.siteId ?? selectedPlan?.site_id ?? ""} onChange={(event) => set("siteId", event.target.value)} disabled={Boolean(form.planId)}><option value="">Company-wide / plan site</option>{lookups.data.sites?.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></Field>
          </div>
          {disabledReason ? <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">{disabledReason}</p> : null}
          {mutations.startFromPlan.error || mutations.create.error ? <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{formatAuditError(mutations.startFromPlan.error ?? mutations.create.error)}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2"><AuditButton onClick={submit} disabled={Boolean(disabledReason) || mutations.startFromPlan.isPending || mutations.create.isPending} title={disabledReason || "Start execution"}>{mutations.startFromPlan.isPending || mutations.create.isPending ? "Starting..." : "Start Execution"}</AuditButton><AuditButton href="/audit-compliance/execution" variant="secondary">Cancel</AuditButton></div>
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
