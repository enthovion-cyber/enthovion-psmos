import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitConflictsPage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Conflicts" />;
}
