import { DrawingFormPage } from '@/features/psi/drawings/DrawingFormPage';

export default function NewUnitDrawingPage({ params }: { params: { unitId: string } }) {
  return <DrawingFormPage unitId={params.unitId} />;
}
