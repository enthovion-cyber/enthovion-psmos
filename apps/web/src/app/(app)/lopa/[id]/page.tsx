import { LopaDetailPage } from '@/features/lopa/components/detail/LopaDetailPage';

export default function LopaStudyDetailRoute({ params }: { params: { id: string } }) {
  return <LopaDetailPage id={params.id} />;
}
