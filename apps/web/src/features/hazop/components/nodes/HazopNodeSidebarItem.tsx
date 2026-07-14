"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Copy, Layers3, ShieldAlert, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/utils/cn";

export function HazopNodeSidebarItem({ node, index, total, active, canEdit, canCreate, canDelete, onSelect, onDuplicate, onDelete, onMove }: any) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => event.key === "Enter" && onSelect(node.id)}
      className={cn(
        "group rounded-lg border p-3 text-left transition",
        active ? "border-blue-400/70 bg-blue-500/10 shadow-[inset_3px_0_0_rgba(59,130,246,.9)]" : "border-transparent hover:border-white/10 hover:bg-white/[.04]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400">Node {node.node_number ?? index + 1}</div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-100">{node.title}</div>
          <div className="mt-1 truncate text-[11px] text-slate-500">{node.equipmentLabel ?? node.process_section ?? node.design_intent ?? "No equipment linked"}</div>
        </div>
        <CheckCircle2 size={14} className={node.status === "Completed" ? "text-emerald-300" : "text-slate-500"} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <SidebarMetric icon={<Layers3 size={12} />} label="Scenarios" value={node.scenarioCount} tone="text-sky-300" />
        <SidebarMetric icon={<AlertTriangle size={12} />} label="High Risk" value={node.highRiskCount} tone="text-red-300" />
        <SidebarMetric icon={<ClipboardList size={12} />} label="Open Recs" value={node.openRecommendationCount} tone="text-amber-300" />
        <SidebarMetric icon={<ShieldAlert size={12} />} label="LOPA Req." value={node.lopaRequiredCount} tone="text-purple-300" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${node.completionPercent ?? 0}%` }} />
        </div>
        <span className="text-[10px] text-slate-500">{node.completionPercent ?? 0}%</span>
      </div>
      <div className="mt-2 hidden items-center gap-1 group-hover:flex">
        {canEdit ? <Tiny label="Up" disabled={index === 0} onClick={(event: any) => { event.stopPropagation(); onMove(node, "up"); }}><ArrowUp size={12} /></Tiny> : null}
        {canEdit ? <Tiny label="Down" disabled={index === total - 1} onClick={(event: any) => { event.stopPropagation(); onMove(node, "down"); }}><ArrowDown size={12} /></Tiny> : null}
        {canCreate ? <Tiny label="Duplicate" onClick={(event: any) => { event.stopPropagation(); onDuplicate(node); }}><Copy size={12} /></Tiny> : null}
        {canDelete ? <Tiny label="Delete" onClick={(event: any) => { event.stopPropagation(); onDelete(node); }}><Trash2 size={12} /></Tiny> : null}
      </div>
    </div>
  );
}

function SidebarMetric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return <div><div className={`flex items-center justify-center gap-1 text-xs font-semibold ${tone}`}>{icon}{value ?? 0}</div><div className="mt-0.5 truncate text-[10px] text-slate-500">{label}</div></div>;
}

function Tiny({ children, label, disabled, onClick }: { children: ReactNode; label: string; disabled?: boolean; onClick: (event: any) => void }) {
  return <button title={label} disabled={disabled} onClick={onClick} className="rounded border border-white/10 p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30">{children}</button>;
}
