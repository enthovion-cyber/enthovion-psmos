import { ReadinessPanel } from './MaterialCompatibilityPrimitives';

export function CompatibilityCompletenessPanel({ checks, score }: { checks: Array<Record<string, any>>; score?: number | null | undefined }) {
  return <ReadinessPanel title="Compatibility Completeness" checks={checks} score={score} />;
}
