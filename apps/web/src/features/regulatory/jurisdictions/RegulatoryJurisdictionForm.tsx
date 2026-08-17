'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { regulatoryJurisdictionService } from '../services/regulatory-jurisdiction.service';

export function RegulatoryJurisdictionForm({ initial }: { initial?: Record<string, any> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>(initial ?? { jurisdictionStatus: 'Active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      const row = initial?.id ? await regulatoryJurisdictionService.update(initial.id, values) : await regulatoryJurisdictionService.create(values);
      router.push(`/regulatory/jurisdictions/${row.id ?? initial?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Jurisdiction save failed.');
    } finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
      <RegulatoryCard title="Jurisdiction Identity" subtitle="No legal advice is generated. Store only verified jurisdiction metadata.">
        <div className="grid gap-4 md:grid-cols-2">
          <RegulatoryField label="Jurisdiction name"><input className={regulatoryInputClass()} value={values.jurisdictionName ?? values.jurisdiction_name ?? ''} onChange={set('jurisdictionName')} required /></RegulatoryField>
          <RegulatoryField label="Jurisdiction code"><input className={regulatoryInputClass()} value={values.jurisdictionCode ?? values.jurisdiction_code ?? ''} onChange={set('jurisdictionCode')} /></RegulatoryField>
          <RegulatoryField label="Level"><input className={regulatoryInputClass()} value={values.jurisdictionLevel ?? values.jurisdiction_level ?? ''} onChange={set('jurisdictionLevel')} required placeholder="Country, State / Province, City / Municipality..." /></RegulatoryField>
          <RegulatoryField label="Status"><select className={regulatoryInputClass()} value={values.jurisdictionStatus ?? values.jurisdiction_status ?? 'Active'} onChange={set('jurisdictionStatus')}><option>Active</option><option>Draft</option><option>Archived</option></select></RegulatoryField>
          <RegulatoryField label="Country"><input className={regulatoryInputClass()} value={values.country ?? ''} onChange={set('country')} /></RegulatoryField>
          <RegulatoryField label="State / Province"><input className={regulatoryInputClass()} value={values.stateProvince ?? values.state_province ?? ''} onChange={set('stateProvince')} /></RegulatoryField>
          <RegulatoryField label="City / Municipality"><input className={regulatoryInputClass()} value={values.cityMunicipality ?? values.city_municipality ?? ''} onChange={set('cityMunicipality')} /></RegulatoryField>
          <RegulatoryField label="Industrial zone"><input className={regulatoryInputClass()} value={values.industrialZone ?? values.industrial_zone ?? ''} onChange={set('industrialZone')} /></RegulatoryField>
          <RegulatoryField label="Authority name"><input className={regulatoryInputClass()} value={values.authorityName ?? values.authority_name ?? ''} onChange={set('authorityName')} /></RegulatoryField>
          <RegulatoryField label="Owner user ID"><input className={regulatoryInputClass()} value={values.ownerUserId ?? values.owner_user_id ?? ''} onChange={set('ownerUserId')} /></RegulatoryField>
          <RegulatoryField label="Description"><textarea className={regulatoryInputClass()} value={values.jurisdictionDescription ?? values.jurisdiction_description ?? ''} onChange={set('jurisdictionDescription')} /></RegulatoryField>
          <RegulatoryField label="Notes"><textarea className={regulatoryInputClass()} value={values.notes ?? ''} onChange={set('notes')} /></RegulatoryField>
        </div>
      </RegulatoryCard>
      <div className="flex justify-end gap-2"><RegulatoryButton variant="secondary" href="/regulatory/jurisdictions">Cancel</RegulatoryButton><RegulatoryButton type="submit" disabled={saving} title={saving ? 'Saving jurisdiction...' : undefined}>{saving ? 'Saving...' : 'Save Jurisdiction'}</RegulatoryButton></div>
    </form>
  );
}
