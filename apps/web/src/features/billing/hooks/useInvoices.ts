'use client';

import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../services/invoice.service';

export function useInvoices() {
  return useQuery({ queryKey: ['billing', 'invoices'], queryFn: invoiceService.list });
}
