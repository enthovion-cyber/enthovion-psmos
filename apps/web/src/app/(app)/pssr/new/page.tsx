import { Suspense } from 'react';
import { PSSRCreateWizard } from '@/features/pssr/components/create/PSSRCreateWizard';

export default function NewPSSRPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#020b16] p-5 text-white">Loading PSSR wizard...</main>}>
      <PSSRCreateWizard />
    </Suspense>
  );
}
