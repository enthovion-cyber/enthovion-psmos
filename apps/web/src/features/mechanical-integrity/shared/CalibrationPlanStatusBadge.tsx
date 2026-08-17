import { PmPlanStatusBadge } from './PmPlanStatusBadge';

export function CalibrationPlanStatusBadge({ value }: { value?: string | null | undefined }) {
  return <PmPlanStatusBadge value={value} />;
}
