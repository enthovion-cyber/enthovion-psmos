import { Suspense } from 'react';
import { PTWDashboard } from '@/features/ptw/components/PTWDashboard';

export default function PTWPage() {
  return <Suspense fallback={<div className="psm-card p-6">Loading PTW dashboard...</div>}><PTWDashboard /></Suspense>;
}
