// apps/web/src/features/contractor-safety/ContractorWorkersPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Award,
  Calendar,
  ExternalLink,
  Clock,
  HardHat,
  FileCheck,
  X,
  ChevronRight,
  Sparkles,
  Building2,
  Phone,
  Mail,
  Flame,
  Zap,
  Check
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmBadgeStatusBadge,
  CsmCertStatusBadge,
  CsmGradeBadge,
  CsmSkillLevelBadge,
  CsmTradeBadge
} from './ContractorSafetyUi';
import {
  useAddCertification,
  useCheckPtwEligibility,
  useContractorLookups,
  useContractorsList,
  useContractorWorkers,
  useCreateWorker,
  useExpiringRadar,
  useVerifyCertification,
  useWorkerDetail
} from './hooks/useContractorSafety';
import type {
  CsmBadgeStatus,
  CsmCertCategory,
  CsmContractorWorker,
  CsmCraftSkillLevel,
  CsmCraftTrade,
  CsmPtwEligibilityResult
} from './types/contractor-safety.types';

export function ContractorWorkersPage() {
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'roster' | 'radar' | 'ptw-checker'>('roster');

  // Selected worker for detail drawer
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null);

  // Modals
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);
  const [certWorkerId, setCertWorkerId] = useState<string | null>(null);

  // Add Worker Form state
  const [newWorkerFirstName, setNewWorkerFirstName] = useState('');
  const [newWorkerLastName, setNewWorkerLastName] = useState('');
  const [newWorkerContractorId, setNewWorkerContractorId] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState<CsmCraftTrade>('PIPEFITTER');
  const [newWorkerSkillLevel, setNewWorkerSkillLevel] = useState<CsmCraftSkillLevel>('JOURNEYMAN');
  const [newWorkerBadgeNum, setNewWorkerBadgeNum] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerEmergencyName, setNewWorkerEmergencyName] = useState('');
  const [newWorkerEmergencyPhone, setNewWorkerEmergencyPhone] = useState('');

  // Add Cert Form state
  const [certName, setCertName] = useState('');
  const [certCategory, setCertCategory] = useState<CsmCertCategory>('PROCESS_SAFETY');
  const [certBody, setCertBody] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpDate, setCertExpDate] = useState('');
  const [certDocUrl, setCertDocUrl] = useState('');
  const [certIsBlocking, setCertIsBlocking] = useState(true);

  // PTW Simulation state
  const [ptwWorkerId, setPtwWorkerId] = useState('');
  const [ptwPreset, setPtwPreset] = useState<'HOT_WORK' | 'CONFINED_SPACE' | 'ELECTRICAL' | 'SCAFFOLD' | 'CUSTOM'>('CONFINED_SPACE');
  const [customReqCerts, setCustomReqCerts] = useState('OSHA, Confined Space');

  // Queries
  const { data: lookups } = useContractorLookups();
  const { data: contractorsData } = useContractorsList();
  const { data: workersData, isLoading: isWorkersLoading } = useContractorWorkers({
    contractor_id: selectedContractorId || undefined,
    craft_trade: selectedTrade || undefined,
    badge_status: selectedStatus || undefined,
    search: searchTerm || undefined
  });
  const { data: radarData } = useExpiringRadar(60);
  const { data: activeWorkerDetail, isLoading: isWorkerDetailLoading } = useWorkerDetail(activeWorkerId ?? '');

  // Mutations
  const createWorkerMutation = useCreateWorker();
  const addCertMutation = useAddCertification(certWorkerId || activeWorkerId || '');
  const verifyCertMutation = useVerifyCertification(activeWorkerId ?? undefined);
  const checkPtwMutation = useCheckPtwEligibility();

  const contractors = (contractorsData as any[]) ?? [];
  const workers = workersData?.workers ?? [];
  const radarSummary = radarData?.summary;
  const ptwResult = checkPtwMutation.data as CsmPtwEligibilityResult | undefined;

  const totalWorkers = workersData?.total ?? workers.length;
  const activeBadged = workers.filter((w) => w.badge_status === 'ACTIVE').length;
  const ptwBlocked = workers.filter((w) => !w.stats?.ptw_eligible).length;

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerFirstName || !newWorkerLastName || !newWorkerContractorId) return;

    await createWorkerMutation.mutateAsync({
      first_name: newWorkerFirstName,
      last_name: newWorkerLastName,
      contractor_id: newWorkerContractorId,
      craft_trade: newWorkerTrade,
      craft_skill_level: newWorkerSkillLevel,
      badge_number: newWorkerBadgeNum || undefined,
      email: newWorkerEmail || undefined,
      phone: newWorkerPhone || undefined,
      emergency_contact_name: newWorkerEmergencyName || undefined,
      emergency_contact_phone: newWorkerEmergencyPhone || undefined,
      badge_status: 'ACTIVE'
    });

    setIsAddWorkerOpen(false);
    setNewWorkerFirstName('');
    setNewWorkerLastName('');
    setNewWorkerBadgeNum('');
    setNewWorkerEmail('');
    setNewWorkerPhone('');
    setNewWorkerEmergencyName('');
    setNewWorkerEmergencyPhone('');
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = certWorkerId || activeWorkerId;
    if (!targetId || !certName || !certBody || !certIssueDate) return;

    await addCertMutation.mutateAsync({
      certification_name: certName,
      certification_category: certCategory,
      certifying_body: certBody,
      certificate_number: certNumber || undefined,
      issue_date: certIssueDate,
      expiration_date: certExpDate || undefined,
      document_url: certDocUrl || undefined,
      is_ptw_blocking: certIsBlocking
    });

    setIsAddCertOpen(false);
    setCertName('');
    setCertBody('');
    setCertNumber('');
    setCertIssueDate('');
    setCertExpDate('');
    setCertDocUrl('');
  };

  const handleVerifyCert = async (certId: string, status: 'VERIFIED' | 'REJECTED') => {
    await verifyCertMutation.mutateAsync({
      certId,
      data: {
        verification_status: status,
        verification_notes: status === 'VERIFIED' ? 'Verified by PSM Safety Coordinator' : 'Invalid documentation'
      }
    });
  };

  const runPtwSimulation = () => {
    if (!ptwWorkerId) return;

    let certs: string[] = [];
    if (ptwPreset === 'CONFINED_SPACE') {
      certs = ['OSHA', 'Confined Space'];
    } else if (ptwPreset === 'HOT_WORK') {
      certs = ['OSHA', 'Welding', 'Hot Work'];
    } else if (ptwPreset === 'ELECTRICAL') {
      certs = ['NFPA 70E', 'Electrician'];
    } else if (ptwPreset === 'SCAFFOLD') {
      certs = ['Scaffold', 'Fall Protection'];
    } else {
      certs = customReqCerts.split(',').map((s) => s.trim()).filter(Boolean);
    }

    checkPtwMutation.mutate({
      workerId: ptwWorkerId,
      requiredCertifications: certs
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <ContractorSafetyHeader
        title="Worker-Level Credentials &amp; Training Records"
        subtitle="Mandatory OSHA 29 CFR 1910.119(h)(3)(iv) training verification, craft qualification tracking, expiration radar, and Permit to Work (PTW) gatekeeping."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (contractors.length > 0 && !newWorkerContractorId) {
                  setNewWorkerContractorId(contractors[0]?.id || '');
                }
                setIsAddWorkerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Worker</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Total Workers</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalWorkers}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all registered contractors</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Active Badged</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeBadged}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cleared for site security turnstile</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Expiring Radar</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {radarSummary?.total_flagged ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {radarSummary?.expired_count ?? 0} expired
              </span>
              {' • '}
              {radarSummary?.urgent_7_days_count ?? 0} within 7d
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>PTW Gate Blocked</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{ptwBlocked}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ineligible for hot work / confined permits</div>
          </div>
        </div>

        {/* Inner Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Workers Roster</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-black/10 dark:bg-white/10">{totalWorkers}</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'radar'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Expiration Radar (60 Days)</span>
            {(radarSummary?.total_flagged ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500 text-white font-bold">
                {radarSummary?.total_flagged}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ptw-checker')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'ptw-checker'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>PTW Readiness Simulator</span>
          </button>
        </div>

        {/* TAB 1: WORKERS ROSTER */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search worker name, badge number, or worker ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="">All Contractors</option>
                  {contractors.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="">All Craft Trades</option>
                  <option value="PIPEFITTER">Pipefitter</option>
                  <option value="WELDER_ASME9">Welder (ASME IX)</option>
                  <option value="SCAFFOLDER_COMPETENT">Scaffolder</option>
                  <option value="ELECTRICIAN_EE">Electrician</option>
                  <option value="INSTRUMENT_TECH">Instrument Tech</option>
                  <option value="RIGGER">Rigger</option>
                  <option value="MILLWRIGHT">Millwright</option>
                  <option value="GENERAL_LABOR">General Labor</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="">All Badge Statuses</option>
                  <option value="ACTIVE">Active Badge</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="EXPIRED">Expired Credentials</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {/* Workers Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Worker</th>
                      <th className="py-3 px-4">Employer Contractor</th>
                      <th className="py-3 px-4">Trade &amp; Skill</th>
                      <th className="py-3 px-4">Badge #</th>
                      <th className="py-3 px-4">Badge Status</th>
                      <th className="py-3 px-4">Certifications</th>
                      <th className="py-3 px-4">PTW Readiness</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                    {isWorkersLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Loading contractor worker rosters...
                        </td>
                      </tr>
                    ) : workers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No contractor workers matching current filter.
                        </td>
                      </tr>
                    ) : (
                      workers.map((w) => {
                        const stats = w.stats;
                        const isPtwOk = stats?.ptw_eligible ?? (w.badge_status === 'ACTIVE');

                        return (
                          <tr
                            key={w.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                            onClick={() => setActiveWorkerId(w.id)}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                                  {w.first_name[0]}
                                  {w.last_name[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    {w.first_name} {w.last_name}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">{w.worker_code}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {w.contractor ? (
                                <div>
                                  <div className="font-medium text-slate-800 dark:text-slate-200">
                                    {w.contractor.company_name}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs text-slate-400 font-mono">
                                      {w.contractor.vendor_number}
                                    </span>
                                    <CsmGradeBadge grade={w.contractor.safety_grade} />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                <CsmTradeBadge trade={w.craft_trade} />
                                <CsmSkillLevelBadge level={w.craft_skill_level} />
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                              {w.badge_number ?? '—'}
                            </td>

                            <td className="py-3.5 px-4">
                              <CsmBadgeStatusBadge status={w.badge_status} />
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-xs">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {stats?.verified_certifications ?? 0}
                                </span>
                                <span className="text-slate-400">/{stats?.total_certifications ?? 0} verified</span>
                                {(stats?.expired_certifications ?? 0) > 0 && (
                                  <span className="block text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                                    {stats?.expired_certifications} expired
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {isPtwOk ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  PTW Cleared
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  PTW Blocked
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setCertWorkerId(w.id);
                                    setIsAddCertOpen(true);
                                  }}
                                  title="Add Certification"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Award className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setActiveWorkerId(w.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="View Worker Dossier"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPIRATION RADAR */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  OSHA 1910.119(h) Turnaround &amp; Unit Access Credential Radar
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Contract personnel with expired credentials are automatically gated from Permit to Work issuance and gate entry. Proactively notify vendor safety managers before credential lapse.
                </p>
              </div>
            </div>

            {/* Expired List */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Expired Credentials ({radarData?.expired.length ?? 0})
                </h3>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {!radarData?.expired.length ? (
                  <div className="p-6 text-center text-sm text-slate-400">Zero expired credentials detected.</div>
                ) : (
                  radarData.expired.map((c) => (
                    <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{c.certification_name}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Expired on {c.expiration_date}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Worker: <span className="font-medium text-slate-700 dark:text-slate-300">{c.worker?.first_name} {c.worker?.last_name}</span>
                          {' • '}Employer: <span className="font-medium text-slate-700 dark:text-slate-300">{c.worker?.contractor?.company_name}</span>
                          {' • '}Body: {c.certifying_body}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveWorkerId(c.worker_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      >
                        <span>Open Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Urgent within 7 Days */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Urgent: Expiring Within 7 Days ({radarData?.urgent7Days.length ?? 0})
                </h3>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {!radarData?.urgent7Days.length ? (
                  <div className="p-6 text-center text-sm text-slate-400">Zero certifications expiring within 7 days.</div>
                ) : (
                  radarData.urgent7Days.map((c) => (
                    <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{c.certification_name}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            Expires {c.expiration_date}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Worker: <span className="font-medium text-slate-700 dark:text-slate-300">{c.worker?.first_name} {c.worker?.last_name}</span>
                          {' • '}Employer: <span className="font-medium text-slate-700 dark:text-slate-300">{c.worker?.contractor?.company_name}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveWorkerId(c.worker_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        <span>Update Recertification</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warning within 30 Days */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Expiring Within 30 Days ({radarData?.warning30Days.length ?? 0})
                </h3>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {!radarData?.warning30Days.length ? (
                  <div className="p-6 text-center text-sm text-slate-400">Zero certifications expiring within 30 days.</div>
                ) : (
                  radarData.warning30Days.map((c) => (
                    <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{c.certification_name}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            Expires {c.expiration_date}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Worker: {c.worker?.first_name} {c.worker?.last_name} ({c.worker?.contractor?.company_name})
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveWorkerId(c.worker_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                      >
                        <span>View</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PTW READINESS SIMULATOR */}
        {activeTab === 'ptw-checker' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Permit Gating Criteria</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulates real-time validation against the active safety permit system before assigning a contract worker to high-hazard jobs.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Contract Worker
                </label>
                <select
                  value={ptwWorkerId}
                  onChange={(e) => setPtwWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">Choose worker...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.first_name} {w.last_name} ({w.craft_trade} - {w.contractor?.company_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permit / Hazard Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CONFINED_SPACE', label: 'Confined Space' },
                    { id: 'HOT_WORK', label: 'Hot Work (Welding)' },
                    { id: 'ELECTRICAL', label: 'High Voltage (NFPA 70E)' },
                    { id: 'SCAFFOLD', label: 'Scaffold Erection' },
                    { id: 'CUSTOM', label: 'Custom Certs' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPtwPreset(p.id as any)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors border ${
                        ptwPreset === p.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {ptwPreset === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Comma-Separated Required Certs
                  </label>
                  <input
                    type="text"
                    value={customReqCerts}
                    onChange={(e) => setCustomReqCerts(e.target.value)}
                    placeholder="e.g. OSHA 30, Rigger, CPR"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}

              <button
                onClick={runPtwSimulation}
                disabled={!ptwWorkerId || checkPtwMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                {checkPtwMutation.isPending ? 'Verifying...' : 'Validate PTW Eligibility'}
              </button>
            </div>

            {/* Simulation Results */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Gate Evaluation Result</h3>
              {!ptwResult ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                  <ShieldCheck className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                  <p className="text-sm">Select a worker and hazard permit type to test clearance.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ptwResult.is_eligible ? (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                          PERMIT TO WORK CLEARED (OSHA COMPLIANT)
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                          {ptwResult.worker_name} holds active, verified qualifications matching all required standards for this permit.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div>
                        <h4 className="font-bold text-rose-900 dark:text-rose-200">
                          PERMIT ISSUANCE PROHIBITED (GATE BLOCKED)
                        </h4>
                        <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                          {ptwResult.worker_name} does not meet mandatory qualification gates under OSHA 1910.119(h).
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-400 font-medium">Worker Badge Status</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {ptwResult.badge_status}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-400 font-medium">Craft Qualification</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {ptwResult.craft_trade}
                      </div>
                    </div>
                  </div>

                  {ptwResult.missing_certifications.length > 0 && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
                        Missing or Expired Mandatory Certifications:
                      </div>
                      <ul className="space-y-1 text-xs">
                        {ptwResult.missing_certifications.map((mc: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span>{mc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WORKER DETAIL DRAWER / MODAL */}
      {activeWorkerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {activeWorkerDetail?.worker_code ?? 'WORKER DOSSIER'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {activeWorkerDetail?.first_name} {activeWorkerDetail?.last_name}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Employer: {activeWorkerDetail?.contractor?.company_name}
                </div>
              </div>
              <button
                onClick={() => setActiveWorkerId(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isWorkerDetailLoading ? (
                <div className="py-12 text-center text-slate-400">Loading worker dossier...</div>
              ) : activeWorkerDetail ? (
                <>
                  {/* Badges strip */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <CsmBadgeStatusBadge status={activeWorkerDetail.badge_status} />
                    <CsmTradeBadge trade={activeWorkerDetail.craft_trade} />
                    <CsmSkillLevelBadge level={activeWorkerDetail.craft_skill_level} />
                    {activeWorkerDetail.badge_number && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Badge #{activeWorkerDetail.badge_number}
                      </span>
                    )}
                  </div>

                  {/* PTW Summary Alert */}
                  {activeWorkerDetail.compliance_summary.ptw_eligible ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                        PTW Ready: All mandatory credentials active and verified.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          PTW Ineligible: Clearance blocked.
                        </div>
                        <ul className="text-xs text-rose-800 dark:text-rose-300 mt-1 list-disc list-inside">
                          {activeWorkerDetail.compliance_summary.block_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                      Contact &amp; Emergency Info
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                      <div>Email: {activeWorkerDetail.email ?? '—'}</div>
                      <div>Phone: {activeWorkerDetail.phone ?? '—'}</div>
                      <div>Emergency Contact: {activeWorkerDetail.emergency_contact_name ?? '—'}</div>
                      <div>Emergency Phone: {activeWorkerDetail.emergency_contact_phone ?? '—'}</div>
                    </div>
                  </div>

                  {/* OSHA 1910.119(h)(3)(iv) Training Record Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          Certifications &amp; Training Records
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          OSHA 29 CFR 1910.119(h)(3)(iv) documented qualification records.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCertWorkerId(activeWorkerDetail.id);
                          setIsAddCertOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Cert</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {!activeWorkerDetail.certifications?.length ? (
                        <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          No certifications on file for this worker.
                        </div>
                      ) : (
                        activeWorkerDetail.certifications.map((c) => (
                          <div
                            key={c.id}
                            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {c.certification_name}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Body: <span className="font-medium text-slate-700 dark:text-slate-300">{c.certifying_body}</span>
                                  {c.certificate_number && ` • Lic/Cert #: ${c.certificate_number}`}
                                </div>
                              </div>
                              <CsmCertStatusBadge status={c.verification_status} isExpired={c.is_expired} />
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                              <div>Issued: {c.issue_date}</div>
                              <div>
                                Expires:{' '}
                                {c.expiration_date ? (
                                  <span className={c.is_expired ? 'text-rose-600 font-bold' : ''}>
                                    {c.expiration_date}
                                  </span>
                                ) : (
                                  'Permanent / No Expiry'
                                )}
                              </div>
                              {c.is_ptw_blocking && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                  • PTW Mandatory Gate
                                </span>
                              )}
                            </div>

                            {/* Verification action for pending certs */}
                            {c.verification_status === 'PENDING' && (
                              <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleVerifyCert(c.id, 'REJECTED')}
                                  className="px-2.5 py-1 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleVerifyCert(c.id, 'VERIFIED')}
                                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                                >
                                  Verify Qualification
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER WORKER MODAL */}
      {isAddWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Register Contract Worker</h3>
              </div>
              <button
                onClick={() => setIsAddWorkerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employer Contractor *
                </label>
                <select
                  value={newWorkerContractorId}
                  onChange={(e) => setNewWorkerContractorId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">Select employer company...</option>
                  {contractors.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.vendor_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newWorkerFirstName}
                    onChange={(e) => setNewWorkerFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newWorkerLastName}
                    onChange={(e) => setNewWorkerLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Craft Trade</label>
                  <select
                    value={newWorkerTrade}
                    onChange={(e) => setNewWorkerTrade(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="PIPEFITTER">Pipefitter</option>
                    <option value="WELDER_ASME9">Welder (ASME IX)</option>
                    <option value="SCAFFOLDER_COMPETENT">Scaffolder Competent</option>
                    <option value="ELECTRICIAN_EE">Electrician (EE)</option>
                    <option value="INSTRUMENT_TECH">Instrumentation Tech</option>
                    <option value="RIGGER">Rigger / Signal</option>
                    <option value="MILLWRIGHT">Millwright</option>
                    <option value="INSULATOR">Insulator</option>
                    <option value="GENERAL_LABOR">General Labor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Skill Level</label>
                  <select
                    value={newWorkerSkillLevel}
                    onChange={(e) => setNewWorkerSkillLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="APPRENTICE">Apprentice</option>
                    <option value="JOURNEYMAN">Journeyman</option>
                    <option value="FOREMAN">Foreman</option>
                    <option value="SUPERINTENDENT">Superintendent</option>
                    <option value="MASTER_CRAFTSMAN">Master Craftsman</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Badge Number</label>
                  <input
                    type="text"
                    value={newWorkerBadgeNum}
                    onChange={(e) => setNewWorkerBadgeNum(e.target.value)}
                    placeholder="e.g. BDG-4401"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newWorkerPhone}
                    onChange={(e) => setNewWorkerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Emergency Contact (OSHA EAP Requirement)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={newWorkerEmergencyName}
                    onChange={(e) => setNewWorkerEmergencyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={newWorkerEmergencyPhone}
                    onChange={(e) => setNewWorkerEmergencyPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWorkerOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createWorkerMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  {createWorkerMutation.isPending ? 'Saving...' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CERTIFICATION MODAL */}
      {isAddCertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Record Certification / Training</h3>
              </div>
              <button
                onClick={() => setIsAddCertOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCert} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Certification Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OSHA 30-Hour Construction Safety, Confined Space Entry"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={certCategory}
                    onChange={(e) => setCertCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="PROCESS_SAFETY">Process Safety (PSM)</option>
                    <option value="OSHA_STANDARD">OSHA Standard (10/30)</option>
                    <option value="TRADE_QUALIFICATION">Trade Qualification</option>
                    <option value="EQUIPMENT_OPERATION">Equipment Operation</option>
                    <option value="EMERGENCY_RESPONSE">Emergency Response</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Certifying Body *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OSHA Training Institute, NCCER, AWS"
                    value={certBody}
                    onChange={(e) => setCertBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiration Date (leave blank if permanent)
                  </label>
                  <input
                    type="date"
                    value={certExpDate}
                    onChange={(e) => setCertExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  License / Certificate ID #
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS-6G-88219"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ptwBlock"
                  checked={certIsBlocking}
                  onChange={(e) => setCertIsBlocking(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ptwBlock" className="font-semibold text-slate-700 dark:text-slate-300">
                  PTW Blocking Gate (Worker blocked from permit if expired)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCertOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCertMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  {addCertMutation.isPending ? 'Saving...' : 'Record Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
