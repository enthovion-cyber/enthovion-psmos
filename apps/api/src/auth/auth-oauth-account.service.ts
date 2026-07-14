import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AuthOauthAccountService {
  constructor(private readonly db: SupabaseService) {}

  async link(input: { userId: string; provider: string; providerUserId?: string; providerEmail: string; providerDomain?: string; metadata?: Record<string, unknown> }) {
    return this.db.single(this.db.from('auth_oauth_accounts').upsert({
      id: crypto.randomUUID(),
      user_id: input.userId,
      provider: input.provider,
      provider_user_id: input.providerUserId ?? null,
      provider_email: input.providerEmail.toLowerCase(),
      provider_domain: input.providerDomain?.toLowerCase() ?? null,
      status: 'ACTIVE',
      metadata_json: input.metadata ?? null,
      linked_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'provider,provider_user_id' }).select().single()).catch(() => null);
  }
}
