import { Injectable } from "@nestjs/common";
@Injectable()
export class AuditChecklistReviewApprovalAdapterService {
  requestPayload(c: Record<string, any>) {
    return {
      module: "AUDIT_CHECKLIST",
      recordId: c.id,
      title: `Review ${c.checklist_code}`,
      reviewerUserId: c.reviewer_user_id,
      status: "Pending Review",
    };
  }
}
