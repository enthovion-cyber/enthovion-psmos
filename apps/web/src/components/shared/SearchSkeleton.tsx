export function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 rounded-xl psm-skeleton" />
      ))}
    </div>
  );
}
