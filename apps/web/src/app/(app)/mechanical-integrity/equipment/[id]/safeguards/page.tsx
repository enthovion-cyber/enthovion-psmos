import { SifRegistryPage } from '@/features/mechanical-integrity/sif/SifRegistryPage';

export default function EquipmentSafeguardsPage({ params }: { params: { id: string } }) {
  return <SifRegistryPage equipmentId={params.id} />;
}
