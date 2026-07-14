import { RoleDetailPage } from '@/features/admin/roles/RoleDetailPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export default function AdminRoleDetailPage() {
  return (
    <Can permission={['roles.view', 'roles.edit', 'roles.assign', 'roles.manage', 'permissions.view', 'permissions.edit']} fallback={<PermissionDeniedState message="You do not have permission to view this role." />}>
      <RoleDetailPage />
    </Can>
  );
}
