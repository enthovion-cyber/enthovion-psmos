// apps/web/src/features/contractor-safety/PrequalificationPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  X,
  FileCheck,
  Filter,
  Check,
  Building2,
  AlertCircle
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmGradeBadge,
  CsmStatusBadge,
  CsmTierBadge,
  CsmVarianceStatusBadge
} from './ContractorSafetyUi';
import {
  useApproveContractorVariance,
  useContractorPrequal,
  useContractorsList,
  useContractorVariances,
  useCreateContractorVariance,
  useEvaluateContractorPrequal,
  usePrequalRules,
  useUpsertContractorMetrics
} from './hooks/useContractorSafety';
import type { ContractorProfile, ContractorVariance } from './types/contractor-safety.types';

export function PrequalificationPage() {
  const [activeTab, setActiveTab] = useState<'gradebook' | 'variances'>('gradebook');
  const [varianceStatusFilter, setVarianceStatusFilter] = useState<string>('ALL');

  // Selected contractor for evaluation drawer
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  // Variance Request Modal
  const [isVarianceModalOpen, setIsVarianceModalOpen] = useState(false);
  const [varianceContractorId, setVarianceContractorId] = useState('');
  const [varianceTitle, setVarianceTitle] = useState('');
  const [varianceJustification, setVarianceJustification] = useState('');
  const [varianceScope, setVarianceScope] = useState('');
  const [mitigationsText, setMitigationsText] = useState(
    '100% dedicated plant safety watcher on site\nDaily pre-job JSA review by Operations Supervisor\nMandatory tool and PPE inspection before unit entry'
  );
  const [varianceStartsAt, setVarianceStartsAt] = useState('');
  const [varianceExpiresAt, setVarianceExpiresAt] = useState('');

  // Approval decision modal
  const [reviewingVariance, setReviewingVariance] = useState<ContractorVariance | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Add metrics state (inside drawer)
  const [isAddingMetrics, setIsAddingMetrics] = useState(false);
  const [metricYear, setMetricYear] = useState(new Date().getFullYear() - 1);
  const [hoursWorked, setHoursWorked] = useState('350000');
  const [recordables, setRecordables] = useState('1');
  const [dartCases, setDartCases] = useState('0');
  const [fatalities, setFatalities] = useState('0');
  const [emr, setEmr] = useState('0.85');
  const [citations, setCitations] = useState('0');

  const { data: rules } = usePrequalRules();
  const { data: contractors = [], isLoading: isContractorsLoading } = useContractorsList();
  const { data: variances = [], isLoading: isVariancesLoading } = useContractorVariances(
    varianceStatusFilter !== 'ALL' ? varianceStatusFilter : undefined
  );

  const { data: prequalSummary, isLoading: isPrequalLoading } = useContractorPrequal(
    selectedContractorId ?? ''
  );

  const evaluateMutation = useEvaluateContractorPrequal(selectedContractorId ?? '');
  const upsertMetricsMutation = useUpsertContractorMetrics(selectedContractorId ?? '');
  const createVarianceMutation = useCreateContractorVariance(varianceContractorId);
  const approveVarianceMutation = useApproveContractorVariance();

  // Metrics summary
  const total = contractors.length;
  const gradeA = contractors.filter((c) => c.safety_grade === 'A').length;
  const gradeB = contractors.filter((c) => c.safety_grade === 'B').length;
  const gradeC = contractors.filter((c) => c.safety_grade === 'C').length;
  const gradeDF = contractors.filter((c) => c.safety_grade === 'D' || c.safety_grade === 'F').length;
  const activeVariancesCount = variances.filter((v) => v.status === 'APPROVED').length;

  const handleOpenDrawer = (contractorId: string) => {
    setSelectedContractorId(contractorId);
    setIsAddingMetrics(false);
  };

  const handleEvaluate = async () => {
    if (!selectedContractorId) return;
    await evaluateMutation.mutateAsync({
      evaluation_notes: 'Manual re-evaluation triggered from Prequalification Gradebook.'
    });
  };

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractorId) return;

    await upsertMetricsMutation.mutateAsync({
      year: Number(metricYear),
      total_hours_worked: Number(hoursWorked),
      fatalities_count: Number(fatalities),
      recordable_cases_count: Number(recordables),
      dart_cases_count: Number(dartCases),
      emr: Number(emr),
      osha_citations_count: Number(citations),
      has_written_safety_program: true,
      has_subcontractor_management_plan: true
    });

    setIsAddingMetrics(false);
  };

  const handleCreateVariance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varianceContractorId || !varianceTitle || !varianceJustification) return;

    const mitigations = mitigationsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await createVarianceMutation.mutateAsync({
      title: varianceTitle,
      justification: varianceJustification,
      work_scope: varianceScope,
      required_mitigations: mitigations,
      starts_at: varianceStartsAt || undefined,
      expires_at: varianceExpiresAt || undefined
    });

    setIsVarianceModalOpen(false);
    setVarianceContractorId('');
    setVarianceTitle('');
    setVarianceJustification('');
    setVarianceScope('');
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!reviewingVariance) return;

    await approveVarianceMutation.mutateAsync({
      varianceId: reviewingVariance.id,
      data: {
        decision,
        ...(approvalNotes ? { approval_notes: approvalNotes } : {})
      }
    });

    setReviewingVariance(null);
    setApprovalNotes('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      <ContractorSafetyHeader
        title="Contractor Prequalification &amp; Gradebook"
        subtitle="Automated grading engine based on 3-year historical safety data (TRIR, EMR, DART, Fatalities) and conditional safety variance management."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVarianceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              New Safety Variance Request
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Contractors
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</div>
            <span className="text-xs text-slate-500">active prequal files</span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Grade A (Preferred)
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{gradeA}</div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300">Score &gt; 90% (Zero citations)</span>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Grade B (Approved)
            </span>
            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{gradeB}</div>
            <span className="text-xs text-blue-700 dark:text-blue-300">Score 80–89% (Standard)</span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Grade C (Conditional)
            </span>
            <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{gradeC}</div>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              {activeVariancesCount} Active Variances
            </span>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Grade D/F (Disqualified)
            </span>
            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{gradeDF}</div>
            <span className="text-xs text-rose-700 dark:text-rose-300">High Risk &bull; Gated</span>
          </div>
        </div>

        {/* Scoring Engine Formula Guide */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Automated Scoring Algorithm &amp; Weightings (100 Point Scale)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">OSHA 1910.119(h)(2)(i) Benchmark</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Workers Comp EMR
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">30 pts</span>
              <p className="text-[10px] text-slate-500 mt-0.5">&le;0.80 = 30 pts, &le;1.0 = 20 pts</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                3-Year Avg TRIR
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">30 pts</span>
              <p className="text-[10px] text-slate-500 mt-0.5">&le;0.75 = 30 pts, &le;1.5 = 24 pts</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Fatality History
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">20 pts</span>
              <p className="text-[10px] text-slate-500 mt-0.5">0 fatalities = 20 pts, &ge;1 = 0 pts (F)</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                3-Year Avg DART
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">10 pts</span>
              <p className="text-[10px] text-slate-500 mt-0.5">&le;0.50 = 10 pts, &le;1.2 = 6 pts</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                Written HSE Program
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">10 pts</span>
              <p className="text-[10px] text-slate-500 mt-0.5">0 Citations &amp; Complete Plan</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'gradebook'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Master Gradebook ({contractors.length})
            </button>
            <button
              onClick={() => setActiveTab('variances')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'variances'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Management Safety Variances ({variances.length})
            </button>
          </div>

          {activeTab === 'variances' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filter status:</span>
              <select
                value={varianceStatusFilter}
                onChange={(e) => setVarianceStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Variances</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved Active</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}
        </div>

        {/* Gradebook View */}
        {activeTab === 'gradebook' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Contractor Company</th>
                    <th className="py-3 px-4 font-semibold">Risk Tier</th>
                    <th className="py-3 px-4 font-semibold">Safety Grade</th>
                    <th className="py-3 px-4 font-semibold">Prequal Score</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Prequal Valid Until</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {isContractorsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading prequalification records...
                      </td>
                    </tr>
                  ) : contractors.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/contractor-safety/contractors/${c.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {c.company_name}
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {c.company_code} &bull; {c.primary_contact_name || 'No contact specified'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <CsmTierBadge tier={c.tier} />
                      </td>
                      <td className="py-3.5 px-4">
                        <CsmGradeBadge grade={c.safety_grade} score={c.prequal_score} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                Number(c.prequal_score ?? 0) >= 90
                                  ? 'bg-emerald-500'
                                  : Number(c.prequal_score ?? 0) >= 80
                                  ? 'bg-blue-600'
                                  : Number(c.prequal_score ?? 0) >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-600'
                              }`}
                              style={{ width: `${Math.min(100, Number(c.prequal_score ?? 0))}%` }}
                            />
                          </div>
                          <span className="font-bold">{c.prequal_score ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <CsmStatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {c.prequal_valid_until
                          ? new Date(c.prequal_valid_until).toLocaleDateString()
                          : 'Annual Review Pending'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(c.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Prequal Details &amp; Metrics</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Variances View */}
        {activeTab === 'variances' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Variance # / Title</th>
                    <th className="py-3 px-4 font-semibold">Contractor</th>
                    <th className="py-3 px-4 font-semibold">Reason Category</th>
                    <th className="py-3 px-4 font-semibold">Mandatory Mitigations</th>
                    <th className="py-3 px-4 font-semibold">Validity Window</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {isVariancesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Loading variance requests...
                      </td>
                    </tr>
                  ) : variances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No variances found matching filters.
                      </td>
                    </tr>
                  ) : (
                    variances.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {v.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {v.variance_number}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {v.contractor?.company_name || 'Contractor'}
                          </span>
                          <div className="text-[11px] font-mono text-slate-400">
                            {v.contractor?.company_code}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {v.reason_category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {v.required_mitigations?.slice(0, 2).map((m: string, idx: number) => (
                              <li key={idx} className="truncate">{m}</li>
                            ))}
                            {(v.required_mitigations?.length ?? 0) > 2 && (
                              <li className="text-slate-400">
                                +{(v.required_mitigations?.length ?? 0) - 2} more controls
                              </li>
                            )}
                          </ul>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {v.starts_at} to {v.expires_at}
                        </td>
                        <td className="py-3.5 px-4">
                          <CsmVarianceStatusBadge status={v.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {v.status === 'PENDING_APPROVAL' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingVariance(v);
                                setApprovalNotes('');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                            >
                              Review &amp; Approve
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              {v.status === 'APPROVED' ? 'Approved' : 'Concluded'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Prequalification Evaluation Drawer */}
      {selectedContractorId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold uppercase">
                  Prequalification Safety Evaluation
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {prequalSummary?.contractor?.company_name || 'Loading...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContractorId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {isPrequalLoading ? (
                <div className="py-12 text-center text-slate-500">
                  Loading evaluation profile...
                </div>
              ) : (
                <>
                  {/* Current Grade Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CsmGradeBadge
                          grade={prequalSummary?.contractor?.safety_grade ?? 'UNRATED'}
                          score={prequalSummary?.contractor?.prequal_score}
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            Overall Score: {prequalSummary?.contractor?.prequal_score ?? 0} / 100
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Calculated across 3-year historical safety filings
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleEvaluate}
                        disabled={evaluateMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                      >
                        {evaluateMutation.isPending ? 'Recalculating...' : 'Recalculate Score'}
                      </button>
                    </div>

                    {/* Breakdown bars */}
                    {prequalSummary?.currentEvaluation?.score_breakdown && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            EMR Score
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prequalSummary.currentEvaluation.score_breakdown.emrScore} / 30 pts
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            TRIR Score
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prequalSummary.currentEvaluation.score_breakdown.trirScore} / 30 pts
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Fatality Score
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prequalSummary.currentEvaluation.score_breakdown.fatalityScore} / 20 pts
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            DART Score
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prequalSummary.currentEvaluation.score_breakdown.dartScore} / 10 pts
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Programs &amp; OSHA Citations
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prequalSummary.currentEvaluation.score_breakdown.programScore} / 10 pts
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3-Year Annual Metrics Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        3-Year Historical Metrics (OSHA 300 &amp; EMR)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingMetrics(!isAddingMetrics)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        {isAddingMetrics ? 'Cancel' : '+ Add / Update Year Metrics'}
                      </button>
                    </div>

                    {isAddingMetrics && (
                      <form
                        onSubmit={handleSaveMetrics}
                        className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3"
                      >
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">Year</label>
                            <input
                              type="number"
                              value={metricYear}
                              onChange={(e) => setMetricYear(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Total Hours Worked</label>
                            <input
                              type="number"
                              value={hoursWorked}
                              onChange={(e) => setHoursWorked(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Workers Comp EMR</label>
                            <input
                              type="number"
                              step="0.01"
                              value={emr}
                              onChange={(e) => setEmr(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">Recordable Cases</label>
                            <input
                              type="number"
                              value={recordables}
                              onChange={(e) => setRecordables(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">DART Cases</label>
                            <input
                              type="number"
                              value={dartCases}
                              onChange={(e) => setDartCases(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Fatalities</label>
                            <input
                              type="number"
                              value={fatalities}
                              onChange={(e) => setFatalities(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                          <button
                            type="button"
                            onClick={() => setIsAddingMetrics(false)}
                            className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={upsertMetricsMutation.isPending}
                            className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                          >
                            {upsertMetricsMutation.isPending ? 'Saving...' : 'Save & Re-evaluate'}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Year</th>
                            <th className="py-2 px-3 font-semibold">Hours Worked</th>
                            <th className="py-2 px-3 font-semibold">TRIR</th>
                            <th className="py-2 px-3 font-semibold">DART Rate</th>
                            <th className="py-2 px-3 font-semibold">EMR</th>
                            <th className="py-2 px-3 font-semibold">Fatalities</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {!prequalSummary?.metricsHistory?.length ? (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-slate-400">
                                No historical safety metrics logged.
                              </td>
                            </tr>
                          ) : (
                            prequalSummary.metricsHistory.map((m: any) => (
                              <tr key={m.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-bold">{m.year}</td>
                                <td className="py-2.5 px-3 font-mono">
                                  {Number(m.total_hours_worked).toLocaleString()} hrs
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">
                                  {m.trir}
                                </td>
                                <td className="py-2.5 px-3">{m.dart_rate}</td>
                                <td className="py-2.5 px-3 font-mono font-bold">{m.emr}</td>
                                <td
                                  className={`py-2.5 px-3 font-bold ${
                                    m.fatalities_count > 0 ? 'text-rose-600' : 'text-slate-600'
                                  }`}
                                >
                                  {m.fatalities_count}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Variance Request Modal */}
      {isVarianceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Request Management Safety Variance
              </h3>
              <button
                type="button"
                onClick={() => setIsVarianceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVariance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contractor Company *
                </label>
                <select
                  required
                  value={varianceContractorId}
                  onChange={(e) => setVarianceContractorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="">Select Contractor...</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.company_code}) &bull; Grade {c.safety_grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Variance Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialized Robotic Tank Sludge Desludging Authorization"
                  value={varianceTitle}
                  onChange={(e) => setVarianceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justification &amp; Operational Need *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why this contractor is required despite Grade C or conditional status."
                  value={varianceJustification}
                  onChange={(e) => setVarianceJustification(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specific Work Scope *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tank T-104 internal nozzle cleaning outside battery limits"
                  value={varianceScope}
                  onChange={(e) => setVarianceScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Mitigating Controls (One per line) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={mitigationsText}
                  onChange={(e) => setMitigationsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Starts At
                  </label>
                  <input
                    type="date"
                    value={varianceStartsAt}
                    onChange={(e) => setVarianceStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expires At
                  </label>
                  <input
                    type="date"
                    value={varianceExpiresAt}
                    onChange={(e) => setVarianceExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVarianceModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVarianceMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm"
                >
                  {createVarianceMutation.isPending ? 'Submitting...' : 'Submit Variance Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      {reviewingVariance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Executive Safety Variance Decision
            </h3>
            <p className="text-slate-500">
              You are authorizing contractor{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {reviewingVariance.contractor?.company_name}
              </strong>{' '}
              under variance <strong>{reviewingVariance.variance_number}</strong>.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="font-semibold block text-slate-700 dark:text-slate-300">
                Mandatory Mitigating Controls:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                {reviewingVariance.required_mitigations?.map((m: string, idx: number) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block font-semibold mb-1">Approval / Rejection Sign-off Notes</label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Approved with condition that full-time watcher logs entries hourly."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewingVariance(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision('REJECTED')}
                disabled={approveVarianceMutation.isPending}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
              >
                Reject Variance
              </button>
              <button
                type="button"
                onClick={() => handleDecision('APPROVED')}
                disabled={approveVarianceMutation.isPending}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm"
              >
                Sign &amp; Approve Variance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
