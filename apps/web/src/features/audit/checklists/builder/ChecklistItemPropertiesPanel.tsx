import { AuditResponseTypeBadge } from "../../shared/AuditResponseTypeBadge";
export function ChecklistItemPropertiesPanel({ item }: { item?: any }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Item Properties</h2>
      {!item ? (
        <p className="mt-3 text-sm text-[var(--psm-muted)]">
          Select an item to inspect its execution rules.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <AuditResponseTypeBadge value={item.response_type} />
          {Object.entries({
            "Required response": item.required_response,
            "Mandatory evidence": item.mandatory_evidence,
            "May create finding": item.may_create_finding,
            "Safety-critical": item.safety_critical,
            "Regulatory-critical": item.regulatory_critical,
            "PSM-critical": item.psm_critical,
            "N/A allowed": item.not_applicable_allowed,
            "Comments required": item.comments_required,
            "Attachments allowed": item.attachments_allowed,
            "Attachments required": item.attachments_required,
          }).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b border-[var(--psm-line)] py-2"
            >
              <span>{k}</span>
              <strong>{v ? "Yes" : "No"}</strong>
            </div>
          ))}
          <p>
            <strong>Expected evidence:</strong>{" "}
            {item.expected_evidence ?? "Not defined"}
          </p>
          <p>
            <strong>Guidance:</strong> {item.guidance_text ?? "Not defined"}
          </p>
        </div>
      )}
    </section>
  );
}
