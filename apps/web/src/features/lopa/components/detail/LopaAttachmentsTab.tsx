'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLopaAttachmentMutations, useLopaAttachments } from '../../hooks/useLopaAttachments';
import { lopaAttachmentsService } from '../../services/lopa-attachments.service';
import type { LopaAttachmentFilters } from '../../types/lopa-attachment.types';
import { AttachmentsHeader } from '../attachments/AttachmentsHeader';
import { AttachmentSummaryCards } from '../attachments/AttachmentSummaryCards';
import { AttachmentFilters } from '../attachments/AttachmentFilters';
import { RequiredEvidencePanel } from '../attachments/RequiredEvidencePanel';
import { AttachmentReadinessPanel } from '../attachments/AttachmentReadinessPanel';
import { AttachmentRegister } from '../attachments/AttachmentRegister';
import { AttachmentBulkActions } from '../attachments/AttachmentBulkActions';
import { AttachmentDetailDrawer } from '../attachments/AttachmentDetailDrawer';
import { UploadAttachmentDialog } from '../attachments/UploadAttachmentDialog';
import { ControlledDocumentLinksPanel } from '../attachments/ControlledDocumentLinksPanel';
import { EvidenceMappingPanel } from '../attachments/EvidenceMappingPanel';
import { LinkControlledDocumentDialog } from '../attachments/LinkControlledDocumentDialog';
import { EvidenceMappingDialog } from '../attachments/EvidenceMappingDialog';

