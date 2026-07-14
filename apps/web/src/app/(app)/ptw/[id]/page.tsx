import { PermitDetailPage as PermitDetailWorkbench } from '@/features/ptw/components/PermitDetailPage';

export default function PermitDetailPage({ params }: { params: { id: string } }) {
  return <PermitDetailWorkbench id={params.id} />;
}
