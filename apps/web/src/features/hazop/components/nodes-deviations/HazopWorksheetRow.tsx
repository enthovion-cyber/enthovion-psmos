"use client";

import type { ReactNode } from "react";
import { Copy, Eye, ShieldAlert, Target, Trash2, Wrench, ClipboardPlus, ShieldPlus } from "lucide-react";
import type { HazopScenarioRow } from "../../types/hazop-scenario.types";
import type { HazopWorksheetActions } from "../../types/hazop-worksheet.types";
import { HazopScenarioRiskBadge } from "./HazopScenarioRiskBadge";
import { HazopScenarioStatusBadge } from "./HazopScenarioStatusBadge";

export function HazopWorksheetRow({
  scenario,
  index,
  recommendationCount,
  canEdit,
  canDelete,
  actions,
}: {
  scenario: HazopScenarioRow;
  index: number;
  recommendationCount: number;
  canEdit: boolean;
  canDelete: boolean;
  actions: HazopWorksheetActions;
}) {
  return (
    <tr className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
      <td onClick={() => actions.onOpen(scenario)} className="cursor-pointer px-3 py-3 font-semibold">{scenario.row_number ?? index + 1}</td>
      <td className="px-3 py-3"><Pill>{scenario.guideword ?? "-"}</Pill></td>
      <td className="px-3 py-3"><Pill tone="blue">{scenario.parameter ?? "-"}</Pill></td>
      <td onClick={() => actions.onOpen(scenario)} className="max-w-[180px] cursor-pointer px-3 py-3 font-medium">{scenario.deviation_text ?? "-"}</td>
      <td className="max-w-[240px] px-3 py-3 text-[var(--psm-muted)]">{scenario.cause ?? "-"}</td>
      <td className="max-w-[260px] px-3 py-3 text-[var(--psm-muted)]">{scenario.consequence ?? "-"}</td>
      <td className="max-w-[220px] px-3 py-3 text-[var(--psm-muted)]">{scenario.existing_safeguards ?? "Not captured"}</td>
      <td className="px-3 py-3">{scenario.severity ?? "-"}</td>
      <td className="px-3 py-3">{scenario.likelihood ?? "-"}</td>
      <td className="px-3 py-3"><HazopScenarioRiskBadge value={scenario.risk_level} /></td>
      <td className="px-3 py-3">{scenario.recommendation_required ? <Pill tone="amber">Required</Pill> : <Pill tone="green">No</Pill>}</td>
      <td className="px-3 py-3">{recommendationCount ? <button type="button" onClick={() => actions.onAddRecommendation(scenario)} className="text-primary hover:underline">{recommendationCount} Open</button> : <span className="text-[var(--psm-muted)]">0</span>}</td>
      <td className="px-3 py-3">{scenario.lopa_required ? <Pill tone="purple">Yes</Pill> : <span className="text-[var(--psm-muted)]">No</span>}</td>
      <td className="px-3 py-3"><HazopScenarioStatusBadge value={scenario.status} /></td>
      <td className="px-3 py-3">{scenario.owner_id ?? "-"}</td>
      <td className="px-3 py-3">{scenario.updated_at ? new Date(scenario.updated_at).toLocaleDateString() : "-"}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          <Tiny label="View details" onClick={() => actions.onOpen(scenario)}><Eye size={12} /></Tiny>
          {canEdit ? <Tiny label="Edit" onClick={() => actions.onEdit(scenario)}><Wrench size={12} /></Tiny> : null}
          {canEdit ? <Tiny label="Add recommendation" onClick={() => actions.onAddRecommendation(scenario)}><ClipboardPlus size={12} /></Tiny> : null}
          {canEdit ? <Tiny label="Add safeguard" onClick={() => actions.onAddSafeguard(scenario)}><ShieldPlus size={12} /></Tiny> : null}
          {canEdit ? <Tiny label="Rank risk" onClick={() => actions.onRankRisk(scenario)}><Target size={12} /></Tiny> : null}
          {canEdit ? <Tiny label="Mark LOPA required" onClick={() => actions.onMarkLopa(scenario)}><ShieldAlert size={12} /></Tiny> : null}
          {canEdit ? <Tiny label="Duplicate scenario" onClick={() => actions.onDuplicate(scenario)}><Copy size={12} /></Tiny> : null}
          {canDelete ? <Tiny label="Delete scenario" danger onClick={() => actions.onDelete(scenario)}><Trash2 size={12} /></Tiny> : null}
        </div>
      </td>
    </tr>
  );
}

function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "blue" | "amber" | "green" | "purple" }) {
  const tones = {
    slate: "border-white/10 bg-white/5 text-slate-200",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    purple: "border-purple-400/25 bg-purple-500/10 text-purple-200",
  };
  return <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function Tiny({ children, label, danger, onClick }: { children: ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" title={label} onClick={onClick} className={`rounded border border-white/10 p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-100 ${danger ? "hover:border-red-400/40 hover:text-red-300" : ""}`}>{children}</button>;
}
