'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAssessments } from '../hooks/useAssessments';
import { AssessmentStatusBadge } from '../shared/AssessmentStatusBadge';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function AssessmentLibraryPage() {
  const [search, setSearch] = useState('');
  const query = useAssessments({ search });
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Assessment Library</h1><p className="text-sm text-[var(--psm-muted)]">Question banks, passing rules, validity periods, and safety-critical assessment setup.</p></div><TrainingButton href="/training-competency/assessments/library/new">New Assessment</TrainingButton></header><TrainingCard><input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search title, code, category..." value={search} onChange={(event) => setSearch(event.target.value)} /></TrainingCard><TrainingCard title="Library" subtitle={`${query.data?.total ?? 0} records`}>{!rows.length ? <TrainingEmptyState title="No assessments" message="Create an assessment to start assigning quizzes or evaluations." action={<TrainingButton href="/training-competency/assessments/library/new">Create Assessment</TrainingButton>} /> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Assessment</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Passing</th><th className="px-3 py-2">Critical</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold"><Link href={`/training-competency/assessments/library/${row.id}`}>{row.assessment_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.assessment_code ?? row.version ?? 'No code'}</p></td><td className="px-3 py-3">{row.assessment_type}</td><td className="px-3 py-3"><AssessmentStatusBadge status={row.assessment_status} /></td><td className="px-3 py-3">{row.passing_score}/{row.max_score}</td><td className="px-3 py-3">{[row.safety_critical && 'Safety', row.ptw_critical && 'PTW', row.moc_critical && 'MOC', row.pssr_critical && 'PSSR'].filter(Boolean).join(', ') || 'Normal'}</td></tr>)}</tbody></table></div>}</TrainingCard></div>;
}
