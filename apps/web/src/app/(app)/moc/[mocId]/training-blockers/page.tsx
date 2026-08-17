import { MocTrainingMocScopePage } from '@/features/training/moc/MocTrainingMocScopePage';

export default function Page({ params }: { params: { mocId: string } }) {
  return <MocTrainingMocScopePage mocId={params.mocId} view="blockers" />;
}
