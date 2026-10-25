// apps/web/src/features/contractor-safety/ContractorDetailPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  FileCheck,
  ArrowLeft,
  Link2,
  Check,
  RefreshCw,
  Plus,
  AlertCircle,
  Trash2,
  X,
  ExternalLink,
  Calculator,
  Users,
  ClipboardCheck
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmBadgeStatusBadge,
  CsmDocStatusBadge,
  CsmEvaluationScoreBadge,
  CsmEvaluationStatusBadge,
  CsmGradeBadge,
  CsmRollingSafetyIndexBadge,
  CsmStatusBadge,
  CsmTierBadge,
  CsmTradeBadge,
  CsmVarianceStatusBadge
} from './ContractorSafetyUi';
import {
  useAddDocument,
  useContractorDetail,
  useContractorEvaluationSummary,
  useContractorPrequal,
  useContractorWorkers,
  useDeleteDocument,
  useRegeneratePortalToken,
  useVerifyDocument
} from './hooks/useContractorSafety';

export function ContractorDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { data: contractor, isLoading, error } = useContractorDetail(id);
  const { data: prequal } = useContractorPrequal(id);
  const { data: workersData } = useContractorWorkers({ contractor_id: id });
  const { data: scorecardSummary } = useContractorEvaluationSummary(id);
  const regenerateTokenMutation = useRegeneratePortalToken(id);
  const addDocumentMutation = useAddDocument(id);
  const verifyDocumentMutation = useVerifyDocument(id);
  const deleteDocumentMutation = useDeleteDocument(id);

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'prequal' | 'workers' | 'evaluations' | 'portal'>('documents');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  // New Doc Form
  const [docType, setDocType] = useState('COI_GENERAL_LIABILITY');
  const [docTitle, setDocTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('5000000');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Rejection modal
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ContractorSafetyHeader
          title="Loading Contractor Profile..."
          subtitle="Fetching contractor compliance records..."
        />
        <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Contractor Not Found
          </h2>
          <p className="text-xs text-slate-500">
            The requested contractor profile does not exist or has been removed.
          </p>
          <Link
            href="/contractor-safety/contractors"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    if (!contractor.portal_access_token) return;
    const url = `${window.location.origin}/contractor-portal/${contractor.portal_access_token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !fileName) return;

    await addDocumentMutation.mutateAsync({
      document_type: docType,
      title: docTitle,
      file_name: fileName,
      file_url: `https://storage.psm-os.local/contractors/${contractor.company_code.toLowerCase()}/${fileName}`,
      policy_number: policyNumber || undefined,
      insurance_carrier: carrier || undefined,
      coverage_amount_usd: coverageAmount ? Number(coverageAmount) : 0,
      effective_date: effectiveDate || undefined,
      expiration_date: expirationDate || undefined
    });

    setIsAddDocOpen(false);
    setDocTitle('');
    setFileName('');
    setPolicyNumber('');
    setCarrier('');
    setEffectiveDate('');
    setExpirationDate('');
  };

  const handleVerify = async (docId: string) => {
    await verifyDocumentMutation.mutateAsync({
      docId,
      data: { verification_status: 'VERIFIED' }
    });
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDocId) return;

    await verifyDocumentMutation.mutateAsync({
      docId: rejectingDocId,
      data: {
        verification_status: 'REJECTED',
        rejection_reason: rejectionReason || 'Certificate does not meet plant minimum liability limits.'
      }
    });

    setRejectingDocId(null);
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Top Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-5 pb-5">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link
            href="/contractor-safety/contractors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {contractor.company_code}
                </span>
                <CsmTierBadge tier={contractor.tier} />
                <CsmGradeBadge grade={contractor.safety_grade} score={contractor.prequal_score} />
                <CsmStatusBadge status={contractor.status} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {contractor.company_name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {contractor.office_address ? `${contractor.office_address}, ` : ''}
                {contractor.city || 'Houston'}, {contractor.state || 'TX'} &bull; Primary Contact:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {contractor.primary_contact_name || 'N/A'} ({contractor.primary_contact_phone || 'N/A'})
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {contractor.portal_access_token && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      copiedLink
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 text-slate-500" />
                        <span>Copy Vendor Portal Link</span>
                      </>
                    )}
                  </button>
                  <Link
                    href={`/contractor-portal/${contractor.portal_access_token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
                  >
                    <span>Launch Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'documents'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Insurance &amp; Documents ({contractor.documents?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('prequal')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'prequal'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Prequalification &amp; Safety Metrics
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'workers'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Worker Roster ({workersData?.workers?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'evaluations'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Evaluations &amp; Scorecard ({scorecardSummary?.total_evaluations ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Overview &amp; Facilities
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'portal'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Vendor Portal Access &amp; Audit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Compliance Documents &amp; Insurance Certificates (COI)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  OSHA 1910.119(h) requires plant owners to verify contract employer safety programs and active liability coverage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            {/* Document Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Document Title / Type</th>
                      <th className="py-3 px-4 font-semibold">Policy / Carrier</th>
                      <th className="py-3 px-4 font-semibold">Coverage Limit</th>
                      <th className="py-3 px-4 font-semibold">Effective Range</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Source</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {!contractor.documents?.length ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No documents uploaded yet. Contractor can upload via the self-service portal, or you can register files above.
                        </td>
                      </tr>
                    ) : (
                      contractor.documents.map((doc) => {
                        const isExpired = doc.expiration_date
                          ? new Date(doc.expiration_date) <= new Date()
                          : false;

                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {doc.title}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {doc.file_name} &bull; {doc.document_type}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              <div>{doc.insurance_carrier || '—'}</div>
                              {doc.policy_number && (
                                <div className="text-[11px] font-mono text-slate-400">
                                  #{doc.policy_number}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              {doc.coverage_amount_usd
                                ? `$${(doc.coverage_amount_usd).toLocaleString()} USD`
                                : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <div>{doc.effective_date || 'N/A'} to</div>
                              <div
                                className={`font-semibold ${
                                  isExpired
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {doc.expiration_date || 'Indefinite'}
                                {isExpired && ' (EXPIRED)'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <CsmDocStatusBadge status={isExpired ? 'EXPIRED' : doc.verification_status} />
                              {doc.rejection_reason && (
                                <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 max-w-xs">
                                  {doc.rejection_reason}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {doc.uploaded_via_portal ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  Vendor Portal
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">Plant Internal</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {doc.verification_status !== 'VERIFIED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerify(doc.id)}
                                    className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100"
                                  >
                                    Verify
                                  </button>
                                )}
                                {doc.verification_status !== 'REJECTED' && (
                                  <button
                                    type="button"
                                    onClick={() => setRejectingDocId(doc.id)}
                                    className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

        {activeTab === 'prequal' && (
          <div className="space-y-6">
            {/* Score & Evaluation Card */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CsmGradeBadge
                    grade={contractor.safety_grade}
                    score={contractor.prequal_score}
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Overall Safety Score: {contractor.prequal_score ?? 0} / 100
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluated according to OSHA 29 CFR 1910.119(h) Contractor Selection Standards
                    </p>
                  </div>
                </div>

                <Link
                  href="/contractor-safety/prequalification"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Open Full Gradebook &rarr;</span>
                </Link>
              </div>

              {/* Score breakdown metrics */}
              {prequal?.currentEvaluation?.score_breakdown && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Workers Comp EMR
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {prequal.currentEvaluation.score_breakdown.emrScore} / 30 pts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      3-Yr Avg TRIR
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {prequal.currentEvaluation.score_breakdown.trirScore} / 30 pts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Fatality Record
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {prequal.currentEvaluation.score_breakdown.fatalityScore} / 20 pts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      3-Yr Avg DART
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {prequal.currentEvaluation.score_breakdown.dartScore} / 10 pts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Written HSE Policy
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {prequal.currentEvaluation.score_breakdown.programScore} / 10 pts
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3-Year Historical Metrics Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Annual Safety Metrics (OSHA 300 / 300A Logs &amp; EMR Letters)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified safety statistics logged for prequalification calculation.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Year</th>
                      <th className="py-2.5 px-4 font-semibold">Man-Hours Worked</th>
                      <th className="py-2.5 px-4 font-semibold">Recordables</th>
                      <th className="py-2.5 px-4 font-semibold">TRIR</th>
                      <th className="py-2.5 px-4 font-semibold">DART Cases</th>
                      <th className="py-2.5 px-4 font-semibold">DART Rate</th>
                      <th className="py-2.5 px-4 font-semibold">EMR</th>
                      <th className="py-2.5 px-4 font-semibold">Fatalities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {!prequal?.metricsHistory?.length ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No annual metrics logged yet for this contractor.
                        </td>
                      </tr>
                    ) : (
                      prequal.metricsHistory.map((m: any) => (
                        <tr key={m.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{m.year}</td>
                          <td className="py-3 px-4 font-mono">{Number(m.total_hours_worked).toLocaleString()} hrs</td>
                          <td className="py-3 px-4 font-semibold">{m.recordable_cases_count}</td>
                          <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{m.trir}</td>
                          <td className="py-3 px-4">{m.dart_cases_count}</td>
                          <td className="py-3 px-4">{m.dart_rate}</td>
                          <td className="py-3 px-4 font-bold font-mono">{m.emr}</td>
                          <td className={`py-3 px-4 font-bold ${m.fatalities_count > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {m.fatalities_count}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Safety Variances */}
            {prequal?.variances?.length ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Management Safety Variances on Record
                </h4>
                <div className="space-y-2">
                  {prequal.variances.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{v.title}</span>
                          <span className="font-mono text-slate-400">({v.variance_number})</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{v.justification}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-500 font-mono text-[11px]">
                          {v.starts_at} to {v.expires_at}
                        </span>
                        <CsmVarianceStatusBadge status={v.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Craft Specialties Card */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Approved Craft Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contractor.specialties?.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Plant Site Authorizations */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Authorized Plant Sites
                </h3>
                <div className="space-y-2">
                  {contractor.sites?.length ? (
                    contractor.sites.map((site) => (
                      <div
                        key={site.id}
                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Site ID: {site.site_id}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Authorized on {new Date(site.granted_at || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {site.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      Approved for all facility sites within the tenant company.
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Safety Reviewer Notes &amp; PSM Context
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {contractor.notes || 'No specific reviewer notes recorded for this contractor.'}
                </p>
              </div>
            </div>

            {/* Side Information */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Emergency Contacts
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">24/7 Emergency Dispatch</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {contractor.emergency_contact_phone || 'None provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Dispatch Contact Person</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {contractor.emergency_contact_name || 'Dispatch Control'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block">Tax ID / EIN</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {contractor.tax_id_ein || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Assigned Contract Personnel ({workersData?.workers?.length ?? 0})
                </h3>
                <p className="text-xs text-slate-500">
                  Workers registered by or assigned to this employer under OSHA 1910.119(h)(3).
                </p>
              </div>
              <Link
                href="/contractor-safety/workers"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Open Worker Credentials Module</span>
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4">Trade</th>
                    <th className="py-3 px-4">Badge #</th>
                    <th className="py-3 px-4">Badge Status</th>
                    <th className="py-3 px-4">Certifications</th>
                    <th className="py-3 px-4">PTW Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {!workersData?.workers?.length ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No individual workers registered yet for this contractor.
                      </td>
                    </tr>
                  ) : (
                    workersData.workers.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {w.first_name} {w.last_name}
                          <span className="block text-xs font-normal text-slate-400 font-mono">{w.worker_code}</span>
                        </td>
                        <td className="py-3 px-4">
                          <CsmTradeBadge trade={w.craft_trade} />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {w.badge_number ?? '—'}
                        </td>
                        <td className="py-3 px-4">
                          <CsmBadgeStatusBadge status={w.badge_status} />
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {w.stats?.verified_certifications ?? 0}/{w.stats?.total_certifications ?? 0} verified
                        </td>
                        <td className="py-3 px-4">
                          {w.stats?.ptw_eligible ? (
                            <span className="text-xs font-semibold text-emerald-600">Cleared</span>
                          ) : (
                            <span className="text-xs font-semibold text-rose-600">Blocked</span>
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

        {/* Phase 5: Evaluations & Permanent Scorecard */}
        {activeTab === 'evaluations' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Permanent Contractor Safety Scorecard
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      OSHA 29 CFR 1910.119(h)(2)(v)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Periodic Post-Job Evaluations &amp; Rolling Safety Index
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <CsmRollingSafetyIndexBadge index={scorecardSummary?.rolling_safety_index ?? 90.0} />
                </div>
              </div>

              {/* KPI Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Total Evaluations</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{scorecardSummary?.total_evaluations ?? 0}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Rolling Safety Index</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{scorecardSummary?.rolling_safety_index?.toFixed(1) ?? '90.0'}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Incident-Free Jobs</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{scorecardSummary?.incident_free_percent ?? 100}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Future Work Endorsement</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{scorecardSummary?.recommend_future_percent ?? 100}%</span>
                </div>
              </div>

              {/* Dimension Averages */}
              {scorecardSummary && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Safety Dimension Averages
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">PPE</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.ppe.toFixed(1)} / 5</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Housekeeping</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.housekeeping.toFixed(1)} / 5</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">PTW/LOTO</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.ptw.toFixed(1)} / 5</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Near-Miss</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.near_miss.toFixed(1)} / 5</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">SWA</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.swa.toFixed(1)} / 5</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Quality</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.quality.toFixed(1)} / 5</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">Schedule</span>
                      <strong className="text-slate-900 dark:text-slate-100">{scorecardSummary.criteria_averages.schedule.toFixed(1)} / 5</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Evaluation History List */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Historical Job Evaluations ({scorecardSummary?.recent_evaluations?.length ?? 0})
                </h4>

                {(!scorecardSummary?.recent_evaluations || scorecardSummary.recent_evaluations.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No evaluations recorded for this contractor yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {scorecardSummary.recent_evaluations.map((item) => (
                      <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              WO #{item.work_order_or_job_number}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{new Date(item.evaluation_date).toLocaleDateString()}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-400">{item.work_category.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.evaluation_title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 italic">Supervisor: {item.supervisor_signature_name}</p>
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
            </div>
          </div>
        )}

        {activeTab === 'portal' && (
          <div className="space-y-6">
            {/* Portal Link Box */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    External Self-Service Contractor Portal Link
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provide this secure, one-click access link to the contracting company coordinator to upload COIs, OSHA logs, and safety manuals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => regenerateTokenMutation.mutate()}
                  disabled={regenerateTokenMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Token
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs flex items-center justify-between gap-3 overflow-hidden">
                <span className="truncate text-slate-700 dark:text-slate-300">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/contractor-portal/${contractor.portal_access_token}`
                    : `/contractor-portal/${contractor.portal_access_token}`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block">Portal Token Status</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Token Validity</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {contractor.portal_token_expires_at
                      ? new Date(contractor.portal_token_expires_at).toLocaleDateString()
                      : '90 Days'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last External Access</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {contractor.portal_last_login_at
                      ? new Date(contractor.portal_last_login_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Portal Activity Log */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Vendor Portal Access Audit Trail
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time security log of logins, document submissions, and profile updates.
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {!contractor.auditLogs?.length ? (
                  <div className="py-6 text-center text-slate-500">
                    No external portal activity recorded yet.
                  </div>
                ) : (
                  contractor.auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.event_type}
                        </span>
                        <div className="text-slate-400 text-[11px]">
                          IP: {log.actor_ip || 'external'} &bull; {log.actor_email}
                        </div>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Upload Compliance Document
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDocOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoc} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="COI_GENERAL_LIABILITY">COI - Commercial General Liability</option>
                  <option value="COI_WORKERS_COMP">COI - Workers Compensation &amp; Employers Liability</option>
                  <option value="COI_AUTO">COI - Commercial Auto Liability</option>
                  <option value="COI_UMBRELLA">COI - Umbrella / Excess Liability</option>
                  <option value="OSHA_300">OSHA Form 300 Log of Injuries</option>
                  <option value="OSHA_300A">OSHA Form 300A Annual Summary</option>
                  <option value="SAFETY_PROGRAM_MANUAL">Written Safety Program / HSE Manual</option>
                  <option value="EMR_RATING_LETTER">Experience Modification Rate (EMR) Letter</option>
                  <option value="HAZCOM_WRITTEN_PLAN">HazCom Written Plan</option>
                  <option value="OTHER">Other Regulatory Document</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Commercial General Liability Policy"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex_COI_GL_2026.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GL-99214-TX"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Carrier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Travelers Casualty"
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
                  placeholder="5000000"
                  value={coverageAmount}
                  onChange={(e) => setCoverageAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

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
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDocumentMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {addDocumentMutation.isPending ? 'Uploading...' : 'Save & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Reject Compliance Document
            </h3>
            <p className="text-xs text-slate-500">
              Please specify why this document is rejected. The contractor will be prompted to re-upload via their self-service portal.
            </p>

            <form onSubmit={handleReject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Policy limit of $1M is below the mandatory $5M process turnaround requirement."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingDocId(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyDocumentMutation.isPending}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
