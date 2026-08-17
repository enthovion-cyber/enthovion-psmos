import { AuditMetricCard } from "../shared/AuditUi";
export function AuditChecklistSummaryCards({
  summary,
}: {
  summary: Record<string, number>;
}) {
  const cards: Array<[string, string]> = [
    ["Total Templates", "totalTemplates"],
    ["Active", "active"],
    ["Draft", "draft"],
    ["Pending Review", "pendingReview"],
    ["Approved", "approved"],
    ["Review Overdue", "reviewOverdue"],
    ["Missing Sections", "missingSections"],
    ["Missing Items", "missingItems"],
    ["Missing Standards", "missingStandards"],
    ["Missing Owner", "missingOwner"],
    ["Ready For Execution", "readyForExecution"],
    ["Archived", "archived"],
    ["Safety-Critical Items", "safetyCriticalItems"],
    ["Regulatory-Critical Items", "regulatoryCriticalItems"],
    ["PSM-Critical Items", "psmCriticalItems"],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, key]) => (
        <AuditMetricCard
          key={key}
          label={label}
          value={summary[key] ?? 0}
          tone={
            key === "readyForExecution"
              ? "good"
              : key.startsWith("missing") || key === "reviewOverdue"
                ? "warn"
                : "neutral"
          }
        />
      ))}
    </div>
  );
}
