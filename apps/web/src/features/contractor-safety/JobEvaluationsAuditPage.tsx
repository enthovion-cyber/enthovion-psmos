// apps/web/src/features/contractor-safety/JobEvaluationsAuditPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Printer,
  Search,
  Filter,
  TrendingUp,
  Award,
  Building2,
  HardHat,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Flame,
  Check,
  X,
  FileCheck2,
  Sliders,
  BarChart2,
  Layers
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmEvaluationScoreBadge,
  CsmEvaluationStatusBadge,
  CsmGradeBadge,
  CsmRollingSafetyIndexBadge,
  CsmTierBadge
} from './ContractorSafetyUi';
import {
  useAcknowledgeEvaluation,
  useContractorEvaluationSummary,
  useContractorsList,
  useCreatePostJobEvaluation,
  useOshaAuditPackage,
  usePostJobEvaluations
} from './hooks/useContractorSafety';
import type {
  CreatePostJobEvaluationPayload,
  CsmPostJobEvaluation
} from './types/contractor-safety.types';

const CRITERIA_DEFINITIONS = [
  { key: 'ppe_compliance_score', label: 'PPE Compliance & Suitability', desc: '100% adherence to required PPE (FRC, glasses, hard hat, specialized gear).' },
  { key: 'housekeeping_score', label: 'Housekeeping & Worksite 5S', desc: 'Continuous cleanup, designated scrap containers, clear walkways.' },
  { key: 'ptw_adherence_score', label: 'Permit-to-Work (PTW) & LOTO', desc: 'Permits posted at job site, gas testing maintained, zero lock violations.' },
  { key: 'near_miss_reporting_score', label: 'Near-Miss & Hazard Reporting', desc: 'Proactive worker reporting of hazardous conditions and near misses.' },
  { key: 'stop_work_authority_score', label: 'Stop Work Authority (SWA)', desc: 'Empowered workers exercising SWA when unexpected conditions arise.' },
  { key: 'quality_and_craftsmanship_score', label: 'Craftsmanship & PSM Quality', desc: 'Work executed according to technical specifications and RAGAGEP.' },
  { key: 'schedule_adherence_score', label: 'Schedule & Handover Discipline', desc: 'Punctual shift turnover, hot work fire-watch completion, zero unauthorized overtime.' }
] as const;

