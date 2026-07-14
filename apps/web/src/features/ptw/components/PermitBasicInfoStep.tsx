'use client';

import { Field, Grid, Input, Select, StepPanel } from './PermitWizardFields';
import { permitTypeOptions } from '../schemas/permit.schema';

export function PermitBasicInfoStep() {
  return (
    <StepPanel title="Step 1 - Basic Permit Information" subtitle="Permit Type, Permit Title, Permit Description, Work Order Number, Job Number, Priority, Risk Level, dates, duration, shift, company, and site / plant.">
      <Grid>
        <Field name="permitType" label="Permit Type" required><Select name="permitType" options={permitTypeOptions as any} /></Field>
        <Field name="title" label="Permit Title" required><Input name="title" /></Field>
        <Field name="description" label="Permit Description"><Input name="description" /></Field>
        <Field name="workOrderNumber" label="Work Order Number"><Input name="workOrderNumber" /></Field>
        <Field name="jobNumber" label="Job Number"><Input name="jobNumber" /></Field>
        <Field name="priority" label="Priority"><Select name="priority" options={['Low', 'Medium', 'High', 'Safety-Critical']} /></Field>
        <Field name="riskLevel" label="Risk Level" required><Select name="riskLevel" options={['Low', 'Medium', 'High', 'Critical']} /></Field>
        <Field name="plannedStartAt" label="Planned Start Date/Time" required><Input name="plannedStartAt" type="datetime-local" /></Field>
        <Field name="plannedEndAt" label="Planned End Date/Time" required><Input name="plannedEndAt" type="datetime-local" /></Field>
        <Field name="permitDuration" label="Permit Duration"><Input name="permitDuration" /></Field>
        <Field name="shift" label="Shift"><Select name="shift" options={['Day', 'Night', 'Custom']} /></Field>
        <Field name="company" label="Company"><Input name="company" /></Field>
        <Field name="siteId" label="Site / Plant" required><Input name="siteId" /></Field>
      </Grid>
    </StepPanel>
  );
}
