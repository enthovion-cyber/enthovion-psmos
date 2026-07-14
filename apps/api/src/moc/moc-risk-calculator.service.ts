import { Injectable } from '@nestjs/common';

export type MocRiskInput = {
  safetyScore?: number;
  environmentalScore?: number;
  productionScore?: number;
  safetyImpact?: number;
  environmentalImpact?: number;
  productionImpact?: number;
  beforeScore?: number | null;
};

export type MocRiskCalculation = {
  safetyScore: number;
  environmentalScore: number;
  productionScore: number;
  safetyLabel: string;
  environmentalLabel: string;
  productionLabel: string;
  totalScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  beforeScore: number | null;
  beforeLevel: string | null;
  afterScore: number;
  afterLevel: string;
};

const labels = ['None', 'Minor', 'Significant', 'Major'];

@Injectable()
export class MocRiskCalculatorService {
  calculate(input: MocRiskInput): MocRiskCalculation {
    const safetyScore = this.score(input.safetyScore ?? input.safetyImpact);
    const environmentalScore = this.score(input.environmentalScore ?? input.environmentalImpact);
    const productionScore = this.score(input.productionScore ?? input.productionImpact);
    const totalScore = safetyScore + environmentalScore + productionScore;
    const riskLevel = this.level(totalScore);
    const beforeScore = input.beforeScore === undefined || input.beforeScore === null ? null : this.score(input.beforeScore, 9);
    return {
      safetyScore,
      environmentalScore,
      productionScore,
      safetyLabel: labels[safetyScore] ?? 'None',
      environmentalLabel: labels[environmentalScore] ?? 'None',
      productionLabel: labels[productionScore] ?? 'None',
      totalScore,
      riskLevel,
      beforeScore,
      beforeLevel: beforeScore === null ? null : this.level(beforeScore),
      afterScore: totalScore,
      afterLevel: riskLevel
    };
  }

  level(score: number): MocRiskCalculation['riskLevel'] {
    if (score >= 8) return 'Critical';
    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  }

  private score(value: unknown, max = 3) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(max, Math.round(number)));
  }
}
