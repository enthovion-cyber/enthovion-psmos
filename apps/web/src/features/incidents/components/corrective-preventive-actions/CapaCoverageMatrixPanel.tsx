import { CapaSimplePanel } from './CapaPanelPrimitives';
export function CapaCoverageMatrixPanel({ data }: { data: any }) { return <CapaSimplePanel title="CAPA Coverage Matrix Panel" data={{ ...(data ?? {}), rows: data?.rows ?? [] }} empty="No RCA/barrier/immediate-action sources require CAPA coverage." />; }
