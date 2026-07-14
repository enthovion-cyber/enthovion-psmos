'use client';

import { AuthErrorState } from './AuthErrorState';

export function SessionExpiredState() {
  return <AuthErrorState title="Session expired" message="Your access changed or your session expired. Please sign in again." />;
}
