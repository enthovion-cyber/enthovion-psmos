"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditLayout } from "../../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../../shared/AuditUi";
import { useAuditChecklistLookups } from "../../hooks/useAuditChecklistLookups";
import { auditChecklistService } from "../../services/audit-checklist.service";
import { AuditQuestionBankForm } from "./AuditQuestionBankForm";

export function AuditQuestionBankFormPage({ id }: { id?: string }) {
  const router = useRouter();
  const context = useAuditChecklistLookups();
  const [initial, setInitial] = useState<Record<string, any> | null>(
    id ? null : {},
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    auditChecklistService
      .question(id)
      .then((question) =>
        setInitial({
          questionCode: question.question_code,
          questionText: question.question_text,
          questionType: question.question_type,
          responseType: question.response_type,
          category: question.category,
          standardName: question.standard_name,
          clauseReference: question.clause_reference,
          moduleKey: question.module_key,
          evidenceExpectation: question.evidence_expectation,
          criticality: question.criticality,
          defaultSeverity: question.default_severity,
          defaultGuidance: question.default_guidance,
          ownerUserId: question.owner_user_id,
          questionStatus: question.question_status,
          version: question.version,
        }),
      )
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Unable to load question.",
        ),
      );
  }, [id]);
  if (context.isLoading || !initial)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (context.error || !context.data || error)
    return (
      <AuditLayout>
        <AuditErrorState message={context.error ?? error} />
      </AuditLayout>
    );
  const save = async (value: Record<string, any>) => {
    try {
      setBusy(true);
      const question = await auditChecklistService.saveQuestion(value, id);
      router.push(`/audit-compliance/checklists/question-bank/${question.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save question.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuditLayout>
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          {id ? "Edit Question" : "New Question Bank Item"}
        </h1>
        <AuditQuestionBankForm
          initial={initial}
          context={context.data}
          busy={busy}
          onSave={save}
        />
      </div>
    </AuditLayout>
  );
}
