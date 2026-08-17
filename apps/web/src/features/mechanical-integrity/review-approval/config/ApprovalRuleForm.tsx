'use client';

import { useState } from 'react';
import { ReviewButton } from '../ReviewApprovalPrimitives';
import type { MiApprovalRule } from '../../types/review-approval.types';

export function ApprovalRuleForm({ onSubmit, initial }: { onSubmit: (input: Record<string, unknown>) => void; initial?: MiApprovalRule }) {
  const [ruleName, setRuleName] = useState(initial?.rule_name ?? '');
  const [sourceModule, setSourceModule] = useState(initial?.source_module ?? 'Equipment');
  const [riskLevel, setRiskLevel] = useState(initial?.risk_level ?? '');
  const [eSignatureRequired, setESignatureRequired] = useState(Boolean(initial?.e_signature_required));
  return (
    <form className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit({ ruleName, sourceModule, riskLevel: riskLevel || null, eSignatureRequired, approvalChain: [{ stageName: 'Engineering Review', sequence: 1 }] }); }}>
      <label className="text-sm font-semibold">Rule name
        <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={ruleName} onChange={(event) => setRuleName(event.target.value)} />
      </label>
      <label className="text-sm font-semibold">Source module
        <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={sourceModule} onChange={(event) => setSourceModule(event.target.value)} />
      </label>
      <label className="text-sm font-semibold">Risk level
        <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={eSignatureRequired} onChange={(event) => setESignatureRequired(event.target.checked)} />
        E-signature required
      </label>
      <div className="md:col-span-2"><ReviewButton type="submit" variant="primary" disabled={!ruleName.trim() || !sourceModule.trim()} title="Rule name and source module are required.">Save Approval Rule</ReviewButton></div>
    </form>
  );
}
