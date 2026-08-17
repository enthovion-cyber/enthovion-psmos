import { ImpairmentFormPage } from '@/features/mechanical-integrity/impairments/ImpairmentFormPage';

export default function EditBypassImpairmentPage({ params }: { params: { impairmentId: string } }) {
  return <ImpairmentFormPage impairmentId={params.impairmentId} />;
}
