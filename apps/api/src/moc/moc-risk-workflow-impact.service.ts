import { Injectable } from '@nestjs/common';

@Injectable()
export class MocRiskWorkflowImpactService {
  build(riskLevel: string, totalScore: number) {
    const baseApprovers = ['Originator', 'Process Engineering', 'Operations Supervisor', 'HSE Manager', 'Plant Manager'];
    const addedApprovers = riskLevel === 'High' ? ['HSE Director', 'VP Operations'] : riskLevel === 'Critical' ? ['HSE Director', 'VP Operations', 'HAZOP Review Chair', 'Plant Manager Critical Alert'] : [];
    return {
      riskLevel,
      totalScore,
      approvalPath: [...baseApprovers, ...addedApprovers],
      routeType: riskLevel === 'Critical' ? 'Critical MOC Workflow' : riskLevel === 'High' ? 'High Risk MOC Workflow' : 'Standard MOC Workflow',
      requiresManagementEscalation: ['High', 'Critical'].includes(riskLevel),
      requiresCriticalAlert: riskLevel === 'Critical',
      blocksClosureUntilReviewsComplete: ['High', 'Critical'].includes(riskLevel),
      notes: riskLevel === 'Critical'
        ? 'Critical risk forces HAZOP review, PSSR readiness validation, management justification, and Plant Manager alert.'
        : riskLevel === 'High'
          ? 'High risk adds HSE Director and VP Operations approval before implementation.'
          : 'Low and Medium risk follow the standard MOC approval path.'
    };
  }
}
