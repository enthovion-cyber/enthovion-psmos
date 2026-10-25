'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  useExecutiveReportTemplates,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportsHeader,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';
import type { ExecutiveReportTemplate } from '../types/executive-report.types';

export function ExecutiveReportTemplatesPage() {
  const templatesQuery = useExecutiveReportTemplates();
  const mutations = useExecutiveReportMutations();

  const templates = (templatesQuery.data?.rows ?? []) as ExecutiveReportTemplate[];

  const [createOpen, setCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateCode.trim()) return;
    await mutations.saveTemplate.mutateAsync({
      name: templateName.trim(),
      code: templateCode.trim(),
      description: description.trim() || undefined,
    });
    setCreateOpen(false);
    setTemplateName('');
    setTemplateCode('');
    setDescription('');
    templatesQuery.refetch();
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Executive Report Templates"
        subtitle="Standardized section layouts, modular scorecards, and board pack definitions."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </button>
        }
      />

      <ExecutiveReportIntegrityNotice readinessRate={100} missingSourcesCount={0} />

      {createOpen && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Create New Report Template
            </h2>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-xs text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g. Board Safety Committee Quarterly Brief"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Template Code
              </label>
              <input
                type="text"
                placeholder="e.g. ERT-BOARD-BRIEF"
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Purpose and audience of this report template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-md border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.saveTemplate.isPending}
              className="rounded-md bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {mutations.saveTemplate.isPending ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      )}

      {templatesQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading report templates...</span>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
          No templates configured yet. Click &quot;Create Template&quot; to define your first report layout.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--psm-primary)]">
                    {tpl.template_code}
                  </span>
                  <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--psm-muted)]">
                    v{tpl.version_number ?? '1.0'}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-[var(--psm-text)]">
                  {tpl.template_name}
                </h3>
                <p className="mt-1 text-xs text-[var(--psm-muted)]">
                  {tpl.description || 'Standard executive reporting layout.'}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--psm-line)] pt-3 text-[11px] text-[var(--psm-muted)]">
                <span className="text-emerald-500 font-semibold">Active</span>
                <span>{tpl.created_at ? new Date(tpl.created_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
