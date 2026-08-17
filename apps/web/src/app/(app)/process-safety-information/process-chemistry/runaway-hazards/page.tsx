import { ProcessChemistryRegistryPage } from '@/features/psi/process-chemistry/ProcessChemistryRegistryPage';

export default function RunawayHazardsPage() {
  return <ProcessChemistryRegistryPage preset={{ runawayPotential: 'High' }} />;
}
