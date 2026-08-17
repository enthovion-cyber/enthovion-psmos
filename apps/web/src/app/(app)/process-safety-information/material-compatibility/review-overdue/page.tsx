import { MaterialCompatibilityRegistryPage } from '@/features/psi/material-compatibility/MaterialCompatibilityRegistryPage';

export default function MaterialCompatibilityReviewOverdueRoute() {
  return <MaterialCompatibilityRegistryPage preset={{ reviewOverdue: true }} />;
}

