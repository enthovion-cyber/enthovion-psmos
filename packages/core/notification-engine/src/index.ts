export type NotificationChannel = 'in_app' | 'email' | 'sms';
export type NotificationPriority = 'Info' | 'Normal' | 'High' | 'Safety-Critical';

export function routeNotification(preferences: NotificationChannel[], priority: NotificationPriority = 'Normal'): NotificationChannel[] {
  const channels = new Set<NotificationChannel>(['in_app', ...preferences]);
  if (priority === 'Safety-Critical') channels.add('sms');
  return [...channels];
}

export function isHighPriority(priority: NotificationPriority) {
  return priority === 'High' || priority === 'Safety-Critical';
}
