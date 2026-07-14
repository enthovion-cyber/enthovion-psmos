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
    <section className="rounded-xl border border-[var(--psm-line)] bg-[#07192a] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary"><GitBranch size={18} /></div>
            <div>
              <h2 className="text-lg font-semibold">{node.node_number ?? "Node"} - {node.title}</h2>
              <p className="text-xs text-[var(--psm-muted)]">{node.process_section ?? node.equipmentLabel ?? "Process section not set"} · Completion {node.completionPercent ?? 0}%</p>
            </div>
            <HazopStatusBadge value={node.status ?? "Draft"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
            {node.equipmentLabel ? <span className="rounded border border-white/10 bg-white/[.03] px-2 py-1">Equipment: {node.equipmentLabel}</span> : null}
            {documents.length ? <span className="rounded border border-white/10 bg-white/[.03] px-2 py-1">P&ID/docs: {documents.length}</span> : null}
            {parameters.slice(0, 5).map((parameter: string) => <span key={parameter} className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-primary">{parameter}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? <button type="button" className="btn-secondary" onClick={onEdit}>Edit Node</button> : null}
          {canScenario ? <button type="button" className="btn-primary" onClick={onAddScenario}><Plus size={14} /> Add Scenario</button> : null}
          {canScenario ? <button type="button" className="btn-secondary" onClick={onBulk}>Generate Deviations</button> : null}
          {canEdit ? <button type="button" className="btn-secondary" onClick={node.status === "Completed" ? onReopen : onComplete}>{node.status === "Completed" ? <RotateCcw size={14} /> : <ChevronDown size={14} />} {node.status === "Completed" ? "Reopen" : "Complete Node"}</button> : null}
        </div>
      </div>
    </section>
  );
}
