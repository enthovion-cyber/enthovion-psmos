import { DrawingDetailPage } from '@/features/psi/drawings/DrawingDetailPage';

export default function PsiDrawingDetailPage({ params }: { params: { drawingId: string } }) {
  return <DrawingDetailPage drawingId={params.drawingId} />;
}
