import { AuditProgramDetailPage } from '@/features/audit/programs/AuditProgramDetailPage';
export default function Page({ params }: { params: { programId: string } }) { return <AuditProgramDetailPage programId={params.programId} tab="scope" />; }
