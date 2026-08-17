import { PssrTrainingScopedPage } from '@/features/training/pssr/PssrTrainingScopedPage';
export default function Page({ params }: { params: { unitId: string } }) { return <PssrTrainingScopedPage scope="units" id={params.unitId} />; }
