import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

export default function UnitProcessChemistrySafeguardsPage({ params }: { params: { unitId: string; chemistryId: string } }) {
  return <SafeguardRegistryPage unitId={params.unitId} preset={{ sourceModule: 'Process Chemistry', sourceRecordId: params.chemistryId }} />;
}
