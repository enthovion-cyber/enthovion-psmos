'use client';

import { Plus, RefreshCcw, ChevronDown, History } from 'lucide-react';
import { useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { Permit } from '@/services/ptw.service';
import { useGasTestMutations } from '../../hooks/useGasTestMutations';
import { useGasTestHistory, useGasTestTrends, usePermitGasTests, usePermitGasTestSummary, usePermitGasThresholds } from '../../hooks/usePermitGasTests';
import type { GasTestValues, GasThresholdValues } from '../../schemas/gas-test.schema';
import type { PermitGasTest } from '../../services/ptw-gas-test.service';
import { AddGasTestForm } from '../gas-test/AddGasTestForm';
import { GasTestBlockerBanner } from '../gas-test/GasTestBlockerBanner';
import { GasTestHistoryTable } from '../gas-test/GasTestHistoryTable';
import { GasTestSummaryCard } from '../gas-test/GasTestSummaryCard';
import { GasTrendChart } from '../gas-test/GasTrendChart';
import { LatestGasReadings } from '../gas-test/LatestGasReadings';
import { SiteGasThresholdPanel } from '../gas-test/SiteGasThresholdPanel';

export function PermitGasTestTab({ permit }: { permit: Permit }) {
  const tests = usePermitGasTests(permit.id);
  const summary = usePermitGasTestSummary(permit.id);
  const trends = useGasTestTrends(permit.id);
  const history = useGasTestHistory(permit.id);
  const thresholds = usePermitGasThresholds(permit.id);
  const mutations = useGasTestMutations(permit.id);
  const toast = useMutationToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PermitGasTest | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      const result = await work();
      toast.success(success);
      return result;
    } catch (error) {
      toast.error('Gas test action failed', error instanceof Error ? error.message : 'Request failed');
      return null;
    }
  }

  async function save(values: GasTestValues) {
    if (editing) await run(() => mutations.update.mutateAsync({ id: editing.id, input: values }), 'Gas test updated');
    else await run(() => mutations.create.mutateAsync(values), 'Gas test added');
    setShowForm(false);
    setEditing(null);
  }

  function edit(test: PermitGasTest) {
    setEditing(test);
    setShowForm(true);
  }

  if (tests.isLoading || summary.isLoading) return <LoadingSkeleton />;
  
  if (tests.isError || summary.isError) {
    return (
      <section className="rounded-xl border border-rose-500/20 bg-slate-900 p-6 text-center shadow-xl">
        <div className="font-bold text-rose-400">Unable to load gas test data.</div>
        <p className="mt-2 text-sm text-slate-400">Refresh the tab or check the PTW API connection.</p>
        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 mx-auto mt-4 transition-all hover:bg-slate-800 active:scale-95" 
          onClick={() => { tests.refetch(); summary.refetch(); trends.refetch(); thresholds.refetch(); }}
        >
          <RefreshCcw size={15} /> Retry Connection
        </button>
      </section>
    );
  }

  const latest = summary.data?.latest ?? tests.data?.[0] ?? null;
  const gasRequired = summary.data?.gasTestRequired ?? false;

  // Event list logic: limit to 3 items unless the view all button state is active
  const eventsList = history.data ?? [];
  const displayedEvents = showAllEvents ? eventsList : eventsList.slice(0, 3);
  const hasMoreThanThreeEvents = eventsList.length > 3;

  return (
    <div className="space-y-4">
      <GasTestSummaryCard summary={summary.data} />
      <GasTestBlockerBanner blockers={summary.data?.blockers ?? []} />

      {/* Atmospheric Controls Toolbar Panel */}
      <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Atmospheric Testing Controls</h2>
            <p className="mt-0.5 text-xs text-slate-400">Initial gas tests, periodic re-tests, threshold validation, instrument calibration, and automatic PTW blockers.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-sky-500 active:scale-95" 
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus size={15} /> Add Gas Test
            </button>
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 active:scale-95" 
              onClick={() => run(() => mutations.checkOverdue.mutateAsync(), 'Gas re-test status checked')}
            >
              Check Overdue
            </button>
          </div>
        </div>
      </section>

      {showForm ? (
        <AddGasTestForm 
          editing={editing} 
          saving={mutations.create.isPending || mutations.update.isPending} 
          onCancel={() => { setShowForm(false); setEditing(null); }} 
          onSubmit={save} 
        />
      ) : null}

      {!tests.data?.length && !showForm ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center shadow-lg">
          <div className="text-base font-bold text-slate-200">
            {gasRequired ? 'Gas test is required before permit activation.' : 'No gas test required for this permit.'}
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-400">
            Use Add Gas Test to record tester identity, instrument calibration, readings, and threshold validation rules.
          </p>
          {gasRequired ? (
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md mx-auto mt-4 transition-all hover:bg-sky-500 active:scale-95" 
              onClick={() => setShowForm(true)}
            >
              <Plus size={15} /> Add First Gas Test
            </button>
          ) : null}
        </section>
      ) : null}

      <LatestGasReadings latest={latest} trends={trends.data} />
      <GasTrendChart trends={trends.data} />
      
      <GasTestHistoryTable
        tests={tests.data ?? []}
        onEdit={edit}
        onValidate={(id) => run(() => mutations.validate.mutateAsync(id), 'Gas test validated')}
        onDelete={(id) => {
          if (window.confirm('Delete this gas test? This action is irreversible and will create an audit event.')) {
            run(() => mutations.remove.mutateAsync(id), 'Gas test deleted');
          }
        }}
      />
      
      <SiteGasThresholdPanel
        thresholds={thresholds.data ?? []}
        onCreate={(values: GasThresholdValues) => run(() => mutations.createThreshold.mutateAsync(values), 'Gas threshold created')}
        onUpdate={(id: string, values: GasThresholdValues) => run(() => mutations.updateThreshold.mutateAsync({ id, input: values }), 'Gas threshold updated')}
        onDelete={(id: string) => {
          if (window.confirm('Delete this gas threshold? This may affect future permit validation.')) {
            run(() => mutations.removeThreshold.mutateAsync(id), 'Gas threshold deleted');
          }
        }}
      />

      {/* Gas Test Event History Section featuring custom constraints */}
      <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Gas Test Event History
            </h3>
          </div>
          <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-300">
            {eventsList.length} {eventsList.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {eventsList.length ? (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-md">
              {displayedEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 transition-colors hover:bg-slate-950/80"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-xs text-slate-200 tracking-wide uppercase">
                      {event.event_type}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {event.description}
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-slate-400/80 border-t border-slate-800/30 pt-1.5">
                    Operator ID: <span className="font-mono text-slate-300">{event.user_id ?? 'System'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic View All Toggle Button */}
            {hasMoreThanThreeEvents && (
              <div className="flex justify-center pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-98"
                >
                  {showAllEvents ? 'Show Less' : `View All Events (${eventsList.length})`}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showAllEvents ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center text-xs font-medium text-slate-500">
            No system execution history found for this test profile.
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border border-slate-800/60 h-32 animate-pulse bg-slate-900/60 shadow-md" />
      ))}
    </div>
  );
}