import { TrainingBadge } from './TrainingUi';

export function PssrApprovalBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Approval Blocker' : 'No Approval Blocker'}</TrainingBadge>;
}

