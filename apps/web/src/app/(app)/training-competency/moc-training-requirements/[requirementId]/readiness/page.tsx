import { TrainingMocRequirementDetailPage } from '@/features/training/moc/TrainingMocRequirementDetailPage';

export default function Page({ params }: { params: { requirementId: string } }) {
  return <TrainingMocRequirementDetailPage requirementId={params.requirementId} />;
}
