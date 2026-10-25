'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ClipboardCheck, ExternalLink, X, Zap } from 'lucide-react';
import { regulatoryAuditMappingService } from '../../services/regulatory-audit-mapping.service';

interface SpawnAuditChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (() => void) | undefined;
  sourceType: 'regulation' | 'obligation' | 'mapping';
  sourceId: string;
  sourceCode?: string | null | undefined;
  sourceTitle?: string | null | undefined;
}

const AUDIT_TYPES = [
  'Internal Compliance',
  'OSHA Compliance Audit',
  'Process Safety Assurance',
  'EPA RMP Triennial Audit',
  'Third-Party External Audit',
  'Element Specific Audit'
];

const TEMPLATE_TYPES = [
  'Regulatory Compliance',
  'Protocol Checklist',
  'Field Inspection Checklist',
  'Management System Assurance'
];

const CRITICALITIES = ['Critical', 'High', 'Medium', 'Low'];

export function SpawnAuditChecklistModal({
  isOpen,
  onClose,
  onSuccess,
  sourceType,
  sourceId,
  sourceCode,
  sourceTitle
}: SpawnAuditChecklistModalProps) {
  const [checklistTitle, setChecklistTitle] = useState(
    sourceTitle ? `Audit Checklist: ${sourceTitle}` : ''
  );
  const [checklistCode, setChecklistCode] = useState(
    `CHK-${sourceType === 'obligation' ? 'OBL' : sourceType === 'mapping' ? 'MAP' : 'REG'}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [auditType, setAuditType] = useState('Internal Compliance');
  const [templateType, setTemplateType] = useState('Regulatory Compliance');
  const [criticality, setCriticality] = useState('High');
  const [description, setDescription] = useState(
    `Auto-spawned audit protocol from Regulatory Register for ${sourceCode ? sourceCode + ' - ' : ''}${sourceTitle ?? ''}.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spawnedChecklist, setSpawnedChecklist] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistTitle.trim()) {
      setError('Checklist title is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        checklistTitle: checklistTitle.trim(),
        checklistCode: checklistCode.trim(),
        auditType,
        templateType,
        criticality,
        description: description.trim()
      };

      let res: any;
      if (sourceType === 'regulation') {
        res = await regulatoryAuditMappingService.spawnSourceChecklist(sourceId, payload);
      } else if (sourceType === 'obligation') {
        res = await regulatoryAuditMappingService.spawnObligationChecklist(sourceId, payload);
      } else {
        res = await regulatoryAuditMappingService.spawnAuditChecklist(sourceId, payload);
      }

      setSpawnedChecklist(res.checklist);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to spawn audit checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSpawnedChecklist(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/80">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-cyan-500/20 dark:bg-[#071525]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Spawn Audit Checklist Protocol
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate an OSHA/EPA compliance audit checklist linked directly to this {sourceType}.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-cyan-950/40 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {spawnedChecklist ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Audit Checklist Successfully Spawned!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Checklist <span className="font-semibold">{spawnedChecklist.checklist_code}</span> has been created in Module 4.4 and linked to this regulatory record with Full Coverage status.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-cyan-500/10 dark:bg-[#0c1f38]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Checklist Title:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {spawnedChecklist.checklist_title}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Audit Type:</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {spawnedChecklist.audit_type}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {spawnedChecklist.checklist_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Execution Readiness:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Ready For Execution
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <Link
                  href={`/audit-compliance/checklists/${spawnedChecklist.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-500 transition-colors"
                >
                  <span>Open Audit Checklist</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Source Banner */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-cyan-500/10 dark:bg-[#0c1f38]">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Target {sourceType === 'obligation' ? 'Obligation' : sourceType === 'mapping' ? 'Audit Mapping' : 'Regulation'}:
                </span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {sourceCode ? `${sourceCode} - ` : ''}{sourceTitle ?? sourceId}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Checklist Code
                  </label>
                  <input
                    type="text"
                    value={checklistCode}
                    onChange={(e) => setChecklistCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Criticality
                  </label>
                  <select
                    value={criticality}
                    onChange={(e) => setCriticality(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {CRITICALITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Checklist Title
                </label>
                <input
                  type="text"
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="e.g. Audit Checklist: OSHA 1910.119 Process Safety Management"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Audit Type
                  </label>
                  <select
                    value={auditType}
                    onChange={(e) => setAuditType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {AUDIT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Template Type
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Checklist Description & Objective
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-[11px] text-teal-800 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300">
                <span className="font-bold">⚡ Automated Protocol Synthesis:</span> All mapped clauses, obligations, and safety requirements will automatically be converted into structured audit questions with evidence verification guidance.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-cyan-500/20">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-500 disabled:opacity-50 transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {loading ? 'Spawning Checklist...' : 'Spawn Audit Checklist'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
