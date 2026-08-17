import { TrainingCard } from '../shared/TrainingUi';
import { PssrTrainingAssignmentTable } from './PssrTrainingAssignmentTable';

export function PssrTrainingEvidencePanel({ assignments = [] }: { assignments?: any[] }) {
  return <TrainingCard title="Evidence Register" subtitle="Training evidence, acknowledgements, assessments, certificates and verification status."><PssrTrainingAssignmentTable rows={assignments} /></TrainingCard>;
}

