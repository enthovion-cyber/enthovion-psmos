import { MaterialCompatibilityDetailPage } from '@/features/psi/material-compatibility/MaterialCompatibilityDetailPage';

export default function UnitMaterialCompatibilityDetailRoute({ params }: { params: { compatibilityId: string } }) {
  return <MaterialCompatibilityDetailPage compatibilityId={params.compatibilityId} />;
}

