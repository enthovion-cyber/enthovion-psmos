import { ClipboardCheck, Edit, LogIn, LogOut, Trash2 } from 'lucide-react';
import type { PermitWorkerRecord } from '../../services/ptw-workforce.service';

export function WorkforceRosterTable({ 
  workers, 
  onEdit, 
  onDelete, 
  onBriefing, 
  onSignIn, 
  onSignOut 
}: { 
  workers: PermitWorkerRecord[]; 
  onEdit: (worker: PermitWorkerRecord) => void; 
  onDelete: (id: string) => void; 
  onBriefing: (id: string) => void; 
  onSignIn: (id: string) => void; 
  onSignOut: (id: string) => void 
}) {
  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      {/* Header Profile Info Strip */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Workforce Roster
        </h3>
        <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-300">
          {workers.length} {workers.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      {workers.length ? (
        /* Luxury Scrollbar-Enhanced Container Layout */
        <div 
          className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[640px]
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-slate-950/60
            [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-lg
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <table className="w-full min-w-[1320px] text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
                {[
                  'Worker Name', 
                  'Company', 
                  'Contractor Company', 
                  'Trade', 
                  'Badge ID', 
                  'Contact Number', 
                  'Role on Permit', 
                  'Briefing Status', 
                  'Sign-In Time', 
                  'Sign-Out Time', 
                  'Status', 
                  'Actions'
                ].map((head) => (
                  <th 
                    key={head} 
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 select-none whitespace-nowrap"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {workers.map((worker) => (
                <tr 
                  key={worker.id} 
                  className="group hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                >
                  <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">
                    {worker.worker_name}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                    {worker.employer_company ?? worker.company ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {worker.contractor_company_id ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                    {worker.trade ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-sky-400 tracking-wide whitespace-nowrap">
                    {worker.badge_id ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                    {worker.contact_number ?? worker.phone ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                    {worker.role_on_permit ?? worker.role ?? '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge 
                      good={worker.briefing_completed === true || worker.signed_briefing === true} 
                      yes="Complete" 
                      no="Pending" 
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {worker.signed_in_at || worker.time_in 
                      ? new Date(worker.signed_in_at ?? worker.time_in ?? '').toLocaleString() 
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {worker.signed_out_at || worker.time_out 
                      ? new Date(worker.signed_out_at ?? worker.time_out ?? '').toLocaleString() 
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Status status={worker.status ?? 'Planned'} />
                  </td>
                  
                  {/* Actions Area Context Control Deck */}
                  <td className="px-4 py-2 sticky right-0 z-10 bg-slate-900/90 group-hover:bg-slate-850 backdrop-blur-md border-l border-slate-800/40 transition-colors duration-150 shadow-[-15px_0_20px_-10px_rgba(2,6,23,0.6)]">
                    <div className="flex items-center gap-1.5">
                      <button 
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 transition-all duration-150 active:scale-95 hover:bg-slate-800 hover:border-slate-600 hover:text-sky-400" 
                        onClick={() => onBriefing(worker.id)} 
                        title="Briefing Setup"
                      >
                        <ClipboardCheck size={14} />
                      </button>
                      <button 
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 transition-all duration-150 active:scale-95 hover:bg-slate-800 hover:border-slate-600 hover:text-emerald-400" 
                        onClick={() => onSignIn(worker.id)} 
                        title="Sign Workforce In"
                      >
                        <LogIn size={14} />
                      </button>
                      <button 
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 transition-all duration-150 active:scale-95 hover:bg-slate-800 hover:border-slate-600 hover:text-amber-400" 
                        onClick={() => onSignOut(worker.id)} 
                        title="Sign Workforce Out"
                      >
                        <LogOut size={14} />
                      </button>
                      <button 
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 transition-all duration-150 active:scale-95 hover:bg-slate-800 hover:border-slate-600 hover:text-indigo-400" 
                        onClick={() => onEdit(worker)} 
                        title="Edit Parameters"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="grid h-8 w-8 place-items-center rounded-lg border border-rose-500/20 text-rose-400 transition-all duration-150 active:scale-95 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300" 
                        onClick={() => onDelete(worker.id)} 
                        title="Revoke Worker"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500">
          No active workforce assigned to profile. Add operators before attempting site permit activation.
        </div>
      )}
    </section>
  );
}

function Badge({ good, yes, no }: { good: boolean; yes: string; no: string }) {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide shadow-sm
        ${good 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}
    >
      {good ? yes : no}
    </span>
  );
}

function Status({ status }: { status: string }) {
  let tone = 'bg-slate-950 text-slate-400 border border-slate-800';
  
  if (status === 'Signed In') {
    tone = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
  } else if (status === 'Signed Out' || status === 'Briefed') {
    tone = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  } else if (status === 'Briefing Pending') {
    tone = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  }
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide shadow-sm ${tone}`}>
      {status}
    </span>
  );
}