'use client';

import { DataPanel } from '../equipment-detail/overview/panel-utils';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCalibrationMutations } from '../hooks/useCalibrationMutations';
import { useCalibrationRecord } from '../hooks/useCalibrationRecords';
import { AsFoundReadingsSection } from './AsFoundReadingsSection';
import { AsLeftReadingsSection } from './AsLeftReadingsSection';
import { CalibrationCertificatePanel } from './CalibrationCertificatePanel';
import { CalibrationToleranceEvaluationPanel } from './CalibrationToleranceEvaluationPanel';

export function CalibrationRecordDetailPage({ recordId }: { recordId: string }) {
  const query = useCalibrationRecord(recordId);
  const mutations = useCalibrationMutations(undefined, recordId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Calibration record could not be loaded.</div>;
  const data = query.data as any;
  return <div className="space-y-5"><header className="flex justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div><h1 className="text-xl font-bold">{data.record?.record_number}</h1><p className="text-sm text-[var(--psm-muted)]">Calibration execution and tolerance evaluation</p></div><div className="flex gap-2"><button className="rounded border border-[var(--psm-line)] px-3 py-2 text-sm" onClick={() => mutations.evaluateRecord.mutate()}>Evaluate</button><button className="rounded bg-success px-3 py-2 text-sm text-white" onClick={() => mutations.approveRecord.mutate('Approved from detail')}>Approve</button></div></header><DataPanel title="Calibration Record" data={data.record ?? {}} /><CalibrationToleranceEvaluationPanel evaluations={data.evaluations ?? []} /><AsFoundReadingsSection points={data.points ?? []} /><AsLeftReadingsSection points={data.points ?? []} /><CalibrationCertificatePanel record={data.record ?? {}} /></div>;
}

