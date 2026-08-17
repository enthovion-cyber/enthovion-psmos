'use client';
import { TrainingButton } from '../../shared/TrainingUi';
import { useTrainingScheduledReports } from '../../hooks/useTrainingReports';
import { scheduledColumns, TrainingReportsListPage } from '../shared';
export function ScheduledReportsPage() { const query = useTrainingScheduledReports(); return <TrainingReportsListPage title="Scheduled Reports" subtitle="Recurring reports with delivery method, recipients, cadence, next run and lifecycle." query={query} columns={scheduledColumns} actions={<TrainingButton href="/training-competency/reports/scheduled/new">New Schedule</TrainingButton>} />; }
