"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Copy, Layers3, ShieldAlert, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/utils/cn";
import type { HazopNodeListItem } from "../../types/hazop-node.types";

export function HazopNodeSidebarItem({
  node,
  active,
  canEdit,
  canDelete,
  onSelect,
  onDuplicate,
  onDelete,
  onMove,
}: {
  node: HazopNodeListItem;
  active: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const statusTone = node.status === "Completed" || node.status === "Reviewed" || node.status === "Closed" ? "text-emerald-300" : node.status === "Needs Rework" ? "text-amber-300" : "text-sky-300";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-lg border p-3 text-left transition",
        active ? "border-primary/70 bg-primary/15 shadow-lg shadow-primary/10" : "border-white/10 bg-white/[0.025] hover:border-primary/35 hover:bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400">{node.node_number ?? node.nodeNumber ?? "Node"}</div>
          <div className="truncate text-sm font-semibold text-slate-100">{node.title ?? "Untitled node"}</div>
          <div className="mt-1 truncate text-[11px] text-slate-500">{node.equipmentLabel || node.process_section || "No equipment linked"}</div>
        </div>
        <CheckCircle2 size={14} className={statusTone} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
        <Metric icon={<Layers3 size={12} />} value={node.scenarioCount ?? 0} label="Scenarios" tone="text-sky-300" />
        <Metric icon={<AlertTriangle size={12} />} value={node.highRiskCount ?? 0} label="High Risk" tone="text-red-300" />
        <Metric icon={<ClipboardList size={12} />} value={node.openRecommendationCount ?? 0} label="Open Recs" tone="text-amber-300" />
        <Metric icon={<ShieldAlert size={12} />} value={node.lopaRequiredCount ?? 0} label="LOPA Req." tone="text-purple-300" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, node.completionPercent ?? 0))}%` }} />
        </div>
        <span className="text-[10px] font-semibold text-slate-300">{node.completionPercent ?? 0}%</span>
      </div>
      {(canEdit || canDelete) ? (
        <div className="mt-2 hidden justify-end gap-1 group-hover:flex" onClick={(event) => event.stopPropagation()}>
          {canEdit ? <Tiny title="Move up" onClick={() => onMove("up")}><ArrowUp size={12} /></Tiny> : null}
          {canEdit ? <Tiny title="Move down" onClick={() => onMove("down")}><ArrowDown size={12} /></Tiny> : null}
          {canEdit ? <Tiny title="Duplicate node" onClick={onDuplicate}><Copy size={12} /></Tiny> : null}
          {canDelete ? <Tiny title="Delete node" danger onClick={onDelete}><Trash2 size={12} /></Tiny> : null}
        </div>
      ) : null}
    </button>
  );
}

function Metric({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: string }) {
  return <div className="min-w-0 text-center"><div className={`flex items-center justify-center gap-1 font-semibold ${tone}`}>{icon}{value}</div><div className="truncate text-slate-500">{label}</div></div>;
}

function Tiny({ children, title, danger, onClick }: { children: ReactNode; title: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" title={title} onClick={onClick} className={cn("rounded border border-white/10 p-1 text-slate-400 hover:bg-white/10 hover:text-slate-100", danger && "hover:border-red-400/40 hover:text-red-300")}>{children}</button>;
}
