'use client';
import { useCompetencyLibrary } from '../hooks/useCompetencyLibrary';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CompetencyHeader } from './CompetencyHeader';
import { CompetencyLibraryTable } from './CompetencyLibraryTable';
export function CompetencyLibraryPage() { const query = useCompetencyLibrary(); if (query.isLoading) return <TrainingLoadingState rows={4} />; if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />; return <div className="space-y-5"><CompetencyHeader title="Competency Library" subtitle="Reusable competency definitions with impact-aware changes and no silent profile updates." /><TrainingCard title={`${query.data?.total ?? 0} reusable competencies`}><CompetencyLibraryTable rows={query.data?.rows ?? []} /></TrainingCard></div>; }
