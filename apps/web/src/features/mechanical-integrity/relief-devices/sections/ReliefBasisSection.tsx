import { Field, SectionShell } from './section-utils';

export function ReliefBasisSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Relief Basis / Scenario" description="Governing scenario, calculation reference, capacity margin, disposal destination, and review cycle.">
      <Field label="Scenario type" name="scenarioType" value={values.scenarioType} onChange={onChange} />
      <Field label="Governing scenario" name="governingScenario" value={values.governingScenario} onChange={onChange} />
      <Field label="Scenario description" name="scenarioDescription" value={values.scenarioDescription} onChange={onChange} />
      <Field label="Basis document ID" name="reliefBasisDocumentId" value={values.reliefBasisDocumentId} onChange={onChange} />
      <Field label="Calculation reference" name="calculationReference" value={values.calculationReference} onChange={onChange} />
      <Field label="Required relieving rate" name="requiredRelievingRate" value={values.requiredRelievingRate} onChange={onChange} type="number" />
      <Field label="Selected capacity" name="selectedCapacity" value={values.selectedCapacity} onChange={onChange} type="number" />
      <Field label="Capacity margin" name="capacityMargin" value={values.capacityMargin} onChange={onChange} type="number" />
      <Field label="Disposal destination" name="disposalDestination" value={values.disposalDestination} onChange={onChange} />
      <Field label="Relief header" name="reliefHeader" value={values.reliefHeader} onChange={onChange} />
      <Field label="Fire case" name="fireCase" value={values.fireCase} onChange={onChange} type="checkbox" />
      <Field label="Blocked outlet" name="blockedOutlet" value={values.blockedOutlet} onChange={onChange} type="checkbox" />
      <Field label="Power failure" name="powerFailure" value={values.powerFailure} onChange={onChange} type="checkbox" />
      <Field label="Thermal expansion" name="thermalExpansion" value={values.thermalExpansion} onChange={onChange} type="checkbox" />
      <Field label="Tube rupture" name="tubeRupture" value={values.tubeRupture} onChange={onChange} type="checkbox" />
      <Field label="Two-phase relief" name="twoPhaseRelief" value={values.twoPhaseRelief} onChange={onChange} type="checkbox" />
      <Field label="Last review date" name="lastReviewDate" value={values.lastReviewDate} onChange={onChange} type="date" />
      <Field label="Next review due" name="nextReviewDue" value={values.nextReviewDue} onChange={onChange} type="date" />
    </SectionShell>
  );
}
