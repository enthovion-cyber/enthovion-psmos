'use client';

import { useEffect, useState } from 'react';
import { useOpMutations, useOpSettings } from './hooks/useOperatingProcedures';
import {
  OpButton,
  OpCard,
  OpError,
  OpField,
  OpHeader,
  OpLayout,
  OpLoading,
  formatOpError,
  opInput
} from './shared/OpUi';

export function OpSettingsPage() {
  const query = useOpSettings();
  const mutations = useOpMutations();

  const [form, setForm] = useState({
    defaultReviewFrequencyMonths: 12,
    certificationGraceDays: 0,
    requireTwoPersonApproval: true,
    lockOnPublish: true,
    requireMocForRevision: false,
    blockMocClosureOnOpenFlags: true,
    executionAckGate: 'Warn',
    uncontrolledPrintWatermark: true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      const d = query.data as Record<string, any>;
      setForm({
        defaultReviewFrequencyMonths: Number(d.default_review_frequency_months ?? 12),
        certificationGraceDays: Number(d.certification_grace_days ?? 0),
        requireTwoPersonApproval: Boolean(d.require_two_person_approval ?? true),
        lockOnPublish: Boolean(d.lock_on_publish ?? true),
        requireMocForRevision: Boolean(d.require_moc_for_revision ?? false),
        blockMocClosureOnOpenFlags: Boolean(d.block_moc_closure_on_open_flags ?? true),
        executionAckGate: String(d.execution_ack_gate ?? 'Warn'),
        uncontrolledPrintWatermark: Boolean(d.uncontrolled_print_watermark ?? true)
      });
    }
  }, [query.data]);

  if (query.isLoading) {
    return (
      <OpLayout current="Settings">
        <OpLoading rows={6} />
      </OpLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      await mutations.updateSettings.mutateAsync({
        defaultReviewFrequencyMonths: Number(form.defaultReviewFrequencyMonths),
        certificationGraceDays: Number(form.certificationGraceDays),
        requireTwoPersonApproval: form.requireTwoPersonApproval,
        lockOnPublish: form.lockOnPublish,
        requireMocForRevision: form.requireMocForRevision,
        blockMocClosureOnOpenFlags: form.blockMocClosureOnOpenFlags,
        executionAckGate: form.executionAckGate,
        uncontrolledPrintWatermark: form.uncontrolledPrintWatermark
      });
      setSavedSuccess(true);
      query.refetch();
    } catch (err) {
      setErrorMsg(formatOpError(err));
    }
  };

  return (
    <OpLayout current="Settings">
      <div className="max-w-4xl space-y-6">
        <OpHeader
          title="Operating Procedures Configuration"
          subtitle="Configure compliance rules, annual certification schedulers, MOC gates, and execution acknowledgment policies."
        />

        {errorMsg ? <OpError error={errorMsg} /> : null}
        {savedSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600">
            Settings updated successfully.
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <OpCard title="Certification & Lifecycle Rules" subtitle="Automated scheduling and regulatory enforcement.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <OpField
                    label="Default Annual Review Frequency (Months)"
                    helper="OSHA 1910.119(f)(3) requirement is 12 months."
                  >
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className={opInput}
                      value={form.defaultReviewFrequencyMonths}
                      onChange={(e) => setForm({ ...form, defaultReviewFrequencyMonths: Number(e.target.value) })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField
                    label="Certification Grace Period (Days)"
                    helper="Days past due date before escalation to Site Manager."
                  >
                    <input
                      type="number"
                      min={0}
                      max={30}
                      className={opInput}
                      value={form.certificationGraceDays}
                      onChange={(e) => setForm({ ...form, certificationGraceDays: Number(e.target.value) })}
                    />
                  </OpField>
                </div>

                <div>
                  <OpField
                    label="Execution Read-and-Understand Gate"
                    helper="Controls mobile execution when operator has not acknowledged latest revision."
                  >
                    <select
                      className={opInput}
                      value={form.executionAckGate}
                      onChange={(e) => setForm({ ...form, executionAckGate: e.target.value })}
                    >
                      <option value="Off">Off (Allow execution without prompt)</option>
                      <option value="Warn">Warn (Show warning banner, allow proceed)</option>
                      <option value="Block">Block (Strictly block execution until acknowledged)</option>
                    </select>
                  </OpField>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--psm-line)]">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]">
                  <input
                    type="checkbox"
                    checked={form.requireTwoPersonApproval}
                    onChange={(e) => setForm({ ...form, requireTwoPersonApproval: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--psm-line)] text-primary focus:ring-primary"
                  />
                  Require Two-Person Review & Approval (SME + Operations Supervisor)
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]">
                  <input
                    type="checkbox"
                    checked={form.lockOnPublish}
                    onChange={(e) => setForm({ ...form, lockOnPublish: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--psm-line)] text-primary focus:ring-primary"
                  />
                  Lock Content on Publish (Edits require creating a new revision)
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]">
                  <input
                    type="checkbox"
                    checked={form.blockMocClosureOnOpenFlags}
                    onChange={(e) => setForm({ ...form, blockMocClosureOnOpenFlags: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--psm-line)] text-primary focus:ring-primary"
                  />
                  Block MOC Closeout if Flagged Procedures have not been revised
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]">
                  <input
                    type="checkbox"
                    checked={form.uncontrolledPrintWatermark}
                    onChange={(e) => setForm({ ...form, uncontrolledPrintWatermark: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--psm-line)] text-primary focus:ring-primary"
                  />
                  Watermark Printed Procedures with "UNCONTROLLED WHEN PRINTED"
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
                <OpButton type="submit" disabled={mutations.updateSettings.isPending}>
                  {mutations.updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </OpButton>
              </div>
            </div>
          </OpCard>
        </form>
      </div>
    </OpLayout>
  );
}
