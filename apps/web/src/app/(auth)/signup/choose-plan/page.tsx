import { Suspense } from 'react';
import { ChoosePlanPage } from '@/features/auth/components/ChoosePlanPage';

export default function ChoosePlanRoute() {
  return (
    <Suspense fallback={<div className="psm-panel rounded-xl p-6">Loading plans...</div>}>
      <ChoosePlanPage />
    </Suspense>
  );
}
