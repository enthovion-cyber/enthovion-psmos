import { SafeguardRegistryPage } from '@/features/psi/safeguards/SafeguardRegistryPage';

export default function ReliefSystemSafeguardsPage({ params }: { params: { reliefBasisId: string } }) {
  return <SafeguardRegistryPage preset={{ sourceModule: 'Relief Systems', sourceRecordId: params.reliefBasisId }} />;
}
