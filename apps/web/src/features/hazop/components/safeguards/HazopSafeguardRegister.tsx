'use client';

import { Edit3, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import type { HazopSafeguard } from '../../types/hazop-safeguard.types';
import { HazopIplStatusBadge, SafeguardPill } from './HazopIplStatusBadge';
import { HazopSafeguardTypeBadge } from './HazopSafeguardTypeBadge';

type Props = {
  rows: HazopSafeguard[];
  loading?: boolean;
  readonly?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onOpen: (row: HazopSafeguard) => void;
  onEdit: (row: HazopSafeguard) => void;
  onDelete: (row: HazopSafeguard) => void;
  onValidate: (row: HazopSafeguard) => void;
};

export function HazopSafeguardRegister({ rows, loading, readonly, canEdit, canDelete, onOpen, onEdit, onDelete, onValidate }: Props) {
  if (loading) return <div className="rounded-xl border border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">Loading safeguard register...</div>;
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <h3 className="font-semibold">Scenario Safeguard Register</h3>
        <span className="text-xs text-[var(--psm-muted)]">{rows.length} safeguards</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="sticky top-0 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>{['Safeguard', 'Scenario', 'Type', 'Credited', 'IPL', 'Validation', 'Proof Test', 'Gap', 'Owner', 'Actions'].map((head) => <th key={head} className="px-3 py-3 text-left">{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                <td className="px-3 py-3"><button onClick={() => onOpen(row)} className="text-left font-semibold text-primary">{row.safeguard_number}</button><div className="line-clamp-2 max-w-xs text-xs text-[var(--psm-muted)]">{row.safeguard_name}</div></td>
                <td className="px-3 py-3">{row.scenario?.scenario_number ?? row.scenario_id}<div className="text-xs text-[var(--psm-muted)]">{row.node?.node_number ?? 'Node not linked'}</div></td>
                <td className="px-3 py-3"><HazopSafeguardTypeBadge value={row.safeguard_type} /></td>
                <td className="px-3 py-3">{row.credited_for_risk_reduction ? <SafeguardPill tone="green">Credited</SafeguardPill> : <SafeguardPill>Not credited</SafeguardPill>}</td>
                <td className="px-3 py-3">{row.ipl_candidate ? <SafeguardPill tone="amber">Candidate</SafeguardPill> : <SafeguardPill>Not IPL</SafeguardPill>}</td>
                <td className="px-3 py-3"><HazopIplStatusBadge value={row.ipl_validation_status} /></td>
                <td className="px-3 py-3">{row.testStatus?.status ?? row.proof_test_status ?? '-'}</td>
                <td className="px-3 py-3">{row.gapStatus ?? 'None'}</td>
                <td className="px-3 py-3">{row.owner_id ?? '-'}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onOpen(row)} className="rounded-lg border border-[var(--psm-line)] p-2" title="View"><Eye size={15} /></button>
                    {canEdit && !readonly ? <button onClick={() => onEdit(row)} className="rounded-lg border border-[var(--psm-line)] p-2" title="Edit"><Edit3 size={15} /></button> : null}
                    {canEdit && !readonly ? <button onClick={() => onValidate(row)} className="rounded-lg border border-[var(--psm-line)] p-2" title="Validate IPL"><ShieldCheck size={15} /></button> : null}
                    {canDelete && !readonly ? <button onClick={() => onDelete(row)} className="rounded-lg border border-red-500/30 p-2 text-red-300" title="Delete"><Trash2 size={15} /></button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="p-8 text-center text-sm text-[var(--psm-muted)]">No safeguards match the current filters.</div> : null}
    </section>
  );
}
