import { CompetencyGapRegisterPage } from '@/features/training/competency/CompetencyGapRegisterPage';
export default function Page({ params }: { params: { workerId: string } }) { return <CompetencyGapRegisterPage filter={{ workerId: params.workerId }} />; }
