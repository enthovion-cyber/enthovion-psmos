import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createWorkflowEscalationWorker() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  return new Worker('workflow-escalations', async () => {
    const { data: overdue, error } = await supabase
      .from('workflow_instance_steps')
      .select('id, workflow_instance_id, step_name, assigned_to_user_id, due_at')
      .eq('status', 'Active')
      .lt('due_at', new Date().toISOString());
    if (error) throw new Error(error.message);

    for (const step of overdue ?? []) {
      const { data: existing } = await supabase
        .from('workflow_escalations')
        .select('escalation_level')
        .eq('workflow_step_id', step.id);
      const maxLevel = existing?.length ? Math.max(...existing.map((item) => item.escalation_level)) : 0;
      await supabase.from('workflow_escalations').insert({
        id: crypto.randomUUID(),
        workflow_instance_id: step.workflow_instance_id,
        workflow_step_id: step.id,
        escalated_to: step.assigned_to_user_id,
        escalation_level: Math.min(maxLevel + 1, 3),
        reason: `${step.step_name} is overdue`
      });
    }

    return { escalated: overdue?.length ?? 0 };
  }, { connection });
}
