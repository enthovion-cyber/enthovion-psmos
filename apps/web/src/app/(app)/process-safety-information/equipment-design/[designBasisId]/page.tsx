import { EquipmentDesignDetailPage } from '@/features/psi/equipment-design/EquipmentDesignDetailPage';

export default function EquipmentDesignBasisDetailRoute({ params }: { params: { designBasisId: string } }) {
  return <EquipmentDesignDetailPage designBasisId={params.designBasisId} />;
}
