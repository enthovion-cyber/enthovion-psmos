import { criticalAlarmService } from './critical-alarm.service';
import { interlockService } from './interlock.service';
import { safeguardTestService } from './safeguard-test.service';
import { sifService } from './sif.service';

export const safeguardExportService = {
  sifs: sifService.exportRows,
  interlocks: interlockService.exportRows,
  criticalAlarms: criticalAlarmService.exportRows,
  safeguardTests: safeguardTestService.exportRows
};
