import { PssrAssignmentsNotificationsSection } from '../sections/PssrAssignmentsNotificationsSection';

export function PssrTrainingAssignmentsTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <PssrAssignmentsNotificationsSection rows={rows} />;
}

