import { RcaPanel, RcaTimeline } from './RcaPrimitives';

export function RcaChangeHistoryPanel({ rows }: { rows?: any[] }) {
  return <RcaPanel title="RCA Change History Panel"><RcaTimeline rows={rows ?? []} empty="No RCA history events yet." /></RcaPanel>;
}
