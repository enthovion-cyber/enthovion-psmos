'use client';

import { TrainingRecordsHeader } from '../TrainingRecordsHeader';
import { TrainingSessionForm } from './TrainingSessionForm';

export function TrainingSessionFormPage({ sessionId }: { sessionId?: string | undefined }) {
  return <div className="space-y-5"><TrainingRecordsHeader title={sessionId ? 'Edit Training Session' : 'Create Training Session'} /><TrainingSessionForm sessionId={sessionId} /></div>;
}
