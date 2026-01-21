'use client';

import { useState, useRef } from 'react';
import { uploadFile } from '@/utils/api';
import type { UploadedFile } from '@/types';

interface FileHandlerProps {
  orderId: string;
  storeId: string;
  customerName: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
}

export function FileHandler({ orderId, storeId, customerName, onFilesUploaded }: FileHandlerProps) {
  const [selectedFiles, setSelectedFiles] = useState<Map<string, File>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = new Map(selectedFiles);
    const filenameCounts = new Map<string, number>();

    for (const file of files) {
      const customerNameFormatted = customerName.trim().replace(/\s+/g, '_');
      const extension = file.name.split('.').pop() || '';
      let baseFileName = `${orderId}_${customerNameFormatted}`;

      const count = filenameCounts.get(baseFileName) || 0;
      if (count > 0) {
        baseFileName = `${baseFileName}_${count + 1}`;
      }
      filenameCounts.set(baseFileName, count + 1);

      const newFileName = `${baseFileName}.${extension}`;
      const renamedFile = new File([file], newFileName, {
        type: file.type,
        lastModified: file.lastModified,
      });

      newFiles.set(newFileName, renamedFile);
    }

    setSelectedFiles(newFiles);
  };

  const removeFile = (fileName: string) => {
    const newFiles = new Map(selectedFiles);
    newFiles.delete(fileName);
    setSelectedFiles(newFiles);
  };

  const uploadFiles = async (): Promise<UploadedFile[]> => {
    const uploadedFiles: UploadedFile[] = [];
    setIsUploading(true);

    try {
      for (const [fileName, file] of selectedFiles) {
        const result = await uploadFile(file, orderId, storeId);
        if (result.success && result.fileUrl) {
          uploadedFiles.push({
            name: fileName,
            url: result.fileUrl,
          });
        } else {
          throw new Error(`Failed to upload ${fileName}`);
        }
      }

      onFilesUploaded(uploadedFiles);
      clearFiles();
      return uploadedFiles;
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    setSelectedFiles(new Map());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFilePreview = (file: File, fileName: string) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={fileName}
          className="w-24 h-24 object-cover rounded"
        />
      );
    }
    return (
      <div className="w-24 h-24 bg-gray-100 rounded flex flex-col items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs text-gray-500 mt-1 truncate max-w-full px-1">
          {fileName}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        id="fileUpload"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        צרף קבצים
      </button>

      {selectedFiles.size > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from(selectedFiles.entries()).map(([fileName, file]) => (
            <div key={fileName} className="relative group">
              {getFilePreview(file, fileName)}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                <button
                  onClick={() => removeFile(fileName)}
                  className="text-white bg-red-500 hover:bg-red-600 p-1 rounded"
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.size > 0 && (
        <button
          onClick={uploadFiles}
          disabled={isUploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? 'מעלה...' : `העלה ${selectedFiles.size} קבצים`}
        </button>
      )}
    </div>
  );
}

export { FileHandler as default };
