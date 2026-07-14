import { Suspense } from 'react';
import { ResetPasswordPage } from '@/features/auth/components/ResetPasswordPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">Loading reset form...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
