'use client';

import { Archive, CheckCircle2, CopyPlus, Eye, FileUp, Pencil, RotateCcw, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IplRegistryRecord, IplRegistryResponse } from '../../types/lopa-ipl-registry.types';
import { IplRegistryRiskBadge, IplRegistryStatusBadge } from './IplRegistryStatusBadge';

export function IplRegistryTable({
  data,
  isLoading,
  onView,
  onEdit,
  onAction
}: {
  data?: IplRegistryResponse | undefined;
  isLoading?: boolean;
  onView: (record: IplRegistryRecord) => void;
  onEdit: (record: IplRegistryRecord) => void;
  onAction: (record: IplRegistryRecord, action: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive' | 'restore' | 'duplicate') => void;
}) {
  const rows = data?.rows ?? [];
  if (isLoading) return <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-8 text-center text-slate-300">Loading IPL Registry...</div>;
  if (!rows.length) return <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-8 text-center text-slate-400">No IPL registry records match the current filters.</div>;
  return (
    <section className="overflow-hidden rounded-xl border border-cyan-300/10 bg-[#071525]">
      <div className="overflow-x-auto">
        <table className="min-w-[1320px] w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0b1d31] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              {['IPL', 'Type / Service', 'PFDavg / RRF', 'Basis & Source', 'Proof Test', 'Validation', 'Links', 'Approval', 'Revision', 'Actions'].map((head) => <th key={head} className="border-b border-cyan-300/10 px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} className="border-b border-cyan-300/10 text-slate-200 hover:bg-cyan-300/5">
                <td className="px-4 py-3">
                  <button onClick={() => onView(record)} className="font-black text-blue-300 hover:text-blue-200">{record.registry_number}</button>
                  <div className="mt-1 font-semibold text-white">{record.ipl_name}</div>
                  <div className="line-clamp-1 text-xs text-slate-500">{record.description || 'No description'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{record.ipl_type}</div>
                  <div className="text-xs text-slate-500">{record.service_application || record.protected_equipment || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2"><IplRegistryRiskBadge value={record.pfdavg ?? null} /><IplRegistryRiskBadge value={record.rrf ?? null} /></div>
                  <div className="mt-1 text-xs text-slate-500">PFDavg / RRF</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{record.source_type || 'No source type'}</div>
                  <div className="line-clamp-1 max-w-[230px] text-xs text-slate-500">{record.source_reference || 'Missing source reference'}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{record.proof_test_interval || '-'}</div>
                  <div className="text-xs text-slate-500">{record.proof_test_due_date || 'No due date'}</div>
                </td>
                <td className="px-4 py-3"><IplRegistryStatusBadge value={record.validation_status} /></td>
                <td className="px-4 py-3">
                  <div>{record.equipment_links_count ?? 0} equipment</div>
                  <div className="text-xs text-slate-500">{record.document_links_count ?? 0} documents</div>
                </td>
                <td className="px-4 py-3"><IplRegistryStatusBadge value={record.approval_status} /></td>
                <td className="px-4 py-3">Rev {record.revision}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <IconButton title="View" onClick={() => onView(record)} icon={<Eye size={14} />} />
                    <IconButton title="Edit" onClick={() => onEdit(record)} icon={<Pencil size={14} />} disabled={record.approval_status === 'Approved' || record.approval_status === 'Archived'} />
                    <IconButton title="Submit review" onClick={() => onAction(record, 'submit-review')} icon={<FileUp size={14} />} disabled={!['Draft', 'Rejected'].includes(record.approval_status)} />
                    <IconButton title="Approve" onClick={() => onAction(record, 'approve')} icon={<CheckCircle2 size={14} />} disabled={record.approval_status !== 'Pending Review'} />
                    <IconButton title="Reject" onClick={() => onAction(record, 'reject')} icon={<XCircle size={14} />} disabled={record.approval_status !== 'Pending Review'} />
                    <IconButton title="Create revision" onClick={() => onAction(record, 'create-revision')} icon={<CopyPlus size={14} />} disabled={record.approval_status !== 'Approved'} />
                    {record.approval_status === 'Archived' ? <IconButton title="Restore" onClick={() => onAction(record, 'restore')} icon={<RotateCcw size={14} />} /> : <IconButton title="Archive" onClick={() => onAction(record, 'archive')} icon={<Archive size={14} />} disabled={record.approval_status === 'Archived'} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-cyan-300/10 px-4 py-3 text-xs text-slate-400">
        <span>Showing {rows.length} of {data?.total ?? rows.length} IPL records</span>
        <span>Approved records require a new revision before editing.</span>
      </div>
    </section>
  );
}

function IconButton({ title, icon, onClick, disabled }: { title: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} className="rounded-md border border-cyan-300/10 bg-[#03101d] p-2 text-slate-300 transition hover:border-blue-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
      {icon}
    </button>
  );
}
