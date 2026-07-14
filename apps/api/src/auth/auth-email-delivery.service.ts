import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AuthEmailDeliveryService {
  constructor(private readonly db: SupabaseService) {}

  log(input: { tenantId: string; userId?: string | null; invitationId?: string | null; email: string; templateKey: string; subject?: string; status: string; errorMessage?: string | null }) {
    return this.db.single(this.db.from('UserEmailDeliveryLog').insert({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      invitationId: input.invitationId ?? null,
      email: input.email.toLowerCase(),
      templateKey: input.templateKey,
      subject: input.subject ?? null,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      sentAt: input.status === 'Sent' ? new Date().toISOString() : null
    }).select().single()).catch(() => null);
  }
}
