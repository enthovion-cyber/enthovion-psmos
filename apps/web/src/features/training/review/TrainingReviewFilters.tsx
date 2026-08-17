'use client';

export function TrainingReviewFilters({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const set = (key: string, val: string) => onChange({ ...value, [key]: val || undefined });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4 xl:grid-cols-7">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search package, source, status" value={value.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Site ID" value={value.siteId ?? ''} onChange={(e) => set('siteId', e.target.value)} />
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Unit ID" value={value.unitId ?? ''} onChange={(e) => set('unitId', e.target.value)} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.sourceModule ?? ''} onChange={(e) => set('sourceModule', e.target.value)}><option value="">All source modules</option>{['Training Matrix','Roles & Competency','Required Training','Training Records','Certifications','Assessments','SOP Acknowledgements','MOC Training','PSSR Training','PTW Authorization','Reports / Export'].map((v) => <option key={v}>{v}</option>)}</select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.approvalStatus ?? ''} onChange={(e) => set('approvalStatus', e.target.value)}><option value="">All statuses</option>{['Submitted','Pending Approval','In Review','Returned','Rejected','Approved','Completed','Cancelled','Escalated','Stale','Validation Failed'].map((v) => <option key={v}>{v}</option>)}</select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.priority ?? ''} onChange={(e) => set('priority', e.target.value)}><option value="">All priorities</option>{['Low','Normal','High','Urgent','Safety Critical'].map((v) => <option key={v}>{v}</option>)}</select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.confidentialityLevel ?? ''} onChange={(e) => set('confidentialityLevel', e.target.value)}><option value="">All confidentiality</option>{['Public','Internal','Confidential','Restricted'].map((v) => <option key={v}>{v}</option>)}</select>
    </div>
  );
}
