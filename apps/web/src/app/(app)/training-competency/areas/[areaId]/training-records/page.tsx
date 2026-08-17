import { TrainingRecordsDashboardPage } from '@/features/training/records/TrainingRecordsDashboardPage';

export default function Page({ params }: { params: { areaId: string } }) {
  return <TrainingRecordsDashboardPage params={{ areaId: params.areaId }} />;
}
