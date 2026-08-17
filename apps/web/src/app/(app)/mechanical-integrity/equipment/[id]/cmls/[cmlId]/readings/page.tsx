import { UtReadingsPage } from '@/features/mechanical-integrity/ut-readings/UtReadingsPage';

export default function CmlUtReadingsPage({ params }: { params: { id: string; cmlId: string } }) {
  return <UtReadingsPage equipmentId={params.id} cmlId={params.cmlId} />;
}
