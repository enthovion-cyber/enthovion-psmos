"use client";

import { HazopParameterConfigurationMatrix } from "./HazopParameterConfigurationMatrix";
import { HazopParameterSelector } from "./HazopParameterSelector";
import type { HazopNodeDocumentLink, HazopNodeEquipmentLink, HazopNodeParameterConfiguration } from "../../types/hazop-node.types";

export function HazopNodeParametersTab({
  masterParameters,
  selectedParameters,
  parameterRows,
  equipment,
  documents,
  canCreateCustom,
  onSelectedParametersChange,
  onParameterRowsChange,
  onAddCustom,
}: {
  masterParameters: Array<{ id?: string; name: string; category?: string; unit_hint?: string }>;
  selectedParameters: string[];
  parameterRows: HazopNodeParameterConfiguration[];
  equipment: HazopNodeEquipmentLink[];
  documents: HazopNodeDocumentLink[];
  canCreateCustom?: boolean;
  onSelectedParametersChange: (values: string[]) => void;
  onParameterRowsChange: (rows: HazopNodeParameterConfiguration[]) => void;
  onAddCustom: (value: { name: string; category?: string; unitHint?: string }) => void;
}) {
  const syncSelected = (values: string[]) => {
    const existing = new Map(parameterRows.map((row) => [row.parameterName, row]));
    const nextRows = values.map((name) => existing.get(name) ?? {
      parameterName: name,
      category: masterParameters.find((item) => item.name === name)?.category ?? "Process",
      unitOfMeasurement: masterParameters.find((item) => item.name === name)?.unit_hint ?? "",
    });
    onSelectedParametersChange(values);
    onParameterRowsChange(nextRows);
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-slate-100">Master Parameter Selector</h3>
        <p className="mb-3 text-xs text-slate-500">Selected parameters feed Bulk Generate Deviations and the Add Scenario parameter dropdown.</p>
        <HazopParameterSelector
          masterParameters={masterParameters}
          selected={selectedParameters}
          equipment={equipment}
          canCreateCustom={Boolean(canCreateCustom)}
          onChange={syncSelected}
          onAddCustom={onAddCustom}
        />
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-100">Parameter Configuration Matrix</h3>
        <p className="mb-3 text-xs text-slate-500">Configure operating envelope, limits, linked equipment, and safety concerns before saving the node.</p>
        <HazopParameterConfigurationMatrix rows={parameterRows} equipment={equipment} documents={documents} onChange={onParameterRowsChange} />
      </section>
    </div>
  );
}
