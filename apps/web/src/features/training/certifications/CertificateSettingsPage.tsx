'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '../services/training-api';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function CertificateSettingsPage() {
  const query = useQuery({ queryKey: ['training', 'cert-assessment', 'settings'], queryFn: () => get<Record<string, unknown>>('/training-competency/cert-assessment/settings') });
  if (query.isLoading) return <TrainingLoadingState rows={3} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <TrainingCard title="Certificate + Assessment Settings" subtitle="Company/site expiry, verification, matrix, competency, notification, and e-signature policy values."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></TrainingCard>;
}
