'use client';

import { useState } from 'react';
import { useMOCMutation } from '../../hooks/useMOCMutations';
import { changeCategories, changeTypes, priorities } from '../../schemas/moc.schema';
import { DetailCard, Field, detailInput, detailTextarea, EmptyState } from '../moc-detail-ui';

export function MOCChangeDetailsTab({ moc }: { moc: any }) {
  const mutations = useMOCMutation(moc.id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: moc.title ?? '',
    description: moc.description ?? '',
    changeType: moc.change_type ?? 'Permanent Process Change',
    changeCategory: moc.change_category ?? 'Process',
    priority: moc.priority ?? 'Medium',
    departmentId: moc.department_id ?? '',
    unitId: moc.unit_id ?? '',
    areaId: moc.area_id ?? '',
    locationDescription: moc.location_description ?? '',
    affectedSystem: moc.affected_system ?? '',
    requestedStartDate: moc.requested_start_date ?? '',
    targetImplementationDate: moc.target_implementation_date ?? '',
    changeDescription: moc.change_description ?? {}
  });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const setDesc = (key: string, value: string) => setForm((current) => ({ ...current, changeDescription: { ...current.changeDescription, [key]: value } }));
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <DetailCard title="Editable MOC Master Data" action={<button type="button" onClick={() => editing ? mutations.update.mutate(form, { onSuccess: () => setEditing(false) }) : setEditing(true)} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white">{editing ? 'Save Changes' : 'Edit Details'}</button>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="MOC Number"><input className={detailInput} value={moc.moc_number} disabled /></Field>
          <Field label="Status"><input className={detailInput} value={moc.status} disabled /></Field>
          <Field label="Title"><input className={detailInput} disabled={!editing} value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Description"><textarea className={detailTextarea} disabled={!editing} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Change Type"><select className={detailInput} disabled={!editing} value={form.changeType} onChange={(e) => set('changeType', e.target.value)}>{changeTypes.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Change Category"><select className={detailInput} disabled={!editing} value={form.changeCategory} onChange={(e) => set('changeCategory', e.target.value)}>{changeCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Priority"><select className={detailInput} disabled={!editing} value={form.priority} onChange={(e) => set('priority', e.target.value)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Target Implementation Date"><input className={detailInput} disabled={!editing} type="date" value={form.targetImplementationDate ?? ''} onChange={(e) => set('targetImplementationDate', e.target.value)} /></Field>
          <Field label="Requested Start Date"><input className={detailInput} disabled={!editing} type="date" value={form.requestedStartDate ?? ''} onChange={(e) => set('requestedStartDate', e.target.value)} /></Field>
          <Field label="Affected System / Service"><input className={detailInput} disabled={!editing} value={form.affectedSystem ?? ''} onChange={(e) => set('affectedSystem', e.target.value)} /></Field>
          <Field label="Location Description"><textarea className={detailTextarea} disabled={!editing} value={form.locationDescription ?? ''} onChange={(e) => set('locationDescription', e.target.value)} /></Field>
        </div>
      </DetailCard>
      <DetailCard title="Affected Equipment">
        {moc.equipment?.length ? <div className="space-y-2">{moc.equipment.map((item: any) => <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="font-black text-white">{item.equipment?.tag} · {item.role}</p><p className="text-sm text-slate-400">{item.equipment?.name} / {item.equipment?.type}</p><p className="mt-1 text-xs text-slate-500">Criticality {item.equipment?.criticality ?? '-'} · System {item.equipment?.system ?? '-'}</p></div>)}</div> : <EmptyState title="No affected equipment" detail="Use Edit Details after equipment search is expanded to add or remove affected assets." />}
      </DetailCard>
      <DetailCard title="Change Description">
        <div className="grid gap-4 md:grid-cols-2">
          {['currentCondition', 'proposedChange', 'reasonForChange', 'problemStatement', 'businessJustification', 'safetyJustification', 'expectedBenefit', 'preChangeState', 'postChangeState', 'scopeBoundaries', 'notIncluded', 'implementationPlanSummary'].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><textarea className={detailTextarea} disabled={!editing} value={form.changeDescription?.[key] ?? ''} onChange={(e) => setDesc(key, e.target.value)} /></Field>)}
        </div>
      </DetailCard>
    </div>
  );
}
