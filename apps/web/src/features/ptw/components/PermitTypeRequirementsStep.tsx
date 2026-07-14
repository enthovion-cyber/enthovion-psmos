'use client';

import { useWatch } from 'react-hook-form';
import type { PermitCreateValues } from '../schemas/permit.schema';
import { Check, Field, Grid, Input, Select, StepPanel, Textarea } from './PermitWizardFields';

export function PermitTypeRequirementsStep() {
  const permitType = useWatch<PermitCreateValues>({ name: 'permitType' });
  return (
    <StepPanel title="Step 4 - Permit Type Specific Requirements" subtitle="Dynamic fields based on selected Permit Type. Permit-type required fields are enforced by Zod before submit.">
      {permitType === 'HOT_WORK' ? <HotWork /> : null}
      {permitType === 'CONFINED_SPACE' ? <ConfinedSpace /> : null}
      {permitType === 'ELECTRICAL_ISOLATION' ? <ElectricalIsolation /> : null}
      {permitType === 'EXCAVATION' ? <Excavation /> : null}
      {permitType === 'RADIOGRAPHY' ? <Radiography /> : null}
      {permitType === 'WORKING_AT_HEIGHT' ? <WorkingAtHeight /> : null}
      {permitType === 'LINE_BREAKING' ? <LineBreaking /> : null}
      {permitType === 'SIMOPS' ? <Simops /> : null}
      {permitType === 'COLD_WORK' ? <div className="rounded-lg border border-cyan-300/10 bg-black/10 p-4 text-sm text-slate-300">Cold Work selected. Complete the standard work description, isolation, gas test, workforce, and supporting document steps as applicable.</div> : null}
    </StepPanel>
  );
}

function HotWork() {
  return <Grid><Field name="ignitionSourceType" label="Ignition Source Type"><Select name="ignitionSourceType" options={['Welding', 'Grinding', 'Cutting', 'Burning', 'Spark-producing tool', 'Other']} /></Field><Check name="fireWatchRequired" label="Fire Watch Required" /><Field name="fireWatchName" label="Fire Watch Name"><Input name="fireWatchName" /></Field><Check name="fireExtinguisherAvailable" label="Fire Extinguisher Available" /><Check name="combustiblesRemoved" label="Combustibles Removed" /><Check name="areaBarricaded" label="Area Barricaded" /><Check name="hotWorkGasTestRequired" label="Hot Work Gas Test Required" /><Field name="lelRequirement" label="LEL Requirement"><Input name="lelRequirement" placeholder="Default 0% LEL preferred; site override up to <5% only if company policy allows" /></Field></Grid>;
}

function ConfinedSpace() {
  return <Grid><Field name="confinedSpaceId" label="Confined Space ID"><Input name="confinedSpaceId" /></Field><Field name="entrySupervisor" label="Entry Supervisor"><Input name="entrySupervisor" /></Field><Field name="attendant" label="Attendant"><Input name="attendant" /></Field><Field name="entrants" label="Entrants"><Textarea name="entrants" /></Field><Check name="rescuePlanRequired" label="Rescue Plan Required" /><Field name="rescuePlanDocument" label="Rescue Plan Document"><Input name="rescuePlanDocument" /></Field><Check name="ventilationRequired" label="Ventilation Required" /><Check name="atmosphericTestingRequired" label="Atmospheric Testing Required" /><Field name="communicationMethod" label="Communication Method"><Input name="communicationMethod" /></Field><Check name="retrievalEquipmentAvailable" label="Retrieval Equipment Available" /></Grid>;
}

function ElectricalIsolation() {
  return <Grid><Check name="typeIsolationRequired" label="Isolation Required" /><Field name="isolationAuthorityType" label="Isolation Authority"><Input name="isolationAuthorityType" /></Field><Check name="lockBoxRequired" label="Lock Box Required" /><Check name="multipleLocksRequired" label="Multiple Locks Required" /><Field name="electricalDrawingReference" label="Electrical Drawing Reference"><Input name="electricalDrawingReference" /></Field><Check name="energyIsolationPlanRequired" label="Energy Isolation Plan Required" /></Grid>;
}

function Excavation() {
  return <Grid><Field name="excavationDepth" label="Excavation Depth"><Input name="excavationDepth" /></Field><Check name="buriedServicesChecked" label="Buried Services Checked" /><Field name="excavationDrawing" label="Excavation Drawing"><Input name="excavationDrawing" /></Field><Field name="soilCondition" label="Soil Condition"><Input name="soilCondition" /></Field><Check name="shoringRequired" label="Shoring Required" /><Check name="barricadeRequired" label="Barricade Required" /><Field name="gasLineCableClearance" label="Gas Line / Cable Clearance"><Input name="gasLineCableClearance" /></Field></Grid>;
}

function Radiography() {
  return <Grid><Field name="radiationSource" label="Radiation Source"><Input name="radiationSource" /></Field><Field name="exclusionZoneRadius" label="Exclusion Zone Radius"><Input name="exclusionZoneRadius" /></Field><Check name="radiationSurveyRequired" label="Radiation Survey Required" /><Field name="radiationMonitor" label="Radiation Monitor"><Input name="radiationMonitor" /></Field><Check name="warningSignsPosted" label="Warning Signs Posted" /><Check name="areaEvacuationRequired" label="Area Evacuation Required" /></Grid>;
}

function WorkingAtHeight() {
  return <Grid><Field name="workHeight" label="Work Height"><Input name="workHeight" /></Field><Check name="fallProtectionRequired" label="Fall Protection Required" /><Check name="harnessInspectionCompleted" label="Harness Inspection Completed" /><Check name="anchorPointVerified" label="Anchor Point Verified" /><Check name="rescuePlanRequired" label="Rescue Plan Required" /><Field name="scaffoldTagNumber" label="Scaffold Tag Number"><Input name="scaffoldTagNumber" /></Field><Check name="ladderInspectionCompleted" label="Ladder Inspection Completed" /></Grid>;
}

function LineBreaking() {
  return <Grid><Field name="lineEquipmentNumber" label="Line / Equipment Number"><Input name="lineEquipmentNumber" /></Field><Check name="depressurisedConfirmed" label="Depressurised Confirmed" /><Check name="drainedConfirmed" label="Drained Confirmed" /><Check name="flushedConfirmed" label="Flushed Confirmed" /><Check name="purgedConfirmed" label="Purged Confirmed" /><Check name="blindInstalled" label="Blind Installed" /><Field name="residualChemicalHazard" label="Residual Chemical Hazard"><Input name="residualChemicalHazard" /></Field><Field name="ppeRequirement" label="PPE Requirement"><Textarea name="ppeRequirement" /></Field></Grid>;
}

function Simops() {
  return <Grid><Field name="concurrentWorkDescription" label="Concurrent Work Description"><Textarea name="concurrentWorkDescription" /></Field><Field name="nearbyActivePermits" label="Nearby Active Permits"><Textarea name="nearbyActivePermits" /></Field><Field name="simopsCoordinator" label="SIMOPS Coordinator"><Input name="simopsCoordinator" /></Field><Check name="conflictReviewRequired" label="Conflict Review Required" /><Field name="controlMeasures" label="Control Measures"><Textarea name="controlMeasures" /></Field></Grid>;
}
