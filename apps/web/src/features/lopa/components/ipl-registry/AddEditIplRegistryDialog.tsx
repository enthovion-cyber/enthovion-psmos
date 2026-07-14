'use client';

import { useEffect, useState } from 'react';
import type { IplRegistryContext, IplRegistryRecord } from '../../types/lopa-ipl-registry.types';
import { inputClass, LibraryDialog, LibraryField, selectClass } from '../libraries/LibraryShared';

const empty = {
  iplName: '',
  iplType: '',
  description: '',
  siteId: '',
  serviceApplication: '',
  equipmentType: '',
  processService: '',
  protectedEquipment: '',
  safeState: '',
  demandSource: '',
  riskReductionClaim: '',
  pfdavg: '',
  rrf: '',
  pfdBasis: '',
  rrfBasis: '',
  sourceType: '',
  sourceReference: '',
  standardReference: '',
  proofTestInterval: '',
  proofTestBasis: '',
  inspectionRequirement: '',
  maintenanceRequirement: '',
  ownerId: '',
  reviewDueDate: '',
  proofTestDueDate: '',
  revisionNotes: ''
};

export function AddEditIplRegistryDialog({ open, record, context, isSaving, error, onClose, onSave }: { open: boolean; record: IplRegistryRecord | null; context?: IplRegistryContext | undefined; isSaving?: boolean; error?: unknown; onClose: () => void; onSave: (values: Record<string, any>) => Promise<void> }) {
  const [tab, setTab] = useState('identity');
  const [values, setValues] = useState<Record<string, any>>(empty);
  useEffect(() => {
    if (!open) return;
    setTab('identity');
    setValues(record ? {
      iplName: record.ipl_name ?? '',
      iplType: record.ipl_type ?? '',
      description: record.description ?? '',
      siteId: record.site_id ?? '',
      serviceApplication: record.service_application ?? '',
      equipmentType: record.equipment_type ?? '',
      processService: record.process_service ?? '',
      protectedEquipment: record.protected_equipment ?? '',
      safeState: record.safe_state ?? '',
      demandSource: record.demand_source ?? '',
      riskReductionClaim: record.risk_reduction_claim ?? '',
      pfdavg: record.pfdavg ?? '',
      rrf: record.rrf ?? '',
      pfdBasis: record.pfd_basis ?? '',
      rrfBasis: record.rrf_basis ?? '',
      sourceType: record.source_type ?? '',
      sourceReference: record.source_reference ?? '',
      standardReference: record.standard_reference ?? '',
      proofTestInterval: record.proof_test_interval ?? '',
      proofTestBasis: record.proof_test_basis ?? '',
      inspectionRequirement: record.inspection_requirement ?? '',
      maintenanceRequirement: record.maintenance_requirement ?? '',
      ownerId: record.owner_id ?? '',
      reviewDueDate: record.review_due_date ?? '',
      proofTestDueDate: record.proof_test_due_date ?? '',
      revisionNotes: record.revision_notes ?? ''
    } : empty);
  }, [open, record]);

  const set = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === '' ? undefined : value]));
    await onSave({
      ...cleaned,
      pfdavg: values.pfdavg === '' ? undefined : Number(values.pfdavg),
      rrf: values.rrf === '' ? undefined : Number(values.rrf),
      tags: String(values.tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean)
    });
  };

  return (
    <LibraryDialog open={open} onClose={onClose} title={record ? 'Edit IPL Registry Record' : 'Add IPL Registry Record'} subtitle="Approved records become immutable; later changes must be made through a controlled revision.">
      <div className="mb-4 flex flex-wrap gap-2">
        {['identity', 'type', 'basis', 'proof', 'governance'].map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg border px-3 py-2 text-xs font-black uppercase ${tab === item ? 'border-blue-400/40 bg-blue-500/20 text-blue-100' : 'border-cyan-300/10 bg-[#03101d] text-slate-400'}`}>{item}</button>)}
      </div>
      {error ? <div className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{String((error as any)?.message ?? 'Unable to save IPL registry record.')}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {tab === 'identity' ? (
          <>
            <LibraryField label="IPL Name *"><input className={inputClass} value={values.iplName} onChange={(event) => set('iplName', event.target.value)} /></LibraryField>
            <LibraryField label="IPL Type *"><select className={selectClass} value={values.iplType} onChange={(event) => set('iplType', event.target.value)}><option value="">Select type</option>{(context?.iplTypes ?? []).map((type) => <option key={type} value={type}>{type}</option>)}</select></LibraryField>
            <LibraryField label="Site scope"><select className={selectClass} value={values.siteId} onChange={(event) => set('siteId', event.target.value)}><option value="">Corporate / all sites</option>{(context?.sites ?? []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></LibraryField>
            <LibraryField label="Owner"><select className={selectClass} value={values.ownerId} onChange={(event) => set('ownerId', event.target.value)}><option value="">Unassigned</option>{(context?.users ?? []).map((user) => <option key={user.id} value={user.id}>{user.displayName || user.email}</option>)}</select></LibraryField>
            <LibraryField label="Description"><textarea className={inputClass} rows={4} value={values.description} onChange={(event) => set('description', event.target.value)} /></LibraryField>
            <LibraryField label="Service Application"><input className={inputClass} value={values.serviceApplication} onChange={(event) => set('serviceApplication', event.target.value)} /></LibraryField>
          </>
        ) : null}
        {tab === 'type' ? (
          <>
            <LibraryField label="Equipment Type"><input className={inputClass} value={values.equipmentType} onChange={(event) => set('equipmentType', event.target.value)} /></LibraryField>
            <LibraryField label="Process Service"><input className={inputClass} value={values.processService} onChange={(event) => set('processService', event.target.value)} /></LibraryField>
            <LibraryField label="Protected Equipment"><input className={inputClass} value={values.protectedEquipment} onChange={(event) => set('protectedEquipment', event.target.value)} /></LibraryField>
            <LibraryField label="Safe State"><input className={inputClass} value={values.safeState} onChange={(event) => set('safeState', event.target.value)} /></LibraryField>
            <LibraryField label="Demand Source"><input className={inputClass} value={values.demandSource} onChange={(event) => set('demandSource', event.target.value)} /></LibraryField>
            <LibraryField label="Risk Reduction Claim"><input className={inputClass} value={values.riskReductionClaim} onChange={(event) => set('riskReductionClaim', event.target.value)} /></LibraryField>
          </>
        ) : null}
        {tab === 'basis' ? (
          <>
            <LibraryField label="PFDavg"><input className={inputClass} type="number" step="any" value={values.pfdavg} onChange={(event) => set('pfdavg', event.target.value)} /></LibraryField>
            <LibraryField label="RRF"><input className={inputClass} type="number" step="any" value={values.rrf} onChange={(event) => set('rrf', event.target.value)} /></LibraryField>
            <LibraryField label="PFD Basis"><textarea className={inputClass} rows={4} value={values.pfdBasis} onChange={(event) => set('pfdBasis', event.target.value)} /></LibraryField>
            <LibraryField label="RRF Basis"><textarea className={inputClass} rows={4} value={values.rrfBasis} onChange={(event) => set('rrfBasis', event.target.value)} /></LibraryField>
            <LibraryField label="Source Type"><select className={selectClass} value={values.sourceType} onChange={(event) => set('sourceType', event.target.value)}><option value="">Select source</option>{(context?.sourceTypes ?? []).map((source) => <option key={source} value={source}>{source}</option>)}</select></LibraryField>
            <LibraryField label="Source Reference"><input className={inputClass} value={values.sourceReference} onChange={(event) => set('sourceReference', event.target.value)} /></LibraryField>
            <LibraryField label="Standard Reference"><input className={inputClass} value={values.standardReference} onChange={(event) => set('standardReference', event.target.value)} /></LibraryField>
          </>
        ) : null}
        {tab === 'proof' ? (
          <>
            <LibraryField label="Proof Test Interval"><input className={inputClass} value={values.proofTestInterval} onChange={(event) => set('proofTestInterval', event.target.value)} /></LibraryField>
            <LibraryField label="Proof Test Due Date"><input className={inputClass} type="date" value={values.proofTestDueDate} onChange={(event) => set('proofTestDueDate', event.target.value)} /></LibraryField>
            <LibraryField label="Proof Test Basis"><textarea className={inputClass} rows={4} value={values.proofTestBasis} onChange={(event) => set('proofTestBasis', event.target.value)} /></LibraryField>
            <LibraryField label="Inspection Requirement"><textarea className={inputClass} rows={4} value={values.inspectionRequirement} onChange={(event) => set('inspectionRequirement', event.target.value)} /></LibraryField>
            <LibraryField label="Maintenance Requirement"><textarea className={inputClass} rows={4} value={values.maintenanceRequirement} onChange={(event) => set('maintenanceRequirement', event.target.value)} /></LibraryField>
          </>
        ) : null}
        {tab === 'governance' ? (
          <>
            <LibraryField label="Review Due Date"><input className={inputClass} type="date" value={values.reviewDueDate} onChange={(event) => set('reviewDueDate', event.target.value)} /></LibraryField>
            <LibraryField label="Revision Notes"><textarea className={inputClass} rows={4} value={values.revisionNotes} onChange={(event) => set('revisionNotes', event.target.value)} /></LibraryField>
          </>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="lopa-button-secondary">Cancel</button>
        <button onClick={submit} disabled={isSaving} className="lopa-button-primary">{isSaving ? 'Saving...' : 'Save IPL'}</button>
      </div>
    </LibraryDialog>
  );
}
