import { Suspense } from 'react';
import { CompleteSignupPage } from '@/features/auth/components/CompleteSignupPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function CompleteSignupRoute() {
  return (
    <Suspense fallback={<div className="psm-panel rounded-xl p-6">Loading workspace setup...</div>}>
      <CompleteSignupPage />
    </Suspense>
  );
}
