import { MatrixRuleFormPage } from '@/features/training/matrix/MatrixRuleFormPage';

export default function Page({ params }: { params: { ruleId: string } }) {
  return <MatrixRuleFormPage ruleId={params.ruleId} />;
}
