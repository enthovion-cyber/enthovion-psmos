import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function MissingReliefSystemsPage() {
  return <ReliefSystemRegistryPage preset={{ missing: 'true' }} />;
}
