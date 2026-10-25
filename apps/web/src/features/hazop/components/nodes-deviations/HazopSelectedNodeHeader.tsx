import { ChevronDown, GitBranch, Plus, RotateCcw } from "lucide-react";
import { HazopStatusBadge } from "../shared/HazopBadges";
import type { HazopNodeListItem } from "../../types/hazop-node.types";

export function HazopSelectedNodeHeader({ node, canEdit, canScenario, onEdit, onAddScenario, onBulk, onComplete, onReopen }: {
  node: HazopNodeListItem;
  canEdit: boolean;
  canScenario: boolean;
  onEdit: () => void;
  onAddScenario: () => void;
  onBulk: () => void;
  onComplete: () => void;
  onReopen: () => void;
}) {
  const parameters = node.selected_parameters ?? node.parameter_configurations?.map((item: any) => item.parameterName).filter(Boolean) ?? [];
  const documents = node.document_version_snapshots ?? node.documentLinks ?? [];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary"><GitBranch size={18} /></div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--psm-text)]">{node.node_number ?? "Node"} - {node.title}</h2>
              <p className="text-xs text-[var(--psm-muted)]">{node.process_section ?? node.equipmentLabel ?? "Process section not set"} · Completion {node.completionPercent ?? 0}%</p>
            </div>
            <HazopStatusBadge value={node.status ?? "Draft"} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-[var(--psm-muted)]">
            {node.equipmentLabel ? <span className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-0.5 text-[var(--psm-text)]">Equipment: {node.equipmentLabel}</span> : null}
            {documents.length ? <span className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-0.5 text-[var(--psm-text)]">P&ID/docs: {documents.length}</span> : null}
            {parameters.slice(0, 5).map((parameter: string) => <span key={parameter} className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary font-medium">{parameter}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? <button type="button" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface)] transition" onClick={onEdit}>Edit Node</button> : null}
          {canScenario ? <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition" onClick={onAddScenario}><Plus size={14} /> Add Scenario</button> : null}
          {canScenario ? <button type="button" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface)] transition" onClick={onBulk}>Generate Deviations</button> : null}
          {canEdit ? <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface)] transition" onClick={node.status === "Completed" ? onReopen : onComplete}>{node.status === "Completed" ? <RotateCcw size={14} /> : <ChevronDown size={14} />} {node.status === "Completed" ? "Reopen" : "Complete Node"}</button> : null}
        </div>
      </div>
    </section>
  );
}
