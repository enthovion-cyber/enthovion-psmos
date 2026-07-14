'use client';

import { usePSSRTestingCommissioning } from '../../hooks/usePSSRTestingCommissioning';
import { usePSSRTestingMutations } from '../../hooks/usePSSRTestingMutations';
import { ElectricalInstrumentationTestingSection } from '../testing/ElectricalInstrumentationTestingSection';
import { GenerateSyncTestingControls } from '../testing/GenerateSyncTestingControls';
import { MechanicalPressureTestingSection } from '../testing/MechanicalPressureTestingSection';
import { ProcessCommissioningTestingSection } from '../testing/ProcessCommissioningTestingSection';
import { RequiredTestMatrix } from '../testing/RequiredTestMatrix';
import { SafetySystemTestingSection } from '../testing/SafetySystemTestingSection';
import { TestEvidenceCertificatesPanel } from '../testing/TestEvidenceCertificatesPanel';
import { TestRecordsTable } from '../testing/TestRecordsTable';
import { TestingBlockersPanel } from '../testing/TestingBlockersPanel';
import { TestingCommissioningSummaryCard } from '../testing/TestingCommissioningSummaryCard';
import { UtilitiesSupportSystemsTestingSection } from '../testing/UtilitiesSupportSystemsTestingSection';
import { ErrorState, LoadingState } from '../pssr-ui';

export function PSSRTestingCommissioningTab({ pssr }: { pssr: any }) {
  const query = usePSSRTestingCommissioning(pssr.id);
  const mutations = usePSSRTestingMutations(pssr.id);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load testing and commissioning data from API." />;
  const data = query.data ?? {};
  const section = (name: string) => (data.sections ?? []).find((item: any) => item.name === name) ?? { name, records: [] };
  const busy = mutations.generate.isPending || mutations.syncFromMoc.isPending || mutations.syncFromEngineering.isPending;
  return (
    <div className="space-y-4">
      <GenerateSyncTestingControls busy={busy} onGenerate={() => mutations.generate.mutate()} onSyncMoc={() => mutations.syncFromMoc.mutate()} onSyncEngineering={() => mutations.syncFromEngineering.mutate()} />
      <TestingCommissioningSummaryCard summary={data.summary} />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.9fr]">
        <RequiredTestMatrix requirements={data.requirements ?? []} />
        <TestingBlockersPanel blockers={data.blockers ?? []} />
      </div>
      <TestRecordsTable records={data.records ?? []} onPass={(id) => mutations.pass.mutate(id)} onFail={(id) => mutations.fail.mutate({ testRecordId: id, reason: 'Marked failed from PSSR testing tab' })} onVerify={(id) => mutations.verify.mutate(id)} />
      <div className="grid gap-4 xl:grid-cols-2">
        <SafetySystemTestingSection section={section('Safety System')} />
        <MechanicalPressureTestingSection section={section('Mechanical / Pressure')} />
        <ElectricalInstrumentationTestingSection section={section('Electrical / Instrumentation')} />
        <ProcessCommissioningTestingSection section={section('Process / Commissioning')} />
        <UtilitiesSupportSystemsTestingSection section={section('Utilities / Support Systems')} />
        <TestEvidenceCertificatesPanel evidence={data.evidence ?? []} />
      </div>
    </div>
  );
}
