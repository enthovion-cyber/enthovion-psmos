import { get, patch } from './training-api';

export const trainingSettingsService = {
  get: () => get<Record<string, any>>('/training-competency/settings'),
  update: (values: Record<string, any>) => patch<Record<string, any>>('/training-competency/settings', values)
};
