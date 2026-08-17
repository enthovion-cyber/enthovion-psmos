import { EquipmentDesignRegistryPage } from '@/features/psi/equipment-design/EquipmentDesignRegistryPage';

export default function EquipmentDesignConflictsPage() {
  return <EquipmentDesignRegistryPage preset={{ conflictStatus: 'Open' }} />;
}
