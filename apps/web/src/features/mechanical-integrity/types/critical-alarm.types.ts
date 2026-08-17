import type { MiSafeguardDetailResponse, MiSafeguardRegistryResponse, MiSafeguardRow } from './safeguard-common.types';

export type CriticalAlarm = MiSafeguardRow & {
  alarmTag?: string;
  alarm_tag?: string;
  alarmName?: string;
  alarm_name?: string;
  alarmPriority?: string;
  alarm_priority?: string;
};

export type CriticalAlarmRegistryResponse = MiSafeguardRegistryResponse<CriticalAlarm>;
export type CriticalAlarmDetailResponse = MiSafeguardDetailResponse<CriticalAlarm>;
