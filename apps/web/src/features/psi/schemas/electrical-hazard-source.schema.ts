import { z } from 'zod';
export const electricalHazardSourceSchema = z.object({ hazardous_material_name: z.string().min(1), source_of_release: z.string().min(1), release_source_type: z.string().min(1), release_grade: z.string().min(1) }).passthrough();
