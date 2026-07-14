import { LinkedRecordSimplePanel } from './LinkedRecordsPrimitives';
export function ModuleBasedLinkedRecordsPanel({ rows }: { rows: any[] }) { return <LinkedRecordSimplePanel title="Module-Based Linked Records Panels" data={{ rows: rows ?? [] }} empty="No module-linked records are available." />; }
