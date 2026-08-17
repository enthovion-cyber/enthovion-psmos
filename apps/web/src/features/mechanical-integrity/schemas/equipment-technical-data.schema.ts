import { z } from 'zod';

export const miEquipmentTechnicalDataSchema = z.object({
  designPressure: z.string().optional(),
  designPressureUnit: z.string().optional(),
  designTemperature: z.string().optional(),
  designTemperatureUnit: z.string().optional(),
  operatingPressure: z.string().optional(),
  operatingPressureUnit: z.string().optional(),
  operatingTemperature: z.string().optional(),
  operatingTemperatureUnit: z.string().optional(),
  designCode: z.string().optional(),
  materialOfConstruction: z.string().optional(),
  corrosionAllowance: z.string().optional(),
  designCapacity: z.string().optional(),
  designCapacityUnit: z.string().optional(),
  fluidName: z.string().optional(),
  sdsReference: z.string().optional()
});
