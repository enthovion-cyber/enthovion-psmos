import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { fieldClass, TeamTable } from './TeamSessionsUi';

export function SessionMinutesDecisionsPanel({ minutes, decisions, canEdit, onSaveMinutes, onCreateDecision, minutesForm, setMinutesForm }: any) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <LopaPanel title="Minutes">
        <div className="space-y-3">
          <textarea className={fieldClass} rows={4} placeholder="Minutes summary" disabled={!canEdit || minutes?.locked} value={minutesForm.summary ?? minutes?.minutes_summary ?? ''} onChange={(event) => setMinutesForm((current: any) => ({ ...current, summary: event.target.value }))} />
          <textarea className={fieldClass} rows={4} placeholder="Discussion notes, assumptions, deferred items, disagreements, concerns..." disabled={!canEdit || minutes?.locked} value={minutesForm.discussionNotes ?? minutes?.discussion_notes ?? ''} onChange={(event) => setMinutesForm((current: any) => ({ ...current, discussionNotes: event.target.value }))} />
          <div className="flex items-center justify-between text-sm text-slate-400"><span>Prepared: {minutes?.prepared_by_name ?? '-'}</span><TonePill tone={minutes?.locked ? 'success' : 'warning'}>{minutes?.locked ? 'Locked' : 'Minutes pending'}</TonePill></div>
          {canEdit && !minutes?.locked ? <button className="lopa-button-primary" onClick={onSaveMinutes}>Save Minutes</button> : null}
        </div>
      </LopaPanel>
      <LopaPanel title="Decisions" action={canEdit ? <button className="text-xs font-bold text-blue-200" onClick={onCreateDecision}>Add Decision</button> : null}>
        <TeamTable
          columns={['Decision', 'Type / Outcome', 'Owner', 'Evidence', 'Action']}
          empty="No decisions recorded for this session."
          rows={(decisions ?? []).map((decision: any) => (
            <tr key={decision.id} className="text-slate-200">
              <td className="px-3 py-3"><b className="text-white">{decision.decision_number}</b><div>{decision.title}</div><div className="text-xs text-slate-500">{decision.description ?? '-'}</div></td>
              <td className="px-3 py-3">{decision.decision_type}<div className="text-xs text-slate-500">{decision.decision_outcome ?? '-'}</div></td>
              <td className="px-3 py-3">{decision.owner_name ?? '-'}</td>
              <td className="px-3 py-3">{decision.evidence_reference ?? '-'}</td>
              <td className="px-3 py-3">{decision.action_required ? 'Required' : 'No'}</td>
            </tr>
          ))}
        />
      </LopaPanel>
    </div>
  );
}
