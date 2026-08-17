import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';
export default function EquipmentSafeguardsPage({ params }: { params: { equipmentId: string } }) { return <SafeguardRegistryPage equipmentId={params.equipmentId} />; }
