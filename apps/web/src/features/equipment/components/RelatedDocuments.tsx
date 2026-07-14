import type { EquipmentDocument } from '@/services/equipment.service';

export function RelatedDocuments({ documents, onOpen }: { documents: EquipmentDocument[]; onOpen: () => void }) {
  return (
    <div className="psm-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide">Linked Documents ({documents.length})</h2><button onClick={onOpen} className="text-sm text-info">View All</button></div>
      {documents.length === 0 ? <div className="text-sm text-slate-400">No linked documents.</div> : documents.slice(0, 5).map((doc) => (
        <button key={doc.id} onClick={onOpen} className="flex w-full justify-between border-b border-line py-2 text-left text-sm">
          <span>{doc.title}</span><span className="text-slate-500">{doc.documentType}</span>
        </button>
      ))}
    </div>
  );
}
