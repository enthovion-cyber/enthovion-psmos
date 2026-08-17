import { CalibrationResultBadge } from './CalibrationResultBadge';

export function ToleranceResultBadge({ value }: { value?: string | null | undefined }) {
  return <CalibrationResultBadge value={value} />;
}
