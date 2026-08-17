'use client';

export function ManualOverrideDialog({ onSubmit }: { onSubmit: (input: { dueDate: string; reason: string }) => void }) {
  return <button type="button" onClick={() => onSubmit({ dueDate: prompt('Override due date YYYY-MM-DD') ?? '', reason: prompt('Reason') ?? '' })} className="rounded-lg border border-warning/40 px-3 py-2 text-sm font-semibold text-warning">Manual override</button>;
}
