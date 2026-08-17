import { TechnicalDataPage } from '@/features/mechanical-integrity/technical-data/TechnicalDataPage';

export default function Page({ params }: { params: { id: string } }) {
  return <TechnicalDataPage id={params.id} />;
}
