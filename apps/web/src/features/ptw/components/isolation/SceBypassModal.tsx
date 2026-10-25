'use client';

import React, { useState } from 'react';
import { AlertCircle, FileCheck, ShieldAlert, X, Zap } from 'lucide-react';
import { ptwService } from '@/services/ptw.service';

interface SceBypassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  permitId: string;
  isolationPoint: {
    id: string;
    isolation_point_tag?: string | null;
    isolation_point?: string | null;
    equipment_tag?: string | null;
    sil_rating?: string | null;
    sif_tag?: string | null;
  } | null;
}

const SIL_RATINGS = ['SIL-1', 'SIL-2', 'SIL-3', 'Non-SIL SCE', 'BPCS Interlock'];

export function SceBypassModal({
  isOpen,
  onClose,
  onSuccess,
  permitId,
  isolationPoint
}: SceBypassModalProps) {
  const [certNumber, setCertNumber] = useState(`SCE-BYPASS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [silRating, setSilRating] = useState(isolationPoint?.sil_rating || 'SIL-2');
  const [sifTag, setSifTag] = useState(isolationPoint?.sif_tag || isolationPoint?.isolation_point_tag || '');
  const [reason, setReason] = useState('');
  const [riskAssessmentRef, setRiskAssessmentRef] = useState('');
  const [signConfirmation, setSignConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !isolationPoint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Technical justification and compensatory risk safeguards are required.');
      return;
    }
    if (!signConfirmation) {
      setError('You must confirm authorization for this safety barrier bypass.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await ptwService.authorizeIsolationBypass(permitId, isolationPoint.id, {
        bypassCertificateNumber: certNumber.trim(),
        bypassReason: reason.trim(),
        silRating,
        ...(sifTag.trim() ? { sifTag: sifTag.trim() } : {}),
        ...(riskAssessmentRef.trim() ? { riskAssessmentReference: riskAssessmentRef.trim() } : {})
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? 'Failed to authorize SCE bypass');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[#091122] p-6 shadow-2xl shadow-amber-950/40">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Authorize Interlock / SCE Bypass
              </h2>
              <p className="text-xs text-slate-400">
                Isolation Tag: <span className="font-mono text-amber-300 font-bold">{isolationPoint.isolation_point_tag ?? isolationPoint.isolation_point}</span>
                {isolationPoint.equipment_tag && ` (Equipment: ${isolationPoint.equipment_tag})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Certificate & SIL Rating Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Bypass Certificate #
              </label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Assigned SIL Rating
              </label>
              <select
                value={silRating}
                onChange={(e) => setSilRating(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {SIL_RATINGS.map((sil) => (
                  <option key={sil} value={sil}>{sil}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SIF Loop Tag & Risk Assessment Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                SIF Loop / Interlock Tag
              </label>
              <input
                type="text"
                value={sifTag}
                onChange={(e) => setSifTag(e.target.value)}
                placeholder="e.g. SIF-042-PSV"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Risk Assessment / MOC Ref
              </label>
              <input
                type="text"
                value={riskAssessmentRef}
                onChange={(e) => setRiskAssessmentRef(e.target.value)}
                placeholder="e.g. MOC-2026-0042 / PHA-Node-3"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Justification & Mitigations */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Technical Justification & Compensatory Safeguards <span className="text-amber-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Detail required bypass reason, manual monitoring protocols, dedicated standby attendant, and duration limit..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Electronic Sign-off Checkbox */}
          <label className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={signConfirmation}
              onChange={(e) => setSignConfirmation(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-amber-200">
              <strong>Area Authority Sign-off:</strong> I authorize this temporary barrier bypass under OSHA 1910.119 & IEC 61511.
              I certify that compensatory safety measures are in place and the Control Room operator has logged this inhibition.
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !signConfirmation || !reason.trim()}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-amber-950/50 hover:bg-amber-500 disabled:opacity-50 transition"
            >
              <Zap size={14} />
              {submitting ? 'Authorizing...' : 'Authorize Bypass Certificate'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
