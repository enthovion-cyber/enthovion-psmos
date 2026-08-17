import { reliefDeviceService } from './relief-device.service';

export const reliefSchedulerService = {
  run: reliefDeviceService.runScheduler
};
