'use client';
import { TrainingCard } from '../shared/TrainingUi';
import { PtwStatusBadge, value } from './shared';
import type { PtwAuthorizationList } from '../types/ptw-authorization.types';
export function PtwAuthorizationRuleMobileCards({ data }: { data?: PtwAuthorizationList }) {
  return <div className="grid gap-3 md:hidden">{(data?.rows ?? []).map((row) => <TrainingCard key={row.id} title={String(value(row, 'rule_title'))}><div className="space-y-2 text-sm"><p>{value(row, 'rule_code')}</p><p>{value(row, 'ptw_role')}</p><PtwStatusBadge status={row.rule_status} /></div></TrainingCard>)}</div>;
}
