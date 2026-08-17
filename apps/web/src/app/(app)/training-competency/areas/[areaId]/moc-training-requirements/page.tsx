import { MocTrainingScopedPage } from '@/features/training/moc/MocTrainingScopedPage';

export default function Page({ params }: { params: { areaId: string } }) {
  return <MocTrainingScopedPage scope="areas" id={params.areaId} title="Area MOC Training Requirements" />;
}
