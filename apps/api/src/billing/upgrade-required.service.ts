import { Injectable } from '@nestjs/common';

@Injectable()
export class UpgradeRequiredService {
  module(moduleKey: string, reason?: string) {
    return { upgradeRequired: true, moduleKey, reason: reason ?? 'Your current company plan does not include this module.' };
  }

  limit(limitKey: string, reason?: string) {
    return { upgradeRequired: true, limitKey, reason: reason ?? 'Your current company plan limit has been reached.' };
  }
}
