import { RegulatoryActionDetailPage } from '@/features/regulatory/actions/RegulatoryActionDetailPage';

export default function Page({ params }: { params: { actionLinkId: string } }) {
  return <RegulatoryActionDetailPage actionLinkId={params.actionLinkId} />;
}
