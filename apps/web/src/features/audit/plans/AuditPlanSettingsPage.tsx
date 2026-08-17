"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuditLayout } from "../AuditLayout";
import {
  AuditButton,
  AuditCard,
  AuditErrorState,
  AuditLoadingState,
  Field,
  inputClass,
} from "../shared/AuditUi";
import { auditPlanService } from "../services/audit-plan.service";

const policies = [
  ["allowStandaloneAudits", "Allow standalone audits"],
  ["requireScopeForSchedule", "Require scope before scheduling"],
  ["requireStandardsForSchedule", "Require standards before scheduling"],
  ["requireModulesForSchedule", "Require modules before scheduling"],
  ["requireLeadAuditorForSchedule", "Require lead auditor before scheduling"],
  ["requireTeamForSafetyCritical", "Require team for safety-critical plans"],
  ["hardConflictsBlockSchedule", "Hard conflicts block scheduling"],
  ["requireApprovalBeforeChecklist", "Require approval before checklist"],
] as const;

function normalize(row: Record<string, any>) {
  return {
    siteId: row.site_id ?? row.siteId ?? null,
    allowStandaloneAudits: row.allow_standalone_audits ?? true,
    requireScopeForSchedule: row.require_scope_for_schedule ?? true,
    requireStandardsForSchedule: row.require_standards_for_schedule ?? true,
    requireModulesForSchedule: row.require_modules_for_schedule ?? true,
    requireLeadAuditorForSchedule:
      row.require_lead_auditor_for_schedule ?? true,
    requireTeamForSafetyCritical: row.require_team_for_safety_critical ?? true,
    hardConflictsBlockSchedule: row.hard_conflicts_block_schedule ?? true,
    requireApprovalBeforeChecklist:
      row.require_approval_before_checklist ?? false,
    dueSoonDays: row.due_soon_days ?? 14,
  };
}

export function AuditPlanSettingsPage({ planId }: { planId: string }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["audit", "plans", "settings"],
    queryFn: () => auditPlanService.settings(),
  });
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (query.data) setForm(normalize(query.data));
  }, [query.data]);
  const save = useMutation({
    mutationFn: auditPlanService.updateSettings,
    onSuccess: async () => {
      setMessage("Audit plan policy saved.");
      await client.invalidateQueries({
        queryKey: ["audit", "plans", "settings"],
      });
    },
  });
  if (query.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (query.error)
    return (
      <AuditLayout>
        <AuditErrorState
          message={query.error}
          onRetry={() => query.refetch()}
        />
      </AuditLayout>
    );
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditCard
          title="Audit Plan / Schedule Settings"
          subtitle="Company and selected-site policy used by backend readiness, scheduling, conflict, and approval rules."
          action={
            <AuditButton
              href={`/audit-compliance/plans/${planId}`}
              variant="secondary"
            >
              Back to Plan
            </AuditButton>
          }
        >
          {message ? (
            <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              {message}
            </p>
          ) : null}
          {save.error ? (
            <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {save.error instanceof Error
                ? save.error.message
                : "Unable to save settings."}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {policies.map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm font-semibold"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(event) =>
                    setForm({ ...form, [key]: event.target.checked })
                  }
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 max-w-sm">
            <Field label="Due-soon window (days)">
              <input
                type="number"
                min="1"
                max="365"
                className={inputClass()}
                value={form.dueSoonDays ?? 14}
                onChange={(event) =>
                  setForm({ ...form, dueSoonDays: Number(event.target.value) })
                }
              />
            </Field>
          </div>
          <div className="mt-5">
            <AuditButton
              onClick={() => save.mutate(form)}
              disabled={save.isPending}
              title={
                save.isPending
                  ? "Settings are being saved."
                  : "Save backend policy settings."
              }
            >
              {save.isPending ? "Saving..." : "Save Settings"}
            </AuditButton>
          </div>
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
