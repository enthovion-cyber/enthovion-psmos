import { TrainingSessionRegistryPage } from '@/features/training/records/sessions/TrainingSessionRegistryPage';

export default function Page() {
  return <TrainingSessionRegistryPage title="Missing Attendance" params={{ attendanceStatus: 'Missing' }} />;
}
