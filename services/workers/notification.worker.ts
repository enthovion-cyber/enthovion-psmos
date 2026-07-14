import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

export function createNotificationWorker() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return new Worker('notifications', async (job) => {
    const notification = job.data as Record<string, unknown>;
    const { error } = await supabase.from('notifications').insert({ id: crypto.randomUUID(), ...notification });
    if (error) throw new Error(error.message);
    return { sent: true };
  }, { connection });
}
