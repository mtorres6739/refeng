import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentType } from '@prisma/client';
import { toast } from 'sonner';
import { ImagePicker } from './image-picker';
import { VideoPicker } from './video-picker';
import { FileUpload } from './file-upload';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  url: z.string().min(1, 'Content URL is required'),
  thumbnail: z.string().optional(),
  points: z.number().min(0),
});

interface ContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function ContentDialog({
  open,
  onOpenChange,
  content,
  onSubmit,
}: ContentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: content?.title || '',
      description: content?.description || '',
      type: content?.type || 'TEXT',
      url: content?.url || '',
      thumbnail: content?.thumbnail || '',
      points: content?.points || 0,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {content ? 'Edit Content' : 'Add New Content'}
          </DialogTitle>
          <DialogDescription>
            Add shareable content for your users. They'll earn points when they
            share it on social media.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Content Type Field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of content you want to share
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Field */}
            {form.watch('type') === 'TEXT' && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={10}
                        placeholder="Enter your text content here..."
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the text content that will be shared
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('type') === 'IMAGE' && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <ImagePicker
                        onImageSelect={(url) => {
                          field.onChange(url);
                          form.setValue('thumbnail', url);
                        }}
                        defaultImage={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('type') === 'VIDEO' && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video</FormLabel>
                    <FormControl>
                      <VideoPicker
                        onVideoSelect={(url, thumbnailUrl) => {
                          field.onChange(url);
                          if (thumbnailUrl) {
                            form.setValue('thumbnail', thumbnailUrl);
                          }
                        }}
                        defaultVideo={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('type') === 'DOCUMENT' && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document</FormLabel>
                    <FormControl>
                      <FileUpload
                        accept=".pdf,.doc,.docx,.txt"
                        maxSize={10}
                        onUploadComplete={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a document (PDF, DOC, DOCX, or TXT, max 10MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Points Field */}
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of points users will earn for sharing this content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sticky bottom-0 bg-white py-4 mt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : content ? 'Save Changes' : 'Add Content'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
