import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function EquipmentDesignDocumentsTab({ detail }: { detail: EquipmentDesignDetail }) {
  if (!detail.documents.length) return <PsiEmptyState title="No controlled documents linked" message="Link datasheets, P&IDs, mechanical drawings, calculations, certificates, relief calculations, MOC/PSSR records, vendor manuals, and inspection documents from Document Control." />;
  return (
    <PsiCard title="Documents" subtitle="Controlled document links preserve document number, title, status, revision, evidence requirement, and readiness impact snapshots.">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{['Document', 'Type', 'Revision', 'Status', 'Required', 'Readiness'].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {detail.documents.map((doc) => (
              <tr key={String(doc.id ?? doc.document_id ?? doc.document_number)}>
                <td className="px-3 py-2 font-semibold">{String(doc.document_number ?? 'No number')}<p className="text-xs font-normal text-[var(--psm-muted)]">{String(doc.document_title ?? 'Untitled document')}</p></td>
                <td className="px-3 py-2">{String(doc.document_type ?? '-')}</td>
                <td className="px-3 py-2">{String(doc.document_revision ?? '-')}</td>
                <td className="px-3 py-2">{String(doc.document_status ?? '-')}</td>
                <td className="px-3 py-2">{doc.required ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{doc.readiness_impact ? 'Impacts readiness' : 'Reference'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PsiCard>
  );
}
