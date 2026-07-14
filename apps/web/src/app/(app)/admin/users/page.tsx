import { UserListPage } from '@/features/admin/users/UserListPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export default function AdminUsersPage() {
  return (
    <Can permission={['users.view', 'users.create', 'users.edit', 'users.manage', 'users.invite', 'users.bulk_upload', 'users.export']} fallback={<PermissionDeniedState message="You do not have permission to view User Management." />}>
      <UserListPage />
    </Can>
  );
}
