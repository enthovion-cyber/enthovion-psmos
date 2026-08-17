import { TrainingRecordsDashboardPage } from '@/features/training/records/TrainingRecordsDashboardPage';

export default function Page({ params }: { params: { unitId: string } }) {
  return <TrainingRecordsDashboardPage params={{ unitId: params.unitId }} />;
}
