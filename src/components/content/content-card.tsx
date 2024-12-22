import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareIcon } from 'lucide-react';
import { Content, ContentShare, SharePlatform } from '@prisma/client';
import Image from 'next/image';
import { DocumentPreview } from './document-preview';
import { ShareDialog } from './share-dialog';

interface ContentCardProps {
  content: Content & {
    user: {
      id: string;
      name: string;
      email: string;
    };
    shares: (ContentShare & {
      user: {
        id: string;
        name: string;
        email: string;
      };
    })[];
  };
  onShare: (contentId: string, platform: SharePlatform) => void;
  isAdmin?: boolean;
}

export function ContentCard({ content, onShare, isAdmin }: ContentCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const renderContent = () => {
    switch (content.type) {
      case 'IMAGE':
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={content.url}
              alt={content.title}
              fill
              className="object-cover"
            />
          </div>
        );
      case 'VIDEO':
        if (content.url.includes('youtube.com') || content.url.includes('youtu.be')) {
          const videoId = content.url.includes('youtube.com/watch?v=')
            ? content.url.split('v=')[1]?.split('&')[0]
            : content.url.split('youtu.be/')[1]?.split('?')[0];
          return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        } else if (content.url.includes('vimeo.com')) {
          const videoId = content.url.split('vimeo.com/')[1]?.split('?')[0];
          return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                src={`https://player.vimeo.com/video/${videoId}`}
                className="absolute top-0 left-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        } else {
          // Local video
          return (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <video
                src={content.url}
                controls
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          );
        }
      case 'DOCUMENT':
        return <DocumentPreview url={content.url} />;
      case 'TEXT':
      default:
        return (
          <div className="prose prose-sm max-w-none">
            <p>{content.url}</p>
          </div>
        );
    }
  };

  const totalEngagements = content.shares.reduce(
    (sum, share) => sum + share.clicks + share.engagements,
    0
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{content.title}</h3>
              {content.description && (
                <p className="text-sm text-muted-foreground">
                  {content.description}
                </p>
              )}
            </div>
          </div>
          {renderContent()}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              By {content.user.name}
            </div>
            <div>
              {totalEngagements} engagements
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </Button>
          {content.points > 0 && (
            <div className="text-sm font-medium">
              {content.points} points
            </div>
          )}
        </div>
      </CardFooter>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={(platform) => {
          onShare(content.id, platform as SharePlatform);
          setShowShareDialog(false);
        }}
      />
    </Card>
  );
}
