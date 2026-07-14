import { PSSRDetailPage } from '@/features/pssr/components/detail/PSSRDetailPage';

export default function PSSRDetailRoute({ params }: { params: { id: string } }) {
  return <PSSRDetailPage id={params.id} />;
}
