import { LinkedRecordSimplePanel } from './LinkedRecordsPrimitives';
export function RequiredLinksReadinessPanel({ data }: { data: any }) { return <LinkedRecordSimplePanel title="Required Links / Readiness Panel" data={{ ...(data ?? {}), rows: data?.rows ?? [] }} empty="No required-link rules were returned." />; }
