import { ProcessChemistryFormPage } from '@/features/psi/process-chemistry/ProcessChemistryFormPage';

export default function EditProcessChemistryRoute({ params }: { params: { chemistryId: string } }) {
  return <ProcessChemistryFormPage chemistryId={params.chemistryId} />;
}
