import type { HazopNodesDeviationsLayoutProps } from "../../types/hazop-worksheet.types";

export function HazopNodesDeviationsLayout({ sidebar, children, drawer }: HazopNodesDeviationsLayoutProps) {
  return (
    <div className="grid gap-4 2xl:grid-cols-[310px_minmax(0,1fr)]">
      {sidebar}
      <section className="min-w-0 space-y-4">{children}</section>
      {drawer}
    </div>
  );
}
