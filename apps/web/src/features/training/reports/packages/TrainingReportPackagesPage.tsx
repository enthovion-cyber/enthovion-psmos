'use client';
import { TrainingButton } from '../../shared/TrainingUi';
import { useTrainingReportPackages } from '../../hooks/useTrainingReports';
import { packageColumns, TrainingReportsListPage } from '../shared';
export function TrainingReportPackagesPage() { const query = useTrainingReportPackages(); return <TrainingReportsListPage title="Evidence Packages" subtitle="Audit, worker, MOC, PSSR, PTW and site evidence package register." query={query} columns={packageColumns} actions={<TrainingButton href="/training-competency/reports/packages/new">New Package</TrainingButton>} />; }
