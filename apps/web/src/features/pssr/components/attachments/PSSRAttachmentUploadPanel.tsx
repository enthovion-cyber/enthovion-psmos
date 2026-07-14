'use client';
import { useRef } from 'react';
import { PSSRCard } from '../pssr-ui';

interface PSSRAttachmentUploadPanelProps {
  // Updated to pass the actual selected file back to the parent
  onUpload: (file: File) => void;
}

export function PSSRAttachmentUploadPanel({ onUpload }: { onUpload: (file: File) => void }) {
  // 1. Create a reference to the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Trigger the hidden input click when your custom button is clicked
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 3. Handle the file selection event
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]); // Pass the selected file up to your parent component
    }
  };

  return (
    <PSSRCard title="Upload Panel">
      <div className="rounded-xl border border-dashed border-cyan-300/20 bg-slate-950/30 p-6 text-center">
        {/* Hidden native file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,image/*,.docx,.xlsx,.csv,.txt" // Optional: restricts file picker types
        />

        <p className="font-black text-white">Upload supporting PSSR evidence</p>
        <p className="mt-1 text-sm text-slate-400">
          PDF, images, DOCX, XLSX, CSV, and TXT files. Storage path is scoped by company/site/PSSR.
        </p>
        
        {/* Your custom button now triggers the file picker */}
        <button 
          onClick={handleButtonClick} 
          className="mt-4 rounded-lg border border-blue-300/20 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-100 hover:bg-blue-500/20 transition-colors"
        >
          Add Attachment Metadata
        </button>
      </div>
    </PSSRCard>
  );
}