import { CreateUserForm } from '@/features/admin/users/CreateUserForm';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function NewAdminUserPage() {
  return (
    <Can permission={['users.create', 'users.manage']} fallback={<PermissionDeniedState message="You do not have permission to create users." />}>
      <CreateUserForm />
    </Can>
  );
}
