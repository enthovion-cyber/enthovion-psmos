import { BadRequestException, Injectable } from '@nestjs/common';
import type { MocRiskCalculation } from './moc-risk-calculator.service';

@Injectable()
export class MocRiskValidationService {
  validateForSave(dto: Record<string, any>, calculation: MocRiskCalculation) {
    return this.validate(dto, calculation, false);
  }

  validateForComplete(dto: Record<string, any>, calculation: MocRiskCalculation) {
    const result = this.validate(dto, calculation, true);
    if (!result.canComplete) throw new BadRequestException(result.errors.join(' '));
    return result;
  }

  private validate(dto: Record<string, any>, calculation: MocRiskCalculation, completing: boolean) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requireText = (field: string, label: string) => {
      if (!String(dto[field] ?? '').trim()) errors.push(`${label} is required.`);
    };
    const warnText = (field: string, label: string) => {
      if (!String(dto[field] ?? '').trim()) warnings.push(`${label} is recommended.`);
    };

    if (calculation.safetyScore > 0) requireText('safetyRationale', 'Safety rationale');
    if (calculation.environmentalScore > 0) requireText('environmentalRationale', 'Environmental rationale');
    if (calculation.productionScore > 0) requireText('productionRationale', 'Production rationale');
    if (calculation.safetyScore >= 2) requireText('safetyConsequence', 'Safety consequence');
    if (calculation.environmentalScore >= 2) requireText('emissionsImpact', 'Environmental consequence/emissions impact');
    if (calculation.productionScore >= 2) requireText('downtimeImpact', 'Production consequence/downtime impact');
    if (calculation.totalScore >= 3) requireText('overallRationale', 'Overall risk rationale');
    if (['High', 'Critical'].includes(calculation.riskLevel) && !String(dto.additionalSafeguards ?? '').trim() && !String(dto.additionalSafeguardsJustification ?? '').trim()) {
      errors.push('High/Critical risk requires additional safeguards or a written safeguards justification.');
    }
    if (calculation.riskLevel === 'Critical') {
      requireText('managementJustification', 'Critical risk management justification');
      requireText('riskAcceptanceStatement', 'Critical risk acceptance statement');
    } else if (completing && calculation.totalScore > 0) {
      requireText('riskAcceptanceStatement', 'Risk acceptance statement');
    } else {
      warnText('riskAcceptanceStatement', 'Risk acceptance statement');
    }

    return { errors, warnings, canSave: errors.length === 0 || !completing, canComplete: errors.length === 0 };
  }
}
