'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Download,
  Share2,
  BookmarkPlus,
  Layers,
  Send,
  Eye,
} from 'lucide-react';
import { useExecutiveReportMutations, useExecutiveReportLookups, useExecutiveReportTemplates, useExecutiveReportPeriods, useExecutiveReportAudiences } from '../hooks/useExecutiveReports';
import type { ExecutiveReport, ExecutiveReportVersion } from '../types/executive-report.types';

const inputCls = 'mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]';

export function CreateExecutiveReportDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const mutations = useExecutiveReportMutations();
  const templatesQuery = useExecutiveReportTemplates();
  const periodsQuery = useExecutiveReportPeriods();
  const audiencesQuery = useExecutiveReportAudiences();

  const [title, setTitle] = useState('');
  const [reportTypeId, setReportTypeId] = useState('executive-report-type-kpi-summary');
  const [reportingPeriodId, setReportingPeriodId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [audienceProfileId, setAudienceProfileId] = useState('');
  const [confidentiality, setConfidentiality] = useState('Internal');
  const [siteId, setSiteId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.createReport.mutateAsync({
      title: title.trim() || undefined,
      reportTypeId,
      reportingPeriodId: reportingPeriodId || undefined,
      templateId: templateId || undefined,
      audienceProfileId: audienceProfileId || undefined,
      confidentiality,
      siteId: siteId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Create Executive Report Package</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Report Title</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Q3 2026 Executive PSM Governance Performance Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Report Type</label>
              <select
                className={inputCls}
                value={reportTypeId}
                onChange={(e) => setReportTypeId(e.target.value)}
              >
                <option value="executive-report-type-kpi-summary">Executive KPI Summary</option>
                <option value="executive-report-type-board-package">Board PSM Performance Package</option>
                <option value="executive-report-type-management-review">Management Review Package</option>
                <option value="executive-report-type-critical-risk">Critical Risk & Barrier Report</option>
                <option value="executive-report-type-trend">Historical Trends & Repeat Issues</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Confidentiality Classification</label>
              <select
                className={inputCls}
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value)}
              >
                <option value="Internal">Internal (Company-wide)</option>
                <option value="Confidential">Confidential (Executive Only)</option>
                <option value="Board Confidential">Board Confidential</option>
                <option value="Restricted">Restricted (Restricted Access)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Reporting Period</label>
              <select
                className={inputCls}
                value={reportingPeriodId}
                onChange={(e) => setReportingPeriodId(e.target.value)}
              >
                <option value="">Select Period (or As-Of Current)</option>
                {(periodsQuery.data?.rows ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.period_name} ({p.period_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Report Template</label>
              <select
                className={inputCls}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Standard Enterprise Template</option>
                {(templatesQuery.data?.rows ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.template_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Target Audience Profile</label>
            <select
              className={inputCls}
              value={audienceProfileId}
              onChange={(e) => setAudienceProfileId(e.target.value)}
            >
              <option value="">Executive Leadership</option>
              {(audiencesQuery.data?.rows ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.profile_name} ({a.classification})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">
            <strong className="text-[var(--psm-text)]">Controlled Publication Policy:</strong> Source data will be frozen into an immutable evidence snapshot at validation time. All subsequent modifications will generate a new numbered version.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createReport.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createReport.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Create Report Package</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateBoardPackageDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const mutations = useExecutiveReportMutations();
  const [title, setTitle] = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('Q3 2026');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.createBoardPackage.mutateAsync({
      title: title.trim() || undefined,
      reportingPeriod,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-rose-500" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Create Board PSM Assurance Package</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Board Dossier Title</label>
            <input
              type="text"
              className={inputCls}
              required
              placeholder="e.g. Board PSM Oversight Dossier — Q3 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Quarter / Period</label>
            <input
              type="text"
              className={inputCls}
              required
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <p className="font-bold">Confidentiality: Board Confidential</p>
            <p className="mt-1">
              Includes enterprise PSM health scores, catastrophic risk backlog, barrier impairments, repeat failure clusters, and pending board decisions.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createBoardPackage.isPending}
              className="flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
            >
              {mutations.createBoardPackage.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Assemble Board Package</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GenerateReportArtifactDialog({
  isOpen,
  onClose,
  report,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: ExecutiveReport | null;
}) {
  const mutations = useExecutiveReportMutations();
  const [format, setFormat] = useState('PDF');

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.generateArtifact.mutateAsync({
      id: report.id,
      format,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <Download className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Generate Controlled Artifact</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--psm-text)]">{report.report_title}</p>
          <div>
            <label className={labelCls}>Target Artifact Format</label>
            <select
              className={inputCls}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="PDF">PDF (Formal Auditable Document)</option>
              <option value="XLSX">Excel Workbook (Worksheets & Lineage)</option>
              <option value="PPTX">PowerPoint Deck (Board Presentation)</option>
              <option value="CSV">CSV Tabular Export</option>
              <option value="ZIP">Controlled ZIP Package (Full Manifest)</option>
            </select>
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">
            Artifacts are cryptographically hashed (SHA-256) and sealed. Downloads will be recorded in the access log.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.generateArtifact.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.generateArtifact.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Execute Generation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SubmitReportApprovalDialog({
  isOpen,
  onClose,
  report,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: ExecutiveReport | null;
}) {
  const mutations = useExecutiveReportMutations();
  const [notes, setNotes] = useState('');

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.submitApproval.mutateAsync({
      id: report.id,
      body: { notes: notes.trim() || undefined },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Submit for Governance Approval</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--psm-text)]">{report.report_title}</p>
          <div>
            <label className={labelCls}>Submission Notes / Review Scope</label>
            <textarea
              className={inputCls}
              rows={3}
              placeholder="State readiness status, verification remarks, or special items requiring executive scrutiny..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.submitApproval.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.submitApproval.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Submit for Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ApproveReportDialog({
  isOpen,
  onClose,
  report,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: ExecutiveReport | null;
}) {
  const mutations = useExecutiveReportMutations();
  const [notes, setNotes] = useState('');

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.approveReport.mutateAsync({
      id: report.id,
      body: { notes: notes.trim() || undefined },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Approve & Seal Report Version</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--psm-text)]">{report.report_title}</p>
          <div>
            <label className={labelCls}>Approval Remarks</label>
            <textarea
              className={inputCls}
              rows={3}
              placeholder="Confirm governance review completion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500">
            Approval locks this version permanently. The source manifest and artifacts cannot be modified without creating a subsequent numbered version.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.approveReport.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              {mutations.approveReport.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Approve & Seal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DistributeReportDialog({
  isOpen,
  onClose,
  report,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: ExecutiveReport | null;
}) {
  const mutations = useExecutiveReportMutations();
  const [deliveryMethod, setDeliveryMethod] = useState('Internal Report Library');
  const [watermark, setWatermark] = useState(true);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.sendDistribution.mutateAsync({
      id: report.id,
      body: { deliveryMethod, watermark },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Distribute Report Package</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--psm-text)]">{report.report_title}</p>
          <div>
            <label className={labelCls}>Distribution Channel</label>
            <select
              className={inputCls}
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
            >
              <option value="Internal Report Library">Internal Report Library Access</option>
              <option value="In-App Secure Notice">In-App Secure Notification</option>
              <option value="Encrypted Link">Encrypted Time-Limited Secure Link</option>
              <option value="Board Portal">Board Governance Portal Release</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="watermark-chk"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
              className="rounded border-[var(--psm-line)]"
            />
            <label htmlFor="watermark-chk" className="text-xs text-[var(--psm-text)]">
              Apply security watermark with recipient identity and timestamp
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.sendDistribution.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.sendDistribution.isPending && <Loader2 size={16} className="animate-spin" />}
              <span>Confirm Distribution</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
