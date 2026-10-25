import { ExecutivePsmDetailPage } from '@/features/executive/psm-elements/ExecutivePsmElementPages';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props:{params: Promise<{elementId:string;view?:string[]}>}) {
  const params = await props.params;
  return <ExecutivePsmDetailPage id={params.elementId} view={params.view?.[0]??'overview'}/>
}
