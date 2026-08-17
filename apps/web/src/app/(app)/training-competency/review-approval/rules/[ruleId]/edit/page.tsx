import { TrainingApprovalRuleFormPage } from '@/features/training/review/TrainingApprovalRuleFormPage';
export default function Page({ params }: { params: { ruleId: string } }) { return <TrainingApprovalRuleFormPage ruleId={params.ruleId} />; }
