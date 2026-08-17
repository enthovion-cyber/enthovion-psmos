import { ProcessChemistryRegistryPage } from '@/features/psi/process-chemistry/ProcessChemistryRegistryPage';

export default function UnwantedReactionsPage() {
  return <ProcessChemistryRegistryPage preset={{ sort: 'updated_at.desc' }} />;
}
