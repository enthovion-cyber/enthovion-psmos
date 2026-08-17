export function ExportFormatBadge({ format }: { format?: string | null | undefined }) {
  return <span className="inline-flex rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-fg)]">{format ?? 'PDF'}</span>;
}
