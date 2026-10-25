import{AuditChecklistTemplateLibraryPage}from'@/features/audit/checklists/AuditChecklistTemplateLibraryPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props:{params: Promise<{programId:string}>}) {
  const params = await props.params;
  return<AuditChecklistTemplateLibraryPage fixed={{programId:params.programId}}/>
}
