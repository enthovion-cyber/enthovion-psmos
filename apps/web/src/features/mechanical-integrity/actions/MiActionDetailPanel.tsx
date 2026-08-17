'use client';

import type { MiWorkOrderRow } from '../types/work-order.types';
import { KeyValueGrid, SectionCard } from '../safeguards/SafeguardUiPrimitives';

export function MiActionDetailPanel({ action }: { action: MiWorkOrderRow }) {
  return <SectionCard title="MI Action Detail"><KeyValueGrid items={[['Title', action.title], ['Status', action.status], ['Priority', action.priority], ['Equipment', action.equipment_id], ['Assigned to', action.assigned_user_id], ['Due date', action.due_date]]} /></SectionCard>;
}
