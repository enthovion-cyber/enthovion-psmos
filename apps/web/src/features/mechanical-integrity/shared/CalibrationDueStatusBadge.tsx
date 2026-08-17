import { PmDueStatusBadge } from './PmDueStatusBadge';

export function CalibrationDueStatusBadge({ value }: { value?: string | null | undefined }) {
  return <PmDueStatusBadge value={value} />;
}
