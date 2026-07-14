import { Injectable } from '@nestjs/common';
import { ApprovalChainEngine, RuntimeStep } from './approval-chain.engine';

@Injectable()
export class WorkflowRuntimeEngine {
  constructor(private readonly approvalChain: ApprovalChainEngine) {}

  nextActivationPatch(steps: RuntimeStep[], completedSequence = 0) {
    const nextSequence = this.approvalChain.nextSequence(steps, completedSequence);
    if (!nextSequence) return { nextSequence: null, complete: true };
    return { nextSequence, complete: false };
  }
}
