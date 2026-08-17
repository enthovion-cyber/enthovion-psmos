"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditLayout } from "../AuditLayout";
import {
  AuditButton,
  AuditCard,
  AuditErrorState,
  AuditLoadingState,
  Field,
  inputClass,
} from "../shared/AuditUi";
import { useAuditChecklistLookups } from "../hooks/useAuditChecklistLookups";
import { useAuditChecklists } from "../hooks/useAuditChecklists";
import { auditChecklistService } from "../services/audit-checklist.service";

export function AuditChecklistAssignToPlanPage({ planId }: { planId: string }) {
  const router = useRouter();
  const context = useAuditChecklistLookups();
  const list = useAuditChecklists({ page: 1, limit: 250 });
  const [form, setForm] = useState<Record<string, any>>({
    primaryChecklist: true,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (context.isLoading || list.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (context.error || list.error || !context.data || !list.data)
    return (
      <AuditLayout>
        <AuditErrorState message={context.error ?? list.error} />
      </AuditLayout>
    );
  const plan = context.data.plans.find((item) => item.id === planId);
  const assign = async () => {
    try {
      setBusy(true);
      setError("");
      await auditChecklistService.assign(planId, form);
      router.push(`/audit-compliance/plans/${planId}/checklist`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assignment failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuditLayout>
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">Assign Checklist to Audit Plan</h1>
        <AuditCard
          title={plan ? `${plan.plan_code} · ${plan.plan_title}` : "Audit Plan"}
        >
          {error ? <p className="mb-3 text-danger">{error}</p> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Checklist template">
              <select
                className={inputClass()}
                value={form.checklistId ?? ""}
                onChange={(event) =>
                  setForm({ ...form, checklistId: event.target.value })
                }
              >
                <option value="">Select approved/current checklist</option>
                {list.data.rows.map((checklist) => (
                  <option key={checklist.id} value={checklist.id}>
                    {checklist.checklist_code} · {checklist.checklist_title} · v
                    {checklist.version}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assignment reason">
              <textarea
                className={inputClass()}
                value={form.assignmentReason ?? ""}
                onChange={(event) =>
                  setForm({ ...form, assignmentReason: event.target.value })
                }
              />
            </Field>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.primaryChecklist}
                onChange={(event) =>
                  setForm({
                    ...form,
                    primaryChecklist: event.target.checked,
                    supplementalChecklist: !event.target.checked,
                  })
                }
              />
              Primary checklist
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(form.supplementalChecklist)}
                onChange={(event) =>
                  setForm({
                    ...form,
                    supplementalChecklist: event.target.checked,
                    primaryChecklist: !event.target.checked,
                  })
                }
              />
              Supplemental checklist
            </label>
          </div>
          <div className="mt-5">
            <AuditButton
              disabled={busy || !form.checklistId}
              title={
                !form.checklistId ? "Select a checklist." : "Assign checklist"
              }
              onClick={assign}
            >
              {busy ? "Assigning..." : "Assign Checklist"}
            </AuditButton>
          </div>
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
