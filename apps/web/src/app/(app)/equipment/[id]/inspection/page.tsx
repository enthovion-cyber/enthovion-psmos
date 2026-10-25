// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function EquipmentInspectionPage() {
  return <div className="psm-panel rounded-lg p-5">Inspection register and RBI schedule for this equipment.</div>;
}
