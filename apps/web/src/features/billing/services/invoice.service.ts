import { api } from '@/services/api';
import { unwrap } from './billing.service';
import type { BillingInvoice } from '../types/invoice.types';

export const invoiceService = {
  list: () => api.get('/billing/invoices').then(unwrap<BillingInvoice[]>),
  get: (invoiceId: string) => api.get(`/billing/invoices/${invoiceId}`).then(unwrap<BillingInvoice>),
  download: (invoiceId: string) => api.get(`/billing/invoices/${invoiceId}/download`).then(unwrap<{ url: string; invoice: BillingInvoice }>)
};
