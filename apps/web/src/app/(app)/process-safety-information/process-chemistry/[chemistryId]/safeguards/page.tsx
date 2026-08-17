import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

export default function ProcessChemistrySafeguardsPage({ params }: { params: { chemistryId: string } }) {
  return <SafeguardRegistryPage preset={{ sourceModule: 'Process Chemistry', sourceRecordId: params.chemistryId }} />;
}
