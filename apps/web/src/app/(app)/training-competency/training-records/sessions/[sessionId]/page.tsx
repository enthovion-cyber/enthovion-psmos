import { TrainingSessionDetailPage } from '@/features/training/records/sessions/TrainingSessionDetailPage';

export default function Page({ params }: { params: { sessionId: string } }) {
  return <TrainingSessionDetailPage sessionId={params.sessionId} />;
}
