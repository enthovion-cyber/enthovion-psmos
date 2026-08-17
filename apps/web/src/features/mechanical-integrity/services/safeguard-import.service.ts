import { criticalAlarmService } from './critical-alarm.service';
import { interlockService } from './interlock.service';
import { safeguardTestService } from './safeguard-test.service';
import { sifService } from './sif.service';

export const safeguardImportService = {
  sif: sifService.importRows,
  interlock: interlockService.importRows,
  criticalAlarm: criticalAlarmService.importRows,
  safeguardTest: safeguardTestService.importRows
};
