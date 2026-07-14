export function HazopAttachmentTypeBadge({ type, mime }: { type?: string; mime?: string }) {
  const label = type || (mime?.split('/').pop() ?? 'file');
  const color = mime?.startsWith('image/') ? 'border-cyan-400/30 bg-cyan-500/15 text-cyan-200' : mime?.includes('pdf') ? 'border-red-400/30 bg-red-500/15 text-red-200' : 'border-slate-400/30 bg-slate-500/15 text-slate-200';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${color}`}>{label}</span>;
}