export function LopaAttachmentsTab({ id }: { id:string }) {
  const [filters,setFilters]=useState<LopaAttachmentFilters>({page:'1',limit:'50'});
  const [selected,setSelected]=useState<string[]>([]);
  const [detailId,setDetailId]=useState<string|null>(null);
  const [upload,setUpload]=useState(false);
  const [linkDocument,setLinkDocument]=useState(false);
  const [mappingAttachmentId,setMappingAttachmentId]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);
  const query=useLopaAttachments(id,filters);
  const context=useQuery({queryKey:['lopa','attachments-context',id],queryFn:()=>lopaAttachmentsService.context(id)});
  const detail=useQuery({queryKey:['lopa','attachment',id,detailId],queryFn:()=>lopaAttachmentsService.detail(id,detailId!),enabled:!!detailId});
  const mutations=useLopaAttachmentMutations(id);
  const fail=(e:any,fallback:string)=>setNotice(Array.isArray(e?.response?.data?.message)?e.response.data.message.join('. '):e?.response?.data?.message??fallback);
  if(query.isLoading||context.isLoading)return <State text="Loading secure LOPA attachments, evidence requirements, and readiness..."/>;
  if(query.isError||!query.data||!context.data)return <State tone="error" text="Unable to load LOPA attachments. Confirm the migration and attachment permission."/>;
  const data=query.data;
  const toggle=(attachmentId:string)=>setSelected(old=>old.includes(attachmentId)?old.filter(x=>x!==attachmentId):[...old,attachmentId]);
  const openDownloads=(files:any[])=>files.forEach(file=>window.open('/api/v1'+file.downloadPath,'_blank','noopener'));
  const exportIndex=()=>lopaAttachmentsService.exportIndex(id,filters).then(result=>setNotice('Attachment index generated with '+(result.rows?.length??0)+' visible record(s).')).catch(e=>fail(e,'Attachment index export failed.'));
  return <div className="space-y-4">
    {notice?<Banner text={notice} onClose={()=>setNotice(null)}/>:null}
    <AttachmentsHeader header={data.header} summary={data.summary} readOnly={data.readOnly} onRefresh={()=>query.refetch()} onUpload={()=>setUpload(true)} onLink={()=>setLinkDocument(true)} onExport={exportIndex}/>
    {data.readOnly?<Banner text="Read-only: this study is approved or closed. Upload, metadata, mapping, and bulk actions are disabled."/>:null}
    <AttachmentFilters filters={filters} context={context.data} onChange={setFilters}/>
    <AttachmentSummaryCards summary={data.summary} onFilter={(key:string)=>key==='requiredEvidenceMissing'?setFilters({...filters,requiredEvidence:'true'}):key==='restricted'?setFilters({...filters,restricted:'true'}):null}/>
    <AttachmentBulkActions count={selected.length} readOnly={data.readOnly} onDownload={()=>lopaAttachmentsService.bulkDownload(id,selected).then(result=>{openDownloads(result.files);setNotice(result.files.length+' permitted download(s) opened; '+result.skipped+' skipped by policy.');}).catch(e=>fail(e,'Bulk download failed.'))} onArchive={()=>mutations.bulkUpdate.mutate({attachmentIds:selected,action:'archive',reason:'Bulk archive from attachment register'},{onSuccess:()=>{setSelected([]);setNotice('Selected attachments archived.');},onError:e=>fail(e,'Bulk archive failed.')})}/>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><RequiredEvidencePanel rows={data.requiredEvidence} onSelect={(row:any)=>setFilters({...filters,relatedTab:row.tab})}/><AttachmentReadinessPanel readiness={data.readiness}/></div>
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-cyan-300/10 dark:bg-[#071525]"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Attachment Register</h3><AttachmentRegister rows={data.register.rows} selected={selected} onSelect={toggle} onOpen={(row:any)=>setDetailId(row.id)}/></section>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><ControlledDocumentLinksPanel links={data.documentLinks} onRefresh={(linkId:string)=>mutations.refreshDocument.mutate(linkId,{onSuccess:()=>setNotice('Controlled document snapshot refreshed.'),onError:e=>fail(e,'Document refresh failed.')})}/><EvidenceMappingPanel mappings={data.mappings}/></div>
    {upload?<UploadAttachmentDialog context={context.data} busy={mutations.upload.isPending||mutations.bulkUpload.isPending} onClose={()=>setUpload(false)} onSubmit={(files:File[],values:any)=>{const mutation=files.length>1?mutations.bulkUpload:mutations.upload;const variables=files.length>1?{files,values}:{file:files[0],values};mutation.mutate(variables as any,{onSuccess:()=>{setUpload(false);setNotice(files.length+' attachment(s) uploaded and readiness recalculated.');},onError:e=>fail(e,'Attachment upload failed.')});}}/>:null}
    {linkDocument?<LinkControlledDocumentDialog studyId={id} busy={mutations.linkDocument.isPending} onClose={()=>setLinkDocument(false)} onLinked={(values:any)=>mutations.linkDocument.mutate(values,{onSuccess:()=>{setLinkDocument(false);setNotice('Controlled document linked with current status and revision snapshot.');},onError:e=>fail(e,'Controlled document link failed.')})}/>:null}
    {mappingAttachmentId?<EvidenceMappingDialog attachmentId={mappingAttachmentId} context={context.data} busy={mutations.addMapping.isPending} onClose={()=>setMappingAttachmentId(null)} onSave={(values:any)=>mutations.addMapping.mutate(values,{onSuccess:()=>{setMappingAttachmentId(null);detail.refetch();setNotice('Evidence mapping saved and readiness recalculated.');},onError:e=>fail(e,'Evidence mapping failed.')})}/>:null}
    {detailId?<AttachmentDetailDrawer studyId={id} detail={detail.data} onClose={()=>setDetailId(null)} onMap={setMappingAttachmentId} onRefreshDocument={(linkId:string)=>mutations.refreshDocument.mutate(linkId,{onSuccess:()=>detail.refetch(),onError:e=>fail(e,'Document refresh failed.')})}/>:null}
  </div>;
}
function State({text,tone='muted'}:{text:string;tone?:'muted'|'error'}){return <div className={tone==='error'?'rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-800 dark:text-red-100':'rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-400'}>{text}</div>;}
function Banner({text,onClose}:{text:string;onClose?:()=>void}){return <div className="flex justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-100"><span>{text}</span>{onClose?<button onClick={onClose}>Dismiss</button>:null}</div>;}
