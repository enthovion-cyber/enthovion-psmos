import { PssrTrainingPssrScopePage } from '@/features/training/pssr/PssrTrainingPssrScopePage';
export default function Page({ params }: { params: { pssrId: string } }) { return <PssrTrainingPssrScopePage pssrId={params.pssrId} view="impact" />; }
