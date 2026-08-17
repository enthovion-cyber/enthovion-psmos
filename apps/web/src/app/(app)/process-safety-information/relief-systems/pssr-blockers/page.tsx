import { ReliefSystemRegistryPage } from '@/features/psi/relief-systems/ReliefSystemRegistryPage';

export default function ReliefSystemPssrBlockersPage() {
  return <ReliefSystemRegistryPage preset={{ pssrBlocker: 'true' }} />;
}
