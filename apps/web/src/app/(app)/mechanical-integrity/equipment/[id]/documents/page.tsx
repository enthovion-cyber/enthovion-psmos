import { DocumentsTab } from '@/features/mechanical-integrity/equipment-detail/tabs/DocumentsTab';

export default function Page({ params }: { params: { id: string } }) {
  return <DocumentsTab equipmentId={params.id} />;
}
