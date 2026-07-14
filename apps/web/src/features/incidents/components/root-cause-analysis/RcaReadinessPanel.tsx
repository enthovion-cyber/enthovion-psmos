import { ReadinessContent } from '../shared/IncidentTabPrimitives';
import { RcaPanel } from './RcaPrimitives';

export function RcaReadinessPanel({ readiness }: { readiness: any }) {
  return <RcaPanel title="RCA Readiness / Missing Data Panel" subtitle="Backend-generated readiness for completion, review, CAPA mapping, and blockers."><ReadinessContent readiness={readiness} /></RcaPanel>;
}
