import { RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';

export function AuditMappingRegulatorySourceSection({ form, setForm, sourceTypes }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; sourceTypes?: string[] | undefined }) {
  return (
    <RegulatoryCard title="Regulatory Source" subtitle="Select the real regulatory object that requires audit assurance coverage.">
      <div className="grid gap-4 md:grid-cols-2">
        <RegulatoryField label="Source type" helper="Regulatory item, obligation, compliance status, gap, evidence link, or evidence package.">
          <select className={regulatoryInputClass()} value={form.regulatorySourceType ?? 'Regulatory Obligation'} onChange={(event) => setForm({ regulatorySourceType: event.target.value })}>{(sourceTypes?.length ? sourceTypes : ['Regulatory Item', 'Regulatory Obligation', 'Compliance Assessment', 'Compliance Gap', 'Evidence Link', 'Evidence Package', 'Manual Foundation']).map((item) => <option key={item}>{item}</option>)}</select>
        </RegulatoryField>
        <RegulatoryField label="Regulatory item ID"><input className={regulatoryInputClass()} value={form.regulatoryItemId ?? ''} onChange={(event) => setForm({ regulatoryItemId: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Obligation ID"><input className={regulatoryInputClass()} value={form.obligationId ?? ''} onChange={(event) => setForm({ obligationId: event.target.value })} /></RegulatoryField>
        <RegulatoryField label="Compliance assessment / gap / evidence ID"><input className={regulatoryInputClass()} value={form.sourceRecordId ?? ''} onChange={(event) => setForm({ sourceRecordId: event.target.value })} /></RegulatoryField>
      </div>
    </RegulatoryCard>
  );
}
