"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ClipboardPlus,
  Copy,
  Eye,
  ShieldAlert,
  ShieldPlus,
  Trash2,
  Wrench,
  Zap,
  Target
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import type { HazopScenarioRow } from "../../types/hazop-scenario.types";
import type { HazopWorksheetActions } from "../../types/hazop-worksheet.types";
import { HazopScenarioRiskBadge } from "./HazopScenarioRiskBadge";
import { HazopScenarioStatusBadge } from "./HazopScenarioStatusBadge";

const commonGuidewords = [
  "No",
  "More",
  "Less",
  "As Well As",
  "Part Of",
  "Reverse",
  "Other Than",
  "Early",
  "Late",
  "Before",
  "After"
];

const commonParameters = [
  "Flow",
  "Pressure",
  "Temperature",
  "Level",
  "Composition",
  "Phase",
  "Reaction",
  "Mixing",
  "Utility",
  "Containment"
];

export function HazopWorksheetRow({
  scenario,
  index,
  recommendationCount,
  canEdit,
  canDelete,
  actions,
  isSpreadsheetMode = false,
}: {
  scenario: HazopScenarioRow;
  index: number;
  recommendationCount: number;
  canEdit: boolean;
  canDelete: boolean;
  actions: HazopWorksheetActions;
  isSpreadsheetMode?: boolean;
}) {
  const [inlineValues, setInlineValues] = useState({
    guideword: scenario.guideword ?? "",
    parameter: scenario.parameter ?? "",
    deviation_text: scenario.deviation_text ?? "",
    cause: scenario.cause ?? "",
    consequence: scenario.consequence ?? "",
    existing_safeguards: scenario.existing_safeguards ?? "",
    severity: Number(scenario.severity ?? 1),
    likelihood: Number(scenario.likelihood ?? 1)
  });

  const [savingField, setSavingField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setInlineValues({
      guideword: scenario.guideword ?? "",
      parameter: scenario.parameter ?? "",
      deviation_text: scenario.deviation_text ?? "",
      cause: scenario.cause ?? "",
      consequence: scenario.consequence ?? "",
      existing_safeguards: scenario.existing_safeguards ?? "",
      severity: Number(scenario.severity ?? 1),
      likelihood: Number(scenario.likelihood ?? 1)
    });
  }, [scenario]);

  const liveScore = inlineValues.severity * inlineValues.likelihood;
  const liveRiskLevel =
    liveScore >= 15 ? "Critical" : liveScore >= 10 ? "High" : liveScore >= 5 ? "Medium" : "Low";

  const handleFieldCommit = async (fieldName: string, value: any) => {
    if (!actions.onInlineSave || !canEdit) return;
    const currentVal = (scenario as any)[fieldName];
    if (currentVal === value) return;

    setSavingField(fieldName);
    try {
      await actions.onInlineSave(scenario.id, {
        [fieldName]: value,
        ...(fieldName === "severity" || fieldName === "likelihood"
          ? {
              severity: fieldName === "severity" ? Number(value) : inlineValues.severity,
              likelihood: fieldName === "likelihood" ? Number(value) : inlineValues.likelihood
            }
          : {})
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } finally {
      setSavingField(null);
    }
  };

  return (
    <tr
      className={cn(
        "border-t border-[var(--psm-line)] transition-colors hover:bg-[var(--psm-surface-2)]/60 text-xs",
        scenario.lopa_required ? "bg-purple-500/[0.03]" : ""
      )}
    >
      {/* Row # */}
      <td
        onClick={() => actions.onOpen(scenario)}
        className="sticky left-0 z-10 cursor-pointer bg-[var(--psm-surface)] px-3 py-2.5 font-bold text-slate-200 border-r border-[var(--psm-line)] shadow-[2px_0_4px_rgba(0,0,0,0.05)]"
      >
        <div className="flex items-center gap-1.5">
          <span>{scenario.row_number ?? index + 1}</span>
          {saveSuccess ? <Check size={12} className="text-emerald-400 animate-bounce" /> : null}
        </div>
      </td>

      {/* Guideword */}
      <td className="px-2.5 py-2">
        {isSpreadsheetMode && canEdit ? (
          <select
            value={inlineValues.guideword}
            onChange={(e) => {
              const val = e.target.value;
              setInlineValues((prev) => ({ ...prev, guideword: val }));
              handleFieldCommit("guideword", val);
            }}
            className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-slate-200 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
          >
            <option value="" className="bg-[var(--psm-surface)] text-slate-200">Select...</option>
            {commonGuidewords.map((gw) => (
              <option key={gw} value={gw} className="bg-[var(--psm-surface)] text-slate-200">{gw}</option>
            ))}
          </select>
        ) : (
          <Pill tone="slate">{scenario.guideword || "-"}</Pill>
        )}
      </td>

      {/* Parameter */}
      <td className="px-2.5 py-2">
        {isSpreadsheetMode && canEdit ? (
          <select
            value={inlineValues.parameter}
            onChange={(e) => {
              const val = e.target.value;
              setInlineValues((prev) => ({ ...prev, parameter: val }));
              handleFieldCommit("parameter", val);
            }}
            className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-slate-200 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
          >
            <option value="" className="bg-[var(--psm-surface)] text-slate-200">Select...</option>
            {commonParameters.map((p) => (
              <option key={p} value={p} className="bg-[var(--psm-surface)] text-slate-200">{p}</option>
            ))}
          </select>
        ) : (
          <Pill tone="blue">{scenario.parameter || "-"}</Pill>
        )}
      </td>

      {/* Deviation */}
      <td className="max-w-[180px] px-2.5 py-2">
        {isSpreadsheetMode && canEdit ? (
          <input
            type="text"
            value={inlineValues.deviation_text}
            onChange={(e) => setInlineValues((prev) => ({ ...prev, deviation_text: e.target.value }))}
            onBlur={() => handleFieldCommit("deviation_text", inlineValues.deviation_text)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFieldCommit("deviation_text", inlineValues.deviation_text);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-full truncate rounded border border-transparent bg-transparent px-1.5 py-1 font-medium text-slate-200 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
          />
        ) : (
          <span
            onClick={() => actions.onOpen(scenario)}
            className="cursor-pointer font-medium text-slate-200 hover:text-primary hover:underline line-clamp-2"
          >
            {scenario.deviation_text || "-"}
          </span>
        )}
      </td>

      {/* Causes */}
      <td className="max-w-[220px] px-2.5 py-2">
        {isSpreadsheetMode && canEdit ? (
          <textarea
            rows={1}
            value={inlineValues.cause}
            onChange={(e) => setInlineValues((prev) => ({ ...prev, cause: e.target.value }))}
            onBlur={() => handleFieldCommit("cause", inlineValues.cause)}
            className="w-full resize-none rounded border border-transparent bg-transparent px-1.5 py-1 text-slate-300 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
            placeholder="Type cause..."
          />
        ) : (
          <span className="text-[var(--psm-muted)] line-clamp-2">{scenario.cause || "-"}</span>
        )}
      </td>

      {/* Consequences */}
      <td className="max-w-[240px] px-2.5 py-2">
        {isSpreadsheetMode && canEdit ? (
          <textarea
            rows={1}
            value={inlineValues.consequence}
            onChange={(e) => setInlineValues((prev) => ({ ...prev, consequence: e.target.value }))}
            onBlur={() => handleFieldCommit("consequence", inlineValues.consequence)}
            className="w-full resize-none rounded border border-transparent bg-transparent px-1.5 py-1 text-slate-300 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
            placeholder="Type consequence..."
          />
        ) : (
          <span className="text-[var(--psm-muted)] line-clamp-2">{scenario.consequence || "-"}</span>
        )}
      </td>

      {/* Existing Safeguards */}
      <td className="max-w-[200px] px-2.5 py-2">
        {isSpreadsheetMode && canEdit ? (
          <textarea
            rows={1}
            value={inlineValues.existing_safeguards}
            onChange={(e) => setInlineValues((prev) => ({ ...prev, existing_safeguards: e.target.value }))}
            onBlur={() => handleFieldCommit("existing_safeguards", inlineValues.existing_safeguards)}
            className="w-full resize-none rounded border border-transparent bg-transparent px-1.5 py-1 text-slate-300 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
            placeholder="Safeguards..."
          />
        ) : (
          <span className="text-[var(--psm-muted)] line-clamp-2">{scenario.existing_safeguards || "None documented"}</span>
        )}
      </td>

      {/* Severity (S) */}
      <td className="px-2 py-2 text-center">
        {isSpreadsheetMode && canEdit ? (
          <select
            value={inlineValues.severity}
            onChange={(e) => {
              const val = Number(e.target.value);
              setInlineValues((prev) => ({ ...prev, severity: val }));
              handleFieldCommit("severity", val);
            }}
            className="rounded border border-transparent bg-transparent px-1 py-1 text-center font-bold text-slate-200 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num} className="bg-[var(--psm-surface)] text-slate-200">
                S{num}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-semibold text-slate-200">{scenario.severity ?? "-"}</span>
        )}
      </td>

      {/* Likelihood (L) */}
      <td className="px-2 py-2 text-center">
        {isSpreadsheetMode && canEdit ? (
          <select
            value={inlineValues.likelihood}
            onChange={(e) => {
              const val = Number(e.target.value);
              setInlineValues((prev) => ({ ...prev, likelihood: val }));
              handleFieldCommit("likelihood", val);
            }}
            className="rounded border border-transparent bg-transparent px-1 py-1 text-center font-bold text-slate-200 focus:border-primary focus:bg-[var(--psm-surface)] focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num} className="bg-[var(--psm-surface)] text-slate-200">
                L{num}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-semibold text-slate-200">{scenario.likelihood ?? "-"}</span>
        )}
      </td>

      {/* Risk Level Badge (Auto-Calculated) */}
      <td className="px-2.5 py-2">
        <HazopScenarioRiskBadge value={isSpreadsheetMode ? liveRiskLevel : scenario.risk_level} />
      </td>

      {/* Recommendation Required */}
      <td className="px-2 py-2 text-center">
        {scenario.recommendation_required ? (
          <Pill tone="amber">Required</Pill>
        ) : (
          <Pill tone="green">No</Pill>
        )}
      </td>

      {/* Recommendations Count / Button */}
      <td className="px-2.5 py-2 text-center">
        {recommendationCount ? (
          <button
            type="button"
            onClick={() => actions.onAddRecommendation(scenario)}
            className="font-bold text-primary hover:underline"
          >
            {recommendationCount} Open
          </button>
        ) : (
          <span className="text-[var(--psm-muted)]">0</span>
        )}
      </td>

      {/* LOPA Escalation Status / Badge */}
      <td className="px-2.5 py-2">
        {scenario.lopa_required ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded border border-purple-400/40 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300">
              <Zap size={10} className="text-purple-400 animate-pulse" />
              LOPA
            </span>
          </div>
        ) : (
          <span className="text-[var(--psm-muted)]">No</span>
        )}
      </td>

      {/* Scenario Status */}
      <td className="px-2 py-2">
        <HazopScenarioStatusBadge value={scenario.status} />
      </td>

      {/* Actions Toolbar (Sticky Right) */}
      <td className="sticky right-0 z-10 bg-[var(--psm-surface)] px-3 py-2 border-l border-[var(--psm-line)] shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-1">
          {/* 1-Click Escalate to LOPA */}
          {canEdit ? (
            <button
              type="button"
              title="Escalate directly to LOPA / SIL"
              onClick={() => {
                if (actions.onEscalateToLopa) actions.onEscalateToLopa(scenario);
                else actions.onMarkLopa(scenario);
              }}
              className="flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition"
            >
              <Zap size={12} className="text-purple-400" />
              <span>LOPA</span>
            </button>
          ) : null}

          {/* Add Recommendation CAPA */}
          {canEdit ? (
            <Tiny label="Add Recommendation / CAPA" onClick={() => actions.onAddRecommendation(scenario)}>
              <ClipboardPlus size={13} className="text-amber-400" />
            </Tiny>
          ) : null}

          {/* Add Safeguard */}
          {canEdit ? (
            <Tiny label="Add Credited Safeguard" onClick={() => actions.onAddSafeguard(scenario)}>
              <ShieldPlus size={13} className="text-blue-400" />
            </Tiny>
          ) : null}

          {/* View Details */}
          <Tiny label="View Full Details Drawer" onClick={() => actions.onOpen(scenario)}>
            <Eye size={13} />
          </Tiny>

          {/* Duplicate */}
          {canEdit ? (
            <Tiny label="Duplicate Scenario" onClick={() => actions.onDuplicate(scenario)}>
              <Copy size={13} />
            </Tiny>
          ) : null}

          {/* Delete */}
          {canDelete ? (
            <Tiny label="Delete Scenario" danger onClick={() => actions.onDelete(scenario)}>
              <Trash2 size={13} />
            </Tiny>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "amber" | "green" | "purple";
}) {
  const tones = {
    slate: "border-white/10 bg-white/5 text-slate-300 dark:border-white/10 dark:bg-white/5",
    blue: "border-blue-400/30 bg-blue-500/10 text-blue-300",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    purple: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  };
  return (
    <span className={cn("inline-block rounded border px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

function Tiny({
  children,
  label,
  danger,
  onClick,
}: {
  children: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "rounded border border-[var(--psm-line)] p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-slate-100 transition",
        danger && "hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      )}
    >
      {children}
    </button>
  );
}
