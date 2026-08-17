import { RegulatoryObligationDetailPage } from '@/features/regulatory/obligations/RegulatoryObligationDetailPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryObligationDetailPage obligationId={params.obligationId} />; }
