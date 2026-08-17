import { z } from 'zod';
export const electricalProtectionRequirementsSchema = z.object({ required_protection_method: z.string().min(1, 'Required protection method is required.') }).passthrough();
