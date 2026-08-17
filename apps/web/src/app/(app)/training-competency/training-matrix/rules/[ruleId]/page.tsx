import { MatrixRuleDetailPage } from '@/features/training/matrix/MatrixRuleDetailPage';

export default function Page({ params }: { params: { ruleId: string } }) {
  return <MatrixRuleDetailPage ruleId={params.ruleId} />;
}
