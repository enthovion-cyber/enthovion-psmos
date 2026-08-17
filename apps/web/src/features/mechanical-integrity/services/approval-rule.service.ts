import { reviewApprovalService } from './review-approval.service';

export const approvalRuleService = {
  list: reviewApprovalService.rules,
  create: reviewApprovalService.createRule,
  update: reviewApprovalService.updateRule,
  archive: reviewApprovalService.archiveRule
};
