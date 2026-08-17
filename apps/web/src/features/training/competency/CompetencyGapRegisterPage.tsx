'use client';
import { useCompetencyGaps } from '../hooks/useCompetencyGaps';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CompetencyHeader } from './CompetencyHeader';
import { CompetencyGapTable } from './CompetencyGapTable';
export function CompetencyGapRegisterPage({ filter = {} }: { filter?: Record<string, any> }) { const query = useCompetencyGaps(filter); if (query.isLoading) return <TrainingLoadingState rows={5} />; if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />; return <div className="space-y-5"><CompetencyHeader title="Competency Gap Register" subtitle="Backend-generated missing evidence, expired, verification, PTW, MOC, PSSR, and safety-critical competency gaps." /><TrainingCard title={`${query.data?.total ?? 0} competency gaps`}><CompetencyGapTable rows={query.data?.rows ?? []} /></TrainingCard></div>; }
