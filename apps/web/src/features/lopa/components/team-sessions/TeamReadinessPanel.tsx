import { ReadinessCard } from './TeamSessionsUi';

export function TeamReadinessPanel({ readiness }: any) {
  return <ReadinessCard title="Team Readiness / Review Preparation" readiness={readiness} />;
}
