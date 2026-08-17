import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MaterialCompatibilityConflictsRoute() {
  return <MaterialCompatibilityRegistryPage preset={{ conflicts: true }} />;
}

