import { MaterialCompatibilityDetailPage } from '@/features/psi/material-compatibility/MaterialCompatibilityDetailPage';

export default function MaterialCompatibilityDetailRoute({ params }: { params: { compatibilityId: string } }) {
  return <MaterialCompatibilityDetailPage compatibilityId={params.compatibilityId} />;
}

