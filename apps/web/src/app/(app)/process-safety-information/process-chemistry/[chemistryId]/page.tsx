import { ProcessChemistryDetailPage } from '@/features/psi/process-chemistry/detail/ProcessChemistryDetailPage';

export default function ProcessChemistryDetailRoute({ params }: { params: { chemistryId: string } }) {
  return <ProcessChemistryDetailPage chemistryId={params.chemistryId} />;
}
