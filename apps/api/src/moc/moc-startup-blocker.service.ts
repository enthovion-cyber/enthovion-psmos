import { Injectable } from '@nestjs/common';

@Injectable()
export class MocStartupBlockerService {
  list(moc: any) {
    const actions = (moc.actions ?? []).filter((item: any) => item.required !== false && item.required_before_startup && !['Completed', 'Closed'].includes(item.status));
    const training = (moc.training ?? []).filter((item: any) => item.required_before_startup && item.status !== 'Completed');
    const pssr = moc.pssr?.required && !['Completed', 'Ready'].includes(moc.pssr.status) ? [{ type: 'PSSR', title: 'PSSR required before startup', status: moc.pssr.status ?? 'Required', priority: 'SAFETY_CRITICAL' }] : [];
    return [
      ...actions.map((item: any) => ({ type: 'Action', title: item.title, status: item.status, priority: item.priority, actionId: item.action_id ?? item.id })),
      ...training.map((item: any) => ({ type: 'Training', title: `${item.role_name}: ${item.training_topic}`, status: item.status, priority: 'HIGH' })),
      ...pssr
    ];
  }
}
