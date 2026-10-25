import type { HazopNodesDeviationsLayoutProps } from "../../types/hazop-worksheet.types";

export function HazopNodesDeviationsLayout({ sidebar, children, drawer }: HazopNodesDeviationsLayoutProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
      {sidebar}
      <section className="min-w-0 space-y-4">{children}</section>
      {drawer}
    </div>
  );
}
