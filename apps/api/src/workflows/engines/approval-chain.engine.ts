import { BadRequestException, Injectable } from '@nestjs/common';

export type RuntimeStep = {
  id: string;
  sequence: number;
  status: string;
  is_required: boolean;
};

@Injectable()
export class ApprovalChainEngine {
  firstSequence(steps: RuntimeStep[]) {
    return this.nextSequence(steps, 0);
  }

  nextSequence(steps: RuntimeStep[], completedSequence: number) {
    const candidates = steps
      .filter((step) => step.is_required && step.status === 'Pending' && step.sequence > completedSequence)
      .sort((a, b) => a.sequence - b.sequence);
    return candidates[0]?.sequence ?? null;
  }

  canCompleteStep(step: RuntimeStep, activeSteps: RuntimeStep[]) {
    if (step.status !== 'Active') throw new BadRequestException('Only active workflow steps can be completed');
    if (!activeSteps.some((active) => active.id === step.id)) throw new BadRequestException('Step is not in the active approval group');
  }

  isSequenceComplete(steps: RuntimeStep[], sequence: number) {
    return steps
      .filter((step) => step.is_required && step.sequence === sequence)
      .every((step) => ['Approved', 'Skipped', 'Overridden'].includes(step.status));
  }

  isWorkflowComplete(steps: RuntimeStep[]) {
    return steps
      .filter((step) => step.is_required)
      .every((step) => ['Approved', 'Skipped', 'Overridden'].includes(step.status));
  }
}
