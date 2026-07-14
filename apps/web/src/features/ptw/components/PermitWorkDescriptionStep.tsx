'use client';

import { Check, Field, Grid, Input, SectionTitle, StepPanel, Textarea } from './PermitWizardFields';

export function PermitWorkDescriptionStep() {
  return (
    <StepPanel title="Step 3 - Work Description & Job Scope" subtitle="Detailed work description, work method / procedure, tools, materials, energy sources, documents, and special instructions.">
      <Grid>
        <Field name="detailedWorkDescription" label="Detailed Work Description" required><Textarea name="detailedWorkDescription" /></Field>
        <Field name="workMethod" label="Work Method / Procedure" required><Textarea name="workMethod" /></Field>
        <Field name="toolsEquipmentRequired" label="Tools & Equipment Required"><Textarea name="toolsEquipmentRequired" /></Field>
        <Field name="chemicalsMaterialsUsed" label="Chemicals / Materials Used"><Textarea name="chemicalsMaterialsUsed" /></Field>
        <SectionTitle>Energy Sources Involved</SectionTitle>
        <Check name="energyElectrical" label="Electrical" />
        <Check name="energyMechanical" label="Mechanical" />
        <Check name="energyPneumatic" label="Pneumatic" />
        <Check name="energyHydraulic" label="Hydraulic" />
        <Check name="energyThermal" label="Thermal" />
        <Check name="energyChemical" label="Chemical" />
        <Check name="energyGravitational" label="Gravitational" />
        <Check name="jsaRequired" label="Job Safety Analysis Required" />
        <Field name="sopReference" label="SOP Reference"><Input name="sopReference" /></Field>
        <Field name="pidReference" label="P&ID Reference"><Input name="pidReference" /></Field>
        <Field name="drawingsReference" label="Drawings Reference"><Input name="drawingsReference" /></Field>
        <Field name="specialInstructions" label="Special Instructions"><Textarea name="specialInstructions" /></Field>
      </Grid>
    </StepPanel>
  );
}
