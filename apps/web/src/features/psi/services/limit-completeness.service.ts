import { safeOperatingLimitService } from './safe-operating-limit.service';

export const limitCompletenessService = {
  run: safeOperatingLimitService.runCompleteness
};
