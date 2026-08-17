import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MaterialCompatibilityIncompatibleRoute() {
  return <MaterialCompatibilityRegistryPage preset={{ incompatible: true }} />;
}

