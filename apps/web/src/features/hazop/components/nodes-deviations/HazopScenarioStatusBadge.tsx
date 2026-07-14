import { HazopStatusBadge } from "../shared/HazopBadges";

export function HazopScenarioStatusBadge({ value }: { value: string | undefined }) {
  return <HazopStatusBadge value={value ?? "Draft"} />;
}
