import { CreateUserForm } from '@/features/admin/users/CreateUserForm';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export default function NewAdminUserPage() {
  return (
    <Can permission={['users.create', 'users.manage']} fallback={<PermissionDeniedState message="You do not have permission to create users." />}>
      <CreateUserForm />
    </Can>
  );
}
