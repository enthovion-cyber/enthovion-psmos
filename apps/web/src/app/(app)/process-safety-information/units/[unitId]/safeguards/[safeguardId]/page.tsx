import { SafeguardDetailPage } from '@/features/psi/safeguards/SafeguardDetailPage';
export default function UnitSafeguardDetailPage({ params }: { params: { safeguardId: string } }) { return <SafeguardDetailPage safeguardId={params.safeguardId} />; }
