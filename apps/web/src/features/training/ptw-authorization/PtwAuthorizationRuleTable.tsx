'use client';
import { PtwAuthorizationTable, ruleColumns } from './shared';
import type { PtwAuthorizationList } from '../types/ptw-authorization.types';
export function PtwAuthorizationRuleTable({ data }: { data?: PtwAuthorizationList | undefined }) {
  return <PtwAuthorizationTable title="Authorization Rule Registry" subtitle="Role, permit type, scope, evidence, approval, expiry and enforcement rules." data={data} columns={ruleColumns} />;
}
