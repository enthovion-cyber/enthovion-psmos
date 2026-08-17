import { AuditEmptyState } from "../../shared/AuditUi";
export function ChecklistTabTable({
  title,
  rows,
}: {
  title: string;
  rows: any[];
}) {
  if (!rows.length)
    return (
      <AuditEmptyState
        title={`No ${title}`}
        message={`Add ${title.toLowerCase()} in the checklist builder or edit workflow.`}
      />
    );
  const keys = Object.keys(rows[0])
    .filter(
      (k) =>
        ![
          "company_id",
          "created_by",
          "updated_by",
          "removed_by",
          "removed_at",
        ].includes(k),
    )
    .slice(0, 8);
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[800px] w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)]">
          <tr>
            {keys.map((k) => (
              <th key={k} className="p-3 text-left">
                {k.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="border-t border-[var(--psm-line)]">
              {keys.map((k) => (
                <td key={k} className="max-w-[280px] truncate p-3">
                  {typeof r[k] === "boolean"
                    ? r[k]
                      ? "Yes"
                      : "No"
                    : typeof r[k] === "object"
                      ? JSON.stringify(r[k])
                      : String(r[k] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
