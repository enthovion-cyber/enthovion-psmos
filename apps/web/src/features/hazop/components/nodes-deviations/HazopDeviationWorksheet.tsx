"use client";

import { useMemo, useState } from "react";
import { Filter, Grid3X3, Table, ShieldAlert, Sparkles, CheckSquare, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";
import type { HazopScenarioRow } from "../../types/hazop-scenario.types";
import type { HazopWorksheetActions } from "../../types/hazop-worksheet.types";
import { HazopWorksheetRow } from "./HazopWorksheetRow";

type QuickFilter = "all" | "high_critical" | "lopa_required" | "action_required";

export function HazopDeviationWorksheet({
  scenarios,
  recommendationCountFor,
  actions,
  canEdit,
  canDelete,
}: {
  scenarios: HazopScenarioRow[];
  recommendationCountFor: (scenarioId: string) => number;
  actions: HazopWorksheetActions;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(true);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((sc) => {
      if (quickFilter === "high_critical") {
        return sc.risk_level === "Critical" || sc.risk_level === "High";
      }
      if (quickFilter === "lopa_required") {
        return Boolean(sc.lopa_required);
      }
      if (quickFilter === "action_required") {
        return Boolean(sc.recommendation_required) || recommendationCountFor(sc.id) > 0;
      }
      return true;
    });
  }, [scenarios, quickFilter, recommendationCountFor]);

  const highCriticalCount = useMemo(
    () => scenarios.filter((sc) => sc.risk_level === "Critical" || sc.risk_level === "High").length,
    [scenarios]
  );
  const lopaCount = useMemo(
    () => scenarios.filter((sc) => Boolean(sc.lopa_required)).length,
    [scenarios]
  );
  const actionCount = useMemo(
    () => scenarios.filter((sc) => Boolean(sc.recommendation_required) || recommendationCountFor(sc.id) > 0).length,
    [scenarios, recommendationCountFor]
  );

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      {/* Worksheet Header & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)]/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {isSpreadsheetMode ? <Table size={18} /> : <Grid3X3 size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[var(--psm-text)] text-sm">Nodes & Deviations Worksheet</h3>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {isSpreadsheetMode ? "⚡ Spreadsheet Mode" : "Card / Read View"}
              </span>
            </div>
            <p className="text-xs text-[var(--psm-muted)] mt-0.5">
              {filteredScenarios.length} displayed of {scenarios.length} scenarios · OSHA 1910.119(e) / IEC 61511
            </p>
          </div>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Chips */}
          <div className="flex items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                quickFilter === "all"
                  ? "bg-[var(--psm-surface-2)] text-[var(--psm-text)] shadow-sm"
                  : "text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
              )}
            >
              All ({scenarios.length})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("high_critical")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors",
                quickFilter === "high_critical"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 shadow-sm border border-rose-500/30"
                  : "text-[var(--psm-muted)] hover:text-rose-500"
              )}
            >
              <ShieldAlert size={12} />
              Critical/High ({highCriticalCount})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("lopa_required")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors",
                quickFilter === "lopa_required"
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 shadow-sm border border-purple-500/30"
                  : "text-[var(--psm-muted)] hover:text-purple-500"
              )}
            >
              <Zap size={12} />
              LOPA ({lopaCount})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("action_required")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors",
                quickFilter === "action_required"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 shadow-sm border border-amber-500/30"
                  : "text-[var(--psm-muted)] hover:text-amber-500"
              )}
            >
              <CheckSquare size={12} />
              CAPA ({actionCount})
            </button>
          </div>

          {/* Spreadsheet vs Classic Toggle */}
          <button
            type="button"
            onClick={() => setIsSpreadsheetMode((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-sm",
              isSpreadsheetMode
                ? "border-blue-500/40 bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/30"
                : "border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
            )}
            title={isSpreadsheetMode ? "Switch to standard row view" : "Switch to fast inline spreadsheet mode"}
          >
            <Table size={14} />
            {isSpreadsheetMode ? "Spreadsheet Active" : "Enable Spreadsheet"}
          </button>
        </div>
      </div>

      {/* Spreadsheet Notice Banner */}
      {isSpreadsheetMode && canEdit ? (
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] bg-blue-500/10 px-4 py-1.5 text-[11px] text-blue-600 dark:text-blue-300">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-blue-500" />
            <strong>Fast Keyboard Entry:</strong> Click any cell to edit · Tab/Enter to auto-commit · Auto-calculates risk matrix & highlights LOPA triggers.
          </span>
          <span className="text-[var(--psm-muted)]">Changes save directly to study</span>
        </div>
      ) : null}

      {/* Main Worksheet Table */}
      <div className="max-h-[680px] overflow-auto">
        <table className="w-full min-w-[2000px] border-collapse text-sm">
          <thead className="sticky top-0 z-20 bg-[var(--psm-surface-2)] text-[11px] uppercase tracking-wider text-[var(--psm-muted)] shadow-sm">
            <tr className="border-b border-[var(--psm-line)]">
              <th className="px-3 py-3 text-left w-12 font-semibold">#</th>
              <th className="px-3 py-3 text-left w-32 font-semibold">Guideword</th>
              <th className="px-3 py-3 text-left w-36 font-semibold">Parameter</th>
              <th className="px-3 py-3 text-left min-w-[180px] font-semibold">Deviation</th>
              <th className="px-3 py-3 text-left min-w-[220px] font-semibold">Causes</th>
              <th className="px-3 py-3 text-left min-w-[240px] font-semibold">Consequences</th>
              <th className="px-3 py-3 text-left min-w-[240px] font-semibold">Existing Safeguards</th>
              <th className="px-2 py-3 text-center w-16 font-semibold">Sev (S)</th>
              <th className="px-2 py-3 text-center w-16 font-semibold">Lik (L)</th>
              <th className="px-3 py-3 text-center w-28 font-semibold">Initial Risk</th>
              <th className="px-2 py-3 text-center w-24 font-semibold">Rec. Req.</th>
              <th className="px-3 py-3 text-center w-28 font-semibold">Actions</th>
              <th className="px-3 py-3 text-center w-36 font-semibold">LOPA Status</th>
              <th className="px-3 py-3 text-center w-28 font-semibold">Status</th>
              <th className="px-3 py-3 text-left w-28 font-semibold">Owner</th>
              <th className="px-3 py-3 text-left w-24 font-semibold">Updated</th>
              <th className="sticky right-0 z-30 bg-[var(--psm-surface-2)] px-3 py-3 text-center w-40 font-semibold border-l border-[var(--psm-line)]">
                Worksheet Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {filteredScenarios.map((scenario, index) => (
              <HazopWorksheetRow
                key={scenario.id}
                scenario={scenario}
                index={index}
                recommendationCount={recommendationCountFor(scenario.id)}
                actions={actions}
                canEdit={canEdit}
                canDelete={canDelete}
                isSpreadsheetMode={isSpreadsheetMode}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!filteredScenarios.length ? (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--psm-surface-2)] text-[var(--psm-muted)] mb-3 border border-[var(--psm-line)]">
            <Filter size={24} />
          </div>
          <h4 className="font-semibold text-[var(--psm-text)]">No matching worksheet rows</h4>
          <p className="mt-1 text-xs text-[var(--psm-muted)] max-w-md mx-auto">
            {scenarios.length === 0
              ? "This node has no deviation scenarios yet. Use 'Add Scenario' or 'Bulk Generate' above to populate the worksheet."
              : "No scenarios match the selected filter. Try switching back to 'All' or clearing search queries."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
