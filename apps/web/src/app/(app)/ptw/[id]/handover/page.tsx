import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitHandoverPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Shift Handover" />;
}
