"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { HazopNodeListItem } from "../../types/hazop-node.types";
import type { HazopScenarioRow } from "../../types/hazop-scenario.types";

export function AddRecommendationFromScenarioDialog({
  scenario,
  node,
  users,
  saving,
  onClose,
  onSubmit,
}: {
  scenario: HazopScenarioRow;
  node?: HazopNodeListItem;
  users: any[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({
    scenarioId: scenario.id,
    nodeId: scenario.node_id,
    sourceType: "Scenario",
    title: scenario.deviation_text ? `Recommendation for ${scenario.deviation_text}` : "HAZOP recommendation",
    recommendationText: "",
    description: "",
    priority: ["High", "Critical"].includes(String(scenario.risk_level)) ? "High" : "Medium",
    ownerId: "",
    dueDate: "",
    verificationRequired: true,
    evidenceRequired: ["High", "Critical"].includes(String(scenario.risk_level)),
    closureBlocker: true,
    createActionNow: true,
    notes: "",
  });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const error = !form.recommendationText && !form.description ? "Recommendation text is required" : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--psm-line)] p-4">
          <div>
            <h3 className="text-lg font-semibold">Add Recommendation From Scenario</h3>
            <p className="text-sm text-[var(--psm-muted)]">{node?.node_number ?? "Node"} · {scenario.scenario_number ?? scenario.deviation_text}</p>
          </div>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <Field label="Source scenario"><input className="input" value={`${scenario.scenario_number ?? scenario.id} · ${scenario.deviation_text ?? ""}`} disabled /></Field>
          <Field label="Priority"><select className="input" value={form.priority} onChange={(event) => set("priority", event.target.value)}>{["Low", "Medium", "High", "Safety Critical"].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Recommendation title"><input className="input" value={form.title} onChange={(event) => set("title", event.target.value)} /></Field>
          <Field label="Owner"><select className="input" value={form.ownerId} onChange={(event) => set("ownerId", event.target.value)}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName ?? user.email}</option>)}</select></Field>
          <Field label="Due date"><input type="date" className="input" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Check label="Verification required" checked={form.verificationRequired} onChange={(value) => set("verificationRequired", value)} />
            <Check label="Evidence required" checked={form.evidenceRequired} onChange={(value) => set("evidenceRequired", value)} />
            <Check label="Closure blocker" checked={form.closureBlocker} onChange={(value) => set("closureBlocker", value)} />
            <Check label="Create Universal Action now" checked={form.createActionNow} onChange={(value) => set("createActionNow", value)} />
          </div>
          <Field label="Recommendation text" className="md:col-span-2"><textarea className="input min-h-24" value={form.recommendationText} onChange={(event) => set("recommendationText", event.target.value)} /></Field>
          <Field label="Notes" className="md:col-span-2"><textarea className="input min-h-20" value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field>
          {error ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200 md:col-span-2">{error}</div> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="button" disabled={Boolean(error) || saving} onClick={() => onSubmit({ ...form, actionCreationMode: form.createActionNow ? "create" : undefined })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Recommendation"}</button>
          <button type="button" disabled={Boolean(error) || saving} onClick={() => onSubmit({ ...form, createActionNow: true, actionCreationMode: "create" })} className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">{saving ? "Saving..." : "Save + Create Action"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={className}><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-2 text-xs"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
