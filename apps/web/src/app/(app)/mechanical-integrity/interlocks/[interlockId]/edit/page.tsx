import { InterlockFormPage } from '@/features/mechanical-integrity/interlocks/InterlockFormPage';

export default function MechanicalIntegrityEditInterlockPage({ params }: { params: { interlockId: string } }) {
  return <InterlockFormPage interlockId={params.interlockId} />;
}
