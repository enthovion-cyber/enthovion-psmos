import { RegulatoryItemDetailPage } from '@/features/regulatory/RegulatoryItemDetailPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryItemDetailPage id={params.regulationId} tab="compliance-status" />; }
