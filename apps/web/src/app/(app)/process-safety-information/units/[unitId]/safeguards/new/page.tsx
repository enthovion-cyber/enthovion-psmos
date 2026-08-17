import { SafeguardFormPage } from '@/features/psi/safeguards/SafeguardFormPage';
export default function NewUnitSafeguardPage({ params }: { params: { unitId: string } }) { return <SafeguardFormPage forcedUnitId={params.unitId} />; }
