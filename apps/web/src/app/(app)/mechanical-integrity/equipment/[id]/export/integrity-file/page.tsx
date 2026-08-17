import { EquipmentIntegrityFileExport } from '@/features/mechanical-integrity/export/EquipmentIntegrityFileExport';

export default function Page({ params }: { params: { id: string } }) {
  return <main className="p-4 lg:p-6"><EquipmentIntegrityFileExport equipmentId={params.id} /></main>;
}
