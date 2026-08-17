'use client';

import { TrainingCard } from '../../../shared/TrainingUi';
import { CompletionRecordTable } from '../../completions/CompletionRecordTable';

export function SessionCompletionsTab({ rows }: { rows: Record<string, any>[] }) {
  return <TrainingCard title="Completion Records" subtitle="Attendance does not equal completion unless backend evidence and rules allow it."><CompletionRecordTable rows={rows as any} /></TrainingCard>;
}
