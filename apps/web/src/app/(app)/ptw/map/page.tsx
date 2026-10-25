import { Suspense } from 'react';
import { PTWPermitMapPage } from '@/features/ptw/components/map/PTWPermitMapPage';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function PTWMapPage() {
  return <Suspense fallback={<div className="psm-card p-6">Loading permit map...</div>}><PTWPermitMapPage /></Suspense>;
}
