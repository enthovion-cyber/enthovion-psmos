'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export function SignatureUploadInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Select a PNG, JPG, or WebP signature image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Signature image must be smaller than 2 MB.');
      return;
    }
    try {
      onChange(await resizeSignatureImage(file));
    } catch {
      setError('Unable to process signature image.');
    }
  }

  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Upload signature image</div>
          <div className="text-xs text-[var(--psm-muted)]">Transparent PNG is preferred. The preview is saved with your signature profile.</div>
        </div>
        <button type="button" className="psm-button psm-button-secondary" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Upload Image
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); event.currentTarget.value = ''; }} />
      <input className="psm-input mt-4 w-full px-3 text-sm" placeholder="Or paste a secure image URL / storage key" value={value} onChange={(event) => onChange(event.target.value)} />
      {value ? <img src={value} alt="Uploaded signature preview" className="mt-3 max-h-24 max-w-full rounded-md border border-[var(--psm-line)] bg-white object-contain p-3" /> : null}
      {error ? <div className="mt-2 text-xs text-danger">{error}</div> : null}
    </div>
  );
}

function resizeSignatureImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to load image'));
      image.onload = () => {
        const maxWidth = 900;
        const maxHeight = 320;
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
