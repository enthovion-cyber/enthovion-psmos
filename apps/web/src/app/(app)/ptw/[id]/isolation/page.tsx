import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitIsolationPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Isolation" />;
}
