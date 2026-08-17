import { PssrTrainingScopedPage } from '@/features/training/pssr/PssrTrainingScopedPage';
export default function Page({ params }: { params: { siteId: string } }) { return <PssrTrainingScopedPage scope="sites" id={params.siteId} />; }
