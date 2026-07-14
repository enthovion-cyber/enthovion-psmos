import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitGasTestPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Gas Test" />;
}
