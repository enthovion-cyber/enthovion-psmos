import { z } from 'zod';

export const operatorResponseSchema = z.object({
  required_operator_action: z.string().min(1, 'Required operator action is required.'),
  response_time_requirement: z.string().optional()
});
