import { RcaChecklist, RcaPanel } from './RcaPrimitives';

export function RcaPrerequisiteCheckPanel({ data }: { data: any }) {
  return <RcaPanel title="RCA Readiness / Prerequisite Check Panel" subtitle="Backend-generated prerequisites from timeline, evidence, team, and blockers."><RcaChecklist items={data?.checks} /></RcaPanel>;
}
