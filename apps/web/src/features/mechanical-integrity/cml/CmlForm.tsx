'use client';

import { useEffect, useState } from 'react';
import type { MiCml } from '../types/cml.types';

const fields = [
  ['cmlNumber', 'CML/TML Number'], ['cmlType', 'CML Type'], ['description', 'Description'], ['status', 'Status'], ['equipmentSection', 'Equipment Section'], ['pipingCircuit', 'Piping Circuit'], ['vesselSection', 'Vessel Shell/Head/Nozzle'], ['tankSection', 'Tank Shell/Floor/Roof'], ['componentType', 'Component Type'], ['locationDescription', 'Location Description'], ['orientation', 'Orientation'], ['clockPosition', 'Clock Position'], ['elevation', 'Elevation'], ['distanceFromReference', 'Distance From Reference'], ['circuitOrComponentId', 'Circuit / Component ID'], ['lineNumber', 'Line Number'], ['drawingReference', 'Drawing Reference'], ['isometricReference', 'Isometric Reference'], ['gridReference', 'Grid / Reference Label'], ['photoDocumentId', 'Photo / Document Link'], ['serviceFluid', 'Service Fluid'], ['material', 'Material'], ['materialOfConstruction', 'Material of Construction'], ['materialSpecification', 'Material Specification'], ['weldSeamNearby', 'Weld Seam Nearby'], ['deadleg', 'Deadleg'], ['injectionPointNearby', 'Injection Point Nearby'], ['corrosionZone', 'Corrosion Zone'], ['damageMechanism', 'Damage Mechanism'], ['insulated', 'Insulated'], ['cuiRisk', 'CUI Risk'], ['nominalThickness', 'Nominal Thickness'], ['originalThickness', 'Original Thickness'], ['originalThicknessDate', 'Original Thickness Date'], ['minimumRequiredThickness', 'Minimum Required Thickness'], ['alertThickness', 'Alert Thickness'], ['criticalThickness', 'Critical Thickness'], ['retirementThickness', 'Retirement Thickness'], ['corrosionAllowance', 'Corrosion Allowance'], ['thicknessUnit', 'Measurement Unit'], ['designBasisNotes', 'Design Basis Notes'], ['highCorrosionRateThreshold', 'Corrosion Rate Alert Threshold'], ['lowRemainingLifeThresholdYears', 'Remaining Life Alert Threshold'], ['overdueThresholdDays', 'Overdue Threshold Days'], ['manualAlertOverrideReason', 'Manual Alert Override Reason'], ['inspectionMethod', 'Inspection Method'], ['utTechnique', 'UT Technique'], ['inspectionFrequencyValue', 'Inspection Frequency'], ['inspectionFrequencyUnit', 'Frequency Unit'], ['lastReadingDate', 'Last Reading Date'], ['nextDueDate', 'Next Due Date'], ['nextDueBasis', 'Next Due Basis'], ['inspectionProcedure', 'Inspection Procedure'], ['responsibleUserId', 'Responsible Inspector/User'], ['responsibleTeamId', 'Responsible Team'], ['corrosionRateMethod', 'Corrosion Rate Method'], ['useShortTermRate', 'Use Short-Term Rate'], ['useLongTermRate', 'Use Long-Term Rate'], ['governingRateMethod', 'Governing Rate Method'], ['minimumRateFloor', 'Minimum Rate Floor'], ['remainingLifeMethod', 'Remaining Life Method'], ['nextDueRuleSource', 'Next Due Rule Source'], ['ruleConfigReference', 'Company/Site Rule Config Reference'], ['manualCalculationOverride', 'Manual Calculation Override'], ['overrideReason', 'Override Reason'], ['active', 'Active'], ['criticality', 'Criticality'], ['notes', 'Notes']
] as const;

export function CmlForm({ value, saving, onSubmit }: { value?: MiCml | null | undefined; saving?: boolean; onSubmit: (input: Record<string, unknown>) => void }) {
  const [form, setForm] = useState<Record<string, unknown>>({});
  useEffect(() => {
    if (value) {
      setForm({
        cmlNumber: value.cmlNumber ?? value.cml_number,
        cmlType: value.cmlType ?? value.cml_type,
        componentType: value.component_type,
        locationDescription: value.location_description,
        damageMechanism: value.damage_mechanism,
        inspectionMethod: value.inspection_method,
        nominalThickness: value.nominal_thickness,
        minimumRequiredThickness: value.minimum_required_thickness,
        retirementThickness: value.retirement_thickness,
        thicknessUnit: value.thickness_unit,
        status: value.status,
        criticality: value.criticality
      });
    }
  }, [value]);
  return (
    <form className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map(([key, label]) => <label key={key} className="space-y-1 text-sm"><span className="font-semibold text-[var(--psm-muted)]">{label}</span><input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-[var(--psm-text)]" value={String(form[key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      </div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving}>{saving ? 'Saving...' : 'Save CML/TML'}</button></div>
    </form>
  );
}
