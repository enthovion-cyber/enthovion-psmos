import { AuditMappingLinksSection } from '../sections/AuditMappingLinksSection';

export function AuditMappingAuditLinksTab({ detail }: { detail: any }) { return <AuditMappingLinksSection links={detail?.links} />; }
