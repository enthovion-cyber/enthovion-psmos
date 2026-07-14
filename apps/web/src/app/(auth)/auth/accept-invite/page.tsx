import { Suspense } from 'react';
import { AcceptInvitePage } from '@/features/auth/components/AcceptInvitePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">Loading invitation...</div>}>
      <AcceptInvitePage />
    </Suspense>
  );
}
