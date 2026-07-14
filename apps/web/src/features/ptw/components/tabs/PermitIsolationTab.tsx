'use client';

import { Plus, RefreshCcw, UploadCloud, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { Permit } from '@/services/ptw.service';
import { usePermitIsolation, usePermitIsolationCertificate, usePermitIsolationHistory, usePermitIsolationSummary } from '../../hooks/usePermitIsolation';
import { usePermitIsolationMutations } from '../../hooks/usePermitIsolationMutations';
import type { IsolationPointValues } from '../../schemas/isolation.schema';
import type { PermitIsolationPoint } from '../../services/ptw-isolation.service';
import { BlindSpadeSection } from '../isolation/BlindSpadeSection';
import { DeIsolationPanel } from '../isolation/DeIsolationPanel';
import { IsolationBlockerBanner } from '../isolation/IsolationBlockerBanner';
import { IsolationCertificatePanel } from '../isolation/IsolationCertificatePanel';
import { IsolationPointForm } from '../isolation/IsolationPointForm';
import { IsolationPointsTable } from '../isolation/IsolationPointsTable';
import { IsolationSummaryCard } from '../isolation/IsolationSummaryCard';
import { ValveIsolationSection } from '../isolation/ValveIsolationSection';

export function PermitIsolationTab({ permit }: { permit: Permit }) {
  const isolation = usePermitIsolation(permit.id);
  const summary = usePermitIsolationSummary(permit.id);
  const history = usePermitIsolationHistory(permit.id);
  const certificate = usePermitIsolationCertificate(permit.id);
  const mutations = usePermitIsolationMutations(permit.id);
  const toast = useMutationToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PermitIsolationPoint | null>(null);
  const [expandHistory, setExpandHistory] = useState(false);

  const points = isolation.data ?? [];
  const historyEvents = history.data ?? [];
  const busy = mutations.create.isPending || mutations.update.isPending;

  // Limit constants
  const INITIAL_HISTORY_LIMIT = 3;
  const visibleHistory = expandHistory ? historyEvents : historyEvents.slice(0, INITIAL_HISTORY_LIMIT);

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      const result = await work();
      toast.success(success);
      return result;
    } catch (error) {
      toast.error('Isolation action failed', error instanceof Error ? error.message : 'Request failed');
      return null;
    }
  }

  async function save(values: IsolationPointValues) {
    if (editing) {
      await run(() => mutations.update.mutateAsync({ id: editing.id, input: values }), 'Isolation point updated');
    } else {
      await run(() => mutations.create.mutateAsync(values), 'Isolation point added');
    }
    setShowForm(false);
    setEditing(null);
  }

  function edit(point: PermitIsolationPoint) {
    setEditing(point);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  if (isolation.isLoading || summary.isLoading) {
    return <LoadingSkeleton />;
  }

  if (isolation.isError || summary.isError) {
    return (
      <section className="psm-card p-6 text-center border border-danger/20 rounded-xl bg-[var(--psm-surface-1,inherit)]">
        <div className="font-bold text-danger">Unable to load isolation data.</div>
        <p className="mt-1 text-xs text-[var(--psm-muted)]">Refresh the tab or check the PTW API connection.</p>
        <button 
          className="psm-button psm-button-secondary mx-auto mt-4 text-xs font-semibold px-4 py-2 flex items-center gap-2 border border-[var(--psm-line)] rounded-lg hover:bg-[var(--psm-surface-2)]" 
          onClick={() => { isolation.refetch(); summary.refetch(); }}
        >
          <RefreshCcw size={14} /> Retry Layout Connection
        </button>
      </section>
    );
  }

  const emptyText = summary.data?.isolationRequired
    ? 'Isolation is required. Add isolation points or import from Equipment Registry.'
    : 'No isolation required for this permit.';

  return (
    <div className="space-y-4">
      <IsolationSummaryCard summary={summary.data} />
      <IsolationBlockerBanner blockers={summary.data?.blockers ?? []} />

      {/* Main Isolation Controls Banner */}
      <section className="psm-card p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-1,inherit)] shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Isolation Controls
            </h2>
            <p className="mt-1 text-xs font-medium text-[var(--psm-muted)]/80 leading-relaxed">
              Manage LOTO, valve isolation, blind/spade controls, signatures, de-isolation, and certificates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button 
              className="psm-button psm-button-primary text-xs font-bold px-4 py-2.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 transition-all hover:bg-primary/90 active:scale-[0.985]" 
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus size={14} /> Add Isolation Point
            </button>
            <button 
              className="psm-button psm-button-secondary text-xs font-bold px-4 py-2.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-1)] text-foreground flex items-center gap-2 transition-all hover:bg-[var(--psm-surface-2)] active:scale-[0.985]" 
              onClick={() => run(() => mutations.importFromEquipment.mutateAsync(), 'Equipment isolation import completed')}
            >
              <UploadCloud size={14} /> Import From Equipment
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <IsolationPointForm 
          equipmentTag={permit.equipment_tag} 
          editing={editing} 
          saving={busy} 
          onCancel={closeForm} 
          onSubmit={save} 
        />
      )}

      {/* Empty States / Main Table */}
      {!points.length ? (
        <section className="psm-card p-8 text-center border border-dashed border-[var(--psm-line)] rounded-xl bg-[var(--psm-surface-2)]/20 flex flex-col items-center justify-center">
          <div className="text-sm font-bold tracking-tight text-foreground">{emptyText}</div>
          <p className="mx-auto mt-1.5 max-w-xl text-xs font-medium text-[var(--psm-muted)] leading-relaxed">
            Use Add Isolation Point for manual entry or Import From Equipment to pull available LOTO suggestions from the Equipment Registry.
          </p>
          {summary.data?.isolationRequired && (
            <button 
              className="psm-button psm-button-primary mx-auto mt-4 text-xs font-bold px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.985]" 
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Add First Isolation Point
            </button>
          )}
        </section>
      ) : (
        <IsolationPointsTable
          points={points}
          onEdit={edit}
          onDelete={(id) => run(() => mutations.remove.mutateAsync(id), 'Isolation point deleted')}
          onConfirm={(id) => run(() => mutations.confirm.mutateAsync(id), 'Isolation confirmed')}
          onVerify={(id) => run(() => mutations.verify.mutateAsync(id), 'Isolation verified')}
          onDeIsolate={(id) => run(() => mutations.deIsolate.mutateAsync(id), 'Isolation point de-isolated')}
          onRemovalVerify={(id) => run(() => mutations.removalVerify.mutateAsync(id), 'Removal verified')}
        />
      )}

      {/* Section Sub-Grids */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ValveIsolationSection points={points} />
        <BlindSpadeSection points={points} />
      </div>

      <DeIsolationPanel 
        points={points} 
        summary={summary.data} 
        onStart={() => run(() => mutations.startDeIsolation.mutateAsync(), 'De-isolation started')} 
      />

      <IsolationCertificatePanel 
        permitId={permit.id} 
        summary={summary.data} 
        certificate={certificate.data} 
        onGenerate={() => run(() => mutations.generateCertificate.mutateAsync(), 'Isolation certificate generated')} 
      />

      {/* Isolation History Section with controlled display count */}
      <section className="psm-card p-5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-1,inherit)] shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)]/20 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[var(--psm-muted)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Isolation History
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)]/30 text-[var(--psm-muted)]">
            {historyEvents.length} {historyEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {historyEvents.length ? (
          <div className="space-y-2">
            <div className="space-y-2 transition-all duration-300">
              {visibleHistory.map((event) => (
                <div 
                  key={event.id} 
                  className="rounded-lg border border-[var(--psm-line)]/40 bg-[var(--psm-surface-2)]/60 px-4 py-3 text-xs font-medium border-l-2 border-l-primary/60 transition-colors hover:bg-[var(--psm-surface-2)]"
                >
                  <div className="font-bold text-foreground tracking-tight text-sm mb-0.5">
                    {event.event_type}
                  </div>
                  <div className="text-[var(--psm-muted)] leading-relaxed mb-1.5 font-medium">
                    {event.description}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--psm-muted)]/60 flex items-center gap-1">
                    <span>{new Date(event.created_at).toLocaleString()}</span>
                    <span className="opacity-40">•</span>
                    <span className="text-primary/80 uppercase">{event.user_id ?? 'System'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Option Button Container */}
            {historyEvents.length > INITIAL_HISTORY_LIMIT && (
              <button
                onClick={() => setExpandHistory(!expandHistory)}
                className="mt-2 w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-[var(--psm-surface-2)]/40 rounded-lg border border-[var(--psm-line)]/30 active:scale-[0.995]"
              >
                {expandHistory ? (
                  <>
                    Show Less <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    View All Remaining ({historyEvents.length - INITIAL_HISTORY_LIMIT}) <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30 p-8 text-center text-xs font-medium text-[var(--psm-muted)]">
            No isolation history logs yet.
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
        <div key={item} className="psm-card h-32 animate-pulse bg-[var(--psm-surface-2)] rounded-xl border border-[var(--psm-line)]/30" />
      ))}
    </div>
  );
}