'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock,
  Unlock,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Search,
  FileCheck2,
  Cpu,
  Layers
} from 'lucide-react';
import {
  PsiButton,
  PsiCard,
  PsiEmptyState,
  PsiErrorState,
  PsiLoadingState,
  PsiMetricCard
} from '../shared/PsiUi';
import {
  PsiIntegrationHeader,
  IntegrationImpactTable,
  MocClosureBlockerPanel
} from './PsiIntegrationPanels';
import { useIntegrationImpactRegister } from './hooks/usePsiIntegrations';
import { mocPsiImpactService } from './services/psi-integration.service';

export function MocPsiIntegrationPage() {
  const queryClient = useQueryClient();
  const [selectedMocId, setSelectedMocId] = useState('');
  const [activeMocInput, setActiveMocInput] = useState('');
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'warn' | 'error' | 'info';
    text: string;
  } | null>(null);

  // General MOC integration register rows
  const registerQuery = useIntegrationImpactRegister({ sourceModule: 'MOC' });

  // Specific MOC impact query (when selected)
  const impactQuery = useQuery({
    queryKey: ['psi', 'integrations', 'moc-impact', selectedMocId],
    queryFn: () => mocPsiImpactService.getImpact(selectedMocId),
    enabled: Boolean(selectedMocId)
  });

  // Mutations
  const runImpactMutation = useMutation({
    mutationFn: (mocId: string) => mocPsiImpactService.runImpact(mocId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['psi', 'integrations'] });
      setActionMessage({
        type: 'info',
        text: `PSI impact evaluation completed. Found ${data?.items?.length ?? 0} impacted technical items.`
      });
    },
    onError: (err: any) => {
      setActionMessage({
        type: 'error',
        text: `Failed to evaluate impact: ${err.message || 'Server error'}`
      });
    }
  });

  const lockMutation = useMutation({
    mutationFn: (mocId: string) => mocPsiImpactService.lock(mocId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['psi'] });
      setActionMessage({
        type: 'warn',
        text: `MOC Baseline Lock applied: ${data?.lockedCount ?? 0} PSI technical records locked. Records marked as PSSR blockers.`
      });
    },
    onError: (err: any) => {
      setActionMessage({
        type: 'error',
        text: `Failed to lock PSI records: ${err.message || 'Server error'}`
      });
    }
  });

  const baselineMutation = useMutation({
    mutationFn: (mocId: string) =>
      mocPsiImpactService.applyBaseline(mocId, {
        promoteDrawings: true,
        updateEquipmentSpecs: true,
        notes: 'Promoted via PSI MOC Baseline Promotion Control Center'
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['psi'] });
      setActionMessage({
        type: 'success',
        text: `MOC Baseline Promotion successful: ${data?.promotedDrawingsCount ?? 0} drawings promoted to Approved, ${data?.unlockedCount ?? 0} records unlocked. Baseline updated.`
      });
    },
    onError: (err: any) => {
      setActionMessage({
        type: 'error',
        text: `Baseline promotion failed: ${err.message || 'Server error'}`
      });
    }
  });

  const rows = registerQuery.data?.rows ?? [];

  // Suggest active MOC IDs from rows
  const availableMocIds = Array.from(
    new Set(
      rows
        .filter((r) => r.source_record_id)
        .map((r) => String(r.source_record_id))
    )
  );

  const activeImpactData = impactQuery.data as any;
  const assessment = activeImpactData?.assessment;
  const impactItems: any[] = activeImpactData?.items ?? [];
  const blockers: any[] = impactItems.filter((i) => i.blocking || i.pssr_blocker);

  const handleInspectMoc = (id: string) => {
    if (!id.trim()) return;
    setSelectedMocId(id.trim());
    setActiveMocInput(id.trim());
    setActionMessage(null);
  };

  return (
    <div className="space-y-6">
      <PsiIntegrationHeader
        title="Management of Change (MOC) & Technical Baseline"
        subtitle="Enforce strict OSHA 1910.119(l) change spine: Lock baseline drawings and equipment specifications upon MOC approval, track PSSR blockers, and promote approved redlines upon MOC closure."
        onRefresh={() => {
          registerQuery.refetch();
          if (selectedMocId) impactQuery.refetch();
        }}
      />

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm transition-all ${
            actionMessage.type === 'success'
              ? 'border-emerald-300 bg-emerald-50/90 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'
              : actionMessage.type === 'warn'
              ? 'border-amber-300 bg-amber-50/90 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200'
              : actionMessage.type === 'error'
              ? 'border-rose-300 bg-rose-50/90 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200'
              : 'border-blue-300 bg-blue-50/90 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : actionMessage.type === 'warn' ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{actionMessage.text}</p>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MOC Baseline Operations Hub */}
      <PsiCard
        title="MOC Baseline Promotion & Lock Workspace"
        subtitle="Inspect any active MOC, trigger automated impact screening, lock affected PSI records, or promote redlines to the active baseline."
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--psm-muted)]" />
              <input
                value={activeMocInput}
                onChange={(e) => setActiveMocInput(e.target.value)}
                placeholder="Enter MOC UUID or Identifier (e.g. moc-2026-001)..."
                className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] py-2 pl-9 pr-3 text-sm font-mono text-[var(--psm-fg)] outline-none focus:border-primary"
              />
            </div>
            <PsiButton
              onClick={() => handleInspectMoc(activeMocInput)}
              disabled={!activeMocInput.trim() || impactQuery.isFetching}
            >
              {impactQuery.isFetching ? 'Inspecting...' : 'Inspect MOC'}
            </PsiButton>
          </div>

          {availableMocIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[var(--psm-muted)]">Active Linked MOCs:</span>
              {availableMocIds.map((id) => (
                <button
                  key={id}
                  onClick={() => handleInspectMoc(id)}
                  className={`rounded-md border px-2.5 py-1 font-mono transition-all ${
                    selectedMocId === id
                      ? 'border-primary bg-primary/10 font-bold text-primary'
                      : 'border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-muted)] hover:border-primary/50 hover:text-[var(--psm-fg)]'
                  }`}
                >
                  {id.slice(0, 16)}...
                </button>
              ))}
            </div>
          )}
        </div>
      </PsiCard>

      {/* Active MOC Inspection View */}
      {selectedMocId ? (
        <div className="space-y-5 rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--psm-line)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                  MOC ID: {selectedMocId}
                </span>
                {assessment?.assessment_status && (
                  <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--psm-fg)]">
                    Status: {assessment.assessment_status}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-xl font-bold text-[var(--psm-fg)]">
                {assessment?.moc_title ?? 'Active MOC Technical Spine Inspection'}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <PsiButton
                variant="secondary"
                disabled={runImpactMutation.isPending}
                onClick={() => runImpactMutation.mutate(selectedMocId)}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${runImpactMutation.isPending ? 'animate-spin' : ''}`} />
                {runImpactMutation.isPending ? 'Evaluating...' : 'Re-Evaluate Impact'}
              </PsiButton>

              <PsiButton
                variant="secondary"
                disabled={lockMutation.isPending}
                onClick={() => lockMutation.mutate(selectedMocId)}
                title="Lock affected drawings, equipment specs, and SOLs pending PSSR verification"
              >
                <Lock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                {lockMutation.isPending ? 'Locking...' : 'Lock Baseline Records'}
              </PsiButton>

              <PsiButton
                disabled={baselineMutation.isPending}
                onClick={() => baselineMutation.mutate(selectedMocId)}
                title="Promote redlines to approved revisions, update equipment specs, and clear MOC locks upon physical startup completion"
              >
                <GitBranch className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                {baselineMutation.isPending ? 'Promoting...' : 'Promote to Baseline (Closure)'}
              </PsiButton>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PsiMetricCard
              label="Impacted Technical Records"
              value={String(impactItems.length)}
              tone={impactItems.length ? 'warn' : 'neutral'}
            />
            <PsiMetricCard
              label="PSSR Startup Blockers"
              value={String(blockers.length)}
              tone={blockers.length ? 'danger' : 'good'}
            />
            <PsiMetricCard
              label="Baseline Lock State"
              value={blockers.some((b) => b.blocking) ? 'Active Locks' : 'Clean'}
              tone={blockers.some((b) => b.blocking) ? 'warn' : 'good'}
            />
            <PsiMetricCard
              label="Closure Readiness"
              value={blockers.length === 0 ? 'Ready for Promotion' : 'Blocked'}
              tone={blockers.length === 0 ? 'good' : 'danger'}
            />
          </div>

          {/* Impact items table */}
          {impactItems.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                Impacted PSI Technical Items & Closure Gates
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
                    <tr>
                      <th className="px-4 py-3">Pillar / Module</th>
                      <th className="px-4 py-3">Technical Item / Tag</th>
                      <th className="px-4 py-3">Change Required</th>
                      <th className="px-4 py-3">PSSR Blocker</th>
                      <th className="px-4 py-3">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--psm-line)]">
                    {impactItems.map((item, idx) => (
                      <tr key={item.id ?? idx} className="hover:bg-[var(--psm-surface-2)]">
                        <td className="px-4 py-3 font-medium">
                          {item.psi_module ?? 'Equipment / Drawing'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {item.checklist_item ?? item.psi_record_id ?? item.tag ?? 'Affected Record'}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">
                          {item.blocker_reason ?? item.required_update ?? 'Baseline spec revision'}
                        </td>
                        <td className="px-4 py-3">
                          {item.blocking || item.pssr_blocker ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <ShieldAlert className="h-3 w-3" /> Startup Blocker
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="h-3 w-3" /> Non-blocking
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">
                          {item.verification_status ?? 'Pending Sign-Off'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <PsiEmptyState
              title="No impact records found for this MOC"
              message="Click 'Re-Evaluate Impact' to screen live drawings, equipment tags, and Safe Operating Limits against this MOC."
            />
          )}

          {/* Closure Blocker Panel */}
          <MocClosureBlockerPanel assessment={assessment} items={impactItems} />
        </div>
      ) : null}

      {/* General Integration Impact Register Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--psm-fg)]">
          All MOC-Linked Technical Baseline Records
        </h2>
        {registerQuery.isLoading ? (
          <PsiLoadingState rows={5} />
        ) : registerQuery.isError ? (
          <PsiErrorState
            message="Failed to load MOC integration records."
            onRetry={() => registerQuery.refetch()}
          />
        ) : (
          <IntegrationImpactTable rows={rows} />
        )}
      </div>
    </div>
  );
}
