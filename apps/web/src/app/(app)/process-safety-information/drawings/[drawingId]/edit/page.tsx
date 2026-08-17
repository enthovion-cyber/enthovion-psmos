import { DrawingFormPage } from '@/features/psi/drawings/DrawingFormPage';

export default function EditPsiDrawingPage({ params }: { params: { drawingId: string } }) {
  return <DrawingFormPage drawingId={params.drawingId} />;
}
