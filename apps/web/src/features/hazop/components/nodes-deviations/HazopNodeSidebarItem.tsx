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
  const statusTone = node.status === "Completed" || node.status === "Reviewed" || node.status === "Closed" ? "text-emerald-600 dark:text-emerald-400" : node.status === "Needs Rework" ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-lg border p-2.5 sm:p-3 text-left transition",
        active ? "border-blue-500/80 bg-blue-500/15 shadow-sm" : "border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30 hover:border-blue-500/35 hover:bg-[var(--psm-surface-2)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-medium text-[var(--psm-muted)]">{node.node_number ?? node.nodeNumber ?? "Node"}</div>
          <div className="truncate text-xs sm:text-sm font-semibold text-[var(--psm-text)]">{node.title ?? "Untitled node"}</div>
          <div className="mt-0.5 truncate text-[10px] sm:text-[11px] text-[var(--psm-muted)]">{node.equipmentLabel || node.process_section || "No equipment linked"}</div>
        </div>
        <CheckCircle2 size={14} className={statusTone} />
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-[10px]">
        <Metric icon={<Layers3 size={11} />} value={node.scenarioCount ?? 0} label="Scenarios" tone="text-sky-600 dark:text-sky-400" />
        <Metric icon={<AlertTriangle size={11} />} value={node.highRiskCount ?? 0} label="High Risk" tone="text-rose-600 dark:text-rose-400" />
        <Metric icon={<ClipboardList size={11} />} value={node.openRecommendationCount ?? 0} label="Open Recs" tone="text-amber-600 dark:text-amber-400" />
        <Metric icon={<ShieldAlert size={11} />} value={node.lopaRequiredCount ?? 0} label="LOPA Req." tone="text-purple-600 dark:text-purple-400" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)]">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, node.completionPercent ?? 0))}%` }} />
        </div>
        <span className="text-[10px] font-semibold text-[var(--psm-text)]">{node.completionPercent ?? 0}%</span>
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
  return <div className="min-w-0 text-center"><div className={`flex items-center justify-center gap-0.5 font-semibold ${tone}`}>{icon}{value}</div><div className="truncate text-[var(--psm-muted)]">{label}</div></div>;
}

function Tiny({ children, title, danger, onClick }: { children: ReactNode; title: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" title={title} onClick={onClick} className={cn("rounded border border-white/10 p-1 text-slate-400 hover:bg-white/10 hover:text-slate-100", danger && "hover:border-red-400/40 hover:text-red-300")}>{children}</button>;
}
