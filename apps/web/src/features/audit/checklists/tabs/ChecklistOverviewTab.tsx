import { AuditMetricCard, AuditCard } from "../../shared/AuditUi";
export function ChecklistOverviewTab({ detail }: { detail: any }) {
  const t = detail.template;
  const cards = [
    ["Template Type", t.template_type],
    ["Audit Type", t.audit_type],
    ["Criticality", t.criticality],
    ["Sections", t.sections_count],
    ["Items", t.items_count],
    ["Mandatory Items", t.mandatory_items],
    ["Safety-Critical", t.safety_critical_items],
    ["Standards", t.standards_count],
    ["Modules", t.modules_count],
    ["Owner", t.owner_user_id ?? "Missing"],
    ["Reviewer", t.reviewer_user_id ?? "Not assigned"],
    ["Review Due", t.next_review_due ?? "Missing"],
    ["Ready For Execution", t.ready_for_execution ? "Yes" : "No"],
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([l, v]) => (
          <AuditMetricCard key={String(l)} label={String(l)} value={v} />
        ))}
      </div>
      <AuditCard title="Objective and governance">
        <p className="text-sm">
          {t.checklist_objective ?? "No objective recorded."}
        </p>
        <p className="mt-3 text-sm text-[var(--psm-muted)]">
          {t.governance_notes ?? "No governance notes."}
        </p>
      </AuditCard>
    </div>
  );
}
