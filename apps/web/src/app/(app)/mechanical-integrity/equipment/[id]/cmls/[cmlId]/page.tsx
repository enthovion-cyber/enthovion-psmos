import { CmlDetailPage } from '@/features/mechanical-integrity/cml/CmlDetailPage';

export default function Page({ params }: { params: { id: string; cmlId: string } }) {
  return <CmlDetailPage equipmentId={params.id} cmlId={params.cmlId} />;
}
