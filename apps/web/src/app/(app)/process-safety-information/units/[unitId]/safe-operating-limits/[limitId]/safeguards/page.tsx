import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

export default function UnitSafeOperatingLimitSafeguardsPage({ params }: { params: { unitId: string; limitId: string } }) {
  return <SafeguardRegistryPage unitId={params.unitId} preset={{ sourceModule: 'Safe Operating Limits', sourceRecordId: params.limitId }} />;
}
