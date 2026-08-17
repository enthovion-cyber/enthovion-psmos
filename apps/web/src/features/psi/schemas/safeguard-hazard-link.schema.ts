import { z } from 'zod';
export const safeguardHazardLinkSchema = z.object({ scenario_title: z.string().min(1, 'Scenario title is required.'), hazard_type: z.string().min(1, 'Hazard type is required.') }).passthrough();
