// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function EquipmentLinkedRecordsPage() {
  return <div className="psm-panel rounded-lg p-5">Linked PTW, MOC, HAZOP, PSSR, actions, and documents.</div>;
}
