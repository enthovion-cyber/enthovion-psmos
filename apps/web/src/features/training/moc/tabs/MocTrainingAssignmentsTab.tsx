import { MocAssignmentsNotificationsSection } from '../sections/MocAssignmentsNotificationsSection';

export function MocTrainingAssignmentsTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <MocAssignmentsNotificationsSection rows={rows} />;
}
