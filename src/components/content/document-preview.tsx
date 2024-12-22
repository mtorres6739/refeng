import { FileIcon, DownloadIcon, EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentPreviewProps {
  url: string;
  fileName?: string;
}

export function DocumentPreview({ url, fileName }: DocumentPreviewProps) {
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'txt':
        return 'Text Document';
      default:
        return 'Document';
    }
  };

  const getDisplayName = () => {
    if (fileName) return fileName;
    return url.split('/').pop() || 'document';
  };

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  const handlePreview = () => {
    // For PDFs, we can show them directly in a new tab
    if (url.toLowerCase().endsWith('.pdf')) {
      window.open(url, '_blank');
    } else {
      // For other document types, trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = getDisplayName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="relative aspect-[3/2] w-full bg-accent/10 rounded-lg flex items-center justify-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-16 w-16 bg-background rounded-lg shadow-sm flex items-center justify-center">
          <FileIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm truncate max-w-[200px]">
            {getDisplayName()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getFileType(url)}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreview}
            className="flex items-center gap-1.5"
          >
            <EyeIcon className="h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1.5"
          >
            <DownloadIcon className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
