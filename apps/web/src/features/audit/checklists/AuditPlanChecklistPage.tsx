"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuditLayout } from "../AuditLayout";
import {
  AuditButton,
  AuditCard,
  AuditEmptyState,
  AuditErrorState,
  AuditLoadingState,
} from "../shared/AuditUi";
import { useAuditChecklistAssignments } from "../hooks/useAuditChecklistAssignments";
import { auditChecklistService } from "../services/audit-checklist.service";
import { AuditChecklistReadinessBadge } from "../shared/AuditChecklistReadinessBadge";

export function AuditPlanChecklistPage({ planId }: { planId: string }) {
  const query = useAuditChecklistAssignments(planId);
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");
  if (query.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (query.error || !query.data)
    return (
      <AuditLayout>
        <AuditErrorState message={query.error} />
      </AuditLayout>
    );
  const rows = Array.isArray(query.data.rows) ? query.data.rows : [];
  const remove = async (assignmentId: string) => {
    const reason = window.prompt(
      "Reason for removing this checklist assignment",
    );
    if (!reason?.trim()) return;
    try {
      setError("");
      setRemoving(assignmentId);
      await auditChecklistService.removeAssignment(
        planId,
        assignmentId,
        reason,
      );
      await queryClient.invalidateQueries({
        queryKey: ["audit", "plans", planId, "checklist"],
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Assignment removal failed.",
      );
    } finally {
      setRemoving("");
    }
  };
  return (
    <AuditLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Audit plan configuration
            </p>
            <h1 className="text-3xl font-bold">Assigned Checklists</h1>
          </div>
          <AuditButton
            href={`/audit-compliance/plans/${planId}/assign-checklist`}
          >
            Assign Checklist
          </AuditButton>
        </div>
        {error ? (
          <AuditCard title="Assignment error">
            <p className="text-danger">{error}</p>
          </AuditCard>
        ) : null}
        {!rows.length ? (
          <AuditEmptyState
            title="No checklist assigned"
            message="Assign an approved/current checklist before this audit plan is executed."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((assignment: Record<string, any>) => {
              const checklist = assignment.checklist ?? {};
              return (
                <AuditCard
                  key={assignment.id}
                  title={`${checklist.checklist_code ?? "Checklist"} · ${checklist.checklist_title ?? "Restricted checklist"}`}
                >
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-[var(--psm-muted)]">
                        Assignment
                      </span>
                      <br />
                      {assignment.primary_checklist
                        ? "Primary"
                        : "Supplemental"}
                    </p>
                    <p>
                      <span className="text-[var(--psm-muted)]">
                        Version snapshot
                      </span>
                      <br />
                      {assignment.checklist_version}
                    </p>
                    <p>
                      <span className="text-[var(--psm-muted)]">Readiness</span>
                      <br />
                          <AuditChecklistReadinessBadge
                        value={
                          assignment.readiness_status ??
                          checklist.readiness_health
                        }
                      />
                    </p>
                    <p>
                      <span className="text-[var(--psm-muted)]">Assigned</span>
                      <br />
                      {assignment.assigned_at
                        ? new Date(assignment.assigned_at).toLocaleString()
                        : "Not recorded"}
                    </p>
                  </div>
                  {assignment.assignment_reason ? (
                    <p className="mt-3 text-sm text-[var(--psm-muted)]">
                      {assignment.assignment_reason}
                    </p>
                  ) : null}
                  {Array.isArray(assignment.alignment_warnings_json) &&
                  assignment.alignment_warnings_json.length ? (
                    <div className="mt-3 rounded border border-warning/40 bg-warning/10 p-3 text-sm">
                      {assignment.alignment_warnings_json.join(" · ")}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AuditButton
                      href={`/audit-compliance/checklists/templates/${assignment.checklist_id}`}
                      variant="secondary"
                    >
                      View Checklist
                    </AuditButton>
                    <AuditButton
                      disabled={removing === assignment.id}
                      title="A removal reason is required and will be audited."
                      variant="danger"
                      onClick={() => remove(assignment.id)}
                    >
                      {removing === assignment.id
                        ? "Removing..."
                        : "Remove Assignment"}
                    </AuditButton>
                  </div>
                </AuditCard>
              );
            })}
          </div>
        )}
      </div>
    </AuditLayout>
  );
}
