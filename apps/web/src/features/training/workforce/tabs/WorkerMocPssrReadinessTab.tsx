'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workforceService } from '../../services/workforce.service';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingMetricCard } from '../../shared/TrainingUi';
import type { Worker } from '../../types/training.types';

interface Props {
  workerId: string;
  worker?: Worker;
  summary?: Record<string, any>;
}

export function WorkerMocPssrReadinessTab({ workerId, worker, summary }: Props) {
  const queryClient = useQueryClient();
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const passportQuery = useQuery({
    queryKey: ['worker-qualification-passport', workerId],
    queryFn: () => workforceService.qualificationPassport(workerId)
  });

  const verifyMutation = useMutation({
    mutationFn: () => workforceService.verifyCompetency(workerId),
    onSuccess: (data) => {
      setVerificationResult(data);
      queryClient.invalidateQueries({ queryKey: ['worker-qualification-passport', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-detail', workerId] });
    }
  });

  if (passportQuery.isLoading) {
    return <TrainingLoadingState rows={4} />;
  }

  if (passportQuery.isError) {
    return (
      <TrainingErrorState
        message={passportQuery.error}
        onRetry={() => passportQuery.refetch()}
      />
    );
  }

  const passport = (passportQuery.data as any) ?? {};
  const moc = passport.mocTraining ?? {};
  const pssr = passport.pssrReadiness ?? {};
  const sc = passport.safetyCritical ?? {};
  const ptw = passport.ptwAuthorizations ?? {};
  const blockers: string[] = passport.blockers ?? [];

  const overallStatus = passport.overallStatus ?? (blockers.length > 0 ? 'FAIL' : 'PASS');
  const statusBadge =
    overallStatus === 'PASS' ? (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
        ● QUALIFIED (PASS)
      </span>
    ) : overallStatus === 'RESTRICTED' ? (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
        ▲ RESTRICTED GATE
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/30">
        ✕ BLOCKED (FAIL)
      </span>
    );

  return (
    <div className="space-y-6">
      {/* Top Passport Card */}
      <TrainingCard
        title="OSHA PSM Worker Qualification Passport"
        subtitle="Real-time multi-discipline verification across active employment, certifications, MOC delta-training, and PSSR startup readiness."
        action={
          <TrainingButton
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            variant="primary"
          >
            {verifyMutation.isPending ? 'Verifying...' : 'Run OSHA PSM Verification'}
          </TrainingButton>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold tracking-wider text-primary">
                {passport.passportNumber ?? `QP-${workerId.slice(0, 8).toUpperCase()}`}
              </span>
              {statusBadge}
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Worker: <span className="font-semibold text-[var(--psm-fg)]">{passport.worker?.displayName ?? worker?.display_name ?? 'Operator'}</span> · Job Title: {passport.worker?.jobTitle ?? worker?.job_title ?? 'Safety-Critical Technician'}
            </p>
          </div>
          <div className="text-right text-xs text-[var(--psm-muted)]">
            <p>Last Verified: <span className="font-mono text-[var(--psm-fg)]">{passport.verifiedAt ? new Date(passport.verifiedAt).toLocaleString() : 'Never'}</span></p>
            <p className="mt-0.5">OSHA 1910.119(g) & 1910.119(l) Gate</p>
          </div>
        </div>

        {/* Live Verification Result Banner */}
        {verificationResult && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm transition-all ${
              verificationResult.allowed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-base">
                  {verificationResult.allowed
                    ? '✓ Competency Verified — Worker Authorized for Unit Operations'
                    : '✕ Blocker Identified — Worker Disqualified from Safety-Critical Actions'}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  Status: <span className="font-semibold">{verificationResult.status}</span> · Evaluated at{' '}
                  {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVerificationResult(null)}
                className="text-xs underline hover:opacity-80"
              >
                Dismiss
              </button>
            </div>

            {verificationResult.reasons?.length > 0 && (
              <div className="mt-3 rounded-lg bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider">Active Blockers / Reasons:</p>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs">
                  {verificationResult.reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Active Blockers Notice */}
        {blockers.length > 0 && !verificationResult && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm font-semibold text-rose-400">
              Active Startup & Delta-Training Blockers ({blockers.length})
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-rose-300">
              {blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </TrainingCard>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrainingMetricCard
          label="MOC Delta Tasks"
          value={`${moc.completed ?? 0} / ${moc.totalAssigned ?? 0}`}
          href={`/training-competency/workforce/${workerId}/moc-training-assignments`}
          tone={moc.pending > 0 ? 'warn' : 'good'}
        />
        <TrainingMetricCard
          label="PSSR Startup Readiness"
          value={`${pssr.verified ?? 0} / ${pssr.totalAssigned ?? 0}`}
          href={`/training-competency/workforce/${workerId}/pssr-training-readiness`}
          tone={pssr.startupBlockers > 0 ? 'danger' : 'good'}
        />
        <TrainingMetricCard
          label="Safety-Critical Role"
          value={sc.isSafetyCritical ? (sc.compliant ? 'Compliant' : 'Non-Compliant') : 'Standard'}
          tone={sc.isSafetyCritical && !sc.compliant ? 'danger' : 'neutral'}
        />
        <TrainingMetricCard
          label="PTW Authorization"
          value={ptw.status ?? 'Pending'}
          href={`/training-competency/workforce/${workerId}/ptw-authorization`}
          tone={ptw.authorized ? 'good' : 'warn'}
        />
      </div>

      {/* Detailed MOC Delta-Training Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrainingCard
          title="MOC Delta-Training Spine"
          subtitle="OSHA 1910.119(l) mandates training prior to placing modified equipment into service."
          action={
            <TrainingButton
              href={`/training-competency/workforce/${workerId}/moc-training-assignments`}
              variant="secondary"
            >
              View MOC Tasks
            </TrainingButton>
          }
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Total MOC Delta Assignments</span>
              <span className="font-semibold text-[var(--psm-fg)]">{moc.totalAssigned ?? 0}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Completed & Acknowledged</span>
              <span className="font-semibold text-emerald-400">{moc.completed ?? 0}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Pending Operator Completion</span>
              <span className="font-semibold text-amber-400">{moc.pending ?? 0}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Supervisor Verified</span>
              <span className="font-semibold text-cyan-400">{moc.verified ?? 0}</span>
            </div>
          </div>
        </TrainingCard>

        {/* Detailed PSSR Startup Readiness Breakdown */}
        <TrainingCard
          title="PSSR Pre-Startup Safety Review"
          subtitle="OSHA 1910.119(i) hard readiness gate blocking startup authorization."
          action={
            <TrainingButton
              href={`/training-competency/workforce/${workerId}/pssr-training-readiness`}
              variant="secondary"
            >
              View PSSR Readiness
            </TrainingButton>
          }
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Total PSSR Requirements</span>
              <span className="font-semibold text-[var(--psm-fg)]">{pssr.totalAssigned ?? 0}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Verified Prior to Introduction of Chemicals</span>
              <span className="font-semibold text-emerald-400">{pssr.verified ?? 0}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-[var(--psm-line)] p-3 text-sm">
              <span className="text-[var(--psm-muted)]">Approved Risk Waivers</span>
              <span className="font-semibold text-indigo-400">{pssr.waived ?? 0}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm">
              <span className="font-semibold text-rose-400">Hard Startup Blockers</span>
              <span className="font-mono font-bold text-rose-400">{pssr.startupBlockers ?? 0}</span>
            </div>
          </div>
        </TrainingCard>
      </div>
    </div>
  );
}
