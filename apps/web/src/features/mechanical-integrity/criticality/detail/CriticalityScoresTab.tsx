import { ConsequenceScoringSection } from '../assessment/sections/ConsequenceScoringSection';
import { LikelihoodScoringSection } from '../assessment/sections/LikelihoodScoringSection';
import type { CriticalityAssessmentDetail } from '../../types/criticality.types';

export function CriticalityScoresTab({ detail }: { detail: CriticalityAssessmentDetail }) {
  return <div className="grid gap-4 lg:grid-cols-2"><ConsequenceScoringSection scores={detail.consequenceScores} /><LikelihoodScoringSection scores={detail.likelihoodScores} /></div>;
}
