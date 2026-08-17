import { ProcessChemistryRegistryPage } from '@/features/psi/process-chemistry/ProcessChemistryRegistryPage';

export default function UnitProcessChemistryPage({ params }: { params: { unitId: string } }) {
  return <ProcessChemistryRegistryPage unitId={params.unitId} />;
}
