import {
  ExecutiveReportDetailPage,
  ExecutiveReportsDashboardPage,
  ExecutiveReportSectionPage,
} from '@/features/executive/reports/ExecutiveReportsPages';

const KNOWN_SECTIONS = [
  'dashboard',
  'board',
  'board-packages',
  'board-assurance',
  'register',
  'reports',
  'new',
  'builder',
  'create',
  'templates',
  'periods',
  'audiences',
  'schedules',
  'distribution',
  'staleness',
  'lineage',
];

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  if (!slug.length) return <ExecutiveReportsDashboardPage />;

  const [section, id] = slug;

  if (section === 'report' && id) {
    return <ExecutiveReportDetailPage id={id} />;
  }

  if (section && id) {
    return <ExecutiveReportDetailPage id={id} />;
  }

  if (section && !KNOWN_SECTIONS.includes(section.toLowerCase())) {
    return <ExecutiveReportDetailPage id={section} />;
  }

  return <ExecutiveReportSectionPage section={section ?? 'dashboard'} />;
}
