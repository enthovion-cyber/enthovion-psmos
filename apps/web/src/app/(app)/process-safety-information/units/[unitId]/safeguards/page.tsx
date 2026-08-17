import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';
export default function UnitSafeguardsPage({ params }: { params: { unitId: string } }) { return <SafeguardRegistryPage unitId={params.unitId} />; }
