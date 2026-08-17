import { EquipmentDesignRegistryPage } from '@/features/psi/equipment-design/EquipmentDesignRegistryPage';

export default function MissingEquipmentDesignBasisPage() {
  return <EquipmentDesignRegistryPage preset={{ missing: true }} />;
}
