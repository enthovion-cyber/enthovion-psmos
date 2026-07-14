import { Injectable } from '@nestjs/common';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { BillingProviderFactory } from './billing-provider.factory';
import { BillingAuditService } from './billing-audit.service';

@Injectable()
export class BillingWebhookService {
  constructor(
    private readonly db: SupabaseService,
    private readonly providers: BillingProviderFactory,
    private readonly audit: BillingAuditService
  ) {}

  async process(payload: any, signature?: string | null) {
    const verified = await this.providers.verifyConfiguredWebhook(payload, signature);
    const provider = payload?.provider ?? 'provider_agnostic';
    const providerEventId = payload?.id ?? payload?.provider_event_id ?? crypto.randomUUID();
    const eventType = payload?.type ?? payload?.event_type ?? 'unknown';
    if (!verified) {
      const failed = await this.insertEvent({ provider, providerEventId, eventType, status: 'failed', payload, errorMessage: 'Invalid billing webhook signature.' });
      return { processed: false, status: 'failed', event: failed };
    }
    const existing = await this.db.single<any>(this.db.from('billing_events').select('*').eq('provider', provider).eq('provider_event_id', providerEventId).maybeSingle());
    if (existing) return { processed: false, status: 'ignored', reason: 'Duplicate billing webhook event.', event: existing };
    const companyId = await this.resolveCompanyId(payload);
    const event = await this.insertEvent({ provider, providerEventId, eventType, status: 'processed', payload, companyId });
    await this.applyEvent(companyId, eventType, payload);
    await this.audit.write({ tenantId: 'system', companyId, action: 'BILLING_WEBHOOK_PROCESSED', targetType: 'BillingEvent', targetId: event.id, providerEventId, after: { eventType, provider } as JsonValue });
    return { processed: true, event };
  }

  list() {
    return this.db.many<any>(this.db.from('billing_events').select('*').order('created_at', { ascending: false }).limit(200));
  }

  async replay(eventId: string) {
    const event = await this.db.single<any>(this.db.from('billing_events').select('*').eq('id', eventId).maybeSingle());
    if (!event) return null;
    await this.db.single(this.db.from('billing_events').update({ status: 'replayed', updated_at: new Date().toISOString() }).eq('id', eventId).select().single());
    return this.process({ ...event.payload_json, id: `${event.provider_event_id}-replay-${Date.now()}`, replayedFrom: event.provider_event_id }, null);
  }

  private insertEvent(input: { provider: string; providerEventId: string; eventType: string; status: string; payload: any; companyId?: string | null; errorMessage?: string | null }) {
    return this.db.single<any>(this.db.from('billing_events').insert({
      id: crypto.randomUUID(),
      company_id: input.companyId ?? null,
      provider: input.provider,
      provider_event_id: input.providerEventId,
      event_type: input.eventType,
      status: input.status,
      payload_json: input.payload ?? {},
      processed_at: input.status === 'processed' ? new Date().toISOString() : null,
      error_message: input.errorMessage ?? null,
      idempotency_key: `${input.provider}:${input.providerEventId}`
    }).select().single());
  }

  private async resolveCompanyId(payload: any) {
    const explicitCompanyId = payload?.company_id ?? payload?.data?.object?.metadata?.company_id ?? payload?.data?.object?.metadata?.companyId;
    if (explicitCompanyId) return explicitCompanyId;
    const customerId = payload?.customer ?? payload?.data?.object?.customer;
    if (customerId) {
      const customer = await this.db.single<any>(this.db.from('company_billing_customers').select('company_id').eq('provider_customer_id', customerId).maybeSingle()).catch(() => null);
      if (customer?.company_id) return customer.company_id;
    }
    const subscriptionId = payload?.subscription ?? payload?.data?.object?.subscription ?? payload?.data?.object?.id;
    if (subscriptionId) {
      const subscription = await this.db.single<any>(this.db.from('company_subscriptions').select('company_id').eq('provider_subscription_id', subscriptionId).maybeSingle()).catch(() => null);
      if (subscription?.company_id) return subscription.company_id;
    }
    return null;
  }

  private async applyEvent(companyId: string | null, eventType: string, payload: any) {
    if (!companyId) return;
    if (eventType.includes('invoice.payment_failed')) {
      await this.db.many(this.db.from('company_subscriptions').update({ status: 'past_due', access_mode: 'warning', payment_failed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', companyId));
    }
    if (eventType.includes('invoice.paid') || eventType.includes('checkout.session.completed')) {
      await this.db.many(this.db.from('company_subscriptions').update({ status: 'active', access_mode: 'full', updated_at: new Date().toISOString() }).eq('company_id', companyId));
    }
    if (eventType.includes('customer.subscription.deleted')) {
      await this.db.many(this.db.from('company_subscriptions').update({ status: 'cancelled', access_mode: 'read_only', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', companyId));
    }
    if (eventType.includes('invoice')) {
      const invoice = payload?.data?.object ?? payload;
      const existingInvoice = invoice.id
        ? await this.db.single<any>(this.db.from('billing_invoices').select('id').eq('provider_invoice_id', invoice.id).eq('provider', payload?.provider ?? 'provider_agnostic').maybeSingle()).catch(() => null)
        : null;
      const invoicePayload = {
        company_id: companyId,
        provider: payload?.provider ?? 'provider_agnostic',
        provider_invoice_id: invoice.id ?? payload?.id ?? null,
        invoice_number: invoice.number ?? invoice.invoice_number ?? null,
        status: invoice.status ?? 'open',
        currency: (invoice.currency ?? 'USD').toUpperCase(),
        amount_due_cents: invoice.amount_due ?? invoice.amount_due_cents ?? 0,
        amount_paid_cents: invoice.amount_paid ?? invoice.amount_paid_cents ?? 0,
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        invoice_pdf_url: invoice.invoice_pdf ?? invoice.invoice_pdf_url ?? null,
        metadata_json: invoice.metadata ?? {}
      };
      if (existingInvoice?.id) {
        await this.db.single(this.db.from('billing_invoices').update({ ...invoicePayload, updated_at: new Date().toISOString() }).eq('id', existingInvoice.id).select().single()).catch(() => null);
      } else {
        await this.db.single(this.db.from('billing_invoices').insert({ id: invoice.local_id ?? crypto.randomUUID(), ...invoicePayload }).select().single()).catch(() => null);
      }
    }
  }
}
