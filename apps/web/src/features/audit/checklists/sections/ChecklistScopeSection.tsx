export function ChecklistScopeSection({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <section aria-label="Checklist applicability scope">{children}</section>
  );
}
