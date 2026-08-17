import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

export default function SafeOperatingLimitSafeguardsPage({ params }: { params: { limitId: string } }) {
  return <SafeguardRegistryPage preset={{ sourceModule: 'Safe Operating Limits', sourceRecordId: params.limitId }} />;
}
