import { z } from 'zod';
export const safeguardFunctionRequirementSchema = z.object({ function_description: z.string().optional().nullable(), required_action: z.string().optional().nullable() }).passthrough();
