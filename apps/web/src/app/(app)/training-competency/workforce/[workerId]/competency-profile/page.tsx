import { WorkerCompetencyProfilePage } from '@/features/training/competency/WorkerCompetencyProfilePage';
export default function Page({ params }: { params: { workerId: string } }) { return <WorkerCompetencyProfilePage workerId={params.workerId} />; }
