'use client';

import { useState } from 'react';
import { useDeficiencyMutations } from '../hooks/useDeficiencies';
import { ActionButton, PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { Check, Input, Select } from './DeficiencyFormSections';

export function DeficiencyVerificationForm({ deficiencyId }: { deficiencyId: string }) {
  const [values, setValues] = useState<Record<string, any>>({ verificationResult: 'Verified', correctionCompleted: false, temporaryControlsRemoved: false, equipmentRestoredToNormal: false, readinessImpactCleared: false });
  const [error, setError] = useState<string | null>(null);
  const mutations = useDeficiencyMutations(deficiencyId);
  const change = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (!values.verificationMethod || !values.closureNotes) {
      setError('Verification method and closure notes are required.');
      return;
    }
    setError(null);
    await mutations.verify.mutateAsync(values);
  };
  return (
    <SectionCard title="Verification / Closure Evidence" description="Correction evidence, test/inspection link, temporary control removal, equipment normal state, and readiness clearance.">
      {error ? <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Select value={values.verificationResult} onChange={(value) => change('verificationResult', value)} options={['Verified','Verification Failed']} />
        <Input value={values.verificationMethod} onChange={(value) => change('verificationMethod', value)} placeholder="Verification method" />
        <Input type="date" value={values.verificationDate} onChange={(value) => change('verificationDate', value)} />
        <Input value={values.evidenceDocumentId} onChange={(value) => change('evidenceDocumentId', value)} placeholder="Evidence document ID" />
        <Input value={values.linkedTestRecordId} onChange={(value) => change('linkedTestRecordId', value)} placeholder="Linked test record ID" />
        <Input value={values.linkedInspectionRecordId} onChange={(value) => change('linkedInspectionRecordId', value)} placeholder="Linked inspection record ID" />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Check label="Correction completed" checked={values.correctionCompleted} onChange={(value) => change('correctionCompleted', value)} />
        <Check label="Action / work order completed" checked={values.actionCompleted} onChange={(value) => change('actionCompleted', value)} />
        <Check label="Temporary controls removed" checked={values.temporaryControlsRemoved} onChange={(value) => change('temporaryControlsRemoved', value)} />
        <Check label="Equipment restored to normal" checked={values.equipmentRestoredToNormal} onChange={(value) => change('equipmentRestoredToNormal', value)} />
        <Check label="Readiness impact cleared" checked={values.readinessImpactCleared} onChange={(value) => change('readinessImpactCleared', value)} />
      </div>
      <div className="mt-3"><Input value={values.closureNotes} onChange={(value) => change('closureNotes', value)} placeholder="Closure notes" /></div>
      <div className="mt-4 flex gap-2">
        <PrimaryButton onClick={submit} disabled={mutations.verify.isPending} title="Saving verification">Verify</PrimaryButton>
        <ActionButton onClick={() => setValues({ verificationResult: 'Verification Failed' })}>Reject verification</ActionButton>
      </div>
    </SectionCard>
  );
}
