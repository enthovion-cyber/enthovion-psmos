import { TrainingSessionRegistryPage } from '@/features/training/records/sessions/TrainingSessionRegistryPage';

export default function Page({ params }: { params: { trainingId: string } }) {
  return <TrainingSessionRegistryPage title="Training Item Sessions" params={{ trainingId: params.trainingId }} />;
}
