import { WorkflowInstanceDetail } from '@/features/workflows/components/WorkflowInstanceDetail';

export default function WorkflowInstancePage({ params }: { params: { id: string } }) {
  return <WorkflowInstanceDetail id={params.id} />;
}
