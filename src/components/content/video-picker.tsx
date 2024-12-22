import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from './file-upload';
import { Input } from '@/components/ui/input';
import { VideoIcon, Upload, Link2Icon } from 'lucide-react';

interface VideoPickerProps {
  onVideoSelect: (videoUrl: string, thumbnailUrl?: string) => void;
  defaultVideo?: string;
}

// Helper function to extract video ID from various platforms
const getVideoInfo = (url: string) => {
  let videoId = '';
  let platform = '';
  let thumbnailUrl = '';

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    if (videoId) {
      platform = 'youtube';
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }
  // Vimeo
  else if (url.includes('vimeo.com')) {
    videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
    if (videoId) {
      platform = 'vimeo';
      // Note: Vimeo requires API access for thumbnails
      // For now, we'll leave it empty
    }
  }

  return { videoId, platform, thumbnailUrl };
};

export function VideoPicker({ onVideoSelect, defaultVideo }: VideoPickerProps) {
  const [videoUrl, setVideoUrl] = useState<string>(defaultVideo || '');
  const [inputUrl, setInputUrl] = useState('');
  const [previewType, setPreviewType] = useState<'file' | 'embed' | null>(null);

  const handleVideoSelect = (url: string, type: 'file' | 'embed') => {
    setVideoUrl(url);
    setPreviewType(type);
    
    if (type === 'embed') {
      const { thumbnailUrl } = getVideoInfo(url);
      onVideoSelect(url, thumbnailUrl);
    } else {
      onVideoSelect(url);
    }
  };

  const handleUrlSubmit = () => {
    if (inputUrl.trim()) {
      handleVideoSelect(inputUrl.trim(), 'embed');
      setInputUrl('');
    }
  };

  const renderPreview = () => {
    if (!videoUrl) {
      return (
        <div className="w-full h-[200px] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-2">
            <VideoIcon className="w-12 h-12 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-500">No video selected</div>
          </div>
        </div>
      );
    }

    if (previewType === 'embed') {
      const { platform, videoId } = getVideoInfo(videoUrl);
      if (platform === 'youtube' && videoId) {
        return (
          <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden border">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      } else if (platform === 'vimeo' && videoId) {
        return (
          <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden border">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              className="absolute top-0 left-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    return (
      <div className="w-full rounded-lg border p-4 bg-gray-50">
        <p className="text-sm text-gray-600 break-all">{videoUrl}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Preview Area */}
      <div className="flex justify-center">
        {renderPreview()}
      </div>

      {/* Upload/Link Options */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Video</span>
          </TabsTrigger>
          <TabsTrigger value="link" className="space-x-2">
            <Link2Icon className="w-4 h-4" />
            <span>Video Link</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-4">
          <FileUpload
            accept="video/*"
            maxSize={100}
            onUploadComplete={(url) => handleVideoSelect(url, 'file')}
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload a video from your computer (max 100MB)
          </p>
        </TabsContent>
        <TabsContent value="link" className="mt-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Paste YouTube or Vimeo URL"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <Button type="button" onClick={handleUrlSubmit}>Add</Button>
            </div>
            <p className="text-xs text-gray-500">
              Supports YouTube and Vimeo links
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
