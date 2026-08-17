export function PmChecklistExecution({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="font-semibold">PM Checklist / Execution Tasks</h2>
      {!rows.length ? <p className="mt-3 text-sm text-[var(--psm-muted)]">No checklist items configured.</p> : (
        <div className="mt-3 space-y-2">{rows.map((row, index) => <div key={String(row.id ?? index)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="font-semibold">{String(row.task_title ?? row.taskTitle ?? row.item_number ?? index + 1)}</div><div className="text-sm text-[var(--psm-muted)]">{String(row.task_instruction ?? row.acceptance_criteria ?? '')}</div></div>)}</div>
      )}
    </section>
  );
}

