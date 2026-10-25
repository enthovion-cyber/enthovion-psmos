import { RegulatoryRegisterPage } from '@/features/regulatory/RegulatoryRegisterPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ areaId: string }> }) {
  const params = await props.params;
  return <RegulatoryRegisterPage view={`areas/${params.areaId}`} />;
}
