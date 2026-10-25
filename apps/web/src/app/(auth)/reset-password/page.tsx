import { Suspense } from 'react';
import { ResetPasswordPage } from '@/features/auth/components/ResetPasswordPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<div className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">Loading reset form...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
