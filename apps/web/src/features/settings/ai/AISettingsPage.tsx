'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Award,
  Bot,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  FileDiff,
  Lock,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  XCircle
} from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { aiSettingsService } from './ai-settings.service';
import type { AiAuditEvent } from './ai-settings.types';
import { useCopilotStore } from '@/features/ai/stores/useCopilotStore';
import { DocumentCompareModal } from '@/features/ai/components/DocumentCompareModal';
import { LopaCalculatorModal } from '@/features/ai/components/LopaCalculatorModal';

export function AISettingsPage() {
  const queryClient = useQueryClient();
  const toast = useMutationToast();
  const { openDrawer } = useCopilotStore();

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isLopaOpen, setIsLopaOpen] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [chainVerification, setChainVerification] = useState<{
    valid: boolean;
    checkedCount: number;
    error?: string;
  } | null>(null);

  const benchmarkMutation = useMutation({
    mutationFn: aiSettingsService.runBenchmark,
    onSuccess: (data) => {
      setBenchmarkResult(data);
      if (data.status === 'SAFETY_BENCHMARK_PASSED') {
        toast.success(
          'PSM Safety Benchmark Passed',
          `100% compliance rate across ${data.totalCases} ground-truth engineering scenarios.`
        );
      } else {
        toast.error(
          'Benchmark Non-Compliance Detected',
          `Failed ${data.totalCases - data.passedCases} process safety test case(s).`
        );
      }
    },
    onError: (err: any) => {
      toast.error('Benchmark Execution Failed', err?.response?.data?.message || err.message);
    }
  });

  const verifyChainMutation = useMutation({
    mutationFn: aiSettingsService.verifyAuditChain,
    onSuccess: (data) => {
      setChainVerification(data);
      if (data.valid) {
        toast.success(
          'Cryptographic Integrity Verified',
          `All ${data.checkedCount} audit records sequentially match their SHA-256 hashes.`
        );
      } else {
        toast.error(
          'Hash Chain Tampering Detected',
          data.error || 'A cryptographic discrepancy was identified in the audit log.'
        );
      }
    },
    onError: (err: any) => {
      toast.error('Integrity Check Failed', err?.response?.data?.message || err.message);
    }
  });

  const settingsQuery = useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: aiSettingsService.getSettings
  });

  const statusQuery = useQuery({
    queryKey: ['ai', 'status'],
    queryFn: aiSettingsService.getStatus
  });

  const auditLogsQuery = useQuery({
    queryKey: ['ai', 'audit-logs'],
    queryFn: () => aiSettingsService.getAuditLogs(25, 0)
  });

  const updateMutation = useMutation({
    mutationFn: aiSettingsService.updateSettings,
    onSuccess: () => {
      toast.success('AI Governance Settings Saved', 'Tenant AI policy has been updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['ai', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'audit-logs'] });
    },
    onError: (err: any) => {
      toast.error('Failed to update settings', err?.response?.data?.message || err.message);
    }
  });

  const [enabled, setEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(365);
  const [approvedModels, setApprovedModels] = useState<string[]>([]);
  const [newModel, setNewModel] = useState('');

  useEffect(() => {
    if (settingsQuery.data) {
      setEnabled(settingsQuery.data.enabled);
      setRetentionDays(settingsQuery.data.retentionDays || 365);
      setApprovedModels(settingsQuery.data.approvedModels || []);
    }
  }, [settingsQuery.data]);

  const handleSave = () => {
    updateMutation.mutate({
      enabled,
      retentionDays: Number(retentionDays),
      approvedModels
    });
  };

  const handleAddModel = () => {
    const trimmed = newModel.trim();
    if (trimmed && !approvedModels.includes(trimmed)) {
      setApprovedModels([...approvedModels, trimmed]);
      setNewModel('');
    }
  };

  const handleRemoveModel = (model: string) => {
    setApprovedModels(approvedModels.filter((m) => m !== model));
  };

  const status = statusQuery.data;
  const isPending = updateMutation.isPending;

  return (
    <main className="space-y-6">
      {/* Header section */}
      <section className="psm-card p-6 border-l-4 border-l-blue-600 dark:border-l-blue-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">AI & Process Intelligence Governance</h1>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Phase 2 Foundation
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-muted)] max-w-3xl">
                Configure tenant-wide process safety AI guardrails, model access boundaries, immutable audit retention, and deterministic fallback behavior.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/platform/barrier-health" className="psm-button border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><Activity className="w-3.5 h-3.5" />Barrier Health</Link>
            <Link href="/platform/multimodal" className="psm-button border border-purple-500/40 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><Eye className="w-3.5 h-3.5" />Multimodal AI</Link>
            <button
              onClick={() => openDrawer()}
              className="psm-button border border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open Copilot
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || settingsQuery.isLoading}
              className="psm-button psm-button-primary flex items-center justify-center gap-2 px-5 py-2.5 shadow-sm text-xs font-semibold"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Policy
            </button>
          </div>
        </div>
      </section>

      {/* Real-time Status & Safe-Failure Diagnostic Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="psm-card p-4 flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${status?.aiEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
            {status?.aiEnabled ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">AI Operational State</div>
            <div className="text-base font-semibold mt-0.5">
              {status?.aiEnabled ? 'Active & Governed' : 'Fallback / Extractive'}
            </div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Security Boundary</div>
            <div className="text-base font-semibold mt-0.5">Enforced Server-Side</div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Audit Chain</div>
            <div className="text-base font-semibold mt-0.5">SHA-256 Chained</div>
          </div>
        </div>

        <div className="psm-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--psm-muted)] font-medium uppercase tracking-wider">Active Model</div>
            <div className="text-base font-semibold mt-0.5 truncate max-w-[160px]">
              {status?.model || 'gpt-4o (OpenAI)'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Governance Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {/* Tenant Activation & Core Policy */}
          <div className="psm-card p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--psm-line)]">
              <div>
                <h2 className="text-lg font-semibold">Tenant Activation & Safe Failure</h2>
                <p className="text-sm text-[var(--psm-muted)] mt-0.5">Control whether AI features are available to authorized site personnel.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Approved Models Configuration */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Approved Model Registry (OpenAI Supported)</label>
              <p className="text-xs text-[var(--psm-muted)]">
                Only models explicitly listed here are approved for tenant operations. Unlisted models will be rejected at the gateway.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {approvedModels.map((model) => (
                  <span
                    key={model}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[var(--psm-surface-2)] border border-[var(--psm-line)]"
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                    {model}
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(model)}
                      className="ml-1 text-[var(--psm-muted)] hover:text-rose-500"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. gpt-4o, gpt-4o-mini, text-embedding-3-small"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddModel();
                    }
                  }}
                  className="psm-input flex-1 px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="psm-button border border-[var(--psm-line)] px-3 text-sm font-medium hover:bg-[var(--psm-surface-2)]"
                >
                  Add Model
                </button>
              </div>
            </div>

            {/* Audit Log Retention */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium">Immutable Audit Retention (Days)</label>
              <p className="text-xs text-[var(--psm-muted)]">
                AI requests, source citations, verification results, and operator overrides are permanently recorded in the hash-chain.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="psm-input w-40 px-3 py-1.5 text-sm"
                />
                <span className="text-sm text-[var(--psm-muted)]">days (Recommended minimum: 365)</span>
              </div>
            </div>
          </div>

          {/* Interactive Shared Tools Launchpad */}
          <div className="psm-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Shared Process Safety AI Launchpad</h2>
            <p className="text-xs text-[var(--psm-muted)]">
              Test and invoke validated shared engineering tools with full audit logging and safety guardrails.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <FileDiff className="w-4 h-4 text-blue-500" />
                    <span>Document AI Comparison</span>
                  </div>
                  <p className="text-xs text-[var(--psm-muted)] mt-1.5">
                    Compare technical specifications, operating limit revisions, and procedure versions for safety discrepancies.
                  </p>
                </div>
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="mt-4 psm-button border border-[var(--psm-line)] text-xs font-semibold py-1.5 w-full hover:bg-[var(--psm-surface)]"
                >
                  Launch Document Comparison
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Calculator className="w-4 h-4 text-emerald-500" />
                    <span>Deterministic LOPA Calculator</span>
                  </div>
                  <p className="text-xs text-[var(--psm-muted)] mt-1.5">
                    Execute quantitative layer of protection calculations with verified math and required risk reduction factors.
                  </p>
                </div>
                <button
                  onClick={() => setIsLopaOpen(true)}
                  className="mt-4 psm-button border border-[var(--psm-line)] text-xs font-semibold py-1.5 w-full hover:bg-[var(--psm-surface)]"
                >
                  Launch LOPA Tool
                </button>
              </div>
            </div>
          </div>

          {/* PSM Safety & Citation Evaluation Benchmark Card */}
          <div className="psm-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--psm-line)] gap-2">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  PSM Engineering Safety Benchmark
                </h2>
                <p className="text-sm text-[var(--psm-muted)]">
                  Evaluates AI accuracy, citation precision, revision disambiguation, and zero-tolerance safety constraints.
                </p>
              </div>
              <button
                type="button"
                onClick={() => benchmarkMutation.mutate()}
                disabled={benchmarkMutation.isPending}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] hover:bg-[var(--psm-surface-3)] transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {benchmarkMutation.isPending ? 'Executing Evaluation Suite...' : 'Run Safety Benchmark'}
              </button>
            </div>

            {benchmarkResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
                    <div className="text-[var(--psm-muted)]">Safety Compliance</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {(benchmarkResult.safetyComplianceRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
                    <div className="text-[var(--psm-muted)]">Citation Precision</div>
                    <div className="text-lg font-bold mt-0.5">
                      {(benchmarkResult.meanCitationPrecision * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
                    <div className="text-[var(--psm-muted)]">Citation Recall</div>
                    <div className="text-lg font-bold mt-0.5">
                      {(benchmarkResult.meanCitationRecall * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
                    <div className="text-[var(--psm-muted)]">Benchmark Status</div>
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase">
                      {benchmarkResult.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div className="font-semibold text-[var(--psm-fg)]">Evaluated Ground-Truth Cases:</div>
                  <div className="divide-y divide-[var(--psm-line)] border border-[var(--psm-line)] rounded-lg overflow-hidden">
                    {benchmarkResult.caseResults?.map((c: any) => (
                      <div key={c.caseId} className="p-2.5 bg-[var(--psm-surface)] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-mono font-medium text-[11px] flex items-center gap-2">
                            <span className={c.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {c.passed ? '✓' : '✗'}
                            </span>
                            <span>{c.caseId}</span>
                          </div>
                          {c.zeroToleranceViolations?.length > 0 && (
                            <div className="text-[10px] text-rose-600">
                              Violations: {c.zeroToleranceViolations.join(', ')}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {c.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-[var(--psm-line)] text-center text-xs text-[var(--psm-muted)]">
                Click <strong>"Run Safety Benchmark"</strong> to evaluate the current model prompt and retrieval stack against OSHA 1910.119 and API RP 754 ground-truth engineering cases.
              </div>
            )}
          </div>

          {/* Real-time Tamper-Evident Audit Event Feed */}
          <div className="psm-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--psm-line)] gap-2">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Tamper-Evident AI Audit Trail
                </h2>
                <p className="text-sm text-[var(--psm-muted)]">Cryptographically hash-chained audit events for this tenant.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => verifyChainMutation.mutate()}
                  disabled={verifyChainMutation.isPending}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] hover:bg-[var(--psm-surface-3)] transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {verifyChainMutation.isPending ? 'Verifying Hashes...' : 'Verify Chain Integrity'}
                </button>
                <button
                  type="button"
                  onClick={() => auditLogsQuery.refetch()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {chainVerification && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  chainVerification.valid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {chainVerification.valid ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>
                    <strong>{chainVerification.valid ? 'Cryptographic Guarantee Confirmed:' : 'Integrity Alert:'}</strong>{' '}
                    {chainVerification.valid
                      ? `${chainVerification.checkedCount} sequential records mathematically verified against append-only SHA-256 tree.`
                      : chainVerification.error}
                  </span>
                </div>
                <span className="font-mono text-[10px] opacity-75">Immutable Trigger Active</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event Kind</th>
                    <th className="py-2.5 px-3">Model / Version</th>
                    <th className="py-2.5 px-3">Sources</th>
                    <th className="py-2.5 px-3">Hash Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)] font-mono text-xs">
                  {auditLogsQuery.isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--psm-muted)] font-sans">
                        Loading verified audit logs...
                      </td>
                    </tr>
                  ) : !auditLogsQuery.data?.items?.length ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--psm-muted)] font-sans">
                        No AI audit events recorded yet for this tenant.
                      </td>
                    </tr>
                  ) : (
                    auditLogsQuery.data.items.slice(0, 10).map((log: AiAuditEvent) => (
                      <tr key={log.id} className="hover:bg-[var(--psm-surface-2)] transition">
                        <td className="py-2.5 px-3 text-[var(--psm-muted)] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[var(--psm-fg)]">
                          <span className="px-2 py-0.5 rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)]">
                            {log.kind}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--psm-muted)]">
                          {log.model || 'Deterministic'}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--psm-muted)]">
                          {log.sourceIds?.length ? `${log.sourceIds.length} ref(s)` : 'None'}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]" title={`Full Hash: ${log.hash}`}>
                          {log.hash ? `${log.hash.slice(0, 10)}...${log.hash.slice(-6)}` : 'Valid'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sidebar Guidance & Policy Guardrails */}
        <section className="space-y-6">
          <div className="psm-card p-5 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Process Safety AI Guardrails
            </h3>
            <ul className="text-xs text-[var(--psm-muted)] space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[var(--psm-fg)] shrink-0">1.</span>
                <span><strong>No Automatic Sign-Off:</strong> AI suggestions remain strictly in draft status. Qualified personnel must review and sign off.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[var(--psm-fg)] shrink-0">2.</span>
                <span><strong>Deterministic Calculations:</strong> Quantitative LOPA/SIL formulas run in verified deterministic engines—never estimated by LLMs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[var(--psm-fg)] shrink-0">3.</span>
                <span><strong>Untrusted Input Defense:</strong> External documents and field logs are sanitized to prevent prompt-injection attacks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[var(--psm-fg)] shrink-0">4.</span>
                <span><strong>Safe Fallback:</strong> If OpenAI is unavailable or fails citation checks, the system returns matching records directly without interruption.</span>
              </li>
            </ul>
          </div>

          <div className="psm-card p-5 space-y-3 border-dashed">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              OpenAI Gateway Status
            </h4>
            <div className="text-xs text-[var(--psm-muted)] space-y-1.5">
              <div className="flex justify-between py-1 border-b border-[var(--psm-line)]">
                <span>AI Provider:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">OpenAI API</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--psm-line)]">
                <span>Primary LLM:</span>
                <span className="font-mono text-[var(--psm-fg)]">gpt-4o</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--psm-line)]">
                <span>Embeddings:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">text-embedding-3-small</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Failover Path:</span>
                <span className="font-mono text-[var(--psm-fg)]">Extractive Search</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Shared Modals */}
      <DocumentCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
      <LopaCalculatorModal
        isOpen={isLopaOpen}
        onClose={() => setIsLopaOpen(false)}
      />
    </main>
  );
}


