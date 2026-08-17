"use client";
import { useRouter } from "next/navigation";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditChecklistLookups } from "../hooks/useAuditChecklistLookups";
import { useAuditChecklistDetail } from "../hooks/useAuditChecklistDetail";
import { useAuditChecklistMutations } from "../hooks/useAuditChecklistMutations";
import { AuditChecklistForm } from "./AuditChecklistForm";
export function AuditChecklistFormPage({
  id,
  defaults,
}: {
  id?: string;
  defaults?: Record<string, any>;
}) {
  const router = useRouter(),
    ctx = useAuditChecklistLookups(),
    detail = useAuditChecklistDetail(id ?? ""),
    m = useAuditChecklistMutations();
  if (ctx.isLoading || (id && detail.isLoading))
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (ctx.error || (id && detail.error) || !ctx.data)
    return (
      <AuditLayout>
        <AuditErrorState message={ctx.error ?? detail.error} />
      </AuditLayout>
    );
  const save = async (payload: Record<string, any>) => {
    if (id) {
      await m.update.mutateAsync({ id, payload });
      router.push(`/audit-compliance/checklists/templates/${id}`);
    } else {
      const result = await m.create.mutateAsync(payload);
      router.push(`/audit-compliance/checklists/builder/${result.template.id}`);
    }
  };
  const t = detail.data?.template;
  const initial = t
    ? {
        checklistTitle: t.checklist_title,
        checklistCode: t.checklist_code,
        templateType: t.template_type,
        auditType: t.audit_type,
        checklistCategory: t.checklist_category,
        criticality: t.criticality,
        version: t.version,
        effectiveDate: t.effective_date,
        checklistObjective: t.checklist_objective,
        siteId: t.site_id,
        programId: t.source_program_id,
        planId: t.source_plan_id,
        standaloneChecklist: t.standalone_checklist,
        standaloneReason: t.standalone_reason,
        ownerUserId: t.owner_user_id,
        reviewerUserId: t.reviewer_user_id,
        approvalOwnerUserId: t.approval_owner_user_id,
        nextReviewDue: t.next_review_due,
        reviewFrequency: t.review_frequency,
        evidenceResponseRules: t.evidence_response_rules_json,
      }
    : defaults;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold">
            {id ? "Edit Checklist Template" : "Create Checklist Template"}
          </h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">
            Draft-first checklist structure. Activation remains backend
            controlled.
          </p>
        </div>
        <AuditChecklistForm
          context={ctx.data}
          {...(initial ? { initial } : {})}
          onSave={save}
          busy={m.create.isPending || m.update.isPending}
        />
      </div>
    </AuditLayout>
  );
}
