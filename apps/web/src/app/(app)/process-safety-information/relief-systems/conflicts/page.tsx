import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function ReliefSystemConflictsPage() {
  return <ReliefSystemRegistryPage preset={{ conflictStatus: 'Critical Conflict' }} />;
}
