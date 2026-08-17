import { MocTrainingScopedPage } from '@/features/training/moc/MocTrainingScopedPage';

export default function Page({ params }: { params: { siteId: string } }) {
  return <MocTrainingScopedPage scope="sites" id={params.siteId} title="Site MOC Training Requirements" />;
}
