import { MocTrainingAssignmentRegisterPage } from '@/features/training/moc/MocTrainingAssignmentRegisterPage';

export default function Page() {
  return <MocTrainingAssignmentRegisterPage title="Pending MOC Training" filters={{ statusView: 'pending' }} />;
}
