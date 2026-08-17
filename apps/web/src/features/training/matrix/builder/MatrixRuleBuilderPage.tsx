import { MatrixRuleFormPage } from '../MatrixRuleFormPage';
import { BlockingSafetyImpactStep } from './BlockingSafetyImpactStep';
import { EvidenceVerificationStep } from './EvidenceVerificationStep';
import { ReviewActivateStep } from './ReviewActivateStep';
import { TrainingRequirementStep } from './TrainingRequirementStep';
import { WhenRequiredStep } from './WhenRequiredStep';
import { WhereItAppliesStep } from './WhereItAppliesStep';
import { WhoItAppliesToStep } from './WhoItAppliesToStep';

export function MatrixRuleBuilderPage() {
  return <div className="space-y-4"><TrainingRequirementStep /><WhoItAppliesToStep /><WhereItAppliesStep /><WhenRequiredStep /><EvidenceVerificationStep /><BlockingSafetyImpactStep /><ReviewActivateStep /><MatrixRuleFormPage /></div>;
}
