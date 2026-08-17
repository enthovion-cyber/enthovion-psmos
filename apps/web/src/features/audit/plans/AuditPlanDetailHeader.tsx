import type { AuditPlan } from "../types/audit-plan.types";
import { AuditButton } from "../shared/AuditUi";
import { AuditPlanStatusBadge } from "../shared/AuditPlanStatusBadge";
import { AuditScheduleStatusBadge } from "../shared/AuditScheduleStatusBadge";
import { AuditPlanReadinessBadge } from "../shared/AuditPlanReadinessBadge";
import { AuditPlanConflictBadge } from "../shared/AuditPlanConflictBadge";
export function AuditPlanDetailHeader({
  plan,
  onAction,
  busy,
}: {
  plan: AuditPlan;
  onAction: (action: string, payload?: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const locked = [
    "Cancelled",
    "Archived",
    "Completed Foundation",
    "Superseded",
  ].includes(plan.plan_status);
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            {plan.plan_code}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{plan.plan_title}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">
            {plan.description ?? "No description provided."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AuditPlanStatusBadge value={plan.plan_status} />
            <AuditScheduleStatusBadge value={plan.schedule_status} />
            <AuditPlanReadinessBadge value={plan.readiness_health} />
            <AuditPlanConflictBadge value={plan.conflict_status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuditButton
            href={`/audit-compliance/plans/${plan.id}/edit`}
            variant="secondary"
            disabled={locked}
            title={
              locked ? `${plan.plan_status} plans are read-only.` : "Edit plan"
            }
          >
            Edit
          </AuditButton>
          <AuditButton
            onClick={() => onAction("schedule")}
            disabled={busy || locked || !plan.planned_start_at}
            title={
              !plan.planned_start_at
                ? "Planned dates are required before scheduling."
                : locked
                  ? "This plan is read-only."
                  : "Run readiness and schedule."
            }
          >
            Schedule
          </AuditButton>
          <AuditButton
            onClick={() => {
              const plannedStartAt = window.prompt(
                "New planned start date/time (ISO 8601):",
                plan.planned_start_at ?? "",
              );
              if (!plannedStartAt) return;
              const plannedEndAt = window.prompt(
                "New planned end date/time (ISO 8601):",
                plan.planned_end_at ?? "",
              );
              const reason = window.prompt("Reason for rescheduling:");
              if (plannedEndAt && reason)
                onAction("reschedule", {
                  plannedStartAt,
                  plannedEndAt,
                  reason,
                });
            }}
            variant="secondary"
            disabled={busy || locked}
            title={
              locked
                ? "This plan is read-only."
                : "New dates and a rescheduling reason are required."
            }
          >
            Reschedule
          </AuditButton>
          <AuditButton
            onClick={() => onAction("readiness/run")}
            variant="secondary"
            disabled={busy || locked}
            title={
              locked
                ? "This plan is read-only."
                : "Recalculate readiness from current plan configuration."
            }
          >
            Run Readiness
          </AuditButton>
          <AuditButton
            onClick={() => onAction("conflicts/detect")}
            variant="secondary"
            disabled={busy || locked}
            title={
              locked
                ? "This plan is read-only."
                : "Detect schedule and resource conflicts."
            }
          >
            Detect Conflicts
          </AuditButton>
          <AuditButton
            onClick={() => {
              const reason = window.prompt("Reason for postponing this audit:");
              if (reason) onAction("postpone", { reason });
            }}
            variant="secondary"
            disabled={busy || locked}
            title={
              locked
                ? "This plan is read-only."
                : "A postponement reason is required."
            }
          >
            Postpone
          </AuditButton>
          <AuditButton
            onClick={() => onAction("submit-review")}
            variant="secondary"
            disabled={busy || locked || !plan.reviewer_user_id}
            title={
              !plan.reviewer_user_id
                ? "Assign a reviewer before submitting."
                : locked
                  ? "This plan is read-only."
                  : "Submit this plan to its configured reviewer."
            }
          >
            Submit Review
          </AuditButton>
          <AuditButton
            onClick={() => {
              const reason = window.prompt(
                "Reason for cancelling this audit plan:",
              );
              if (reason) onAction("cancel", { reason });
            }}
            variant="danger"
            disabled={busy || locked}
            title={
              locked
                ? "This plan is already read-only."
                : "A cancellation reason is required."
            }
          >
            Cancel
          </AuditButton>
          {plan.plan_status === "Archived" ? (
            <AuditButton
              onClick={() => onAction("reactivate")}
              disabled={busy}
              title="Return this archived plan to Draft."
            >
              Reactivate
            </AuditButton>
          ) : (
            <AuditButton
              onClick={() => {
                const reason = window.prompt("Reason for archiving this plan:");
                if (reason) onAction("archive", { reason });
              }}
              variant="secondary"
              disabled={busy || locked}
              title={
                locked
                  ? "This plan cannot be archived in its current status."
                  : "An archive reason is required."
              }
            >
              Archive
            </AuditButton>
          )}
          <AuditButton
            href="/audit-compliance/plans/register"
            variant="secondary"
          >
            Register
          </AuditButton>
        </div>
      </div>
    </header>
  );
}
