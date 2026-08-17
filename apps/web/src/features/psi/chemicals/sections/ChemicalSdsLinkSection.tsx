import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ChemicalSdsLinkSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: Record<string, string[]> | undefined; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ [event.target.name]: event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value });
  return (
    <PsiCard title="3. SDS Link" subtitle="Links to SDS Library / Document Control. Missing or expired SDS updates PSI completeness.">
      <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">SDS status is calculated by the backend from SDS Library / Document Control link, approval, expiry, or waiver state.</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="sds_id" label="Linked SDS record" value={value.sds_id} onChange={change} />
        <Field name="document_id" label="SDS document / Document Control ID" value={value.document_id} onChange={change} />
        <Field name="sds_version" label="SDS version" value={value.sds_version} onChange={change} />
        <Field name="sds_issue_date" label="SDS issue date" type="date" value={value.sds_issue_date} onChange={change} />
        <Field name="sds_expiry_date" label="SDS expiry / review date" type="date" value={value.sds_expiry_date} onChange={change} />
        <Select name="sds_status" label="SDS status override/source status" value={value.sds_status} options={lookups?.sdsStatuses ?? []} onChange={change} />
        <Field name="supplier_name" label="Supplier" value={value.supplier_name} onChange={change} />
        <Field name="manufacturer_name" label="Manufacturer" value={value.manufacturer_name} onChange={change} />
        <Field name="language" label="Language" value={value.language} onChange={change} />
        <Field name="jurisdiction" label="Jurisdiction" value={value.jurisdiction} onChange={change} />
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="approved_sds" checked={Boolean(value.approved_sds)} onChange={change} /> Approved SDS</label>
        <Field name="waiver_reason" label="SDS waiver reason" value={value.waiver_reason} onChange={change} />
      </div>
    </PsiCard>
  );
}

function Field({ label, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>; }
function Select({ label, options, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<select {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Backend calculated</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></label>; }
