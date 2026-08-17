import { ProcessChemistryFormPage } from '@/features/psi/process-chemistry/ProcessChemistryFormPage';

export default function NewUnitProcessChemistryPage({ params }: { params: { unitId: string } }) {
  return <ProcessChemistryFormPage unitId={params.unitId} />;
}
