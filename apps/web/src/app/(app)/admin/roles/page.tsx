import { RoleListPage } from '@/features/admin/roles/RoleListPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export default function AdminRolesPage() {
  return (
    <Can permission={['roles.view', 'roles.create', 'roles.edit', 'roles.assign', 'roles.manage', 'permissions.view', 'permissions.edit']} fallback={<PermissionDeniedState message="You do not have permission to view Roles & Permissions." />}>
      <RoleListPage />
    </Can>
  );
}
