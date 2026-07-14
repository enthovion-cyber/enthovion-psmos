import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AuthRateLimitService {
  constructor(private readonly db: SupabaseService) {}

  async check(eventType: string, emailOrUser: string | undefined, ipAddress: string | undefined, maxAttempts = 8, windowMs = 15 * 60 * 1000) {
    const emailHash = this.hash(emailOrUser?.toLowerCase() ?? 'anonymous');
    const since = new Date(Date.now() - windowMs).toISOString();
    const rows = await this.db.many<any>(
      this.db.from('auth_rate_limit_events')
        .select('id,attempts,blocked_until,created_at')
        .eq('event_type', eventType)
        .eq('email_or_user_hash', emailHash)
        .gte('created_at', since)
    ).catch(() => []);
    const blocked = rows.find((row) => row.blocked_until && new Date(row.blocked_until).getTime() > Date.now());
    if (blocked || rows.length >= maxAttempts) {
      const blockedUntil = blocked?.blocked_until ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await this.record(eventType, emailOrUser, ipAddress, rows.length + 1, blockedUntil);
      throw new HttpException('Too many attempts. Please wait and try again.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.record(eventType, emailOrUser, ipAddress, rows.length + 1, null);
  }

  private record(eventType: string, emailOrUser: string | undefined, ipAddress: string | undefined, attempts: number, blockedUntil: string | null) {
    return this.db.single(this.db.from('auth_rate_limit_events').insert({
      id: crypto.randomUUID(),
      email_or_user_hash: this.hash(emailOrUser?.toLowerCase() ?? 'anonymous'),
      ip_address: ipAddress ?? null,
      event_type: eventType,
      attempts,
      blocked_until: blockedUntil,
      metadata_json: null,
      updated_at: new Date().toISOString()
    }).select().single()).catch(() => null);
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
