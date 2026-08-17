import { badgeClass } from './badge-utils';

export function ExportFormatBadge({ format }: { format?: string | null | undefined }) {
  const value = format || 'CSV';
  const tone = /zip/i.test(value) ? 'warning' : /pdf/i.test(value) ? 'danger' : /json/i.test(value) ? 'info' : 'success';
  return <span className={badgeClass(tone)}>{value}</span>;
}
