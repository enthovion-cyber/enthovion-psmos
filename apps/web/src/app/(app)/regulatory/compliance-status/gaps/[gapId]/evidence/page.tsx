import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ComplianceGapEvidencePage(props: { params: Promise<{ gapId: string }> }) {
  const params = await props.params;
  return <RegulatoryEvidenceRegisterPage initialFilters={{ complianceGapId: params.gapId }} />;
}
