import { KeyValueGrid, SectionCard } from '../../safeguards/SafeguardUiPrimitives';
export function SifBypassHistoryTab({ foundation }: { sifId: string; foundation?: any }) {
  return <SectionCard title="Bypass / Inhibit / Override Foundation" description="Controlled bypass basis, maximum duration, approvals, compensating measures, and startup impact."><KeyValueGrid items={[['Bypass allowed', foundation?.bypass_allowed], ['Maximum duration', foundation?.max_bypass_duration], ['Compensating measures', foundation?.compensating_measures], ['Approval requirements', foundation?.approval_requirements], ['Startup blocked while bypassed', foundation?.startup_blocked_while_bypassed]]} /></SectionCard>;
}
