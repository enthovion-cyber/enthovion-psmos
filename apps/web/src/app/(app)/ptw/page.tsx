import { Suspense } from 'react';
import { PTWDashboard } from '@/features/ptw/components/PTWDashboard';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function PTWPage() {
  return <Suspense fallback={<div className="psm-card p-6">Loading PTW dashboard...</div>}><PTWDashboard /></Suspense>;
}
