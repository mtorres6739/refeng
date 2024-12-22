import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

interface UnsplashImageSearchProps {
  onSelect: (imageUrl: string) => void;
}

export function UnsplashImageSearch({ onSelect }: UnsplashImageSearchProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const searchImages = async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/unsplash?query=${encodeURIComponent(
          searchQuery
        )}&page=${pageNum}&per_page=20`
      );
      const data = await response.json();
      
      if (pageNum === 1) {
        setImages(data.results);
      } else {
        setImages((prev) => [...prev, ...data.results]);
      }
    } catch (error) {
      console.error('Error searching Unsplash:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    searchImages(query);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    searchImages(query, nextPage);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search for images..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e);
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto p-1">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer"
              onClick={() => onSelect(image.urls.regular)}
            >
              <Image
                src={image.urls.thumb}
                alt={image.alt_description || 'Unsplash image'}
                width={200}
                height={200}
                className="rounded-lg object-cover w-full h-32"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 text-sm text-center p-2">
                  Photo by {image.user.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
