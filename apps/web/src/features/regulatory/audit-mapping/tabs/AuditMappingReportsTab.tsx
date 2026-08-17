import { AuditMappingJsonPanel } from '../AuditMappingUi';

export function AuditMappingReportsTab({ detail }: { detail: any }) { return <AuditMappingJsonPanel title="Report / Export Inputs" value={detail?.reports ?? { mapping: detail?.mapping, coverage: detail?.coverage?.summary, gaps: detail?.gaps?.summary }} />; }
