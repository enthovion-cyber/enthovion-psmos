import { UserProfileAdminPage } from '@/features/admin/users/UserProfileAdminPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AdminUserDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <Can permission={['users.view', 'users.edit', 'users.manage']} fallback={<PermissionDeniedState message="You do not have permission to view this user profile." />}>
      <UserProfileAdminPage userId={params.id} />
    </Can>
  );
}
