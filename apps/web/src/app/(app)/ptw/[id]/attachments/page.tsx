import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitAttachmentsPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Attachments" />;
}
