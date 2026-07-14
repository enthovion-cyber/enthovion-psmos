'use client';

import { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopAttachmentMutations } from '../../hooks/useHazopAttachmentMutations';
import { useHazopAttachments } from '../../hooks/useHazopAttachments';
import { hazopAttachmentService } from '../../services/hazop-attachment.service';
import type { HazopAttachment, HazopAttachmentFilters as FilterState } from '../../types/hazop-attachment.types';
import { HazopAttachmentCategoryPanel } from '../attachments/HazopAttachmentCategoryPanel';
import { HazopAttachmentFilters } from '../attachments/HazopAttachmentFilters';
import { HazopAttachmentLinkedRecordPanel } from '../attachments/HazopAttachmentLinkedRecordPanel';
import { HazopAttachmentPreviewDrawer } from '../attachments/HazopAttachmentPreviewDrawer';
import { HazopAttachmentRegister } from '../attachments/HazopAttachmentRegister';
import { HazopAttachmentSecurityPanel } from '../attachments/HazopAttachmentSecurityPanel';
import { HazopAttachmentSummaryCards } from '../attachments/HazopAttachmentSummaryCards';
import { HazopUploadAttachmentDialog } from '../attachments/HazopUploadAttachmentDialog';

export function HazopAttachmentsTab({ study }: { study: any }) {
  const permissions = useMyPermissions().data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const readonly = ['Approved', 'Closed', 'Cancelled'].includes(study.status);
  const [filters, setFilters] = useState<FilterState>({ category: 'All', linkedSection: 'All', reviewStatus: 'All', visibility: 'All' });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<HazopAttachment | null>(null);
  const queries = useHazopAttachments(study.id, filters);
  const mutations = useHazopAttachmentMutations(study.id);
  const rows = queries.attachments.data ?? [];

  if (!can('hazop.attachments.view')) return <StateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP attachments." />;
  const openPreview = async (row: HazopAttachment) => setSelected(await hazopAttachmentService.preview(study.id, row.id));
  const download = async (row: HazopAttachment) => {
    const file = await mutations.download.mutateAsync(row.id);
    const url = file.content ?? file.url;
    if (url) window.open(url, '_blank');
  };
  const exportRegister = async () => {
    const file = await mutations.exportRegister.mutateAsync();
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-attachments.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const replace = (row: HazopAttachment) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => { const file = input.files?.[0]; if (file) mutations.replace.mutate({ attachmentId: row.id, values: { file, changeReason: 'Replaced from attachment drawer' } }); };
    input.click();
  };
  const archive = (row: HazopAttachment) => { const reason = window.prompt('Archive reason'); if (reason !== null) mutations.archive.mutate({ attachmentId: row.id, values: { reason } }); };
  const remove = (row: HazopAttachment) => { const reason = window.prompt('Delete reason'); if (reason !== null) mutations.delete.mutate({ attachmentId: row.id, values: { reason } }); };
  return <div className="space-y-5">{readonly ? <StateCard tone="amber" title="Read-only study" text="Approved, closed, and cancelled studies block attachment changes until re-opened." /> : null}{queries.attachments.isError ? <StateCard tone="red" title="Unable to load attachments" text="Check attachment migration, storage, and permissions." /> : null}<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-semibold">Attachments</h2><p className="text-sm text-[var(--psm-muted)]">Supporting evidence, field media, minutes, calculations, vendor files, and review artifacts.</p></div><div className="flex gap-2">{can('hazop.attachments.export') ? <button onClick={exportRegister} className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold"><Download size={15} /> Export</button> : null}{can('hazop.attachments.upload') && !readonly ? <button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"><Plus size={15} /> Upload</button> : null}</div></div><HazopAttachmentSummaryCards summary={queries.summary.data} onFilter={(key) => key === 'filesNeedingReview' ? setFilters((current) => ({ ...current, reviewStatus: 'Pending Review' })) : undefined} /><HazopAttachmentFilters filters={filters} onChange={setFilters} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><HazopAttachmentRegister rows={rows} readonly={readonly} canDownload={can('hazop.attachments.download')} canReplace={can('hazop.attachments.replace')} canArchive={can('hazop.attachments.archive')} canDelete={can('hazop.attachments.delete')} onPreview={openPreview} onDownload={download} onReplace={replace} onArchive={archive} onDelete={remove} /><div className="space-y-4"><HazopAttachmentCategoryPanel rows={rows} /><HazopAttachmentLinkedRecordPanel rows={rows} /><HazopAttachmentSecurityPanel rows={rows} /></div></div><HazopUploadAttachmentDialog open={uploadOpen} saving={mutations.upload.isPending} onClose={() => setUploadOpen(false)} onUpload={(values) => mutations.upload.mutate(values, { onSuccess: () => setUploadOpen(false) })} /><HazopAttachmentPreviewDrawer attachment={selected} onClose={() => setSelected(null)} onDownload={download} onReplace={replace} onArchive={archive} onDelete={remove} canDownload={can('hazop.attachments.download')} canReplace={can('hazop.attachments.replace')} canArchive={can('hazop.attachments.archive')} canDelete={can('hazop.attachments.delete')} readonly={readonly} /></div>;
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const color = tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return <div className={`rounded-xl border p-4 ${color}`}><div className="font-semibold">{title}</div><p className="mt-1 text-sm opacity-80">{text}</p></div>;
}
