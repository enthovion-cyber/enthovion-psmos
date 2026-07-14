import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

export function createWeeklyReportWorker() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return new Worker('weekly-report', async () => {
    const { data: notifications, error } = await supabase.from('notifications').select('id,priority,module').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
    if (error) throw new Error(error.message);
    return { notifications: notifications?.length ?? 0, generatedAt: new Date().toISOString() };
  }, { connection });
}
