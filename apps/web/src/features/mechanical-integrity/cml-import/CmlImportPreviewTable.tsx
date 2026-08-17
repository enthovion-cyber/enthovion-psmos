'use client';

export function CmlImportPreviewTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">Paste CSV rows to preview the import before upload.</div>;
  const columns = Object.keys(rows[0] ?? {});
  return <div className="overflow-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]"><table className="min-w-full text-left text-xs"><thead className="bg-[var(--psm-surface-2)] text-[var(--psm-muted)]"><tr>{columns.map((column) => <th key={column} className="p-2">{column}</th>)}</tr></thead><tbody>{rows.slice(0, 25).map((row, index) => <tr key={index} className="border-t border-[var(--psm-line)]">{columns.map((column) => <td key={column} className="p-2 text-[var(--psm-text)]">{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
