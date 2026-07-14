export function IplBadge({ value, kind = 'status' }: { value: string | null | undefined; kind?: 'status' | 'risk' }) {
  const text = value || 'Not Started';
  const lower = text.toLowerCase();
  const tone = lower.includes('credit') || lower.includes('pass') || lower.includes('complete') || lower.includes('validated')
    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
    : lower.includes('fail') || lower.includes('reject') || lower.includes('missing') || lower.includes('blocked')
      ? 'border-red-400/30 bg-red-500/10 text-red-200'
      : lower.includes('review') || lower.includes('warning') || lower.includes('progress')
        ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
        : kind === 'risk'
          ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200'
          : 'border-slate-400/25 bg-slate-500/10 text-slate-200';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-black uppercase ${tone}`}>{text}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-cyan-300/15 bg-[#03101d] p-5 text-sm text-slate-400">{text}</div>;
}
