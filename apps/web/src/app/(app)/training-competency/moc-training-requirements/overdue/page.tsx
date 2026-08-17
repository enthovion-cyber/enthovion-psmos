import { MocTrainingAssignmentRegisterPage } from '@/features/training/moc/MocTrainingAssignmentRegisterPage';

export default function Page() {
  return <MocTrainingAssignmentRegisterPage title="Overdue MOC Training" filters={{ statusView: 'overdue' }} />;
}
