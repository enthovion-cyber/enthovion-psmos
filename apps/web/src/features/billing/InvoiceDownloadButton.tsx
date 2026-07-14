'use client';

import { invoiceService } from './services/invoice.service';

export function InvoiceDownloadButton({ invoiceId, disabled }: { invoiceId: string; disabled?: boolean }) {
  async function download() {
    const result = await invoiceService.download(invoiceId);
    window.open(result.url, '_blank', 'noopener,noreferrer');
  }
  return <button className="psm-button" disabled={disabled} title={disabled ? 'Invoice download is unavailable.' : 'Download invoice'} onClick={() => void download()}>Download</button>;
}
