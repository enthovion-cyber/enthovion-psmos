import { TrainingSessionFormPage } from '@/features/training/records/sessions/TrainingSessionFormPage';

export default function Page({ params }: { params: { sessionId: string } }) {
  return <TrainingSessionFormPage sessionId={params.sessionId} />;
}
