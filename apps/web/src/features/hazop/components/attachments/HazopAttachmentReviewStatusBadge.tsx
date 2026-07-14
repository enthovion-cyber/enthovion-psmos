export function HazopAttachmentReviewStatusBadge({ value }: { value?: string }) {
  const status = value ?? 'Not Required';
  const color = status === 'Approved' || status === 'Not Required' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200' : status === 'Rejected' || status === 'Deleted' ? 'border-red-400/30 bg-red-500/15 text-red-200' : 'border-amber-400/30 bg-amber-500/15 text-amber-200';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>{status}</span>;
}
