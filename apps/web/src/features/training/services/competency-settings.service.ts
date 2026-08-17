import { get, patch } from './training-api';

const base = '/training-competency/roles-competency-profiles/settings';

export const competencySettingsService = {
  get: () => get<Record<string, any>>(base),
  update: (data: Record<string, unknown>) => patch<Record<string, any>>(base, data)
};
