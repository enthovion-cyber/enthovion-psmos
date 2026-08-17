import { RegulatoryObligationFormPage } from '@/features/regulatory/obligations/RegulatoryObligationFormPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryObligationFormPage regulationId={params.regulationId} />; }
