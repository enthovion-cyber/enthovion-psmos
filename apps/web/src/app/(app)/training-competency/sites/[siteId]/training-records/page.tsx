import { TrainingRecordsDashboardPage } from '@/features/training/records/TrainingRecordsDashboardPage';

export default function Page({ params }: { params: { siteId: string } }) {
  return <TrainingRecordsDashboardPage params={{ siteId: params.siteId }} />;
}
