import { TonePill } from '../overview/LopaOverviewShared';
import { DataTable } from './RecommendationUi';

export function LopaActionRegister({ rows, onVerify }: { rows: any[]; onVerify: (row: any) => void }) {
  return <DataTable columns={['Action', 'Title', 'Owner', 'Priority', 'Due', 'Status', 'Blocking', 'Action']} empty="No Universal Actions linked to this LOPA study." rows={rows.map((row) => <tr key={row.id} className="text-slate-200"><td className="px-3 py-3 font-mono text-blue-200">{row.actionNumber}</td><td className="px-3 py-3 font-semibold text-white">{row.title}</td><td className="px-3 py-3">{row.owner?.displayName ?? row.assignedToId ?? '-'}</td><td className="px-3 py-3">{row.priority}</td><td className="px-3 py-3">{row.dueDate ?? '-'}</td><td className="px-3 py-3"><TonePill>{row.status}</TonePill></td><td className="px-3 py-3">{row.links?.some((l: any) => l.blocking) ? 'Yes' : 'No'}</td><td className="px-3 py-3"><button className="text-emerald-200" onClick={() => onVerify(row)}>Verify closure</button></td></tr>)} />;
}
