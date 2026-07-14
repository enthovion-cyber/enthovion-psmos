import { Ban, CheckCircle2, Eye, Play, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import type { LopaIplCandidate } from '../../types/lopa-ipls-safeguards.types';
import { LopaPanel } from '../overview/LopaOverviewShared';
import { EmptyState, IplBadge } from './LopaIplBadges';

export function IplCandidateRegister({ rows, readOnly, onOpen, onStartValidation, onSubmitValidation, onCredit, onUncredit, onReject, onReopen }: { rows: LopaIplCandidate[]; readOnly: boolean; onOpen: (row: LopaIplCandidate) => void; onStartValidation: (row: LopaIplCandidate) => void; onSubmitValidation: (row: LopaIplCandidate) => void; onCredit: (row: LopaIplCandidate) => void; onUncredit: (row: LopaIplCandidate) => void; onReject: (row: LopaIplCandidate) => void; onReopen: (row: LopaIplCandidate) => void }) {
  return (
    <LopaPanel title="IPL Candidate Register">
      {!rows.length ? <EmptyState text="No IPL candidates selected. Upgrade a safeguard or select an approved IPL Registry record." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr><th className="py-2">Candidate</th><th>Type</th><th>Source</th><th>Validation</th><th>Credit</th><th>PFDavg / RRF</th><th>Blockers</th><th>Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10">
              {rows.map((row) => {
                const credited = !!(row.creditedInCalculation ?? row.credited_in_calculation);
                return (
                  <tr key={row.id} className="align-top">
                    <td className="py-3"><div className="font-semibold text-white">{row.iplName ?? row.ipl_name}</div><div className="font-mono text-xs text-slate-500">{row.candidateNumber ?? row.candidate_number}</div></td>
                    <td className="text-slate-300">{row.iplType ?? row.ipl_type}</td>
                    <td className="text-slate-300">{row.sourceType ?? row.source_type}</td>
                    <td><IplBadge value={row.validationStatus ?? row.validation_status} /></td>
                    <td><IplBadge value={credited ? 'Credited' : (row.creditStatus ?? row.credit_status)} /></td>
                    <td className="text-slate-300"><div>{row.pfdavg ?? '-'} PFDavg</div><div>{row.rrf ?? '-'} RRF</div></td>
                    <td className="max-w-xs text-xs text-slate-400">{row.creditBlockers?.length ? row.creditBlockers.slice(0, 2).join(' ') : <span className="text-emerald-300">Clear</span>}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button className="lopa-button-secondary" onClick={() => onOpen(row)}><Eye size={13} />View</button>
                        <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onStartValidation(row)}><Play size={13} />Start</button>
                        <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onSubmitValidation(row)}><CheckCircle2 size={13} />Submit</button>
                        {!credited ? <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onCredit(row)}><ShieldCheck size={13} />Credit</button> : <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onUncredit(row)}><XCircle size={13} />Uncredit</button>}
                        <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onReject(row)}><Ban size={13} />Reject</button>
                        <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onReopen(row)}><RotateCcw size={13} />Reopen</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </LopaPanel>
  );
}
