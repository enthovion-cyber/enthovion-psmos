import { LinkedRecordsTab } from '@/features/mechanical-integrity/equipment-detail/tabs/LinkedRecordsTab';

export default function Page({ params }: { params: { id: string } }) {
  return <LinkedRecordsTab equipmentId={params.id} />;
}
