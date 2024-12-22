import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from './file-upload';
import { UnsplashImageSearch } from './unsplash-image-search';
import { ImageIcon, Upload, SearchIcon } from 'lucide-react';
import Image from 'next/image';

interface ImagePickerProps {
  onImageSelect: (imageUrl: string) => void;
  defaultImage?: string;
}

export function ImagePicker({ onImageSelect, defaultImage }: ImagePickerProps) {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(defaultImage);

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    onImageSelect(url);
  };

  return (
    <div className="space-y-4">
      {/* Preview Area */}
      <div className="flex justify-center">
        {selectedImage ? (
          <div className="relative w-full h-[150px] rounded-lg overflow-hidden border">
            <Image
              src={selectedImage}
              alt="Selected image"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[150px] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-2">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
              <div className="text-sm text-gray-500">No image selected</div>
            </div>
          </div>
        )}
      </div>

      {/* Upload/Search Options */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="space-x-2">
            <SearchIcon className="w-4 h-4" />
            <span>Search Images</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-4">
          <FileUpload
            accept="image/*"
            maxSize={5}
            onUploadComplete={handleImageSelect}
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload an image from your computer (max 5MB)
          </p>
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <UnsplashImageSearch onSelect={handleImageSelect} />
          <p className="text-xs text-gray-500 mt-2">
            Search and select from millions of free Unsplash images
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
