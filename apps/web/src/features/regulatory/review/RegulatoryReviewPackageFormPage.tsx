'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { regulatoryReviewService } from '../services/regulatory-review.service';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';

export function RegulatoryReviewPackageFormPage() {
  const router = useRouter();
  const [form, setForm] = useState({ sourceType: 'Regulatory Item', sourceRecordId: '', packageTitle: '', reviewerUserId: '', reason: '', submitNow: true });
  const mutation = useMutation({ mutationFn: () => regulatoryReviewService.create(form), onSuccess: (data) => router.push(`/regulatory/review-approval/packages/${data.package.id}`) });
  const set = (key: keyof typeof form, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const missing = !form.sourceType || !form.sourceRecordId || !form.packageTitle;
  return (
    <div className="space-y-6">
      <RegulatoryHeader title="Submit Regulatory Record For Review" subtitle="Create an immutable backend review package snapshot. Validation runs before approval and every mutation is audited." action={<RegulatoryButton href="/regulatory/review-approval/packages" variant="secondary">Cancel</RegulatoryButton>} />
      {mutation.isError ? <RegulatoryErrorState message={mutation.error} /> : null}
      <RegulatoryCard title="Review Source Selection" subtitle="Use a real regulatory source record id from the register, obligations, compliance, evidence, audit mapping, action, or CAPA modules.">
        <div className="grid gap-4 md:grid-cols-2">
          <RegulatoryField label="Source type">
            <select className={regulatoryInputClass()} value={form.sourceType} onChange={(event) => set('sourceType', event.target.value)}>
              {['Regulatory Item', 'Obligation', 'Applicability Assessment', 'Compliance Assessment', 'Evidence Link', 'Evidence Package', 'Audit Mapping', 'Action Link', 'CAPA Package'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </RegulatoryField>
          <RegulatoryField label="Source record ID" helper="Backend validates company/site scope and source accessibility.">
            <input className={regulatoryInputClass()} value={form.sourceRecordId} onChange={(event) => set('sourceRecordId', event.target.value)} />
          </RegulatoryField>
          <RegulatoryField label="Package title">
            <input className={regulatoryInputClass()} value={form.packageTitle} onChange={(event) => set('packageTitle', event.target.value)} />
          </RegulatoryField>
          <RegulatoryField label="Reviewer user ID">
            <input className={regulatoryInputClass()} value={form.reviewerUserId} onChange={(event) => set('reviewerUserId', event.target.value)} placeholder="Optional manual reviewer assignment" />
          </RegulatoryField>
          <RegulatoryField label="Submission reason">
            <input className={regulatoryInputClass()} value={form.reason} onChange={(event) => set('reason', event.target.value)} placeholder="Why this item needs review" />
          </RegulatoryField>
          <label className="flex items-center gap-3 pt-7 text-sm text-[var(--psm-fg)]"><input type="checkbox" checked={form.submitNow} onChange={(event) => set('submitNow', event.target.checked)} /> Submit immediately after package creation</label>
        </div>
        <div className="mt-5 flex justify-end">
          <RegulatoryButton disabled={missing || mutation.isPending} title={missing ? 'Source type, source record ID and package title are required.' : undefined} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Creating...' : 'Create Review Package'}</RegulatoryButton>
        </div>
      </RegulatoryCard>
    </div>
  );
}
