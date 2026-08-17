import { MocTrainingScopedPage } from '@/features/training/moc/MocTrainingScopedPage';

export default function Page({ params }: { params: { unitId: string } }) {
  return <MocTrainingScopedPage scope="units" id={params.unitId} title="Unit MOC Training Requirements" />;
}
