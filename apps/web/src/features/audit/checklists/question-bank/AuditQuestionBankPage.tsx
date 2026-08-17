"use client";
import { AuditLayout } from "../../AuditLayout";
import {
  AuditButton,
  AuditEmptyState,
  AuditErrorState,
  AuditLoadingState,
} from "../../shared/AuditUi";
import { useAuditQuestionBank } from "../../hooks/useAuditQuestionBank";
import { AuditQuestionBankTable } from "./AuditQuestionBankTable";
export function AuditQuestionBankPage() {
  const q = useAuditQuestionBank();
  if (q.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (q.error || !q.data)
    return (
      <AuditLayout>
        <AuditErrorState message={q.error} />
      </AuditLayout>
    );
  return (
    <AuditLayout>
      <div className="space-y-5">
        <div className="flex justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Audit Question Bank</h1>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">
              Reusable questions copied as snapshots into draft checklists.
            </p>
          </div>
          <AuditButton href="/audit-compliance/checklists/question-bank/new">
            New Question
          </AuditButton>
        </div>
        {q.data.rows.length ? (
          <AuditQuestionBankTable rows={q.data.rows} />
        ) : (
          <AuditEmptyState
            title="No question bank items"
            message="Create a reusable audit question to begin."
          />
        )}
      </div>
    </AuditLayout>
  );
}
