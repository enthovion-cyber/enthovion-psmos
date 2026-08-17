import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MaterialCompatibilityPssrBlockersRoute() {
  return <MaterialCompatibilityRegistryPage preset={{ pssrBlockers: true }} />;
}

