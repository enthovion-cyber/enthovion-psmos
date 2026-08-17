"use client";
import { useMemo, useState } from "react";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";
import { ExecutionActivityPanel } from "../workspace/ExecutionActivityPanel";
import { ExecutionEvidencePanel } from "../workspace/ExecutionEvidencePanel";
import { ExecutionFindingPanel } from "../workspace/ExecutionFindingPanel";
import { ExecutionGuidancePanel } from "../workspace/ExecutionGuidancePanel";
import { ExecutionItemPanel } from "../workspace/ExecutionItemPanel";
import { ExecutionSectionNavigator } from "../workspace/ExecutionSectionNavigator";

export function ExecutionChecklistTab({ detail, workspace = false }: { detail: AuditExecutionDetail; workspace?: boolean }) {
  const [activeSectionId, setActiveSectionId] = useState(detail.sections[0]?.id);
  const items = useMemo(() => detail.items.filter((item) => item.execution_section_id === activeSectionId), [detail.items, activeSectionId]);
  const firstItem = items[0];
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <AuditCard title="Sections"><ExecutionSectionNavigator sections={detail.sections} items={detail.items} activeSectionId={activeSectionId} onSelect={setActiveSectionId} /></AuditCard>
      <div className="space-y-5">
        {items.length ? items.map((item) => <ExecutionItemPanel key={item.id} executionId={detail.execution.id} item={item} response={detail.responses.find((response) => response.execution_item_id === item.id)} />) : <AuditEmptyState title="No checklist items" message="No backend checklist items were materialized for this section." />}
        {workspace ? <div className="grid gap-5 xl:grid-cols-2"><ExecutionGuidancePanel item={firstItem} /><ExecutionActivityPanel activity={detail.activity} /><ExecutionEvidencePanel evidence={detail.evidence} /><ExecutionFindingPanel findings={detail.findings} /></div> : null}
      </div>
    </div>
  );
}
