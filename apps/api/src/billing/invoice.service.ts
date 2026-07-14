import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly db: SupabaseService) {}

  list(companyId: string) {
    return this.db.many<any>(this.db.from('billing_invoices').select('*').eq('company_id', companyId).order('created_at', { ascending: false }));
  }

  async get(companyId: string, invoiceId: string) {
    const invoice = await this.db.single<any>(this.db.from('billing_invoices').select('*').eq('company_id', companyId).eq('id', invoiceId).maybeSingle());
    if (!invoice) throw new NotFoundException('Invoice not found.');
    return invoice;
  }

  async download(companyId: string, invoiceId: string) {
    const invoice = await this.get(companyId, invoiceId);
    if (!invoice.invoice_pdf_url && !invoice.hosted_invoice_url) throw new ForbiddenException('Invoice download is not available.');
    return { url: invoice.invoice_pdf_url ?? invoice.hosted_invoice_url, invoice };
  }
}
