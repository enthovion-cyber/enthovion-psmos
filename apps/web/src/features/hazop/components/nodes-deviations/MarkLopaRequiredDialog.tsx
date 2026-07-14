"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function MarkLopaRequiredDialog({
  scenario,
  saving,
  onClose,
  onSubmit,
}: {
  scenario: any;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({
    reason: scenario.lopa_trigger_reason ?? "",
    source: "High/Critical Risk",
    requiredBy: "",
    dueDate: "",
    notes: "",
    confirmed: false,
  });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const errors = [
    !form.reason || form.reason.length < 5 ? "LOPA trigger reason is required." : null,
    !form.confirmed ? "Confirmation is required." : null,
  ].filter(Boolean);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section className="w-full max-w-3xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
          <div>
            <h2 className="text-lg font-semibold">Mark LOPA Required</h2>
            <p className="text-sm text-[var(--psm-muted)]">{scenario.scenario_number ?? scenario.id} · {scenario.deviation_text ?? "Scenario"}</p>
          </div>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <label><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">Trigger source</span><select className="input" value={form.source} onChange={(event) => set("source", event.target.value)}>{["High/Critical Risk", "IPL Validation Failure", "Safeguard Gap", "Team Decision", "Regulatory Requirement", "MOC Requirement", "PSSR Requirement", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">Required by</span><input className="input" value={form.requiredBy} onChange={(event) => set("requiredBy", event.target.value)} /></label>
          <label><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">Due date</span><input type="date" className="input" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></label>
          <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">LOPA trigger reason *</span><textarea className="input min-h-28" value={form.reason} onChange={(event) => set("reason", event.target.value)} /></label>
          <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">Notes</span><textarea className="input min-h-20" value={form.notes} onChange={(event) => set("notes", event.target.value)} /></label>
          <label className="flex items-start gap-3 rounded-lg border border-purple-400/25 bg-purple-500/10 p-3 text-sm text-purple-100 md:col-span-2"><input type="checkbox" checked={form.confirmed} onChange={(event) => set("confirmed", event.target.checked)} />I confirm this scenario requires LOPA review.</label>
          {errors.length ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200 md:col-span-2">{errors.join(" ")}</div> : null}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="button" disabled={Boolean(errors.length) || saving} onClick={() => onSubmit(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </footer>
      </section>
    </div>
  );
}
