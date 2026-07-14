import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

export function createEmailWorker() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return new Worker('email', async (job) => {
    const { logId } = job.data as { logId: string };
    await supabase.from('email_logs').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', logId);
    return { logId };
  }, { connection });
}
