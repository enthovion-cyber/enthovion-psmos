import { PsiCard } from '../shared/PsiUi';
import { SafeguardReadinessList } from './SafeguardPrimitives';

export function SafeguardCompletenessPanel({ checks, score }: { checks: Array<Record<string, any>>; score?: number | null | undefined }) {
  return <PsiCard title="Completeness Engine" subtitle="Backend-generated checks for identity, critical owner, hazard/source links, function, response, IPL basis, SOP/procedure, setpoint/safe state, testing, bypass, evidence, review, source status, and conflicts."><SafeguardReadinessList checks={checks} score={score} /></PsiCard>;
}