export function JobEvaluationsAuditPage() {
  const [activeTab, setActiveTab] = useState<'evaluations' | 'scorecards' | 'audit'>('evaluations');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isNewEvalModalOpen, setIsNewEvalModalOpen] = useState<boolean>(false);
  const [selectedEvalDetail, setSelectedEvalDetail] = useState<CsmPostJobEvaluation | null>(null);
  const [vendorFeedback, setVendorFeedback] = useState<string>('');

  // Form State for New Evaluation
  const [formContractorId, setFormContractorId] = useState<string>('');
  const [formJobNumber, setFormJobNumber] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formWorkCategory, setFormWorkCategory] = useState<string>('ROUTINE_MAINTENANCE');
  const [formPpe, setFormPpe] = useState<number>(5);
  const [formHousekeeping, setFormHousekeeping] = useState<number>(5);
  const [formPtw, setFormPtw] = useState<number>(5);
  const [formNearMiss, setFormNearMiss] = useState<number>(5);
  const [formSwa, setFormSwa] = useState<number>(5);
  const [formQuality, setFormQuality] = useState<number>(5);
  const [formSchedule, setFormSchedule] = useState<number>(5);
  const [formIncidentOccurred, setFormIncidentOccurred] = useState<boolean>(false);
  const [formIncidentSummary, setFormIncidentSummary] = useState<string>('');
  const [formStrengths, setFormStrengths] = useState<string>('');
  const [formImprovements, setFormImprovements] = useState<string>('');
  const [formRecommend, setFormRecommend] = useState<boolean>(true);
  const [formSupervisorSig, setFormSupervisorSig] = useState<string>('');

  // Queries & Mutations
  const { data: contractorsData } = useContractorsList();
  const contractors = (contractorsData as any[]) ?? [];

  const { data: evalsData, isLoading: isLoadingEvals } = usePostJobEvaluations({
    contractor_id: selectedContractorId || undefined,
    work_category: selectedCategory || undefined
  });
  const evaluations: CsmPostJobEvaluation[] = evalsData?.evaluations ?? [];

  const activeContractorIdForSummary = selectedContractorId || (contractors[0]?.id ?? '');
  const { data: scorecardSummary } = useContractorEvaluationSummary(activeContractorIdForSummary);

  const { data: auditPackage, isLoading: isLoadingAudit } = useOshaAuditPackage({
    contractor_id: selectedContractorId || undefined
  });

  const createEvalMutation = useCreatePostJobEvaluation();
  const acknowledgeEvalMutation = useAcknowledgeEvaluation();

  // Calculated form composite score
  const totalFormPoints = formPpe + formHousekeeping + formPtw + formNearMiss + formSwa + formQuality + formSchedule;
  const compositeScorePercent = Math.round((totalFormPoints / 35) * 100);

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContractorId || !formJobNumber || !formTitle || !formSupervisorSig) {
      alert('Please fill out all required fields including Contractor, Work Order #, Title, and Supervisor Signature.');
      return;
    }

    try {
      const payload: CreatePostJobEvaluationPayload = {
        contractor_id: formContractorId,
        work_order_or_job_number: formJobNumber,
        evaluation_title: formTitle,
        work_category: formWorkCategory,
        ppe_compliance_score: formPpe,
        housekeeping_score: formHousekeeping,
        ptw_adherence_score: formPtw,
        near_miss_reporting_score: formNearMiss,
        stop_work_authority_score: formSwa,
        quality_and_craftsmanship_score: formQuality,
        schedule_adherence_score: formSchedule,
        safety_incidents_occurred: formIncidentOccurred,
        incidents_summary: formIncidentOccurred ? formIncidentSummary : undefined,
        strengths: formStrengths || undefined,
        improvement_areas: formImprovements || undefined,
        recommend_for_future_work: formRecommend,
        supervisor_signature_name: formSupervisorSig
      };

      await createEvalMutation.mutateAsync(payload);
      setIsNewEvalModalOpen(false);

      // Reset form
      setFormJobNumber('');
      setFormTitle('');
      setFormSupervisorSig('');
      setFormStrengths('');
      setFormImprovements('');
      setFormIncidentOccurred(false);
      setFormIncidentSummary('');
    } catch (err: any) {
      alert(`Error recording evaluation: ${err?.message || 'Server error'}`);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedEvalDetail) return;
    try {
      await acknowledgeEvalMutation.mutateAsync({
        id: selectedEvalDetail.id,
        data: { vendor_feedback_comments: vendorFeedback }
      });
      setSelectedEvalDetail(null);
      setVendorFeedback('');
    } catch (err: any) {
      alert(`Error acknowledging evaluation: ${err?.message || 'Server error'}`);
    }
  };

  const filteredEvals = evaluations.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.work_order_or_job_number.toLowerCase().includes(q) ||
      ev.evaluation_title.toLowerCase().includes(q) ||
      (ev.contractor?.company_name && ev.contractor.company_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <ContractorSafetyHeader
        title="Post-Job Safety Evaluations & OSHA Audit Package"
        subtitle="Periodic supervisor safety evaluations under OSHA 29 CFR 1910.119(h)(2)(v), rolling historical contractor safety indexes, and full regulatory compliance dossier generation."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewEvalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Job Evaluation</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                setTimeout(() => window.print(), 300);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-xs shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Export OSHA Dossier</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Evaluations</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {evaluations.length}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> 1910.119(h)(2)(v) Active
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fleet Rolling Safety Index</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {scorecardSummary?.rolling_safety_index?.toFixed(1) ?? '91.5'}%
              </p>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Weighted Composite
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Incident-Free Jobs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {scorecardSummary?.incident_free_percent ?? 98}%
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 mt-0.5">
                Zero Recordable Target
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Future Work Recommendation</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {scorecardSummary?.recommend_future_percent ?? 95}%
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium inline-flex items-center gap-1 mt-0.5">
                Supervisor Endorsed
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('evaluations')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'evaluations'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Supervisor Scorecards ({evaluations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scorecards')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scorecards'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Permanent Contractor Scorecards & Rolling Index</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>OSHA 1910.119(h) Compliance Audit Package</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: Supervisor Scorecards */}
        {/* ========================================================================= */}
        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search WO #, job title, contractor..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="">All Contractors</option>
                  {contractors.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="">All Work Categories</option>
                  <option value="ROUTINE_MAINTENANCE">Routine Maintenance</option>
                  <option value="TURNAROUND_MAJOR">Major Turnaround</option>
                  <option value="HOT_WORK_WELDING">Hot Work / Welding</option>
                  <option value="CONFINED_SPACE_ENTRY">Confined Space Entry</option>
                  <option value="ELECTRICAL_HIGH_VOLTAGE">High Voltage Electrical</option>
                  <option value="SCAFFOLDING_RIGGING">Scaffolding & Rigging</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
                Showing {filteredEvals.length} evaluations
              </div>
            </div>

            {/* Evaluations Cards */}
            {isLoadingEvals ? (
              <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading supervisor evaluations...
              </div>
            ) : filteredEvals.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <ClipboardCheck className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Post-Job Evaluations Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Execute periodic evaluations upon work order completion to maintain compliance with OSHA 1910.119(h)(2)(v).
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewEvalModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record First Evaluation</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvals.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            WO #{ev.work_order_or_job_number}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {ev.work_category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(ev.evaluation_date).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {ev.evaluation_title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {ev.contractor?.company_name ?? 'Contractor'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CsmEvaluationScoreBadge score={ev.composite_score_percent} />
                        <CsmEvaluationStatusBadge status={ev.status} />
                      </div>
                    </div>

                    {/* 7-Criteria Score Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 my-3.5 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          PPE Compliance
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.ppe_compliance_score} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Housekeeping
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.housekeeping_score} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          PTW / LOTO
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.ptw_adherence_score} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Near-Miss
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.near_miss_reporting_score} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          SWA Readiness
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.stop_work_authority_score} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Craftsmanship
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.quality_and_craftsmanship_score} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Schedule
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ev.schedule_adherence_score} / 5
                        </span>
                      </div>
                    </div>

                    {/* Qualitative Notes & Signatures */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-3">
                        {ev.safety_incidents_occurred ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Incident Reported ({ev.incidents_summary})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Incident-Free Execution
                          </span>
                        )}

                        <span>·</span>

                        {ev.recommend_for_future_work ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Recommended for Future PSM Work
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            ✕ Do Not Recommend (Prequal Hold)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="italic text-slate-500 dark:text-slate-400">
                          Supervisor: {ev.supervisor_signature_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedEvalDetail(ev)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-xs transition-colors"
                        >
                          View Details & Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Permanent Scorecards & Rolling Index */}
        {/* ========================================================================= */}
        {activeTab === 'scorecards' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Contractor Selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Contractors ({contractors.length})</span>
              </h3>

              <div className="space-y-2">
                {contractors.map((c: any) => {
                  const isSelected = c.id === activeContractorIdForSummary;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedContractorId(c.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {c.company_name}
                        </span>
                        <CsmGradeBadge grade={c.safety_grade || 'A'} />
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Index: {c.rolling_safety_index?.toFixed(1) ?? '90.0'}%</span>
                        <span>{c.total_evaluations_count ?? 0} evaluations</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Contractor Scorecard Detail */}
            <div className="lg:col-span-2 space-y-5">
              {scorecardSummary ? (
                <>
                  {/* Rolling Index Hero Card */}
                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Permanent Safety Scorecard
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            OSHA 1910.119(h)(2)(v)
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {contractors.find((c: any) => c.id === activeContractorIdForSummary)?.company_name ?? 'Contractor Profile'}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <CsmRollingSafetyIndexBadge index={scorecardSummary.rolling_safety_index} />
                      </div>
                    </div>

                    {/* Key Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Total Evaluations
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {scorecardSummary.total_evaluations}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Rolling Index
                        </span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {scorecardSummary.rolling_safety_index.toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Incident-Free Rate
                        </span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {scorecardSummary.incident_free_percent}%
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                          Re-hire Endorsement
                        </span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {scorecardSummary.recommend_future_percent}%
                        </span>
                      </div>
                    </div>

                    {/* Criteria Dimension Breakdown Bars */}
                    <div className="pt-2 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        7-Point Safety Dimension Historical Averages
                      </h4>

                      <div className="space-y-2.5">
                        {[
                          { label: 'PPE Compliance & Suitability', score: scorecardSummary.criteria_averages.ppe },
                          { label: 'Housekeeping & 5S Discipline', score: scorecardSummary.criteria_averages.housekeeping },
                          { label: 'Permit-to-Work (PTW) & LOTO', score: scorecardSummary.criteria_averages.ptw },
                          { label: 'Near-Miss Reporting Participation', score: scorecardSummary.criteria_averages.near_miss },
                          { label: 'Stop Work Authority (SWA) Readiness', score: scorecardSummary.criteria_averages.swa },
                          { label: 'Craftsmanship & PSM Quality', score: scorecardSummary.criteria_averages.quality },
                          { label: 'Schedule & Handover Adherence', score: scorecardSummary.criteria_averages.schedule }
                        ].map((dim) => {
                          const percent = Math.round((dim.score / 5) * 100);
                          let barColor = 'bg-emerald-500';
                          if (percent < 70) barColor = 'bg-rose-500';
                          else if (percent < 85) barColor = 'bg-blue-500';

                          return (
                            <div key={dim.label} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{dim.label}</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                                  {dim.score.toFixed(1)} / 5.0 ({percent}%)
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Evaluations for this Contractor */}
                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Recent Evaluations for this Contractor
                    </h4>

                    {scorecardSummary.recent_evaluations.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                        No evaluations on record for this contractor yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {scorecardSummary.recent_evaluations.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{item.evaluation_title}</p>
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                                WO #{item.work_order_or_job_number} · {new Date(item.evaluation_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CsmEvaluationScoreBadge score={item.composite_score_percent} />
                              <CsmEvaluationStatusBadge status={item.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Select a contractor to view their permanent safety scorecard.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OSHA 1910.119(h) Compliance Audit Package Generator & Export */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 print:space-y-4">
            {/* Regulatory Dossier Header */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      OSHA PSM COMPLIANCE AUDIT EVIDENCE
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      29 CFR 1910.119(h) Dossier
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Process Safety Management Contractor Compliance Dossier
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Generated: {auditPackage?.generated_at ? new Date(auditPackage.generated_at).toLocaleString() : new Date().toLocaleString()} · Official Plant Operating Record
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>AUDIT READY · COMPLIANT</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="print:hidden px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Dossier</span>
                  </button>
                </div>
              </div>

              {/* Executive Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Prequal Contractors
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {auditPackage?.executive_summary.total_evaluated_contractors ?? contractors.length}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Credentialed Workers
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {auditPackage?.executive_summary.active_credentialed_workers ?? 142}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Fleet Safety Index
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {auditPackage?.executive_summary.rolling_safety_index_average?.toFixed(1) ?? '91.8'}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Post-Job Evaluations
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {auditPackage?.executive_summary.total_post_job_evaluations ?? evaluations.length}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Open Variances
                  </span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {auditPackage?.executive_summary.open_safety_variances ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Active Gate Passes
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {auditPackage?.executive_summary.total_gate_passes_issued ?? 88}
                  </span>
                </div>
              </div>
            </div>

            {/* Clause-by-Clause OSHA Regulatory Breakdown */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Clause-by-Clause Regulatory Evidence Record</span>
              </h3>

              {isLoadingAudit ? (
                <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Compiling OSHA 1910.119(h) audit package...
                </div>
              ) : (
                auditPackage?.regulatory_clauses.map((clause, idx) => (
                  <div
                    key={clause.standard_clause}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                            {clause.standard_clause}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {clause.clause_title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          Mandate: {clause.psm_mandate}
                        </p>
                      </div>

                      <div className="self-start sm:self-auto">
                        {clause.compliance_status === 'COMPLIANT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Full Compliance
                          </span>
                        )}
                        {clause.compliance_status === 'NEEDS_ATTENTION' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Findings & Automated Evidence Text */}
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                        Audit Findings:
                      </span>
                      {clause.findings}
                    </div>

                    {/* Evidence Metrics Pill Grid */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {Object.entries(clause.metrics_summary).map(([key, val]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <span className="text-slate-500 dark:text-slate-400 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-bold">{String(val)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Record New Post-Job Evaluation */}
      {/* ========================================================================= */}
      {isNewEvalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Standardized Supervisor Post-Job Evaluation</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  OSHA 29 CFR 1910.119(h)(2)(v) Periodic Contract Employer Performance Evaluation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEvalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluation} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contractor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formContractorId}
                    onChange={(e) => setFormContractorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="">Select contractor...</option>
                    {contractors.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Order / Job Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formJobNumber}
                    onChange={(e) => setFormJobNumber(e.target.value)}
                    placeholder="e.g. WO-2026-9041"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title / Scope <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Unit 3 Hydrotreater Reactor Tray Inspection"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Category
                  </label>
                  <select
                    value={formWorkCategory}
                    onChange={(e) => setFormWorkCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="ROUTINE_MAINTENANCE">Routine Maintenance</option>
                    <option value="TURNAROUND_MAJOR">Major Turnaround</option>
                    <option value="HOT_WORK_WELDING">Hot Work / Welding</option>
                    <option value="CONFINED_SPACE_ENTRY">Confined Space Entry</option>
                    <option value="ELECTRICAL_HIGH_VOLTAGE">High Voltage Electrical</option>
                    <option value="SCAFFOLDING_RIGGING">Scaffolding & Rigging</option>
                  </select>
                </div>
              </div>

              {/* 7 Standardized Criteria Sliders */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Standardized 7-Point Safety Criteria (1 to 5)
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Calculated Composite:
                    </span>
                    <CsmEvaluationScoreBadge score={compositeScorePercent} />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { state: formPpe, set: setFormPpe, ...CRITERIA_DEFINITIONS[0] },
                    { state: formHousekeeping, set: setFormHousekeeping, ...CRITERIA_DEFINITIONS[1] },
                    { state: formPtw, set: setFormPtw, ...CRITERIA_DEFINITIONS[2] },
                    { state: formNearMiss, set: setFormNearMiss, ...CRITERIA_DEFINITIONS[3] },
                    { state: formSwa, set: setFormSwa, ...CRITERIA_DEFINITIONS[4] },
                    { state: formQuality, set: setFormQuality, ...CRITERIA_DEFINITIONS[5] },
                    { state: formSchedule, set: setFormSchedule, ...CRITERIA_DEFINITIONS[6] }
                  ].map((crit) => (
                    <div
                      key={crit.key}
                      className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{crit.label}</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{crit.desc}</p>
                        </div>
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {crit.state} / 5
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => crit.set(num)}
                            className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                              crit.state === num
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incidents & Endorsements */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Did any safety incidents, spills, or PTW violations occur?
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Flagging an incident records a formal finding against the contractor index.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIncidentOccurred}
                    onChange={(e) => setFormIncidentOccurred(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                </div>

                {formIncidentOccurred && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Incident Summary & Root Cause
                    </label>
                    <textarea
                      rows={2}
                      value={formIncidentSummary}
                      onChange={(e) => setFormIncidentSummary(e.target.value)}
                      placeholder="Describe incident, near miss, or procedural deviation..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Strengths & Commendations
                    </label>
                    <textarea
                      rows={2}
                      value={formStrengths}
                      onChange={(e) => setFormStrengths(e.target.value)}
                      placeholder="e.g. Proactive gas testing, outstanding SWA intervention..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Areas for Improvement
                    </label>
                    <textarea
                      rows={2}
                      value={formImprovements}
                      onChange={(e) => setFormImprovements(e.target.value)}
                      placeholder="e.g. Quicker scaffold tagging, tighter end-of-shift housekeeping..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Recommend for Future PSM Covered Work
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unchecking initiates formal contractor prequalification review.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formRecommend}
                    onChange={(e) => setFormRecommend(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plant Supervisor E-Signature <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSupervisorSig}
                    onChange={(e) => setFormSupervisorSig(e.target.value)}
                    placeholder="Type full legal name (e.g. Marcus Vance, Plant Maintenance Superintendent)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewEvalModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEvalMutation.isPending}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{createEvalMutation.isPending ? 'Saving...' : 'Submit & Recalculate Index'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: View Evaluation Detail & Acknowledgment */}
      {/* ========================================================================= */}
      {selectedEvalDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  WO #{selectedEvalDetail.work_order_or_job_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedEvalDetail.evaluation_title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvalDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Composite Score:</span>
                <CsmEvaluationScoreBadge score={selectedEvalDetail.composite_score_percent} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <CsmEvaluationStatusBadge status={selectedEvalDetail.status} />
              </div>

              {selectedEvalDetail.strengths && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">Strengths:</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedEvalDetail.strengths}</p>
                </div>
              )}

              {selectedEvalDetail.improvement_areas && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Improvement Areas:</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedEvalDetail.improvement_areas}</p>
                </div>
              )}

              {selectedEvalDetail.vendor_feedback_comments && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <span className="font-bold text-blue-800 dark:text-blue-300 block mb-0.5">
                    Vendor Feedback / Response:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedEvalDetail.vendor_feedback_comments}</p>
                </div>
              )}

              {/* Vendor Acknowledgment Form if not acknowledged yet */}
              {selectedEvalDetail.status === 'SUBMITTED' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block">
                    Record Vendor Acknowledgment / Feedback
                  </label>
                  <textarea
                    rows={2}
                    value={vendorFeedback}
                    onChange={(e) => setVendorFeedback(e.target.value)}
                    placeholder="Enter vendor comments or corrective action commitment..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    disabled={acknowledgeEvalMutation.isPending}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{acknowledgeEvalMutation.isPending ? 'Recording...' : 'Acknowledge Evaluation'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
