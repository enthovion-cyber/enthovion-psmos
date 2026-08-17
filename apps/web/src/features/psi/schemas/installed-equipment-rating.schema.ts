import { z } from 'zod';
export const installedEquipmentRatingSchema = z.object({ tag_number: z.string().min(1), item_type: z.string().min(1) }).passthrough();
