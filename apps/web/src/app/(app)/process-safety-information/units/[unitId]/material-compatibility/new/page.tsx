import { MaterialCompatibilityFormPage } from '@/features/psi/material-compatibility/MaterialCompatibilityFormPage';

export default function NewUnitMaterialCompatibilityRoute({ params }: { params: { unitId: string } }) {
  return <MaterialCompatibilityFormPage unitId={params.unitId} />;
}

