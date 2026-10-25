import { MocTrainingWorkerPage } from '@/features/training/moc/MocTrainingWorkerPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(props: { params: Promise<{ workerId: string }> }) {
  const params = await props.params;
  return <MocTrainingWorkerPage workerId={params.workerId} view="requirements" />;
}
