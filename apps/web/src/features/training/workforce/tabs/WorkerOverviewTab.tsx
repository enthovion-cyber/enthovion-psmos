import { TrainingCard, TrainingMetricCard } from '../../shared/TrainingUi';
import type { WorkerDetail } from '../../types/training.types';

export function WorkerOverviewTab({ detail }: { detail: WorkerDetail }) {
  const s = detail.summary;
  const cards = ['workerType', 'employer', 'primarySite', 'primaryUnit', 'jobTitle', 'department', 'trainingStatus', 'certificationStatus', 'ptwAuthorizationStatus', 'sopAcknowledgementStatus', 'mocTrainingStatus', 'pssrTrainingReadiness', 'reviewStatus', 'accountLinkStatus', 'workerStatus', 'documentsLinked'];
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cards.map((key) => <TrainingMetricCard key={key} label={key.replace(/([A-Z])/g, ' $1')} value={String(s[key] ?? 'Missing')} />)}</div>;
}

export function FoundationTab({ title, message, rows = [] }: { title: string; message: string; rows?: Array<Record<string, any>> }) {
  return <TrainingCard title={title} subtitle={message}>{rows.length ? <pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(rows, null, 2)}</pre> : <p className="text-sm text-[var(--psm-muted)]">{message}</p>}</TrainingCard>;
}
