import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MaterialCompatibilityMissingRoute() {
  return <MaterialCompatibilityRegistryPage preset={{ missing: true }} />;
}

