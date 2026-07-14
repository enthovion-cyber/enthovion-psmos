import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { TeamTable } from './TeamSessionsUi';

export function RoleDisciplineCoverageMatrix({ coverage }: any) {
  return (
    <LopaPanel title="Role & Discipline Coverage Matrix">
      <TeamTable
        columns={['Discipline', 'Required', 'Assigned member', 'Status', 'Missing reason', 'Action']}
        empty="Coverage has not been calculated yet."
        rows={(coverage ?? []).map((row: any) => (
          <tr key={row.discipline} className="text-slate-200">
            <td className="px-3 py-3 font-semibold text-white">{row.discipline}</td>
            <td className="px-3 py-3">{row.required ? 'Yes' : 'No'}</td>
            <td className="px-3 py-3">{row.assignedMemberName ?? '-'}</td>
            <td className="px-3 py-3"><TonePill tone={row.status === 'Covered' ? 'success' : row.status === 'Missing' ? 'danger' : 'muted'}>{row.status}</TonePill></td>
            <td className="px-3 py-3 text-slate-400">{row.missingReason ?? '-'}</td>
            <td className="px-3 py-3 text-blue-200">{row.action ?? '-'}</td>
          </tr>
        ))}
      />
    </LopaPanel>
  );
}
