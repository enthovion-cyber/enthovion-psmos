'use client';

import { QrCode } from 'lucide-react';
import { PSSRCard } from '../pssr-ui';

export function TagIdentificationVerification({ onScan }: { onScan: () => void }) {
  return (
    <PSSRCard title="Tag / Identification Verification">
      <div className="rounded-xl border border-purple-300/15 bg-purple-500/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="font-black text-purple-50">Manual tag confirmation and QR comparison</p><p className="mt-1 text-sm text-purple-100/75">Compare scanned or entered equipment identity with expected PSSR equipment. Mismatch creates a critical blocker.</p></div>
          <button onClick={onScan} className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-black text-white"><QrCode size={16} /> Scan / Enter Tag</button>
        </div>
      </div>
    </PSSRCard>
  );
}
