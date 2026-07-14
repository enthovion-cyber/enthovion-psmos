'use client';

import { useRef, useState } from 'react';
import { QrCode, X } from 'lucide-react';

export function QRScanner({ onScan }: { onScan: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function start() {
    setOpen(true);
    if (!('mediaDevices' in navigator)) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Manual entry remains available when camera permissions are blocked.
    }
  }

  function close() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={start} className="psm-button psm-button-secondary"><QrCode size={16} /> Scan QR</button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Scan Equipment QR</h2><button onClick={close} className="psm-button psm-button-ghost min-h-8 px-2"><X size={16} /></button></div>
            <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-lg bg-black" />
            <div className="mt-3 flex gap-2">
              <input className="psm-input h-10 flex-1 px-3" placeholder="Equipment ID or QR payload" value={manual} onChange={(event) => setManual(event.target.value)} />
              <button className="psm-button psm-button-primary" onClick={() => { onScan(manual); close(); }}>Use</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
