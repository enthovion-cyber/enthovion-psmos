import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { TeamTable } from './TeamSessionsUi';

export function SessionActionsPanel({ actions, canEdit, onCreateAction, onSync }: any) {
  return (
    <LopaPanel title="Session Actions" action={canEdit ? <div className="flex gap-2"><button className="text-xs font-bold text-blue-200" onClick={onCreateAction}>Create Action</button><button className="text-xs font-bold text-emerald-200" onClick={onSync}>Sync</button></div> : null}>
      <TeamTable
        columns={['Action', 'Owner', 'Due date', 'Priority', 'Status', 'Verification']}
        empty="No Universal Action Engine actions linked to this session."
        rows={(actions ?? []).map((action: any) => (
          <tr key={action.id ?? action.action_id} className="text-slate-200">
            <td className="px-3 py-3"><b className="text-white">{action.title}</b><div className="text-xs text-slate-500">{action.description ?? '-'}</div></td>
            <td className="px-3 py-3">{action.owner_name ?? '-'}</td>
            <td className="px-3 py-3">{action.due_date ?? '-'}</td>
            <td className="px-3 py-3"><TonePill>{action.priority ?? '-'}</TonePill></td>
            <td className="px-3 py-3"><TonePill tone={action.status === 'Closed' ? 'success' : 'warning'}>{action.status ?? '-'}</TonePill></td>
            <td className="px-3 py-3">{action.verification_required ? 'Required' : 'Not required'}</td>
          </tr>
        ))}
      />
    </LopaPanel>
  );
}
