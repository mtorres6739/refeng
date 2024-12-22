import { Share, MoreVertical, Pencil, Trash, FileText } from "lucide-react";
import { ContentItem, ContentType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoEmbed } from "@/components/ui/video-embed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShareDialog } from "@/components/ui/share-dialog";
import { useState } from "react";

interface ContentCardProps {
  content: ContentItem;
  onShare: (content: ContentItem, platform?: string) => void;
  onEdit: (content: ContentItem) => void;
  onDelete: (content: ContentItem) => void;
  isAdmin: boolean;
}

export function ContentCard({ content, onShare, onEdit, onDelete, isAdmin }: ContentCardProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const renderMedia = () => {
    if (content.type === ContentType.VIDEO && content.url) {
      return <VideoEmbed url={content.url} />;
    } else if (content.type === ContentType.DOCUMENT && content.url) {
      return (
        <div className="aspect-video bg-gray-100 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 text-gray-400 mx-auto" />
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(content.url, '_blank')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                View Document
              </Button>
            </div>
          </div>
        </div>
      );
    } else if (content.type === ContentType.TEXT && content.url) {
      return (
        <div className="aspect-video bg-gray-50 flex items-center justify-center p-6 border rounded-t-lg">
          <div className="w-full h-full overflow-auto">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {content.url}
            </p>
          </div>
        </div>
      );
    } else if (content.thumbnail) {
      return (
        <div className="aspect-video bg-gray-100">
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return null;
  };

  const shareCount = content.shares?.length || 0;
  const hasShared = content.shares?.some(share => share.userId === content.user.id) || false;

  const handleShareClick = () => {
    setIsShareDialogOpen(true);
  };

  const handleShare = async (platform: string) => {
    await onShare(content, platform);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {renderMedia()}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
          <p className="text-gray-600 mb-4">{content.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Badge variant={content.active ? "success" : "secondary"}>
                {content.active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">{content.type}</Badge>
              {shareCount > 0 && (
                <Badge variant="secondary">
                  {shareCount} {shareCount === 1 ? "share" : "shares"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={hasShared ? "secondary" : "ghost"}
                      size="icon"
                      onClick={handleShareClick}
                      className={hasShared ? "bg-blue-50" : ""}
                    >
                      <Share className={`h-4 w-4 ${hasShared ? "text-blue-600" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hasShared ? "Share again" : "Share content"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(content)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(content)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        contentUrl={content.url}
        title={content.title}
        onShare={handleShare}
      />
    </>
  );
}
