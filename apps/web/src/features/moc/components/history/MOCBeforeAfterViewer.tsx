'use client';

export function MOCBeforeAfterViewer({ beforeValue, afterValue }: { beforeValue: any; afterValue: any }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Diff title="Before" value={beforeValue} />
      <Diff title="After" value={afterValue} />
    </div>
  );
}

function Diff({ title, value }: { title: string; value: any }) {
  return (
    <pre className="max-h-56 overflow-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 text-xs font-mono leading-relaxed text-[var(--psm-muted)]">
      <strong className="block text-xs font-black uppercase tracking-wider text-[var(--psm-fg)] mb-1">{title}</strong>
      {value ? JSON.stringify(value, null, 2) : '-'}
    </pre>
  );
}
