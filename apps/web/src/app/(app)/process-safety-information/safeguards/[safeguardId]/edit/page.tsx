import { SafeguardFormPage } from '@/features/psi/safeguards/SafeguardFormPage';
export default function EditSafeguardPage({ params }: { params: { safeguardId: string } }) { return <SafeguardFormPage safeguardId={params.safeguardId} />; }
