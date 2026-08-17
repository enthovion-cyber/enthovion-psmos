import { CompetencyFormPage } from '@/features/training/competency/CompetencyFormPage';
export default function Page({ params }: { params: { competencyId: string } }) { return <CompetencyFormPage competencyId={params.competencyId} />; }
