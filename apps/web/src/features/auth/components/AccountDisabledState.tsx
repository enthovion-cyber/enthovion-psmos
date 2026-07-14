'use client';

import { AuthErrorState } from './AuthErrorState';

export function AccountDisabledState() {
  return <AuthErrorState title="Account disabled" message="Your account is disabled or suspended. Contact your company admin for help." />;
}
