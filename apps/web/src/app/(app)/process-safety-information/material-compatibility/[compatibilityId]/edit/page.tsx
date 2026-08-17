import { MaterialCompatibilityFormPage } from '@/features/psi/material-compatibility/MaterialCompatibilityFormPage';

export default function EditMaterialCompatibilityRoute({ params }: { params: { compatibilityId: string } }) {
  return <MaterialCompatibilityFormPage compatibilityId={params.compatibilityId} />;
}

