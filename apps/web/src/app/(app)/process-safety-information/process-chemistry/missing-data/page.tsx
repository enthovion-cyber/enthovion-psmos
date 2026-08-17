import { ProcessChemistryRegistryPage } from '@/features/psi/process-chemistry/ProcessChemistryRegistryPage';

export default function MissingProcessChemistryDataPage() {
  return <ProcessChemistryRegistryPage preset={{ missingData: 'true' }} />;
}
