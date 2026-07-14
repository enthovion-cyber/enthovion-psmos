import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { fieldClass, TeamTable } from './TeamSessionsUi';

export function SessionAgendaPanel({ agenda, onAdd, canEdit }: any) {
  return (
    <LopaPanel title="Agenda" action={canEdit ? <button className="text-xs font-bold text-blue-200" onClick={onAdd}>Add Agenda Item</button> : null}>
      <TeamTable
        columns={['#', 'Topic', 'Related section', 'Owner', 'Duration', 'Status', 'Notes']}
        empty="No agenda items added yet."
        rows={(agenda ?? []).map((item: any) => (
          <tr key={item.id} className="text-slate-200">
            <td className="px-3 py-3">{item.item_number}</td>
            <td className="px-3 py-3"><b className="text-white">{item.topic}</b><div className="text-xs text-slate-500">{item.description ?? '-'}</div></td>
            <td className="px-3 py-3">{item.related_section ?? '-'}</td>
            <td className="px-3 py-3">{item.owner_name ?? item.presenter_name ?? '-'}</td>
            <td className="px-3 py-3">{item.planned_duration_minutes ?? 0} min</td>
            <td className="px-3 py-3"><TonePill>{item.status}</TonePill></td>
            <td className="px-3 py-3 text-slate-400">{item.notes ?? '-'}</td>
          </tr>
        ))}
      />
    </LopaPanel>
  );
}

export function AddAgendaInline({ value, setValue, onSave, saving }: any) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input className={fieldClass} placeholder="Topic" value={value.topic ?? ''} onChange={(event) => setValue((current: any) => ({ ...current, topic: event.target.value }))} />
        <input className={fieldClass} placeholder="Related section" value={value.relatedSection ?? ''} onChange={(event) => setValue((current: any) => ({ ...current, relatedSection: event.target.value }))} />
        <input className={fieldClass} placeholder="Duration minutes" value={value.plannedDurationMinutes ?? ''} onChange={(event) => setValue((current: any) => ({ ...current, plannedDurationMinutes: Number(event.target.value || 0) }))} />
        <button className="lopa-button-primary justify-center" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Agenda'}</button>
      </div>
    </div>
  );
}
