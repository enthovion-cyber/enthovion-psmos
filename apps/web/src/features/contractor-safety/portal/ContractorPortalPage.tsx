// apps/web/src/features/contractor-safety/portal/ContractorPortalPage.tsx
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  MapPin,
  X,
  FileCheck,
  Users,
  Plus,
  Award,
  GraduationCap,
  QrCode,
  Moon,
  Sun,
  ClipboardCheck,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import {
  CsmBadgeStatusBadge,
  CsmDocStatusBadge,
  CsmEvaluationScoreBadge,
  CsmEvaluationStatusBadge,
  CsmGradeBadge,
  CsmRollingSafetyIndexBadge,
  CsmTierBadge,
  CsmTradeBadge
} from '../ContractorSafetyUi';
import {
  useAcknowledgePortalEvaluation,
  useAddPortalWorkerCert,
  useContractorPortal,
  useCreatePortalWorker,
  usePortalEvaluations,
  usePortalInductions,
  usePortalWorkers,
  useUpdatePortalProfile,
  useUploadPortalDocument
} from '../hooks/useContractorSafety';
import type { CsmDocumentType, PortalChecklistItem } from '../types/contractor-safety.types';

export function ContractorPortalPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  const { data: portalData, isLoading, error } = useContractorPortal(token);
  const { data: portalWorkers } = usePortalWorkers(token);
  const { data: portalInductions } = usePortalInductions(token);
  const { data: portalEvals } = usePortalEvaluations(token);
  const uploadDocMutation = useUploadPortalDocument(token);
  const updateProfileMutation = useUpdatePortalProfile(token);
  const createPortalWorkerMutation = useCreatePortalWorker(token);
  const addPortalWorkerCertMutation = useAddPortalWorkerCert(token);
  const acknowledgeEvalMutation = useAcknowledgePortalEvaluation(token);

  const [activeTab, setActiveTab] = useState<'checklist' | 'workers' | 'inductions' | 'evaluations' | 'profile'>('checklist');
  const [evalFeedbackComments, setEvalFeedbackComments] = useState<Record<string, string>>({});
  const [uploadModalItem, setUploadModalItem] = useState<PortalChecklistItem | null>(null);

  // Portal Worker Registration Modal
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [wFirstName, setWFirstName] = useState('');
  const [wLastName, setWLastName] = useState('');
  const [wTrade, setWTrade] = useState('PIPEFITTER');
  const [wBadge, setWBadge] = useState('');
  const [wPhone, setWPhone] = useState('');

  // Upload modal state
  const [docTitle, setDocTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('5000000');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [primaryName, setPrimaryName] = useState('');
  const [primaryTitle, setPrimaryTitle] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Loading Contractor Portal...
        </h2>
        <p className="text-xs text-slate-400 mt-1">Verifying portal access token &amp; credentials...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Portal Access Link Invalid or Expired
        </h1>
        <p className="text-xs text-slate-500 max-w-md mt-2">
          This contractor self-service link is either invalid, expired, or has been revoked. Please contact the plant Process Safety / HSE department to request a refreshed invitation link.
        </p>
      </div>
    );
  }

  const { contractor, checklist, complianceSummary } = portalData;

  const handleOpenUpload = (item: PortalChecklistItem) => {
    setUploadModalItem(item);
    setDocTitle(`${item.label} (Current)`);
    setFileName(`${contractor.company_code}_${item.document_type}.pdf`);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalItem || !fileName) return;

    await uploadDocMutation.mutateAsync({
      document_type: uploadModalItem.document_type,
      title: docTitle,
      file_name: fileName,
      file_url: `https://storage.psm-os.local/contractor-portal/uploads/${fileName}`,
      policy_number: policyNumber || undefined,
      insurance_carrier: carrier || undefined,
      coverage_amount_usd: coverageAmount ? Number(coverageAmount) : 0,
      effective_date: effectiveDate || undefined,
      expiration_date: expirationDate || undefined
    });

    setUploadModalItem(null);
    setDocTitle('');
    setFileName('');
    setPolicyNumber('');
    setCarrier('');
    setEffectiveDate('');
    setExpirationDate('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync({
      primary_contact_name: primaryName || contractor.primary_contact_name,
      primary_contact_title: primaryTitle || contractor.primary_contact_title,
      primary_contact_email: primaryEmail || contractor.primary_contact_email,
      primary_contact_phone: primaryPhone || contractor.primary_contact_phone,
      emergency_contact_phone: emergencyPhone || contractor.emergency_contact_phone,
      office_address: address || contractor.office_address,
      city: city || contractor.city,
      state: state || contractor.state
    });
    setIsEditingProfile(false);
  };

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wFirstName || !wLastName || !contractor?.id) return;

    await createPortalWorkerMutation.mutateAsync({
      contractor_id: contractor.id,
      first_name: wFirstName,
      last_name: wLastName,
      craft_trade: wTrade,
      badge_number: wBadge || undefined,
      phone: wPhone || undefined
    });

    setIsWorkerModalOpen(false);
    setWFirstName('');
    setWLastName('');
    setWBadge('');
    setWPhone('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              PSM
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Contractor Self-Service Portal
              </div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {contractor.company_name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {contractor.company_code}
            </span>
            <CsmTierBadge tier={contractor.tier} />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              title={`Switch theme (Current: ${theme})`}
              aria-label="Toggle theme"
            >
              <ThemeIcon className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Compliance Status Banner */}
        <div
          className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            complianceSummary.isFullyCompliant
              ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
              : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
          }`}
        >
          <div className="flex items-start gap-3.5">
            {complianceSummary.isFullyCompliant ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {complianceSummary.isFullyCompliant
                    ? 'Compliance Status: Approved & Up-to-Date'
                    : 'Action Required: Submit Pending Compliance Documents'}
                </h2>
                <CsmGradeBadge grade={contractor.safety_grade} score={contractor.prequal_score} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Under OSHA 29 CFR 1910.119(h), contract employers must maintain active Certificate of Insurance (COI) filings, annual OSHA Form 300A records, and written safety programs to enter plant battery limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {complianceSummary.verifiedCount} / {complianceSummary.totalRequired}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Verified
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {complianceSummary.missingCount + complianceSummary.pendingReviewCount}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Action Items
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'checklist'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Required Document Filings ({checklist.length})
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'workers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Worker Roster &amp; Training ({portalWorkers?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('inductions')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'inductions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Digital Site Inductions ({portalInductions?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'evaluations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Safety Evaluations &amp; Scorecard ({portalEvals?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Company Profile &amp; 24/7 Contacts
          </button>
        </div>

        {/* Checklist Content */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {checklist.map((item) => {
                const isVerified = item.verification_status === 'VERIFIED' && !item.isExpired;

                return (
                  <div
                    key={item.document_type}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        <CsmDocStatusBadge
                          status={item.isExpired ? 'EXPIRED' : item.verification_status}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.document ? (
                          <>
                            File on record:{' '}
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {item.document.file_name}
                            </span>
                            {item.document.expiration_date && (
                              <span>
                                {' '}
                                &bull; Expires on{' '}
                                <strong
                                  className={
                                    item.isExpired
                                      ? 'text-rose-600'
                                      : item.isExpiringSoon
                                      ? 'text-amber-600'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }
                                >
                                  {item.document.expiration_date}
                                </strong>
                              </span>
                            )}
                          </>
                        ) : (
                          'No document currently uploaded. Please upload a copy to satisfy plant safety requirements.'
                        )}
                      </p>
                      {item.document?.rejection_reason && (
                        <div className="text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg mt-1 border border-rose-200 dark:border-rose-900">
                          Reviewer feedback: {item.document.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenUpload(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
                          isVerified
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{item.document ? 'Upload Updated Policy' : 'Upload File'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Workers Roster Content */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Designated Contract Personnel Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register all trade craft personnel who will be performing maintenance, turnaround, or construction activities on PSM units.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Register Personnel</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Worker</th>
                    <th className="py-3.5 px-4">Craft Trade</th>
                    <th className="py-3.5 px-4">Badge Number</th>
                    <th className="py-3.5 px-4">Badge Status</th>
                    <th className="py-3.5 px-4">Training Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {!portalWorkers?.length ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No workers registered yet. Click &quot;Register Personnel&quot; to add employees.
                      </td>
                    </tr>
                  ) : (
                    portalWorkers.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {w.first_name} {w.last_name}
                          <span className="block text-xs font-normal text-slate-400 font-mono">{w.worker_code}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <CsmTradeBadge trade={w.craft_trade} />
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {w.badge_number ?? '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <CsmBadgeStatusBadge status={w.badge_status} />
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {w.certifications?.length ?? 0} qualifications on file
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inductions & Training Content */}
        {activeTab === 'inductions' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pre-Site Entry Safety Inductions (OSHA 1910.119(h))
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All contract personnel must review site chemical hazards, Emergency Action Plans (EAP), and pass digital comprehension testing before turnstile QR gate passes are activated.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!portalInductions?.length ? (
                <div className="col-span-full py-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  No courses currently scheduled for this contractor tier.
                </div>
              ) : (
                portalInductions.map((course) => (
                  <div
                    key={course.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {course.course_code}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        Pass Score: {course.passing_score_percent}%
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{course.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                      <span>Validity: {course.validity_period_days} Days</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {course.slides_content?.length ?? 0} Slides • {course.quiz_questions?.length ?? 0} Questions
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Evaluations & Scorecard Content */}
        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Safety Scorecard &amp; Post-Job Evaluations
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      OSHA 29 CFR 1910.119(h)(2)(v)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Periodic Operating Company Performance Evaluations
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plant supervisors periodically evaluate contract employers on PPE compliance, housekeeping, PTW adherence, near-miss reporting, and Stop Work Authority.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CsmRollingSafetyIndexBadge index={contractor.rolling_safety_index ?? 90.0} />
                </div>
              </div>

              {(!portalEvals || portalEvals.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  <ClipboardCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  No post-job evaluations have been published for this contractor yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {portalEvals.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              WO #{ev.work_order_or_job_number}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(ev.evaluation_date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {ev.work_category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {ev.evaluation_title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <CsmEvaluationScoreBadge score={ev.composite_score_percent} />
                          <CsmEvaluationStatusBadge status={ev.status} />
                        </div>
                      </div>

                      {/* 7 criteria scores */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-[11px] p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                        <div><span className="text-slate-400 block">PPE:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.ppe_compliance_score}/5</strong></div>
                        <div><span className="text-slate-400 block">Housekeeping:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.housekeeping_score}/5</strong></div>
                        <div><span className="text-slate-400 block">PTW/LOTO:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.ptw_adherence_score}/5</strong></div>
                        <div><span className="text-slate-400 block">Near-Miss:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.near_miss_reporting_score}/5</strong></div>
                        <div><span className="text-slate-400 block">SWA:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.stop_work_authority_score}/5</strong></div>
                        <div><span className="text-slate-400 block">Craftsmanship:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.quality_and_craftsmanship_score}/5</strong></div>
                        <div><span className="text-slate-400 block">Schedule:</span> <strong className="text-slate-900 dark:text-slate-100">{ev.schedule_adherence_score}/5</strong></div>
                      </div>

                      {ev.strengths && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong className="text-emerald-600 dark:text-emerald-400">Strengths:</strong> {ev.strengths}
                        </p>
                      )}
                      {ev.improvement_areas && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong className="text-amber-600 dark:text-amber-400">Improvement Areas:</strong> {ev.improvement_areas}
                        </p>
                      )}

                      {/* Vendor feedback section */}
                      {ev.vendor_feedback_comments ? (
                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs">
                          <span className="font-bold text-blue-800 dark:text-blue-300 block mb-0.5">
                            Your Acknowledgment &amp; Response:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300">{ev.vendor_feedback_comments}</p>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                            Acknowledge Evaluation &amp; Provide Contractor Comments:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={evalFeedbackComments[ev.id] || ''}
                              onChange={(e) =>
                                setEvalFeedbackComments((prev) => ({ ...prev, [ev.id]: e.target.value }))
                              }
                              placeholder="Type response or confirmation of corrective action taken..."
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                await acknowledgeEvalMutation.mutateAsync({
                                  evalId: ev.id,
                                  data: { vendor_feedback_comments: evalFeedbackComments[ev.id] || 'Acknowledged by contractor representative.' }
                                });
                              }}
                              disabled={acknowledgeEvalMutation.isPending}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                            >
                              Submit Acknowledgment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Content */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Contractor Company Contacts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Keep your primary HSE representative and 24/7 dispatch phone numbers updated for site emergency drills and communication.
                  </p>
                </div>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrimaryName(contractor.primary_contact_name || '');
                      setPrimaryTitle(contractor.primary_contact_title || '');
                      setPrimaryEmail(contractor.primary_contact_email || '');
                      setPrimaryPhone(contractor.primary_contact_phone || '');
                      setEmergencyPhone(contractor.emergency_contact_phone || '');
                      setAddress(contractor.office_address || '');
                      setCity(contractor.city || '');
                      setState(contractor.state || '');
                      setIsEditingProfile(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Edit Contacts
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Primary Contact Name
                      </label>
                      <input
                        type="text"
                        value={primaryName}
                        onChange={(e) => setPrimaryName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Title / Role
                      </label>
                      <input
                        type="text"
                        value={primaryTitle}
                        onChange={(e) => setPrimaryTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={primaryEmail}
                        onChange={(e) => setPrimaryEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={primaryPhone}
                        onChange={(e) => setPrimaryPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        24/7 Emergency Dispatch Phone
                      </label>
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Office Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block">Primary Contact</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {contractor.primary_contact_name || 'Not specified'}
                      </span>
                      <span className="text-slate-500 block">
                        {contractor.primary_contact_title || 'Coordinator'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email Address</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {contractor.primary_contact_email || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone Number</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {contractor.primary_contact_phone || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block">24/7 Emergency Dispatch</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm text-rose-600 dark:text-rose-400">
                        {contractor.emergency_contact_phone || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Physical Office</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {contractor.office_address ? `${contractor.office_address}, ` : ''}
                        {contractor.city || ''} {contractor.state || ''} {contractor.postal_code || ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal Dialog */}
      {uploadModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Submit {uploadModalItem.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Upload file &amp; enter policy verification details for plant review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document / Policy Title *
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Attachment *
                </label>
                <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800/50">
                  <FileCheck className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full text-center font-mono text-xs bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    PDF format supported (Max 25MB)
                  </span>
                </div>
              </div>

              {uploadModalItem.document_type.startsWith('COI') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Policy Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GL-88491"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Insurance Underwriter
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Travelers Property"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Coverage Amount ($ USD)
                    </label>
                    <input
                      type="number"
                      value={coverageAmount}
                      onChange={(e) => setCoverageAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadModalItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadDocMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {uploadDocMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PORTAL REGISTER WORKER MODAL */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Register Contract Worker</h3>
              </div>
              <button
                onClick={() => setIsWorkerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWorkerSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={wFirstName}
                    onChange={(e) => setWFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={wLastName}
                    onChange={(e) => setWLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Craft Trade</label>
                <select
                  value={wTrade}
                  onChange={(e) => setWTrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="PIPEFITTER">Pipefitter</option>
                  <option value="WELDER_ASME9">Welder (ASME IX)</option>
                  <option value="SCAFFOLDER_COMPETENT">Scaffolder Competent</option>
                  <option value="ELECTRICIAN_EE">Electrician (EE)</option>
                  <option value="INSTRUMENT_TECH">Instrumentation Tech</option>
                  <option value="RIGGER">Rigger / Signal Person</option>
                  <option value="MILLWRIGHT">Millwright</option>
                  <option value="GENERAL_LABOR">General Labor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Badge #</label>
                  <input
                    type="text"
                    placeholder="e.g. BDG-7001"
                    value={wBadge}
                    onChange={(e) => setWBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={wPhone}
                    onChange={(e) => setWPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPortalWorkerMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  {createPortalWorkerMutation.isPending ? 'Registering...' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
