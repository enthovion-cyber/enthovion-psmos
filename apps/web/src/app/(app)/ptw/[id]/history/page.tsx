import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitHistoryPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="History" />;
}
