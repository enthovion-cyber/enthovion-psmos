import { BulkUserUploadPage as BulkUserUploadFeaturePage } from '@/features/admin/users/bulk/BulkUserUploadPage';
import { Can } from '@/features/auth/components/Can';
import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export default function BulkUserUploadPage() {
  return (
    <Can permission={['users.bulk_upload', 'users.manage']} fallback={<PermissionDeniedState message="You do not have permission to bulk upload users." />}>
      <BulkUserUploadFeaturePage />
    </Can>
  );
}
