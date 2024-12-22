import { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
  userId: string;
}

interface NoteItemProps {
  note: Note;
  referralId: string;
  currentUserId: string;
  isOrgMember: boolean;
  isSuperAdmin: boolean;
  onNoteUpdated: () => void;
}

export function NoteItem({ 
  note, 
  referralId, 
  currentUserId, 
  isOrgMember,
  isSuperAdmin,
  onNoteUpdated 
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [editedIsInternal, setEditedIsInternal] = useState(note.isInternal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = isSuperAdmin || isOrgMember || note.userId === currentUserId;

  const handleSave = async () => {
    if (!editedContent.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/referrals/${referralId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId: note.id,
          content: editedContent,
          isInternal: editedIsInternal,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update note');
      }

      setIsEditing(false);
      onNoteUpdated();
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/referrals/${referralId}/notes?noteId=${note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete note');
      }

      onNoteUpdated();
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={note.isInternal ? 'border-yellow-200 bg-yellow-50' : ''}>
      <CardHeader className="py-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="font-medium">{note.user.name}</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
            </span>
            {note.isInternal && (
              <Badge variant="warning" className="bg-yellow-200 text-yellow-800">
                Internal
              </Badge>
            )}
          </div>
          {canEdit && !isEditing && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-3">
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editedIsInternal}
                  onChange={(e) => setEditedIsInternal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Internal Note</span>
              </label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSubmitting || !editedContent.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{note.content}</p>
        )}
      </CardContent>
    </Card>
  );
}
