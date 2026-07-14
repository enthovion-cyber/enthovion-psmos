'use client';

import { Check, Field, Grid, Input, StepPanel } from './PermitWizardFields';

export function PermitGasTestPlanStep() {
  return (
    <StepPanel title="Step 6 - Gas Test Plan" subtitle="Gas Test Required, Initial Gas Test Required Before Activation, Retest Interval, Gas Tester, instrument details, required gases, and threshold settings.">
      <Grid>
        <Check name="gasTestRequired" label="Gas Test Required" />
        <Check name="initialGasTestRequiredBeforeActivation" label="Initial Gas Test Required Before Activation" />
        <Field name="retestInterval" label="Retest Interval"><Input name="retestInterval" /></Field>
        <Field name="gasTester" label="Gas Tester"><Input name="gasTester" /></Field>
        <Field name="instrumentId" label="Instrument ID"><Input name="instrumentId" /></Field>
        <Field name="instrumentCalibrationDate" label="Instrument Calibration Date"><Input name="instrumentCalibrationDate" type="date" /></Field>
      </Grid>
      <div className="mt-5 rounded-lg border border-cyan-300/10 bg-black/10 p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-300">Required Gases</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Check name="gasO2" label="O2" />
          <Check name="gasLEL" label="LEL" />
          <Check name="gasH2S" label="H2S" />
          <Check name="gasCO" label="CO" />
          <Check name="gasSO2" label="SO2" />
          <Check name="gasCl2" label="Cl2" />
          <Check name="gasNH3" label="NH3" />
          <Check name="gasHF" label="HF" />
        </div>
        <div className="mt-3">
          <Field name="customGas" label="Custom Gas"><Input name="customGas" /></Field>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-cyan-300/10 bg-black/10 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-200">Threshold Settings</div>
          <div className="grid gap-3">
            <Field name="thresholdO2" label="O2 19.5-23.5%"><Input name="thresholdO2" /></Field>
            <Field name="thresholdLEL" label="LEL Requirement"><Input name="thresholdLEL" /></Field>
            <Field name="thresholdH2S" label="H2S Threshold"><Input name="thresholdH2S" /></Field>
            <Field name="thresholdCO" label="CO Threshold"><Input name="thresholdCO" /></Field>
            <Field name="thresholdCustomGas" label="Custom Gas Threshold"><Input name="thresholdCustomGas" /></Field>
          </div>
        </div>
        <div className="rounded-lg border border-cyan-300/10 bg-black/10 p-4 text-sm text-slate-300">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-300">Validation Rules</div>
          <p>Confined Space LEL default: &lt;10%.</p>
          <p className="mt-2">Hot Work LEL default: 0% preferred.</p>
          <p className="mt-2">Hot Work site override: up to &lt;5% only if allowed by site policy.</p>
          <p className="mt-2">H2S, CO and custom gas thresholds are configurable.</p>
          <p className="mt-2">Hot Work gas test, Confined Space gas test, gas tester, calibration date, and retest interval rules are enforced before submit.</p>
        </div>
      </div>
    </StepPanel>
  );
}
