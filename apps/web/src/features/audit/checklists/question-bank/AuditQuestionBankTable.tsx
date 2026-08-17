import Link from "next/link";
import { AuditQuestionTypeBadge } from "../../shared/AuditQuestionTypeBadge";
import { AuditResponseTypeBadge } from "../../shared/AuditResponseTypeBadge";
export function AuditQuestionBankTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[1000px] w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)]">
          <tr>
            {[
              "Code / Question",
              "Question Type",
              "Response Type",
              "Standard / Clause",
              "Module",
              "Evidence",
              "Criticality",
              "Owner",
              "Status",
              "Version",
              "Actions",
            ].map((x) => (
              <th key={x} className="p-3 text-left">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id} className="border-t border-[var(--psm-line)]">
              <td className="p-3">
                <Link
                  className="font-semibold text-primary"
                  href={`/audit-compliance/checklists/question-bank/${q.id}`}
                >
                  {q.question_code}
                </Link>
                <p className="max-w-md">{q.question_text}</p>
              </td>
              <td className="p-3">
                <AuditQuestionTypeBadge value={q.question_type} />
              </td>
              <td className="p-3">
                <AuditResponseTypeBadge value={q.response_type} />
              </td>
              <td className="p-3">
                {q.standard_name ?? "—"} / {q.clause_reference ?? "—"}
              </td>
              <td className="p-3">{q.module_key ?? "—"}</td>
              <td className="p-3">{q.evidence_expectation ?? "—"}</td>
              <td className="p-3">{q.criticality ?? "—"}</td>
              <td className="p-3">{q.owner_user_id ?? "—"}</td>
              <td className="p-3">{q.question_status}</td>
              <td className="p-3">v{q.version}</td>
              <td className="p-3">
                <Link
                  className="text-primary"
                  href={`/audit-compliance/checklists/question-bank/${q.id}/edit`}
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
