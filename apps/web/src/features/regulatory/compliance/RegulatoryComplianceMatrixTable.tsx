export function RegulatoryComplianceMatrixTable({ rows, columns }: { rows?: Array<Record<string, unknown>> | undefined; columns?: string[] | undefined }) {
  if (!rows?.length) return <p className="text-sm text-[var(--psm-muted)]">No matrix rows returned by backend.</p>;
  const keys = columns?.length ? columns : Object.keys(rows[0] ?? {});
  return <div className="overflow-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr>{keys.map((key) => <th key={key} className="px-3 py-3">{key}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-t border-[var(--psm-line)]">{keys.map((key) => <td key={key} className="px-3 py-3">{String(row[key] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
