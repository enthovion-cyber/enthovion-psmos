import { PermitDetailPage } from '@/features/ptw/components/PermitDetailPage';

export default function PermitWorkforcePage({ params }: { params: { id: string } }) {
  return <PermitDetailPage id={params.id} initialTab="Workforce" />;
}
