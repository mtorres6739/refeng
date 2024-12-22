import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  onUploadComplete,
  accept,
  maxSize = 10, // Default max size is 10MB
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUploadComplete(data.url);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isUploading}
        className="flex-1"
      />
      {isUploading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
    </div>
  );
}
