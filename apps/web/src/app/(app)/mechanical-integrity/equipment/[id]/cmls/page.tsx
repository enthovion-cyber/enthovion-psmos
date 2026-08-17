import { CmlRegistryPage } from '@/features/mechanical-integrity/cml/CmlRegistryPage';

export default function Page({ params }: { params: { id: string } }) {
  return <CmlRegistryPage equipmentId={params.id} />;
}
