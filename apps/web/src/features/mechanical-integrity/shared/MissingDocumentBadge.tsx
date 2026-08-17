export function MissingDocumentBadge({ missing }: { missing?: boolean | number | null }) {
  const count = typeof missing === 'number' ? missing : missing ? 1 : 0;
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${count ? 'border-danger/30 bg-danger/10 text-danger' : 'border-success/30 bg-success/10 text-success'}`}>{count ? `${count} Missing` : 'Complete'}</span>;
}
