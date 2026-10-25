'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ExternalLink, GitBranch, X, Zap } from 'lucide-react';
import { incidentDetailService } from '../../services/incident-detail.service';

interface SpawnMocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  incidentId: string;
  incidentNumber?: string;
  incidentTitle?: string;
  capaItem?: {
    id: string;
    capa_number?: string;
    action_title_snapshot?: string;
    action_description?: string;
    action_category?: string;
    priority?: string;
  } | null;
}

const CHANGE_TYPES = [
  'Permanent Process Change',
  'Temporary Process Change',
  'Emergency Change',
  'Facility Change',
  'Procedural Change',
  'Organizational Change'
];

const CHANGE_CATEGORIES = [
  'Process',
  'Equipment',
  'Procedure',
  'Electrical / Instrumentation',
  'Chemical',
  'Piping / Valve',
  'Organizational'
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export function SpawnMocModal({
  isOpen,
  onClose,
  onSuccess,
  incidentId,
  incidentNumber,
  incidentTitle,
  capaItem
}: SpawnMocModalProps) {
  const initialTitle = capaItem
    ? `MOC: ${capaItem.action_title_snapshot}`
    : `MOC from Incident: ${incidentTitle ?? incidentNumber ?? 'Safety Improvement'}`;

  const initialDescription = capaItem?.action_description
    ? `Corrective Action ${capaItem.capa_number ?? ''}: ${capaItem.action_description}\n\nTriggered by Incident ${incidentNumber ?? incidentId}: ${incidentTitle ?? ''}`
    : `Management of Change triggered by Incident Investigation ${incidentNumber ?? incidentId}: ${incidentTitle ?? ''}`;

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [changeType, setChangeType] = useState('Permanent Process Change');
  const [changeCategory, setChangeCategory] = useState(capaItem?.action_category ?? 'Process');
  const [priority, setPriority] = useState(capaItem?.priority ?? 'High');
  const [affectedSystem, setAffectedSystem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMoc, setCreatedMoc] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('MOC Title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        changeType,
        changeCategory,
        priority,
        affectedSystem: affectedSystem.trim() || undefined,
        capaItemId: capaItem?.id || undefined,
        reason: `Spawned directly from incident corrective actions for ${incidentNumber ?? incidentId}`
      };

      const result = await incidentDetailService.spawnMoc(incidentId, payload);
      setCreatedMoc(result.moc ?? result);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to spawn MOC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setCreatedMoc(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-sky-500/30 bg-[#071324] p-6 shadow-2xl shadow-sky-950/40 text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-sky-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-400">
              <GitBranch size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                1-Click MOC Spawner
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                  Closed-Loop
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Spawn Management of Change from Incident{' '}
                <span className="font-mono text-sky-300 font-bold">{incidentNumber ?? incidentId}</span>
                {capaItem?.capa_number && ` · CAPA ${capaItem.capa_number}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {createdMoc ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                MOC Spawned Successfully!
              </h3>
              <p className="mt-1 font-mono text-sm font-semibold text-sky-300">
                {createdMoc.moc_number ?? createdMoc.id}
              </p>
              <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
                The MOC has been created in Draft status and linked bidirectionally to this incident and its corrective action record.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <Link
                href={`/moc/${createdMoc.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
              >
                Open MOC Workspace <ExternalLink size={14} />
              </Link>
              <button
                type="button"
                onClick={handleModalClose}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                MOC Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g. Relief Valve Setpoint Revision following Overpressure Event"
              />
            </div>

            {/* Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Change Type
                </label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  {CHANGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Change Category
                </label>
                <select
                  value={changeCategory}
                  onChange={(e) => setChangeCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  {CHANGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Affected System */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Affected System / Tag
                </label>
                <input
                  type="text"
                  value={affectedSystem}
                  onChange={(e) => setAffectedSystem(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  placeholder="e.g. Flare Knockout Drum (V-102)"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Technical Justification & Findings *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleModalClose}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition disabled:opacity-50 active:scale-98"
              >
                <Zap size={14} />
                {submitting ? 'Spawning MOC...' : 'Spawn 1-Click MOC'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
