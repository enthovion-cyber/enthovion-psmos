'use client';

import { useState } from 'react';
import { useProcessChemistryDetail } from '../../hooks/useProcessChemistryDetail';
import { useProcessChemistryMutations } from '../../hooks/useProcessChemistryMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../../shared/PsiUi';
import { ProcessChemistryDetailHeader } from './ProcessChemistryDetailHeader';
import { ChemistryOverviewTab } from '../tabs/ChemistryOverviewTab';
import { ReactionDescriptionTab } from '../tabs/ReactionDescriptionTab';
import { ChemicalsRolesTab } from '../tabs/ChemicalsRolesTab';
import { NormalConditionsTab } from '../tabs/NormalConditionsTab';
import { ReactionHazardsTab } from '../tabs/ReactionHazardsTab';
import { UnwantedScenariosTab } from '../tabs/UnwantedScenariosTab';
import { ControlsSafeguardsTab } from '../tabs/ControlsSafeguardsTab';
import { ChemistryDocumentsTab } from '../tabs/ChemistryDocumentsTab';

const tabs = ['Overview', 'Reaction Description', 'Chemicals & Roles', 'Normal Conditions', 'Reaction Hazards', 'Unwanted Scenarios', 'Controls / Safeguards', 'Documents'] as const;

export function ProcessChemistryDetailPage({ chemistryId }: { chemistryId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const query = useProcessChemistryDetail(chemistryId);
  const mutations = useProcessChemistryMutations(chemistryId);
  if (query.isLoading) return <PsiLoadingState rows={9} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const detail = query.data;
  const content = tab === 'Reaction Description' ? <ReactionDescriptionTab detail={detail} /> : tab === 'Chemicals & Roles' ? <ChemicalsRolesTab detail={detail} /> : tab === 'Normal Conditions' ? <NormalConditionsTab detail={detail} /> : tab === 'Reaction Hazards' ? <ReactionHazardsTab detail={detail} /> : tab === 'Unwanted Scenarios' ? <UnwantedScenariosTab detail={detail} /> : tab === 'Controls / Safeguards' ? <ControlsSafeguardsTab detail={detail} /> : tab === 'Documents' ? <ChemistryDocumentsTab detail={detail} /> : <ChemistryOverviewTab detail={detail} />;
  return (
    <div className="space-y-5">
      <ProcessChemistryDetailHeader detail={detail} onRunCompleteness={() => mutations.runCompleteness.mutate()} onSubmitReview={() => mutations.submitReview.mutate({ reason: 'Submitted from Process Chemistry detail.' })} busy={mutations.runCompleteness.isPending || mutations.submitReview.isPending} />
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{tabs.map((item) => <PsiButton key={item} variant={item === tab ? 'primary' : 'secondary'} onClick={() => setTab(item)}>{item}</PsiButton>)}</div>
      {content}
    </div>
  );
}
