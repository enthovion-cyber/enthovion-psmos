import { UserListPage } from '@/features/admin/users/UserListPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function AdminUsersPage() {
  return (
    <Can permission={['users.view', 'users.create', 'users.edit', 'users.manage', 'users.invite', 'users.bulk_upload', 'users.export']} fallback={<PermissionDeniedState message="You do not have permission to view User Management." />}>
      <UserListPage />
    </Can>
  );
}
