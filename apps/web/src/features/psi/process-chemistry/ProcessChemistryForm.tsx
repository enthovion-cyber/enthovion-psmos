'use client';

import { useMemo, useState } from 'react';
import { processChemistrySchema } from '../schemas/process-chemistry.schema';
import { PsiButton, PsiErrorState } from '../shared/PsiUi';
import type { ProcessChemistryLookups } from '../types/process-chemistry.types';
import { ChemistryIdentitySection } from './sections/ChemistryIdentitySection';
import { ReactionDescriptionSection } from './sections/ReactionDescriptionSection';
import { ReactionConditionsSection } from './sections/ReactionConditionsSection';
import { ReactionHazardsSection } from './sections/ReactionHazardsSection';
import { ChemicalsRolesSection } from './sections/ChemicalsRolesSection';
import { UnwantedScenariosSection } from './sections/UnwantedScenariosSection';
import { ControlsSafeguardsSection } from './sections/ControlsSafeguardsSection';
import { ChemistryDocumentsSection } from './sections/ChemistryDocumentsSection';

export function ProcessChemistryForm({ initial, lookups, forcedUnitId, onSubmit, isSaving }: { initial?: Record<string, any> | undefined; lookups?: ProcessChemistryLookups | undefined; forcedUnitId?: string | undefined; onSubmit: (input: Record<string, any>) => void; isSaving?: boolean | undefined }) {
  const [value, setValue] = useState<Record<string, any>>({ status: 'Draft', hazard_level: 'Unknown / Needs Study', runaway_potential: 'Unknown / Needs Study', decomposition_potential: 'Unknown / Needs Study', polymerization_potential: 'Unknown / Needs Study', ...(initial ?? {}), ...(forcedUnitId ? { unit_id: forcedUnitId } : {}) });
  const [error, setError] = useState<string | null>(null);
  const disabledReason = useMemo(() => {
    const result = processChemistrySchema.safeParse(value);
    return result.success ? null : result.error.issues.map((issue) => issue.message).join(' ');
  }, [value]);
  const patch = (input: Record<string, any>) => setValue((current) => ({ ...current, ...input }));
  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); const result = processChemistrySchema.safeParse(value); if (!result.success) { setError(result.error.issues.map((issue) => issue.message).join(' ')); return; } setError(null); onSubmit(value); }}>
      {error ? <PsiErrorState message={error} /> : null}
      <ChemistryIdentitySection value={value} lookups={lookups} onChange={patch} forcedUnitId={forcedUnitId} />
      <ReactionDescriptionSection value={value} lookups={lookups} onChange={patch} />
      <ReactionConditionsSection value={value} onChange={patch} />
      <ReactionHazardsSection value={value} onChange={patch} />
      <ChemicalsRolesSection roles={initial?.roles} />
      <UnwantedScenariosSection scenarios={initial?.scenarios} />
      <ControlsSafeguardsSection controls={initial?.controls} />
      <ChemistryDocumentsSection documents={initial?.documents} />
      <div className="sticky bottom-4 flex flex-wrap justify-end gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-lg">
        <PsiButton variant="secondary" href="/process-safety-information/process-chemistry">Cancel</PsiButton>
        <PsiButton type="submit" disabled={isSaving || Boolean(disabledReason)} title={disabledReason ?? undefined}>{isSaving ? 'Saving...' : 'Save Process Chemistry'}</PsiButton>
      </div>
    </form>
  );
}
