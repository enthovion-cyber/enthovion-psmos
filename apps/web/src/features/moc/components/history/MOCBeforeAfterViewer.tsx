'use client';

export function MOCBeforeAfterViewer({ beforeValue, afterValue }: { beforeValue: any; afterValue: any }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Diff title="Before" value={beforeValue} />
      <Diff title="After" value={afterValue} />
    </div>
  );
}

function Diff({ title, value }: { title: string; value: any }) {
  return (
    <pre className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-slate-950/65 p-3 text-xs leading-relaxed text-slate-400">
      <strong className="text-slate-100">{title}</strong>
      {'\n'}
      {value ? JSON.stringify(value, null, 2) : '-'}
    </pre>
  );
}
