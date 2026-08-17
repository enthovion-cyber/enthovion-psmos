import { AuditChecklistReadinessBadge } from "../shared/AuditChecklistReadinessBadge";
export function AuditChecklistReadinessPanel({ value }: { value: any }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex justify-between">
        <h2 className="font-semibold">Checklist Readiness</h2>
        <AuditChecklistReadinessBadge
          value={value?.readiness_status ?? "Not calculated"}
        />
      </div>
      <p className="mt-3 text-sm text-[var(--psm-muted)]">
        {value?.missing_items_json?.length
          ? `Missing: ${value.missing_items_json.join(", ")}`
          : "No blocking configuration gaps recorded."}
      </p>
    </div>
  );
}
