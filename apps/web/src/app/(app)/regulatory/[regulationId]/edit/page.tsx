import { RegulatoryItemFormPage } from '@/features/regulatory/RegulatoryItemFormPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryItemFormPage id={params.regulationId} />; }
