import { Suspense } from 'react';
import { CompleteSignupPage } from '@/features/auth/components/CompleteSignupPage';

export default function CompleteSignupRoute() {
  return (
    <Suspense fallback={<div className="psm-panel rounded-xl p-6">Loading workspace setup...</div>}>
      <CompleteSignupPage />
    </Suspense>
  );
}
