import { PsiButton, PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemLookups } from '../../types/relief-system.types';
import { SelectField, TextField } from './ReliefSectionControls';

export function ReliefDocumentsSection({ documents, lookups, onChange }: { documents: Record<string, any>[]; lookups?: ReliefSystemLookups | undefined; onChange: (rows: Record<string, any>[]) => void }) {
  const update = (index: number, patch: Record<string, unknown>) => onChange(documents.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <PsiCard title="7. Documents / References" subtitle="Controlled document links for relief calculation, P&ID, datasheet, flare study, operating procedure, MOC/PSSR basis, and MI certificate snapshots.">
      <div className="space-y-3">
        {documents.map((document, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 md:grid-cols-4">
            <TextField label="Document ID" name="document_id" value={document.document_id} onChange={(patch) => update(index, patch)} />
            <SelectField label="Document type" name="document_type" value={document.document_type} options={lookups?.documentTypes ?? ['Relief Calculation','P&ID','Datasheet','Flare Study','Operating Procedure','MOC','PSSR','MI Certificate','Other']} onChange={(patch) => update(index, patch)} />
            <TextField label="Document number" name="document_number" value={document.document_number} onChange={(patch) => update(index, patch)} />
            <TextField label="Revision" name="document_revision" value={document.document_revision} onChange={(patch) => update(index, patch)} />
          </div>
        ))}
        <PsiButton variant="secondary" onClick={() => onChange([...documents, { document_type: 'Relief Calculation' }])}>Add Document Link</PsiButton>
      </div>
    </PsiCard>
  );
}
