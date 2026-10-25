import{AuditQuestionBankFormPage}from'@/features/audit/checklists/question-bank/AuditQuestionBankFormPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props:{params: Promise<{questionId:string}>}) {
  const params = await props.params;
  return<AuditQuestionBankFormPage id={params.questionId}/>
}
