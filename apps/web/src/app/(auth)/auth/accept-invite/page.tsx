import { Suspense } from 'react';
import { AcceptInvitePage } from '@/features/auth/components/AcceptInvitePage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<div className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">Loading invitation...</div>}>
      <AcceptInvitePage />
    </Suspense>
  );
}
