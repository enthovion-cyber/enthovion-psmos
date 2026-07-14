import { AuthErrorState } from '@/features/auth/components/AuthErrorState';

export default function Page() {
  return <AuthErrorState title="Access denied" message="Your account does not have permission to open this workspace, site, or module." />;
}
