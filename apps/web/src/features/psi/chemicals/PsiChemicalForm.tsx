'use client';

import { useEffect, useState } from 'react';
import { PsiButton } from '../shared/PsiUi';
import type { PsiChemicalLookups } from '../types/psi-chemical.types';
import { ChemicalExposureHealthSection } from './sections/ChemicalExposureHealthSection';
import { ChemicalHazardClassificationSection } from './sections/ChemicalHazardClassificationSection';
import { ChemicalIdentitySection } from './sections/ChemicalIdentitySection';
import { ChemicalPpeEmergencySection } from './sections/ChemicalPpeEmergencySection';
import { ChemicalProcessUseInventorySection } from './sections/ChemicalProcessUseInventorySection';
import { ChemicalSdsLinkSection } from './sections/ChemicalSdsLinkSection';
import { ChemicalStorageCompatibilitySection } from './sections/ChemicalStorageCompatibilitySection';

export function PsiChemicalForm({ initial, lookups, forcedUnitId, onSubmit, isSaving }: { initial?: Record<string, any> | undefined; lookups?: PsiChemicalLookups | undefined; forcedUnitId?: string | undefined; onSubmit: (value: Record<string, any>) => void; isSaving?: boolean | undefined }) {
  const [value, setValue] = useState<Record<string, any>>({ ...(initial ?? {}), unit_id: forcedUnitId ?? initial?.unit_id });
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => setValue({ ...(initial ?? {}), unit_id: forcedUnitId ?? initial?.unit_id }), [initial?.id, forcedUnitId]);
  const patch = (next: Record<string, any>) => setValue((current) => ({ ...current, ...next, unit_id: forcedUnitId ?? next.unit_id ?? current.unit_id }));
  const submit = () => {
    const missing = [];
    if (!value.chemical_name) missing.push('Chemical name');
    if (!value.unit_id) missing.push('Process unit');
    if (!value.process_use) missing.push('Process use');
    if (value.max_intended_inventory === undefined || value.max_intended_inventory === '') missing.push('Maximum intended inventory');
    if (!value.inventory_unit) missing.push('Inventory unit');
    if (!value.is_mixture && !value.cas_number && !value.cas_unknown_reason) missing.push('CAS number or CAS unknown reason');
    setErrors(missing);
    if (!missing.length) onSubmit(value);
  };
  const lookupRecord = lookups ? {
    physicalStates: lookups.physicalStates,
    chemicalCategories: lookups.chemicalCategories,
    chemicalUseTypes: lookups.chemicalUseTypes,
    sdsStatuses: lookups.sdsStatuses,
    storageClasses: lookups.storageClasses,
    compatibilityRiskLevels: lookups.compatibilityRiskLevels
  } : undefined;
  return (
    <div className="space-y-5">
      {errors.length ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Cannot save yet. Missing: {errors.join(', ')}.</div> : null}
      <ChemicalIdentitySection value={value} lookups={lookupRecord} onChange={patch} />
      <ChemicalProcessUseInventorySection value={value} lookups={lookupRecord} forcedUnitId={forcedUnitId} onChange={patch} />
      <ChemicalSdsLinkSection value={value} lookups={lookupRecord} onChange={patch} />
      <ChemicalHazardClassificationSection value={value} onChange={patch} />
      <ChemicalExposureHealthSection value={value} onChange={patch} />
      <ChemicalStorageCompatibilitySection value={value} lookups={lookupRecord} onChange={patch} />
      <ChemicalPpeEmergencySection value={value} onChange={patch} />
      <section className="sticky bottom-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">8. Review & Save</p>
            <p className="text-sm text-[var(--psm-muted)]">Backend enforces company/site/unit isolation, SDS status, completeness gaps, MOC suggestion, and audit/history.</p>
          </div>
          <PsiButton onClick={submit} disabled={Boolean(isSaving)} title={isSaving ? 'Saving chemical record' : undefined}>{isSaving ? 'Saving...' : 'Save Chemical'}</PsiButton>
        </div>
      </section>
    </div>
  );
}
