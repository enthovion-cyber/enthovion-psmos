import { CmlImportPage } from '@/features/mechanical-integrity/cml-import/CmlImportPage';

export default function Page({ params }: { params: { id: string } }) {
  return <CmlImportPage equipmentId={params.id} />;
}
