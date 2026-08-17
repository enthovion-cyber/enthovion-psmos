import { DrawingDetailPage } from '@/features/psi/drawings/DrawingDetailPage';

export default function UnitDrawingDetailPage({ params }: { params: { drawingId: string } }) {
  return <DrawingDetailPage drawingId={params.drawingId} />;
}
