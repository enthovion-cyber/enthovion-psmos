"use client";

import { Filter } from "lucide-react";
import type { HazopScenarioRow } from "../../types/hazop-scenario.types";
import type { HazopWorksheetActions } from "../../types/hazop-worksheet.types";
import { HazopWorksheetRow } from "./HazopWorksheetRow";

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
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <div>
          <h3 className="font-semibold">Nodes & Deviations Worksheet</h3>
          <p className="text-xs text-[var(--psm-muted)]">{scenarios.length} visible rows · backend-calculated risk</p>
        </div>
        <Filter size={16} className="text-[var(--psm-muted)]" />
      </div>
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1880px] text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              {["#", "Guideword", "Parameter", "Deviation", "Causes", "Consequences", "Existing safeguards", "Severity", "Likelihood", "Initial risk", "Rec. required", "Rec. count/status", "LOPA", "Scenario status", "Owner", "Last updated", "Actions"].map((head) => (
                <th key={head} className="px-3 py-3 text-left">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario, index) => (
              <HazopWorksheetRow
                key={scenario.id}
                scenario={scenario}
                index={index}
                recommendationCount={recommendationCountFor(scenario.id)}
                actions={actions}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
      {!scenarios.length ? (
        <div className="p-4">
          <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">
            No worksheet rows match this node/filter. Add a scenario or bulk-generate draft deviations.
          </div>
        </div>
      ) : null}
    </section>
  );
}
