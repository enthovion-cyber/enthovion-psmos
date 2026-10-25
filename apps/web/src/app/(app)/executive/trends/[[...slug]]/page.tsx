import { ExecutiveTrendDetailPage, ExecutiveTrendSectionPage } from '@/features/executive/trends/ExecutiveTrendsPages';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  if (!slug.length) return <ExecutiveTrendSectionPage section="dashboard" />;
  const [section, id] = slug;
  return id ? <ExecutiveTrendDetailPage section={section!} id={id} /> : <ExecutiveTrendSectionPage section={section!} />;
}
