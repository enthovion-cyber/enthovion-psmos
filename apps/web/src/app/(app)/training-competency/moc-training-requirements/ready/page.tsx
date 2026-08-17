import { TrainingMocRequirementRegisterPage } from '@/features/training/moc/TrainingMocRequirementRegisterPage';

export default function Page() {
  return <TrainingMocRequirementRegisterPage title="MOCs Ready For Implementation" initialFilters={{ readinessStatus: 'Ready' }} />;
}
