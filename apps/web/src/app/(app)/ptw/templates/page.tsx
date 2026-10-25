// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function PermitTemplatesPage() {
  return <div className="psm-card p-5"><h1 className="text-xl font-semibold">Permit Templates</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">Site, permit-type, and equipment-specific templates are managed through the PTW API.</p></div>;
}
