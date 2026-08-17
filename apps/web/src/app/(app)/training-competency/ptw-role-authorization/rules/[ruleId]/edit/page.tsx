import { PtwAuthorizationRuleFormPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { ruleId: string } }) { return <PtwAuthorizationRuleFormPage ruleId={params.ruleId} />; }
