import { TrainingCard } from '../shared/TrainingUi';
import { MocTrainingAssignmentTable } from './MocTrainingAssignmentTable';

export function MocTrainingEvidencePanel({ assignments = [] }: { assignments?: any[] }) {
  return <TrainingCard title="Evidence Register" subtitle="Training evidence, acknowledgements, assessments, certificates and verification status."><MocTrainingAssignmentTable rows={assignments} /></TrainingCard>;
}
