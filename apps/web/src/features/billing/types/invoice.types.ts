export type BillingInvoice = {
  id: string;
  company_id: string;
  provider: string;
  provider_invoice_id?: string | null;
  invoice_number?: string | null;
  status: string;
  currency: string;
  amount_due_cents: number;
  amount_paid_cents: number;
  hosted_invoice_url?: string | null;
  invoice_pdf_url?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  created_at: string;
};
