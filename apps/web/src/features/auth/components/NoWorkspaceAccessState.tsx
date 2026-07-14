'use client';

import { AuthErrorState } from './AuthErrorState';

export function NoWorkspaceAccessState() {
  return <AuthErrorState title="No workspace access" message="No workspace was found for this account. Ask your company admin to invite you." />;
}
