import { RiskBadge } from "../shared/HazopBadges";

export function HazopScenarioRiskBadge({ value }: { value: string | undefined }) {
  return <RiskBadge value={value ?? "-"} />;
}
