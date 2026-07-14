export type WorkspaceOption = {
  id: string;
  name: string;
  status?: string | null;
  code?: string | null;
};

export type SiteOption = WorkspaceOption & {
  country?: string | null;
};
