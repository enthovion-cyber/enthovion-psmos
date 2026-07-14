import { Injectable } from '@nestjs/common';

@Injectable()
export class PssrStartupBlockerService {
  preview(input: { moc?: any; actions?: any[]; checklist?: any[] }) {
    const blockers = [];
    const moc = input.moc;
    if (moc?.risk_level === 'Critical') blockers.push(this.blocker('Critical MOC startup authorization', 'MOC', moc.id, 'Critical', 'Plant Manager and HSE authorization required before startup.'));
    for (const action of input.actions ?? []) {
      if (action.required_before_startup && !['Completed', 'Closed', 'Verified', 'Waived'].includes(action.status)) {
        blockers.push(this.blocker(action.title ?? 'Required MOC action open', 'MOC Action', action.id, action.priority ?? 'High', action.description));
      }
    }
    for (const item of input.checklist ?? []) {
      if (item.requiredBeforeStartup && item.required) blockers.push(this.blocker(item.title, 'PSSR Checklist', undefined, item.evidenceRequired ? 'High' : 'Medium', `${item.groupName} must be complete before startup.`));
    }
    return blockers;
  }

  private blocker(title: string, sourceModule: string, sourceRecordId: string | undefined, severity: string, description?: string) {
    return { blockerTitle: title, sourceModule, sourceRecordId, severity, blocking: true, status: 'Open', blockerDescription: description, requiredBeforeStartup: true };
  }
}
