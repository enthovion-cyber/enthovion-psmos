import { OccurrenceExecutionPage } from '@/features/mechanical-integrity/inspection-records/OccurrenceExecutionPage';

export default function CompleteInspectionOccurrencePage({ params }: { params: { occurrenceId: string } }) {
  return <OccurrenceExecutionPage occurrenceId={params.occurrenceId} />;
}
