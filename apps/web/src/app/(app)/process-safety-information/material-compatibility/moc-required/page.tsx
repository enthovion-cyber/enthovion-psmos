import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MaterialCompatibilityMocRequiredRoute() {
  return <MaterialCompatibilityRegistryPage preset={{ mocRequired: true }} />;
}

