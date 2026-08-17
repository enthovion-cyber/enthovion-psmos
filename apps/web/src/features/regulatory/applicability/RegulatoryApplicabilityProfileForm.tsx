'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { regulatoryApplicabilityProfileService } from '../services/regulatory-applicability-profile.service';

export function RegulatoryApplicabilityProfileForm({ initial }: { initial?: Record<string, any> | undefined }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>(initial ?? { profileStatus: 'Draft' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    try { const row = initial?.id ? await regulatoryApplicabilityProfileService.update(initial.id, values) : await regulatoryApplicabilityProfileService.create(values); router.push(`/regulatory/applicability/profiles/${row.profile?.id ?? row.id ?? initial?.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Profile save failed.'); }
    finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="space-y-4">{error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}<RegulatoryCard title="Applicability Profile"><div className="grid gap-4 md:grid-cols-2"><RegulatoryField label="Profile name"><input className={regulatoryInputClass()} value={values.profileName ?? values.profile_name ?? ''} onChange={set('profileName')} required /></RegulatoryField><RegulatoryField label="Profile type"><input className={regulatoryInputClass()} value={values.profileType ?? values.profile_type ?? ''} onChange={set('profileType')} required /></RegulatoryField><RegulatoryField label="Status"><select className={regulatoryInputClass()} value={values.profileStatus ?? values.profile_status ?? 'Draft'} onChange={set('profileStatus')}><option>Draft</option><option>Active</option><option>Archived</option></select></RegulatoryField><RegulatoryField label="Category"><input className={regulatoryInputClass()} value={values.category ?? ''} onChange={set('category')} /></RegulatoryField><RegulatoryField label="Criticality"><input className={regulatoryInputClass()} value={values.criticality ?? ''} onChange={set('criticality')} /></RegulatoryField><RegulatoryField label="Description"><textarea className={regulatoryInputClass()} value={values.profileDescription ?? values.profile_description ?? ''} onChange={set('profileDescription')} /></RegulatoryField></div></RegulatoryCard><div className="flex justify-end gap-2"><RegulatoryButton href="/regulatory/applicability/profiles" variant="secondary">Cancel</RegulatoryButton><RegulatoryButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</RegulatoryButton></div></form>;
}
