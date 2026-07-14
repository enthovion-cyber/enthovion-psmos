export function validateWorkspaceSelection(input: { companyId?: string; siteId?: string }) {
  return {
    workspace: input.companyId ? [] : ['Select a workspace.'],
    site: input.siteId ? [] : ['Select a site.']
  };
}
