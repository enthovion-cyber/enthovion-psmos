'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { SignatureDialog } from '@/features/signatures/components/SignatureDialog';
import type { SignatureContext } from '@/features/signatures/services/signature.service';
import { defaultHandoverValues, type HandoverValues } from '../../schemas/handover.schema';
import { usePermitHandover, usePermitHandoverHistory, usePermitHandoverReadiness } from '../../hooks/usePermitHandover';
import { usePermitHandoverMutations } from '../../hooks/usePermitHandoverMutations';
import { CurrentShiftCard } from '../handover/CurrentShiftCard';
import { HandoverActionPanel } from '../handover/HandoverActionPanel';
import { HandoverChecklistCard } from '../handover/HandoverChecklistCard';
import { HandoverHistoryTable } from '../handover/HandoverHistoryTable';
import { HandoverNotesForm } from '../handover/HandoverNotesForm';
import { HandoverValidityReviewCard } from '../handover/HandoverValidityReviewCard';
import { IncomingShiftCard } from '../handover/IncomingShiftCard';
import { PermitRiskReviewCard } from '../handover/PermitRiskReviewCard';

export function PermitShiftHandoverTab({ permit }: { permit: any }) {
  const current = usePermitHandover(permit.id);
  const readiness = usePermitHandoverReadiness(permit.id);
  const history = usePermitHandoverHistory(permit.id);
  const mutations = usePermitHandoverMutations(permit.id);
  const toast = useMutationToast();
  const handover = current.data;
  const [handoverSignature, setHandoverSignature] = useState<SignatureContext | null>(null);
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.checklist.isPending || mutations.acknowledge.isPending || mutations.complete.isPending || mutations.suspend.isPending || mutations.remove.isPending;
  const completionBlockers = handover ? handoverCompletionBlockers(handover) : [];

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      await work();
      toast.success(success);
    } catch (error) {
      toast.error('Shift handover action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  const createValues = (): HandoverValues => ({
    ...defaultHandoverValues(),
    outgoingSupervisorName: permit.issuer?.displayName ?? permit.created_by ?? 'Outgoing Supervisor',
    incomingSupervisorName: permit.holder?.displayName ?? 'Incoming Supervisor',
    incomingSupervisorContact: permit.holder?.email ?? '',
    workProgressNotes: permit.work_description ?? '',
    checklist: {}
  });

  return (
    <div className="w-full space-y-4 px-2 sm:px-4">
      {/* Loading State */}
      {current.isLoading || readiness.isLoading ? <Skeleton /> : null}
      
      {/* Error Alert Box */}
      {current.isError || readiness.isError ? (
        <section className="psm-card p-4 text-sm text-danger sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center">
              <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0 inline sm:mt-0" /> 
              <span>Unable to load shift handover data.</span>
            </div>
            <button 
              onClick={() => { current.refetch(); readiness.refetch(); history.refetch(); }} 
              className="psm-button psm-button-secondary flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </section>
      ) : null}
      
      {/* Empty State Banner */}
      {!current.isLoading && !handover ? (
        <section className="psm-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold sm:text-lg">No shift handover recorded yet.</h2>
              <p className="mt-1 text-xs text-[var(--psm-muted)] sm:text-sm">
                Create handover when permit continues into next shift.
              </p>
            </div>
            <button 
              onClick={() => run(() => mutations.create.mutateAsync(createValues()), 'Shift handover created')} 
              className="psm-button psm-button-primary w-full sm:w-auto text-center"
            >
              Create Handover
            </button>
          </div>
        </section>
      ) : null}

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        
        {/* Left Side: Main Content Forms & Details */}
        <div className="space-y-4 order-2 xl:order-1 min-w-0">
          
          {/* Shift Details Sub-grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CurrentShiftCard handover={handover} permit={permit} />
            <IncomingShiftCard 
              handover={handover} 
              acknowledging={mutations.acknowledge.isPending} 
              onAcknowledge={() => {
                if (!handover) return;
                setHandoverSignature({
                  moduleName: 'PTW',
                  recordType: 'shift_handover',
                  recordId: handover.id,
                  recordNumber: `${permit.permit_number ?? permit.permitNumber ?? permit.id} · Handover`,
                  actionType: 'complete',
                  signatureRole: 'Incoming Performing Authority',
                  declarationText: 'I acknowledge responsibility for this permit, the current work status, hazards, controls, and handover notes for the incoming shift.',
                  metadata: { permitId: permit.id, originatorId: permit.created_by ?? null }
                });
              }} 
            />
          </div>
          
          {/* Checklist Card */}
          <HandoverChecklistCard 
            handover={handover} 
            busy={mutations.checklist.isPending} 
            onToggle={(itemId, isChecked) => {
              if (!handover) return;
              run(() => mutations.checklist.mutateAsync({ handoverId: handover.id, itemId, isChecked }), 'Checklist updated');
            }} 
          />
          
        
          
          {/* Handover Notes Form */}
          <HandoverNotesForm 
            handover={handover} 
            saving={mutations.update.isPending} 
            onSave={(values) => {
              if (!handover) return;
              run(() => mutations.update.mutateAsync({ id: handover.id, input: values }), 'Draft handover saved');
            }} 
          />
          
          {/* History Data Table Wrapper */}
          <div className="overflow-x-auto w-full rounded-lg">
            <HandoverHistoryTable rows={history.data} loading={history.isLoading} />
          </div>
        </div>
        
        {/* Right Side: Quick Action Sidebar panel */}
        <aside className="space-y-4 order-1 xl:order-2">
          <HandoverActionPanel
            handover={handover}
            busy={busy}
            completionBlockers={completionBlockers}
            onCreate={() => run(() => mutations.create.mutateAsync(createValues()), 'Shift handover created')}
            onComplete={() => {
              if (!handover) return;
              const blockers = handoverCompletionBlockers(handover);
              if (blockers.length) {
                toast.warning('Shift handover completion blocked', blockers.join(' '));
                return;
              }
              run(() => mutations.complete.mutateAsync(handover.id), 'Shift handover completed');
            }}
            onSuspend={() => {
              if (!handover) return;
              const reason = window.prompt('Reason for suspending permit during handover');
              if (!reason) return;
              run(() => mutations.suspend.mutateAsync({ id: handover.id, reason }), 'Permit suspended during handover');
            }}
            onDelete={() => {
              if (!handover || !window.confirm('Delete this draft handover? This cannot be undone.')) return;
              run(() => mutations.remove.mutateAsync(handover.id), 'Draft handover deleted');
            }}
          />
          
          {/* Warning System Card */}
          <section className="psm-card p-4 sm:p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)] sm:text-sm">
              Warnings
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              {readiness.data?.expiry.expiresWithinTwoHours ? <Warning text="Permit expires within 2 hours." /> : null}
              {readiness.data?.gasTest.overdue ? <Warning text="Gas re-test is overdue." /> : null}
              {readiness.data?.gasTest.dueSoon ? <Warning text="Gas re-test is due soon." /> : null}
              {readiness.data?.conflicts.openCount ? <Warning text={`${readiness.data.conflicts.openCount} open conflict(s) require review.`} /> : null}
              {!readiness.data?.expiry.expiresWithinTwoHours && !readiness.data?.gasTest.overdue && !readiness.data?.gasTest.dueSoon && !readiness.data?.conflicts.openCount ? (
                <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-success">
                  No critical handover warnings.
                </div>
              ) : null}
            </div>
          </section>

            {/* Risk and Validity Sub-grid */}
          <div className="grid grid-row-2 gap-4 md:grid-rows-2">
            <PermitRiskReviewCard readiness={readiness.data} permit={permit} />
            <HandoverValidityReviewCard readiness={readiness.data} />
          </div>

        </aside>

      </div>
      <SignatureDialog
        context={handoverSignature}
        onClose={() => setHandoverSignature(null)}
        onSigned={() => {
          const signed = handoverSignature;
          setHandoverSignature(null);
          if (signed) run(() => mutations.acknowledge.mutateAsync({ id: signed.recordId, signature: 'Universal electronic signature completed' }), 'Incoming shift acknowledged');
        }}
      />
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-warning flex items-start sm:items-center">
      <AlertTriangle size={14} className="mr-2 mt-0.5 shrink-0 inline sm:mt-0" />
      <span>{text}</span>
    </div>
  );
}

function handoverCompletionBlockers(handover: any) {
  const missing = (handover.checklistItems ?? [])
    .filter((item: any) => item.is_required && !item.is_checked)
    .map((item: any) => item.checklist_label ?? item.checklist_key);
  const blockers = [];
  if (missing.length) blockers.push(`Complete required checklist: ${missing.join(', ')}.`);
  if (handover.acknowledgement_status !== 'Acknowledged') blockers.push('Incoming supervisor acknowledgement is required.');
  return blockers;
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="psm-card h-36 animate-pulse bg-[var(--psm-surface-2)]" />
      ))}
    </div>
  );
}
