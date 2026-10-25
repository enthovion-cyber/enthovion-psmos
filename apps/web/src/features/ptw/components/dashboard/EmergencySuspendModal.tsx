'use client';

import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Radio, ShieldAlert, X } from 'lucide-react';
import { ptwService } from '@/services/ptw.service';

interface EmergencySuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siteId?: string;
  unitId?: string;
  areaId?: string;
}

const ALARM_TYPES = [
  { value: 'PLANT_ESD', label: 'Emergency Shutdown (Plant ESD)', color: 'text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/40' },
  { value: 'GAS_RELEASE', label: 'Toxic / Flammable Gas Release', color: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40' },
  { value: 'FIRE_ALARM', label: 'Confirmed Fire / Explosion Alarm', color: 'text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-950/40' },
  { value: 'PROCESS_UPSET', label: 'Severe Process Hazard / Loss of Containment', color: 'text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/40' },
  { value: 'SEVERE_WEATHER', label: 'Severe Weather / High Wind / Lightning', color: 'text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-950/40' },
  { value: 'OTHER', label: 'Other Operational Emergency', color: 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-950/40' },
];

export function EmergencySuspendModal({ isOpen, onClose, onSuccess, siteId }: EmergencySuspendModalProps) {
  const [alarmType, setAlarmType] = useState('PLANT_ESD');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Emergency description is required.');
      return;
    }
    if (!confirmed) {
      setError('You must confirm authorization for this emergency suspension.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await ptwService.emergencySuspend({
        siteId: siteId || 'default-site',
        alarmType,
        reason: reason.trim(),
        broadcastAlert: true
      });
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? 'Failed to execute emergency suspension');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-red-500/40 bg-white dark:bg-[#070e1b] p-6 shadow-2xl text-slate-900 dark:text-white">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-red-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/50 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 shadow-inner">
              <AlertOctagon size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
                Emergency PTW Suspension
                <span className="rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-600 dark:text-red-400">
                  Critical Command
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immediately suspends all active, issued, and extended permits across the selected facility.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success View */}
        {result ? (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Emergency Shutdown Executed
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Successfully suspended <span className="font-bold text-red-600 dark:text-red-400">{result.totalPermitsSuspended} active permits</span>.
              Control Room broadcast sent and CAPA containment action recorded in the Action Center.
            </p>
            {result.suspendedPermits?.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2 text-left font-mono text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800/40">
                {result.suspendedPermits.map((p: any) => (
                  <div key={p.id} className="py-1 flex justify-between">
                    <span className="font-semibold text-red-600 dark:text-red-300">{p.permitNumber}</span>
                    <span className="text-slate-500 dark:text-slate-400">{p.area ?? 'Area'} ({p.equipmentTag ?? 'SCE'})</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Alarm Classification Selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Trigger Alarm / Event Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALARM_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() => setAlarmType(type.value)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition ${
                      alarmType === type.value
                        ? `${type.color} ring-1 ring-primary/40 font-bold`
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Radio size={14} className={alarmType === type.value ? 'opacity-100' : 'opacity-40'} />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Description */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Emergency Justification & Condition <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="State the observed hazard, leak tag, high-lower explosive limit reading, or emergency ESD trigger..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950/80 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 rounded-xl border border-red-300 dark:border-red-500/20 bg-red-50 dark:bg-red-950/20 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs text-red-800 dark:text-red-200 font-medium">
                <strong>Safety Critical Sign-off:</strong> I confirm this is an active industrial emergency.
                Activating this command will immediately withdraw field hot work and isolation authorizations across the facility.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !confirmed || !reason.trim()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-950/50 hover:bg-red-500 disabled:opacity-50 transition"
              >
                <AlertTriangle size={15} />
                {submitting ? 'Executing Halt...' : 'Execute Emergency Suspend'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
