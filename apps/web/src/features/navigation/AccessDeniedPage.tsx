import { PermissionDeniedState } from '@/features/auth/components/PermissionDeniedState';

export function AccessDeniedPage({ message }: { message?: string }) {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <PermissionDeniedState message={message ?? 'Your account does not have access to this company, site, or module.'} />
    </main>
  );
}
