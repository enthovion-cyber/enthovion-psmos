'use client';

import type { ReactNode } from 'react';
import type { MiDeficiencyLookups } from '../types/deficiency.types';

type FormProps = {
  values: Record<string, any>;
  lookups?: MiDeficiencyLookups | undefined;
  onChange: (key: string, value: unknown) => void;
};

function Field({ label, children, helper }: { label: string; children: ReactNode; helper?: string | undefined }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--psm-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
      {helper ? <span className="mt-1 block text-xs text-[var(--psm-muted)]">{helper}</span> : null}
    </label>
  );
}

export function Input({ value, onChange, placeholder, type = 'text' }: { value?: unknown; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />;
}

export function Select({ value, onChange, options, placeholder = 'Select' }: { value?: unknown; onChange: (value: string) => void; options?: string[] | undefined; placeholder?: string | undefined }) {
  return (
    <select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
      <option value="">{placeholder}</option>
      {(options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

export function DeficiencySourceSection({ values, onChange }: FormProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Equipment ID" helper="Backend validates equipment company/site access."><Input value={values.equipmentId} onChange={(value) => onChange('equipmentId', value)} placeholder="Equipment UUID" /></Field>
      <Field label="Source module"><Input value={values.sourceModule} onChange={(value) => onChange('sourceModule', value)} placeholder="Inspection, PM, Calibration, PSV, SIF, Bypass" /></Field>
      <Field label="Source record"><Input value={values.sourceRecordId} onChange={(value) => onChange('sourceRecordId', value)} /></Field>
      <Field label="CML / TML"><Input value={values.cmlId} onChange={(value) => onChange('cmlId', value)} /></Field>
      <Field label="Safeguard / IPL"><Input value={values.safeguardId} onChange={(value) => onChange('safeguardId', value)} /></Field>
      <Field label="Source finding / test / result summary"><Input value={values.sourceSummary} onChange={(value) => onChange('sourceSummary', value)} placeholder="Finding/test/result summary" /></Field>
    </div>
  );
}

export function DeficiencyDetailsSection({ values, lookups, onChange }: FormProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Title"><Input value={values.title} onChange={(value) => onChange('title', value)} /></Field>
      <Field label="Deficiency type"><Select value={values.deficiencyType} onChange={(value) => onChange('deficiencyType', value)} options={lookups?.deficiencyTypes} /></Field>
      <Field label="Location"><Input value={values.locationDescription} onChange={(value) => onChange('locationDescription', value)} /></Field>
      <Field label="Discovery date"><Input type="date" value={values.discoveryDate} onChange={(value) => onChange('discoveryDate', value)} /></Field>
      <Field label="Reported by"><Input value={values.reportedBy} onChange={(value) => onChange('reportedBy', value)} /></Field>
      <Field label="Evidence / document ID"><Input value={values.evidenceDocumentId} onChange={(value) => onChange('evidenceDocumentId', value)} /></Field>
      <Field label="Observed condition"><Input value={values.observedCondition} onChange={(value) => onChange('observedCondition', value)} /></Field>
      <Field label="Required condition"><Input value={values.requiredCondition} onChange={(value) => onChange('requiredCondition', value)} /></Field>
      <Field label="Description"><Input value={values.description} onChange={(value) => onChange('description', value)} /></Field>
      <Field label="Immediate action taken"><Input value={values.immediateActionTaken} onChange={(value) => onChange('immediateActionTaken', value)} /></Field>
    </div>
  );
}

export function DeficiencyRiskReadinessSection({ values, lookups, onChange }: FormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Severity"><Select value={values.severity} onChange={(value) => onChange('severity', value)} options={lookups?.severityLevels} /></Field>
        <Field label="Risk level"><Select value={values.riskLevel} onChange={(value) => onChange('riskLevel', value)} options={lookups?.riskLevels} /></Field>
        <Field label="Consequence"><Input value={values.consequenceDescription} onChange={(value) => onChange('consequenceDescription', value)} /></Field>
        <Field label="Probability of worsening"><Input value={values.probabilityOfWorsening} onChange={(value) => onChange('probabilityOfWorsening', value)} /></Field>
        <Field label="Owner user ID"><Input value={values.ownerUserId} onChange={(value) => onChange('ownerUserId', value)} /></Field>
        <Field label="Due date"><Input type="date" value={values.dueDate} onChange={(value) => onChange('dueDate', value)} /></Field>
        <Field label="Target closure date"><Input type="date" value={values.targetClosureDate} onChange={(value) => onChange('targetClosureDate', value)} /></Field>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {([
          ['criticalFlag','Critical'],
          ['safetyCriticalImpact','Safety critical'],
          ['psmImpact','PSM impact'],
          ['environmentalImpact','Environmental impact'],
          ['productionImpact','Production impact'],
          ['regulatoryImpact','Regulatory impact'],
          ['startupBlocker','Startup blocker'],
          ['ffsRequired','FFS required'],
          ['engineeringReviewRequired','Engineering review'],
          ['mocRequired','MOC required'],
          ['mocSuggested','MOC suggested'],
          ['pssrImpact','PSSR impact'],
          ['lopaSilImpact','LOPA/SIL impact'],
          ['operationAllowed','Operation allowed']
        ] as Array<[string, string]>).map(([key, label]) => <Check key={key} label={label} checked={values[key]} onChange={(value) => onChange(key, value)} />)}
      </div>
      <Field label="Operation restrictions / startup blocker reason"><Input value={values.operationRestrictions} onChange={(value) => onChange('operationRestrictions', value)} /></Field>
    </div>
  );
}

export function TemporaryControlsSection({ values, onChange }: FormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {([
          ['temporaryControlRequired','Temporary control required'],
          ['reducedOperatingEnvelope','Reduced operating envelope'],
          ['additionalMonitoring','Additional monitoring'],
          ['temporaryRepair','Temporary repair'],
          ['extraInspectionRequired','Extra inspection'],
          ['manualCheckRequired','Manual check']
        ] as Array<[string, string]>).map(([key, label]) => <Check key={key} label={label} checked={values[key]} onChange={(value) => onChange(key, value)} />)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Control description"><Input value={values.controlDescription} onChange={(value) => onChange('controlDescription', value)} /></Field>
        <Field label="Operator instruction"><Input value={values.operatorInstruction} onChange={(value) => onChange('operatorInstruction', value)} /></Field>
        <Field label="Control expiry date"><Input type="date" value={values.controlExpiryDate} onChange={(value) => onChange('controlExpiryDate', value)} /></Field>
        <Field label="Control owner user ID"><Input value={values.controlOwnerUserId} onChange={(value) => onChange('controlOwnerUserId', value)} /></Field>
      </div>
    </div>
  );
}

export function CorrectiveLinksSection({ values, onChange }: FormProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {([
        ['universalActionId','Universal action'],
        ['workOrderId','Work order'],
        ['mocId','MOC'],
        ['inspectionRecordId','Inspection'],
        ['pmRecordId','PM'],
        ['calibrationRecordId','Calibration'],
        ['reliefTestId','PSV test'],
        ['sifProofTestId','SIF proof test'],
        ['impairmentId','Bypass / impairment'],
        ['documentId','Document']
      ] as Array<[string, string]>).map(([key, label]) => <Field key={key} label={label}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}
    </div>
  );
}
