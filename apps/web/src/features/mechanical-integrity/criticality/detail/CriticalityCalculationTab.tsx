import { RiskCalculationPreviewSection } from '../assessment/sections/RiskCalculationPreviewSection';
import type { CriticalityAssessmentDetail } from '../../types/criticality.types';

export function CriticalityCalculationTab({ detail }: { detail: CriticalityAssessmentDetail }) {
  return <RiskCalculationPreviewSection calculation={detail.calculation} />;
}
