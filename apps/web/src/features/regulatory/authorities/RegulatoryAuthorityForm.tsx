'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { regulatoryAuthorityService } from '../services/regulatory-authority.service';

export function RegulatoryAuthorityForm({ initial }: { initial?: Record<string, any> | undefined }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>(initial ?? { authorityStatus: 'Active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    try { const row = initial?.id ? await regulatoryAuthorityService.update(initial.id, values) : await regulatoryAuthorityService.create(values); router.push(`/regulatory/authorities/${row.id ?? initial?.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Authority save failed.'); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
      <RegulatoryCard title="Authority Identity" subtitle="Authority records are metadata only and do not create legal interpretations.">
        <div className="grid gap-4 md:grid-cols-2">
          <RegulatoryField label="Authority name"><input className={regulatoryInputClass()} value={values.authorityName ?? values.authority_name ?? ''} onChange={set('authorityName')} required /></RegulatoryField>
          <RegulatoryField label="Authority code"><input className={regulatoryInputClass()} value={values.authorityCode ?? values.authority_code ?? ''} onChange={set('authorityCode')} /></RegulatoryField>
          <RegulatoryField label="Authority type"><input className={regulatoryInputClass()} value={values.authorityType ?? values.authority_type ?? ''} onChange={set('authorityType')} required placeholder="Government Regulator, Fire Authority..." /></RegulatoryField>
          <RegulatoryField label="Status"><select className={regulatoryInputClass()} value={values.authorityStatus ?? values.authority_status ?? 'Active'} onChange={set('authorityStatus')}><option>Active</option><option>Draft</option><option>Archived</option></select></RegulatoryField>
          <RegulatoryField label="Jurisdiction level"><input className={regulatoryInputClass()} value={values.jurisdictionLevel ?? values.jurisdiction_level ?? ''} onChange={set('jurisdictionLevel')} /></RegulatoryField>
          <RegulatoryField label="Country"><input className={regulatoryInputClass()} value={values.country ?? ''} onChange={set('country')} /></RegulatoryField>
          <RegulatoryField label="State / Province"><input className={regulatoryInputClass()} value={values.stateProvince ?? values.state_province ?? ''} onChange={set('stateProvince')} /></RegulatoryField>
          <RegulatoryField label="City / Municipality"><input className={regulatoryInputClass()} value={values.cityMunicipality ?? values.city_municipality ?? ''} onChange={set('cityMunicipality')} /></RegulatoryField>
          <RegulatoryField label="Website URL"><input className={regulatoryInputClass()} value={values.websiteUrl ?? values.website_url ?? ''} onChange={set('websiteUrl')} /></RegulatoryField>
          <RegulatoryField label="Notes"><textarea className={regulatoryInputClass()} value={values.notes ?? ''} onChange={set('notes')} /></RegulatoryField>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(values.inspectionAuthority ?? values.inspection_authority)} onChange={set('inspectionAuthority')} /> Inspection authority</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(values.permitAuthority ?? values.permit_authority)} onChange={set('permitAuthority')} /> Permit authority</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(values.enforcementAuthority ?? values.enforcement_authority)} onChange={set('enforcementAuthority')} /> Enforcement authority</label>
        </div>
      </RegulatoryCard>
      <div className="flex justify-end gap-2"><RegulatoryButton href="/regulatory/authorities" variant="secondary">Cancel</RegulatoryButton><RegulatoryButton type="submit" disabled={saving} title={saving ? 'Saving authority...' : undefined}>{saving ? 'Saving...' : 'Save Authority'}</RegulatoryButton></div>
    </form>
  );
}
