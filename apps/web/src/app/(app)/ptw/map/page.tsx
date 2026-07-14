import { Suspense } from 'react';
import { PTWPermitMapPage } from '@/features/ptw/components/map/PTWPermitMapPage';

export default function PTWMapPage() {
  return <Suspense fallback={<div className="psm-card p-6">Loading permit map...</div>}><PTWPermitMapPage /></Suspense>;
}
