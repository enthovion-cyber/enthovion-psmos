import { KeyValueGrid, SectionCard } from './SafeguardUiPrimitives';

export function SafeguardHealthPanel({ health }: { health?: Record<string, any> }) {
  return (
    <SectionCard title="Safeguard Health" description="Backend-generated lifecycle health across SIFs, interlocks, critical alarms, testing, bypasses, and readiness.">
      <KeyValueGrid items={[
        ['Healthy safeguards', health?.healthy],
        ['Degraded safeguards', health?.degraded],
        ['Needs review', health?.needsReview],
        ['Missing LOPA/SIL basis', health?.missingLopaSil],
        ['Missing proof-test requirement', health?.missingTestRequirement],
        ['Startup blocked', health?.startupBlocked]
      ]} />
    </SectionCard>
  );
}
