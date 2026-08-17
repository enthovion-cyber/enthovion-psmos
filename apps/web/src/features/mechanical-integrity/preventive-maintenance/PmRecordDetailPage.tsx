'use client';

import { DataPanel } from '../equipment-detail/overview/panel-utils';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { usePmMutations } from '../hooks/usePmMutations';
import { usePmRecord } from '../hooks/usePmRecords';
import { PmChecklistExecution } from './PmChecklistExecution';
import { PmFindingPanel } from './PmFindingPanel';

export function PmRecordDetailPage({ recordId }: { recordId: string }) {
  const query = usePmRecord(recordId);
  const mutations = usePmMutations(undefined, recordId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">PM record could not be loaded.</div>;
  const data = query.data as any;
  return <div className="space-y-5"><header className="flex justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div><h1 className="text-xl font-bold">{data.record?.record_number}</h1><p className="text-sm text-[var(--psm-muted)]">PM execution record</p></div><button className="rounded bg-success px-3 py-2 text-sm text-white" onClick={() => mutations.approveRecord.mutate('Approved from detail')}>Approve</button></header><DataPanel title="PM Record" data={data.record ?? {}} /><PmChecklistExecution rows={data.checklist ?? []} /><PmFindingPanel findings={data.findings ?? []} /></div>;
}

