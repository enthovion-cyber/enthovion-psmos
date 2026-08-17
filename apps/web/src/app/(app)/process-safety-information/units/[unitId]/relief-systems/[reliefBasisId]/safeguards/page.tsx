import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

export default function UnitReliefSystemSafeguardsPage({ params }: { params: { unitId: string; reliefBasisId: string } }) {
  return <SafeguardRegistryPage unitId={params.unitId} preset={{ sourceModule: 'Relief Systems', sourceRecordId: params.reliefBasisId }} />;
}
