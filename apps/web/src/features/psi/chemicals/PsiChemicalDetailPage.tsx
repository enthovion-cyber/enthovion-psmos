'use client';

import { usePsiChemicalDetail } from '../hooks/usePsiChemicalDetail';
import { usePsiChemicalMutations } from '../hooks/usePsiChemicalMutations';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiChemicalDetailHeader } from './PsiChemicalDetailHeader';
import { ChemicalCompatibilityTab } from './tabs/ChemicalCompatibilityTab';
import { ChemicalEmergencyTab } from './tabs/ChemicalEmergencyTab';
import { ChemicalExposureTab } from './tabs/ChemicalExposureTab';
import { ChemicalHazardsTab } from './tabs/ChemicalHazardsTab';
import { ChemicalOverviewTab } from './tabs/ChemicalOverviewTab';
import { ChemicalSdsTab } from './tabs/ChemicalSdsTab';

export function PsiChemicalDetailPage({ chemicalId, tab = 'overview' }: { chemicalId: string; tab?: 'overview' | 'sds' | 'hazards' | 'exposure' | 'compatibility' | 'emergency' }) {
  const query = usePsiChemicalDetail(chemicalId);
  const mutations = usePsiChemicalMutations(chemicalId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const detail = query.data;
  const content = tab === 'sds' ? <ChemicalSdsTab detail={detail} /> : tab === 'hazards' ? <ChemicalHazardsTab detail={detail} /> : tab === 'exposure' ? <ChemicalExposureTab detail={detail} /> : tab === 'compatibility' ? <ChemicalCompatibilityTab detail={detail} /> : tab === 'emergency' ? <ChemicalEmergencyTab detail={detail} /> : <ChemicalOverviewTab detail={detail} />;
  return <div className="space-y-5"><PsiChemicalDetailHeader detail={detail} onRunSds={() => mutations.runSdsCheck.mutate()} onRunCompatibility={() => mutations.runCompatibilityCheck.mutate({})} busy={mutations.runSdsCheck.isPending || mutations.runCompatibilityCheck.isPending} />{content}</div>;
}
