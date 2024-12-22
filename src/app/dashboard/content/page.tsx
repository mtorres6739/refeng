'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole, ContentType } from '@prisma/client';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ContentCard } from './ContentCard';
import { ContentDialog } from './ContentDialog';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  url: string;
  thumbnail: string | null;
  points: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  shares: ContentShare[];
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
}

interface ContentShare {
  id: string;
  contentId: string;
  userId: string;
  createdAt: string;
}

export default function ContentPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState({
    type: '_all',
    search: '',
  });

  const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.SUPER_ADMIN;

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      // Build query params
      const params = new URLSearchParams();
      if (filter.type && filter.type !== '_all') params.append('type', filter.type);
      if (filter.search) params.append('search', filter.search);
      // Add cache-busting parameter
      params.append('_t', Date.now().toString());

      const url = `/api/content?${params}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || 'Failed to fetch content');
      }

      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast({
        description: 'Failed to fetch content',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchContent();
    }
  }, [session, filter]);

  const handleCreateSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || 'Failed to create content');
      }

      await fetchContent();
      setIsDialogOpen(false);
      toast({
        description: 'Content created successfully',
      });
    } catch (error) {
      console.error('Failed to create content:', error);
      toast({
        description: 'Failed to create content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async (content: ContentItem, platform: string = "OTHER") => {
    try {
      const response = await fetch(`/api/content/${content.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: platform.toUpperCase(),
          shareUrl: content.url,
          trackingId: `${content.id}-${Date.now()}`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to share content");
      }

      const share = await response.json();
      toast({
        description: "Content shared successfully!",
      });
      
      // Refresh content to show updated share status
      await fetchContent();
    } catch (error) {
      console.error("Failed to share content:", error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to share content",
      });
    }
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/content/${editingContent?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || 'Failed to update content');
      }

      await fetchContent();
      setIsEditDialogOpen(false);
      setEditingContent(null);
      toast({
        description: 'Content updated successfully',
      });
    } catch (error) {
      console.error('Failed to update content:', error);
      toast({
        description: 'Failed to update content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (content: ContentItem) => {
    setContentToDelete(content);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contentToDelete) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/content/${contentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || 'Failed to delete content');
      }

      await fetchContent();
      setIsDeleteConfirmOpen(false);
      setContentToDelete(null);
      toast({
        description: 'Content deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast({
        description: 'Failed to delete content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContent = content.filter((item) => {
    if (filter.type !== '_all' && item.type !== filter.type) {
      return false;
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        (item.description?.toLowerCase() || '').includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Content Library</h1>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Content
          </Button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search content..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>
        <Select
          value={filter.type}
          onValueChange={(value) => setFilter({ ...filter, type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Types</SelectItem>
            {Object.values(ContentType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No content found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <ContentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateSubmit}
      />

      <ContentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditSubmit}
        content={editingContent}
      />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this content item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
