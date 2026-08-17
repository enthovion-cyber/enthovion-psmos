import { RegulatoryObligationFormPage } from '@/features/regulatory/obligations/RegulatoryObligationFormPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryObligationFormPage obligationId={params.obligationId} />; }
