import { ActionDetail } from '@/features/actions/components/ActionDetail';

export default function ActionDetailPage({ params }: { params: { id: string } }) {
  return <ActionDetail id={params.id} />;
}
