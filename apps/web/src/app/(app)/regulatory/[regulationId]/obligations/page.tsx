import { RegulatoryObligationRegisterPage } from '@/features/regulatory/obligations/RegulatoryObligationRegisterPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryObligationRegisterPage initialFilters={{ regulatoryItemId: params.regulationId }} />; }
