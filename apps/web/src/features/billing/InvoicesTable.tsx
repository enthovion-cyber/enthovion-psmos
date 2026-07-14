'use client';

import { useInvoices } from './hooks/useInvoices';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';

export function InvoicesTable() {
  const query = useInvoices();
  if (query.isLoading) return <div className="psm-panel rounded-xl p-6">Loading invoices...</div>;
  const invoices = query.data ?? [];
  if (!invoices.length) return <div className="psm-panel rounded-xl p-6 text-sm text-[var(--psm-muted)]">No invoices are available for this company.</div>;
  return <div className="psm-panel overflow-hidden rounded-xl"><table className="w-full text-sm"><thead className="bg-[var(--psm-surface-2)] text-left"><tr><th className="p-3">Invoice</th><th className="p-3">Period</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-t border-[var(--psm-line)]"><td className="p-3">{invoice.invoice_number ?? invoice.provider_invoice_id ?? invoice.id}</td><td className="p-3">{invoice.period_start ? new Date(invoice.period_start).toLocaleDateString() : 'N/A'} - {invoice.period_end ? new Date(invoice.period_end).toLocaleDateString() : 'N/A'}</td><td className="p-3">{invoice.currency} {(invoice.amount_due_cents / 100).toLocaleString()}</td><td className="p-3 capitalize">{invoice.status}</td><td className="p-3"><InvoiceDownloadButton invoiceId={invoice.id} disabled={!invoice.invoice_pdf_url && !invoice.hosted_invoice_url} /></td></tr>)}</tbody></table></div>;
}
