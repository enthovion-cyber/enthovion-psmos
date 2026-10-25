import { RegulatoryAuditMappingFormPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ obligationId: string }> }) {
  const params = await props.params;
  return <RegulatoryAuditMappingFormPage initialValues={{ regulatorySourceType: 'Regulatory Obligation', obligationId: params.obligationId }} />;
}
