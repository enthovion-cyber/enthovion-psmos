import { OccurrenceExecutionPage } from '@/features/mechanical-integrity/inspection-records/OccurrenceExecutionPage';

export default function ExecuteInspectionOccurrencePage({ params }: { params: { occurrenceId: string } }) {
  return <OccurrenceExecutionPage occurrenceId={params.occurrenceId} />;
}
