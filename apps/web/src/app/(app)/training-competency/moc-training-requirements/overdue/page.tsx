import { MocTrainingAssignmentRegisterPage } from '@/features/training/moc/MocTrainingAssignmentRegisterPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
  return <MocTrainingAssignmentRegisterPage title="Overdue MOC Training" filters={{ statusView: 'overdue' }} />;
}
