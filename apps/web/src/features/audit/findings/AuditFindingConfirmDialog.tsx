"use client";
import { useState } from "react";
import { AuditButton, Field, inputClass } from "../shared/AuditUi";

export function AuditFindingConfirmDialog({ onConfirm, disabledReason }: { onConfirm: (payload: Record<string, unknown>) => void; disabledReason?: string }) {
  return <AuditButton disabled={Boolean(disabledReason)} title={disabledReason ?? "Confirm finding"} onClick={() => onConfirm({})}>Confirm</AuditButton>;
}

export function ReasonAction({ label, action, onSubmit, disabledReason, danger }: { label: string; action: string; onSubmit: (action: string, payload: Record<string, unknown>) => void; disabledReason?: string; danger?: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <Field label={`${label} reason`}><textarea className={inputClass()} value={reason} onChange={(event) => setReason(event.target.value)} rows={2} /></Field>
      <div className="mt-2"><AuditButton variant={danger ? "danger" : "secondary"} disabled={Boolean(disabledReason) || !reason} title={disabledReason ?? (!reason ? `${label} requires reason.` : label)} onClick={() => onSubmit(action, { reason })}>{label}</AuditButton></div>
    </div>
  );
}
