import { ElectricalClassificationRegistryPage } from '@/features/psi/electrical-classification/ElectricalClassificationRegistryPage';

export default function ElectricalRatingMismatchesPage() {
  return <ElectricalClassificationRegistryPage preset={{ ratingMismatches: true }} />;
}
