import { CmlDetailPage } from '@/features/mechanical-integrity/cml/CmlDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return <CmlDetailPage equipmentId={params.id} />;
}
