import { SafeguardTestFormPage } from '@/features/mechanical-integrity/safeguard-tests/SafeguardTestFormPage';

export default function MechanicalIntegrityEditSafeguardTestPage({ params }: { params: { testId: string } }) {
  return <SafeguardTestFormPage testId={params.testId} />;
}
