import { ReadinessContent } from '../shared/IncidentTabPrimitives';
import { RcaPanel } from './RcaPrimitives';

export function RcaQualityCheckPanel({ data }: { data: any }) {
  return <RcaPanel title="RCA Quality Check Panel" subtitle="Backend-generated RCA quality, evidence, method, hypothesis, systemic, and CAPA checks."><ReadinessContent readiness={{ status: data?.status, score: data?.score, checklist: data?.checks }} /></RcaPanel>;
}
