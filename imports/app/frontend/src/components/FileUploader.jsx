import React, { useRef, useState } from 'react';
import { Paperclip, X, FileText, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUploader = ({ onFilesSelected, attachedFiles = [], onRemoveFile }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.warn(`File type ${file.type} not allowed`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} is too large`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4 text-red-400" />;
    if (file.type.includes('word')) return <FileText className="h-4 w-4 text-blue-400" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1c] rounded-lg border border-[#2a2a2c]"
            >
              {getFileIcon(file)}
              <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
              <span className="text-xs text-[#6b6b6b]">{formatFileSize(file.size)}</span>
              <button
                onClick={() => onRemoveFile(index)}
                className="text-[#6b6b6b] hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "h-8 px-3 text-xs text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1c] rounded-full border border-[#2a2a2c]",
          isDragging && "border-purple-500 bg-purple-500/10"
        )}
      >
        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
        Attach
      </Button>
    </div>
  );
};

export default FileUploader;
