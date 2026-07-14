'use client';

import { QRCodeSVG } from 'qrcode.react';

export function QRCodeDisplay({ value }: { value: string }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-white p-3 text-center text-[#06111f] shadow-sm">
      <QRCodeSVG value={value} size={108} />
      <div className="mt-2 text-xs font-semibold">Scan QR for Asset Info</div>
    </div>
  );
}
