import Link from 'next/link';
import { ExecutivePanel } from './ExecutivePanel';

export function ExecutiveKpiDrilldownPanel({ drilldown }: { drilldown: { route: string | null; status: string; reason?: string | null } }) {
  return <ExecutivePanel title="Drilldown" subtitle={drilldown.reason ?? 'Open the approved source module for record-level investigation.'}>{drilldown.route ? <Link href={drilldown.route} className="inline-flex rounded-md bg-[var(--psm-primary)] px-3 py-2 text-sm font-semibold text-white">Open source records</Link> : <p className="text-sm text-[var(--psm-muted)]">{drilldown.reason ?? 'This drilldown is not available.'}</p>}</ExecutivePanel>;
}
