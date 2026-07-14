export const PermitStatuses = ['Draft', 'Submitted', 'Approved', 'Issued', 'Active', 'Suspended', 'Extended', 'Closed', 'Cancelled'] as const;
export type PermitStatus = (typeof PermitStatuses)[number];

export const activePermitStatuses = ['Issued', 'Active', 'Suspended', 'Extended'] as const;
