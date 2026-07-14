import { z } from 'zod';

export const hazopNodeSchema = z.object({
  nodeNumber: z.string().min(1, 'Node number is required').optional(),
  title: z.string().min(2, 'Node title is required'),
  description: z.string().optional(),
  designIntent: z.string().min(3, 'Design intent is required'),
  ownerId: z.string().optional(),
  complexId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  parentNodeId: z.string().optional(),
  equipmentIds: z.array(z.string()).default([]),
  documentIds: z.array(z.string()).default([]),
  pidReferences: z.array(z.string()).default([]),
  equipmentLinks: z.array(z.record(z.any())).default([]),
  documentLinks: z.array(z.record(z.any())).default([]),
  selectedParameters: z.array(z.string()).default([]),
  parameterConfigurations: z.array(z.record(z.any())).default([]),
  normalOperatingConditions: z.string().optional(),
  processConditions: z.string().optional(),
  processConditionsJson: z.record(z.any()).default({}),
  relatedChemicalIds: z.array(z.string()).default([]),
  boundaries: z.string().optional(),
  boundaryLimits: z.string().min(2, 'Boundary / battery limits are required'),
  assumptions: z.string().optional(),
  exclusions: z.string().optional(),
  sortOrder: z.number().int().positive().optional(),
  status: z.string().optional()
});

export const hazopNodeParameterSchema = z.object({
  parameterName: z.string().min(1),
  category: z.string().optional(),
  normalOperatingRange: z.string().optional(),
  designRange: z.string().optional(),
  unitOfMeasurement: z.string().optional(),
  highLimit: z.string().optional(),
  lowLimit: z.string().optional(),
  relatedEquipmentId: z.string().optional(),
  relatedDocumentId: z.string().optional(),
  safetyConcern: z.string().optional(),
  notes: z.string().optional(),
  isCustom: z.boolean().optional()
});

export const reorderHazopNodesSchema = z.object({
  nodeIds: z.array(z.string()).min(1, 'At least one node is required')
});

export type HazopNodeInput = z.infer<typeof hazopNodeSchema>;
export type HazopNodeParameterInput = z.infer<typeof hazopNodeParameterSchema>;
