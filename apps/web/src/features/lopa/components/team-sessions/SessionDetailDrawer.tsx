import { LibraryDrawer, DetailRow } from '../libraries/LibraryShared';
import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { QuorumRequiredRepresentationPanel } from './QuorumRequiredRepresentationPanel';
import { SessionActionsPanel } from './SessionActionsPanel';
import { SessionAgendaPanel } from './SessionAgendaPanel';
import { SessionAttendancePanel } from './SessionAttendancePanel';
import { SessionMinutesDecisionsPanel } from './SessionMinutesDecisionsPanel';

export function SessionDetailDrawer({ open, onClose, session, detail, canEdit, onAddAgenda, onBulkPresent, onSaveAttendance, onSaveMinutes, minutesForm, setMinutesForm, onCreateDecision, onCreateAction, onSyncActions, onLockMinutes, onUnlockMinutes, onComplete, onCancel }: any) {
  const data = detail ?? {};
  const row = session ?? data.session;
  return (
    <LibraryDrawer title="Session Detail" open={open} onClose={onClose}>
      {!row ? <div className="text-sm text-slate-400">Select a session to inspect details.</div> : (
        <div className="space-y-4">
          <LopaPanel title="Session Overview" action={<TonePill>{row.status}</TonePill>}>
            <DetailRow label="Title" value={row.session_title} />
            <DetailRow label="Type" value={row.session_type} />
            <DetailRow label="Date / Time" value={`${row.start_time ?? '-'} - ${row.end_time ?? '-'}`} />
            <DetailRow label="Location" value={row.location ?? row.meeting_link ?? '-'} />
            <DetailRow label="Facilitator" value={row.facilitator_name ?? '-'} />
            <DetailRow label="Scribe" value={row.scribe_name ?? '-'} />
            <div className="mt-3 flex flex-wrap gap-2">
              {canEdit ? <button className="lopa-button-secondary" onClick={onComplete}>Complete</button> : null}
              {canEdit ? <button className="lopa-button-secondary" onClick={onCancel}>Cancel</button> : null}
              {canEdit && !data.minutes?.locked ? <button className="lopa-button-secondary" onClick={onLockMinutes}>Lock Minutes</button> : null}
              {canEdit && data.minutes?.locked ? <button className="lopa-button-secondary" onClick={onUnlockMinutes}>Unlock Minutes</button> : null}
            </div>
          </LopaPanel>
          <SessionAgendaPanel agenda={data.agenda} onAdd={onAddAgenda} canEdit={canEdit} />
          <SessionAttendancePanel rows={data.attendance} canEdit={canEdit} onBulkPresent={onBulkPresent} onSave={onSaveAttendance} />
          <SessionMinutesDecisionsPanel minutes={data.minutes} decisions={data.decisions} canEdit={canEdit} onSaveMinutes={onSaveMinutes} onCreateDecision={onCreateDecision} minutesForm={minutesForm} setMinutesForm={setMinutesForm} />
          <SessionActionsPanel actions={data.actions} canEdit={canEdit} onCreateAction={onCreateAction} onSync={onSyncActions} />
          <QuorumRequiredRepresentationPanel quorum={data.quorum} />
          <LopaPanel title="Session History">
            {(data.history ?? []).length ? data.history.map((event: any) => <div key={event.id} className="border-b border-cyan-300/10 py-2 text-sm text-slate-300"><b className="text-white">{event.event_title ?? event.event_type}</b><div className="text-xs text-slate-500">{event.created_at}</div></div>) : <div className="text-sm text-slate-400">No session history yet.</div>}
          </LopaPanel>
        </div>
      )}
    </LibraryDrawer>
  );
}
