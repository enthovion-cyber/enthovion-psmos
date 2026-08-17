import { DrawingRegistryPage } from '@/features/psi/drawings/DrawingRegistryPage';

export default function UnitDrawingsPage({ params }: { params: { unitId: string } }) {
  return <DrawingRegistryPage unitId={params.unitId} />;
}
