import { MocTrainingBlockerRegisterPage } from '@/features/training/moc/MocTrainingBlockerRegisterPage';

export default function Page() {
  return <MocTrainingBlockerRegisterPage title="PSSR Startup Training Blockers" filters={{ blockerScope: 'startup' }} />;
}
