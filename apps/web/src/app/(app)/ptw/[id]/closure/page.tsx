import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitClosurePage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Closure" />;
}
