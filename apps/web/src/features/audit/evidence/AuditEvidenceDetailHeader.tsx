import { AuditHeader } from "../AuditHeader";

export function AuditEvidenceDetailHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <AuditHeader title={title} {...(subtitle ? { subtitle } : {})} actionHref="/audit-compliance/evidence/register" />;
}
