import { TrainingCard, TrainingEmptyState } from '../../shared/TrainingUi';

export function WorkerDocumentsSection({ value, onChange, context }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void; context?: Record<string, any> }) {
  const documents = Array.isArray(context?.documents) ? context.documents : [];
  return (
    <TrainingCard title="6. Documents" subtitle="Document links use Document Control references. Raw files are not stored in Training tables.">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm"><span className="mb-1 block font-semibold">Document Control record</span><select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.documentLink?.documentId ?? ''} onChange={(e) => onChange({ documentLink: { ...(value.documentLink ?? {}), documentId: e.target.value } })}><option value="">No document selected</option>{documents.map((doc: any) => <option key={doc.id} value={doc.id}>{doc.documentNo ?? doc.id} - {doc.title}</option>)}</select></label>
        <label className="text-sm"><span className="mb-1 block font-semibold">Document type</span><select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.documentLink?.documentType ?? 'Other'} onChange={(e) => onChange({ documentLink: { ...(value.documentLink ?? {}), documentType: e.target.value } })}>{['Employment record reference', 'Contractor onboarding document', 'Training certificate', 'Competency assessment evidence', 'Medical/fitness document', 'ID/badge document', 'Authorization letter', 'Vendor qualification document', 'Signed policy acknowledgement', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {!documents.length ? <div className="mt-3"><TrainingEmptyState title="No Document Control records returned" message="Linking remains available once Document Control records exist in your current scope." /></div> : null}
    </TrainingCard>
  );
}
