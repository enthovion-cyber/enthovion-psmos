import { UserProfileAdminPage } from '@/features/admin/users/UserProfileAdminPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  return (
    <Can permission={['users.view', 'users.edit', 'users.manage']} fallback={<PermissionDeniedState message="You do not have permission to view this user profile." />}>
      <UserProfileAdminPage userId={params.id} />
    </Can>
  );
}
