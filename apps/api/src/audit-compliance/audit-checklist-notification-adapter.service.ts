import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
@Injectable()
export class AuditChecklistNotificationAdapterService {
  constructor(private readonly notifications: NotificationsService) {}
  notify(input: {
    tenantId: string;
    siteId?: string | null;
    checklistId: string;
    code: string;
    title: string;
    message: string;
    userIds: Array<string | null | undefined>;
  }) {
    const ids = [
      ...new Set(input.userIds.filter((id): id is string => Boolean(id))),
    ];
    return Promise.allSettled(
      ids.map((userId) =>
        this.notifications.notifyUser({
          tenantId: input.tenantId,
          userId,
          siteId: input.siteId,
          type: "audit.checklist.review",
          module: "audit",
          title: `${input.code} - ${input.title}`,
          message: input.message,
          relatedRecordId: input.checklistId,
          relatedRecordType: "Audit Checklist",
          relatedUrl: `/audit-compliance/checklists/templates/${input.checklistId}`,
          priority: "Normal",
        }),
      ),
    );
  }
}
