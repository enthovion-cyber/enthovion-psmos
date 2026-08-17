import { safeOperatingLimitService } from './safe-operating-limit.service';

export const limitConflictService = {
  run: safeOperatingLimitService.runConflictCheck,
  override: safeOperatingLimitService.overrideConflict
};
