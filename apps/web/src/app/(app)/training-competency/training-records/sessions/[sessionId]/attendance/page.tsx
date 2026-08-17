import { AttendanceEntryPage } from '@/features/training/records/attendance/AttendanceEntryPage';

export default function Page({ params }: { params: { sessionId: string } }) {
  return <AttendanceEntryPage sessionId={params.sessionId} />;
}
