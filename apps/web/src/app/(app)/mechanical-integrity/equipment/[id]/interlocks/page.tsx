import { InterlockRegistryPage } from '@/features/mechanical-integrity/interlocks/InterlockRegistryPage';

export default function EquipmentInterlocksPage({ params }: { params: { id: string } }) {
  return <InterlockRegistryPage equipmentId={params.id} />;
}
