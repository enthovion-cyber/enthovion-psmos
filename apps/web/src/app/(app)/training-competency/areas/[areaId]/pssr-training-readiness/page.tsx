import { PssrTrainingScopedPage } from '@/features/training/pssr/PssrTrainingScopedPage';
export default function Page({ params }: { params: { areaId: string } }) { return <PssrTrainingScopedPage scope="areas" id={params.areaId} />; }
