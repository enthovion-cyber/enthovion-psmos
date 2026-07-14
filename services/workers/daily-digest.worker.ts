import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

export function createDailyDigestWorker() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return new Worker('daily-digest', async () => {
    const { data: users, error } = await supabase.from('User').select('id,tenantId').eq('status', 'ACTIVE');
    if (error) throw new Error(error.message);
    return { users: users?.length ?? 0, generatedAt: new Date().toISOString() };
  }, { connection });
}
