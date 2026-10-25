'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  useExecutiveReportLookups,
  useExecutiveReportTemplates,
  useExecutiveReportPeriods,
  useExecutiveReportAudiences,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportsHeader,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';

const steps = [
  { id: 1, title: 'Report Type', desc: 'Classification & Purpose' },
  { id: 2, title: 'Scope & Boundary', desc: 'Site & Hierarchy Scope' },
  { id: 3, title: 'Reporting Period', desc: 'Cut-off & Time Range' },
  { id: 4, title: 'Template & Audience', desc: 'Structure & Distribution' },
  { id: 5, title: 'Review & Create', desc: 'Confirm Specifications' },
];

export function ExecutiveReportBuilderWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportTypeId, setReportTypeId] = useState('executive-report-type-kpi-summary');
  const [siteId, setSiteId] = useState('');
  const [reportingPeriodId, setReportingPeriodId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [audienceProfileId, setAudienceProfileId] = useState('');
  const [confidentiality, setConfidentiality] = useState('Internal');
  const [executiveSummary, setExecutiveSummary] = useState('');

  const lookupsQuery = useExecutiveReportLookups();
  const templatesQuery = useExecutiveReportTemplates();
  const periodsQuery = useExecutiveReportPeriods();
  const audiencesQuery = useExecutiveReportAudiences();
  const mutations = useExecutiveReportMutations();

  const lookups = lookupsQuery.data;
  const templates = templatesQuery.data?.rows ?? [];
  const periods = periodsQuery.data?.rows ?? [];
  const audiences = audiencesQuery.data?.rows ?? [];

  const handleCreate = async () => {
    const res = await mutations.createReport.mutateAsync({
      title: reportTitle.trim() || undefined,
      reportTypeId,
      reportingPeriodId: reportingPeriodId || undefined,
      templateId: templateId || undefined,
      audienceProfileId: audienceProfileId || undefined,
      confidentiality,
      siteId: siteId || undefined,
      executiveSummary: executiveSummary.trim() || undefined,
    });
    const createdId = res?.report?.id;
    if (createdId) {
      router.push(`/executive/reports/${createdId}`);
    } else {
      router.push('/executive/reports/register');
    }
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Executive Report Builder Wizard"
        subtitle="Guided step-by-step workflow to configure, scope, and generate audit-ready PSM report packages."
      />

      <ExecutiveReportIntegrityNotice
        readinessRate={96}
        missingSourcesCount={0}
      />

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-lg border p-3 text-left transition ${
              currentStep === step.id
                ? 'border-[var(--psm-primary)] bg-[var(--psm-primary)]/10 font-bold'
                : currentStep > step.id
                ? 'border-emerald-500/30 bg-emerald-500/5 text-[var(--psm-text)]'
                : 'border-[var(--psm-line)] bg-[var(--psm-surface)] opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">Step 0{step.id}</span>
              {currentStep > step.id ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : null}
            </div>
            <div className="mt-1 text-xs font-semibold text-[var(--psm-text)]">
              {step.title}
            </div>
            <div className="text-[10px] text-[var(--psm-muted)]">{step.desc}</div>
          </div>
        ))}
      </div>

      {/* Step Content Card */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
        {/* Step 1: Report Type */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Step 1: Select Report Purpose & Package Title
              </h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Define the high-level governance purpose and title for this report.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Report Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 2026 Board Process Safety Assurance Review"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Report Type
                </label>
                <select
                  value={reportTypeId}
                  onChange={(e) => setReportTypeId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none"
                >
                  <option value="executive-report-type-kpi-summary">
                    KPI Performance & Executive Summary
                  </option>
                  <option value="executive-report-type-board-psm-pack">
                    Board-Level PSM Performance & Assurance Package
                  </option>
                  <option value="executive-report-type-site-performance">
                    Site / Operating Asset Deep Dive
                  </option>
                  <option value="executive-report-type-psm-element-deep-dive">
                    PSM Element Health & Readiness Audit
                  </option>
                  <option value="executive-report-type-escalation-report">
                    Critical Risk & Escalation Digest
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Confidentiality Classification
                </label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none"
                >
                  <option value="Internal">Internal (Company PSM Personnel)</option>
                  <option value="Board Confidential">Board Confidential (Strict Access)</option>
                  <option value="Restricted">Restricted (C-Suite & Legal Only)</option>
                  <option value="Public">Public (Redacted Safety Disclosure)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Scope & Boundary */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Step 2: Operating Boundary & Facility Scope
              </h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Select whether this report covers company-wide operations or is scoped to a specific site facility.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Facility / Site Scope
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none"
                >
                  <option value="">Company-Wide (All Sites & Operating Facilities)</option>
                  {lookups?.sites?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name} ({s.site_code})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[var(--psm-muted)]">
                  Reports with no site selection aggregate all licensed operating facilities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reporting Period */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Step 3: Reporting Period & Immutable Cut-Off
              </h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Historical records are snapped to the reporting period cut-off date to prevent retro-active distortion.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Reporting Period
                </label>
                <select
                  value={reportingPeriodId}
                  onChange={(e) => setReportingPeriodId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none"
                >
                  <option value="">Ad-hoc Cut-off (Present Snapshot)</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.period_name} ({p.period_code}) — Cut-off: {new Date(p.cut_off_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Template & Audience */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Step 4: Report Template & Audience Profile
              </h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Choose the structural template layout and preconfigured audience distribution profile.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Report Template
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none"
                >
                  <option value="">Default Standard Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.template_name} ({t.template_code}) — v{t.version_number ?? '1.0'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Audience Profile
                </label>
                <select
                  value={audienceProfileId}
                  onChange={(e) => setAudienceProfileId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:outline-none"
                >
                  <option value="">Standard Executive Audience</option>
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.profile_name} ({a.classification_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                  Initial Executive Commentary (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide leadership context, strategic notes, or key governance highlights..."
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Create */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Step 5: Review Specifications & Create Package
              </h2>
              <p className="text-xs text-[var(--psm-muted)]">
                Review the configuration before generating the report package.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--psm-muted)]">Title:</span>
                <span className="font-semibold text-[var(--psm-text)]">
                  {reportTitle || 'Auto-generated Title'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--psm-muted)]">Classification:</span>
                <span className="font-semibold text-[var(--psm-text)]">{confidentiality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--psm-muted)]">Scope:</span>
                <span className="font-semibold text-[var(--psm-text)]">
                  {siteId ? 'Single Facility' : 'Company-Wide'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--psm-muted)]">Readiness Enforcement:</span>
                <span className="font-semibold text-emerald-500">Source Lineage Check Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--psm-line)] pt-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((c) => Math.max(1, c - 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((c) => Math.min(5, c + 1))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--psm-primary-hover)] transition"
            >
              <span>Next Step</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={mutations.createReport.isPending}
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {mutations.createReport.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Create Report Package</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
