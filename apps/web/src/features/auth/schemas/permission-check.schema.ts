import { z } from 'zod';

export const permissionCheckSchema = z.object({
  permission: z.string().min(1)
});

export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;
