import { AuditButton } from "../shared/AuditUi";
import { AuditChecklistStatusBadge } from "../shared/AuditChecklistStatusBadge";
import { AuditChecklistReadinessBadge } from "../shared/AuditChecklistReadinessBadge";
import { AuditChecklistVersionBadge } from "../shared/AuditChecklistVersionBadge";
export function AuditChecklistDetailHeader({
  template,
  onAction,
  busy,
}: {
  template: any;
  onAction: (a: string, p?: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const locked = [
    "Approved",
    "Active",
    "Current",
    "Superseded",
    "Archived",
  ].includes(template.checklist_status);
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            {template.checklist_code}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {template.checklist_title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <AuditChecklistStatusBadge value={template.checklist_status} />
            <AuditChecklistReadinessBadge value={template.readiness_health} />
            <AuditChecklistVersionBadge
              value={template.version}
              current={template.current_version}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuditButton
            href={`/audit-compliance/checklists/builder/${template.id}`}
          >
            Open Builder
          </AuditButton>
          <AuditButton
            href={`/audit-compliance/checklists/templates/${template.id}/edit`}
            variant="secondary"
            disabled={locked}
            title={
              locked
                ? "Create a new version to edit this locked checklist."
                : "Edit checklist"
            }
          >
            Edit
          </AuditButton>
          <AuditButton
            onClick={() => onAction("calculate-readiness")}
            variant="secondary"
          >
            Validate
          </AuditButton>
          <AuditButton
            onClick={() => onAction("submit-review")}
            disabled={busy || locked}
          >
            Submit Review
          </AuditButton>
          <AuditButton
            onClick={() => onAction("activate")}
            disabled={busy || locked}
          >
            Activate
          </AuditButton>
          <AuditButton
            onClick={() => {
              const reason = prompt("Change reason for the new version:");
              if (reason) onAction("create-version", { reason });
            }}
            variant="secondary"
          >
            New Version
          </AuditButton>
          <AuditButton
            onClick={() => {
              const reason = prompt("Archive reason:");
              if (reason) onAction("archive", { reason });
            }}
            variant="danger"
            disabled={busy || template.checklist_status === "Archived"}
          >
            Archive
          </AuditButton>
        </div>
      </div>
    </header>
  );
}
