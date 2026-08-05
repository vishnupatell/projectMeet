'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addSharedFile, removeSharedFile } from '@/store/slices/featuresSlice';
import { File, Upload, Trash2, Download } from 'lucide-react';
import { API_URL } from '@/lib/config';

export function FileSharePanel({ meetingId }: { meetingId: string }) {
  const dispatch = useDispatch();
  const files = useSelector((state: RootState) => state.features.sharedFiles);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/files/meeting/${meetingId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addSharedFile(data.data));
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        dispatch(removeSharedFile(fileId));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <File className="w-5 h-5" /> Shared Files
        </h3>
        <label className="cursor-pointer p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white">
          <Upload className="w-4 h-4" />
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {uploading && (
        <div className="mb-3 text-sm text-blue-400 animate-pulse">Uploading...</div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{file.filename}</p>
              <p className="text-gray-400 text-xs">
                {formatSize(file.fileSize)} • by {file.uploader?.displayName || 'Unknown'}
              </p>
            </div>
            <div className="flex gap-1 ml-2">
              <button className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(file.id)}
                className="p-1.5 rounded bg-gray-700 hover:bg-red-600 text-gray-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No files shared yet</p>
        )}
      </div>
    </div>
  );
}
