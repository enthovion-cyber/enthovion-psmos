import { TrainingMocRequirementFormPage } from '@/features/training/moc/TrainingMocRequirementFormPage';

export default function Page({ params }: { params: { requirementId: string } }) {
  return <TrainingMocRequirementFormPage requirementId={params.requirementId} />;
}
