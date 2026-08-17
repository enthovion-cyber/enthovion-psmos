"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { useAuditCapaLookups } from "../../hooks/useAuditCapaLookups";
import { useAuditCapaMutations } from "../../hooks/useAuditCapaMutations";
import { AuditCard } from "../../shared/AuditUi";
import { AuditCapaActionForm } from "../AuditCapaActionForm";
import { AuditCapaActionTable } from "../AuditCapaActionTable";

export function CapaActionsTab({ detail, filterType }: { detail: AuditCapaDetail; filterType?: string }) {
  const mutations = useAuditCapaMutations(detail.capa.id);
  const context = useAuditCapaLookups();
  const rows = filterType ? detail.actions.filter((row) => row.action_type === filterType) : detail.actions;
  return (
    <div className="space-y-5">
      <AuditCard title={`Add ${filterType ?? "CAPA"} action`} subtitle="Actions are backend persisted and synchronized through the Action Engine mapping foundation.">
        <AuditCapaActionForm context={context.data} defaultType={filterType} onSubmit={(payload) => mutations.section.mutate({ section: "actions", payload })} />
      </AuditCard>
      <AuditCard title={`${filterType ?? "All"} actions`} subtitle="Complete, verify, reject, reopen, and cancel actions through backend-controlled transitions.">
        <AuditCapaActionTable rows={rows} onLifecycle={(actionId, lifecycle, payload) => mutations.actionLifecycle.mutate(payload === undefined ? { actionId, lifecycle } : { actionId, lifecycle, payload })} />
      </AuditCard>
    </div>
  );
}
