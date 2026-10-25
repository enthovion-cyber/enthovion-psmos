import { Suspense } from 'react';
import { ChoosePlanPage } from '@/features/auth/components/ChoosePlanPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function ChoosePlanRoute() {
  return (
    <Suspense fallback={<div className="psm-panel rounded-xl p-6">Loading plans...</div>}>
      <ChoosePlanPage />
    </Suspense>
  );
}
