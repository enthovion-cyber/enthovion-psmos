import { InspectionScheduleTab } from '@/features/mechanical-integrity/equipment-detail/tabs/InspectionScheduleTab';

export default function EquipmentInspectionSchedulePage({ params }: { params: { id: string } }) {
  return <InspectionScheduleTab equipmentId={params.id} />;
}
