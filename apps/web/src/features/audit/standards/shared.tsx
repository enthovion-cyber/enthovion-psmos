import { AuditBadge } from "../shared/AuditUi";
import type { ReactNode } from "react";

export function toneFor(value?: string | null) {
  const text = String(value ?? "").toLowerCase();
  if (/(healthy|verified|active|mapped|resolved|complete|current|ready)/.test(text)) return "good" as const;
  if (/(warning|partial|pending|review|stale|superseded|missing|not scored)/.test(text)) return "warn" as const;
  if (/(gap|overdue|blocked|critical|archived|rejected|failed)/.test(text)) return "danger" as const;
  if (/(draft|not applicable|unknown)/.test(text)) return "info" as const;
  return "neutral" as const;
}

export function StatusBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={toneFor(value)}>{value || "Not Set"}</AuditBadge>;
}

export function MiniTable({ rows, columns, empty }: { rows: Record<string, any>[]; columns: { key: string; label: string; render?: (row: Record<string, any>) => ReactNode }[]; empty: ReactNode }) {
  if (!rows.length) return <>{empty}</>;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{columns.map((column) => <th key={column.key} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{column.label}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id ?? JSON.stringify(row)}>{columns.map((column) => <td key={column.key} className="px-3 py-2 align-top text-[var(--psm-fg)]">{column.render ? column.render(row) : row[column.key] ?? "—"}</td>)}</tr>)}</tbody></table></div>;
}
