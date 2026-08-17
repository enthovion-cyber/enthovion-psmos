import type { MiWorkOrderRow } from './work-order.types';

export type MiActionRow = MiWorkOrderRow & {
  action_type?: string | null;
};
