import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function InvitationParticipationPanel({ invitations }: any) {
  return (
    <LopaPanel title="Invitation / Participation Status">
      <div className="space-y-2">
        {(invitations ?? []).length ? invitations.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm">
            <div>
              <div className="font-bold text-white">{item.full_name ?? item.email}</div>
              <div className="text-xs text-slate-500">{item.study_role} - {item.discipline}</div>
            </div>
            <TonePill tone={item.invitation_status === 'Accepted' ? 'success' : item.invitation_status === 'Declined' ? 'danger' : 'warning'}>{item.invitation_status}</TonePill>
          </div>
        )) : <div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-4 text-sm text-slate-400">No pending or recent invitations.</div>}
      </div>
    </LopaPanel>
  );
}
