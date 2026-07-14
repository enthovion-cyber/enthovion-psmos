import { Suspense } from 'react';
import { VerifyEmailPage } from '@/features/auth/components/VerifyEmailPage';

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={<div className="psm-panel rounded-xl p-6">Loading verification...</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
