'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { TechnicalDataCompletenessCard } from './TechnicalDataCompletenessCard';
import { TechnicalDataHeader } from './TechnicalDataHeader';
import { TechnicalDataRevisionHistory } from './TechnicalDataRevisionHistory';
import { TechnicalDataSectionCard } from './TechnicalDataSectionCard';
import { TechnicalDataSummaryCards } from './TechnicalDataSummaryCards';

const sections = [
  { title: 'Identification & Classification', key: 'identification', fields: [{ key: 'tag', label: 'Equipment Tag' }, { key: 'name', label: 'Equipment Name' }, { key: 'description', label: 'Description' }, { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'serialNumber', label: 'Serial Number' }, { key: 'assetNumber', label: 'Asset Number' }] },
  { title: 'Design Data', key: 'designData', fields: [{ key: 'designPressure', label: 'Design Pressure' }, { key: 'designPressureUnit', label: 'Pressure Unit' }, { key: 'designTemperature', label: 'Design Temperature' }, { key: 'designTemperatureUnit', label: 'Temperature Unit' }, { key: 'designCode', label: 'Design Code' }, { key: 'capacityValue', label: 'Capacity' }, { key: 'capacityUnit', label: 'Capacity Unit' }] },
  { title: 'Operating Data', key: 'operatingData', fields: [{ key: 'operatingPressure', label: 'Operating Pressure' }, { key: 'operatingPressureUnit', label: 'Pressure Unit' }, { key: 'operatingTemperature', label: 'Operating Temperature' }, { key: 'operatingTemperatureUnit', label: 'Temperature Unit' }, { key: 'operatingMode', label: 'Operating Mode' }, { key: 'serviceType', label: 'Service Type' }] },
  { title: 'Materials / Corrosion Data', key: 'materialsCorrosion', fields: [{ key: 'materialOfConstruction', label: 'Material of Construction' }, { key: 'corrosionAllowance', label: 'Corrosion Allowance' }, { key: 'nominalThickness', label: 'Nominal Thickness' }, { key: 'minimumRequiredThickness', label: 'Minimum Required Thickness' }, { key: 'internalCoating', label: 'Internal Coating' }, { key: 'externalCoating', label: 'External Coating' }, { key: 'corrosionLoop', label: 'Corrosion Loop' }] },
  { title: 'Process Fluid / Chemical / SDS Data', key: 'processFluidChemical', fields: [{ key: 'serviceFluid', label: 'Service Fluid' }, { key: 'chemicalId', label: 'Chemical ID' }, { key: 'sdsId', label: 'SDS ID' }, { key: 'hazardClass', label: 'Hazard Class' }] },
  { title: 'Geometry / Dimensions', key: 'geometryDimensions', fields: [{ key: 'lineSize', label: 'Line Size' }, { key: 'diameter', label: 'Diameter' }] },
  { title: 'Code / Standard / Rating', key: 'codeStandardRating', fields: [{ key: 'ratingClass', label: 'Rating Class' }, { key: 'designCode', label: 'Code / Standard' }] },
  { title: 'Relief / Protection Data', key: 'reliefProtectionData', fields: [{ key: 'reliefProtection', label: 'Relief Protection', type: 'checkbox' }] },
  { title: 'Drawings / References', key: 'drawingsReferences', fields: [{ key: 'pAndIdReference', label: 'P&ID Reference' }, { key: 'drawingReference', label: 'Drawing Reference' }] },
  { title: 'Safety-Critical Attributes', key: 'safetyCriticalAttributes', fields: [{ key: 'safetyCritical', label: 'Safety Critical', type: 'checkbox' }, { key: 'psvTag', label: 'PSV Tag' }, { key: 'sisProtected', label: 'SIS Protected', type: 'checkbox' }, { key: 'sisFunctionTag', label: 'SIS Function Tag' }, { key: 'alarmTags', label: 'Alarm Tags' }, { key: 'interlockTags', label: 'Interlock Tags' }] }
] as const;

export function TechnicalDataPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data'], queryFn: () => miEquipmentService.technicalData(id) });
  const revisions = useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data', 'revisions'], queryFn: () => miEquipmentService.technicalDataRevisions(id) });
  const [form, setForm] = useState<Record<string, Record<string, unknown>>>({});
  const [reason, setReason] = useState('');
  useEffect(() => { if (query.data) setForm(query.data as unknown as Record<string, Record<string, unknown>>); }, [query.data]);
  const mutation = useMutation({
    mutationFn: () => miEquipmentService.updateTechnicalData(id, { ...Object.assign({}, ...Object.values(form)), reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data'] });
      qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data', 'revisions'] });
      setReason('');
    }
  });
  const completeness = useMemo(() => form.completeness ?? query.data?.completeness, [form, query.data]);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Technical data could not be loaded.</div>;
  return (
    <div className="space-y-5">
      <TechnicalDataHeader completeness={completeness} saving={mutation.isPending} onSave={() => mutation.mutate()} />
      {mutation.isError ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{String((mutation.error as Error).message ?? 'Save failed')}</div> : null}
      <TechnicalDataSummaryCards data={form} />
      <TechnicalDataCompletenessCard completeness={completeness} />
      <label className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 text-sm shadow-sm">
        <span className="font-semibold text-[var(--psm-muted)]">Revision reason</span>
        <textarea className="mt-2 min-h-20 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-[var(--psm-text)]" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for safety-critical technical data changes." />
      </label>
      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => (
          <TechnicalDataSectionCard key={section.key} title={section.title} fields={[...section.fields]} values={form[section.key] ?? {}} onChange={(field, value) => setForm((current) => ({ ...current, [section.key]: { ...(current[section.key] ?? {}), [field]: value } }))} />
        ))}
      </div>
      <TechnicalDataRevisionHistory revisions={revisions.data ?? []} />
    </div>
  );
}
