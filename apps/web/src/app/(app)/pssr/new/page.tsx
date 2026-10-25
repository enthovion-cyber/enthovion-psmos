import { Suspense } from 'react';
import { PSSRCreateWizard } from '@/features/pssr/components/create/PSSRCreateWizard';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function NewPSSRPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#020b16] p-5 text-white">Loading PSSR wizard...</main>}>
      <PSSRCreateWizard />
    </Suspense>
  );
}
