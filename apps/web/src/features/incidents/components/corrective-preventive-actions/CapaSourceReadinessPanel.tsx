import { CapaSimplePanel } from './CapaPanelPrimitives';
export function CapaSourceReadinessPanel({ data }: { data: any }) { return <CapaSimplePanel title="CAPA Source / Readiness Panel" data={{ ...(data ?? {}), rows: data?.missingSources ?? data?.checklist ?? [] }} empty="No missing CAPA sources." />; }
