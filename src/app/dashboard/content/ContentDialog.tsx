import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { ContentType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePicker } from "@/components/content/image-picker";
import { VideoPicker } from "@/components/content/video-picker";
import { X } from "lucide-react";
import { FileUpload } from "@/components/content/file-upload";
import { FileText } from "lucide-react";

const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  url: z.string().refine((val) => {
    // For TEXT type, any non-empty string is valid
    // For other types, must be a valid URL
    return val.length > 0;
  }, "Content is required"),
  thumbnail: z.string().optional().or(z.literal("")),
  points: z.coerce.number().min(0),
  active: z.boolean().default(true),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface ContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContentFormValues) => Promise<void>;
  content?: {
    id: string;
    title: string;
    description: string | null;
    type: ContentType;
    url: string;
    thumbnail: string | null;
    points: number;
    active: boolean;
  } | null;
}

export function ContentDialog({
  open,
  onOpenChange,
  onSubmit,
  content,
}: ContentDialogProps) {
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: ContentType.TEXT,
      url: "",
      thumbnail: "",
      points: 0,
      active: true,
    },
  });

  const { isSubmitting } = form.formState;
  const contentType = form.watch("type");

  useEffect(() => {
    if (content && open) {
      form.reset({
        title: content.title,
        description: content.description || "",
        type: content.type,
        url: content.url,
        thumbnail: content.thumbnail || "",
        points: content.points,
        active: content.active,
      });
    } else if (!open) {
      form.reset();
    }
  }, [content, open, form]);

  const handleMediaSelect = (url: string, thumbnail?: string) => {
    if (contentType === ContentType.IMAGE) {
      form.setValue("url", url, { shouldValidate: true });
      form.setValue("thumbnail", url, { shouldValidate: true });
    } else {
      form.setValue("url", url, { shouldValidate: true });
      if (thumbnail) {
        form.setValue("thumbnail", thumbnail, { shouldValidate: true });
      }
    }
  };

  const renderMediaPicker = () => {
    if (contentType === ContentType.VIDEO) {
      return (
        <VideoPicker
          onVideoSelect={handleMediaSelect}
          defaultVideo={content?.url}
          defaultThumbnail={content?.thumbnail || undefined}
        />
      );
    } else if (contentType === ContentType.IMAGE) {
      return (
        <ImagePicker
          onImageSelect={handleMediaSelect}
          defaultImage={content?.url}
        />
      );
    } else if (contentType === ContentType.DOCUMENT) {
      return (
        <div className="space-y-4">
          <div className="flex justify-center">
            {form.watch("url") ? (
              <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <a 
                  href={form.watch("url")} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:underline truncate"
                >
                  {form.watch("url")}
                </a>
              </div>
            ) : (
              <div className="w-full h-[150px] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                  <div className="text-sm text-gray-500">No document selected</div>
                </div>
              </div>
            )}
          </div>
          <FileUpload
            accept=".pdf,.doc,.docx,.txt"
            maxSize={10}
            onUploadComplete={(url) => form.setValue("url", url, { shouldValidate: true })}
          />
          <p className="text-xs text-gray-500">
            Upload a document (PDF, DOC, DOCX, or TXT - max 10MB)
          </p>
        </div>
      );
    } else if (contentType === ContentType.TEXT) {
      return (
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter your text content here..."
                  className="min-h-[200px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] h-[90vh] flex flex-col">
        <div className="absolute right-4 top-4">
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        <DialogHeader>
          <DialogTitle>{content ? "Edit Content" : "Add New Content"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-6">
              <div className="space-y-6">
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
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ContentType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <FormLabel>
                    {contentType === ContentType.VIDEO ? "Video" : contentType === ContentType.IMAGE ? "Image" : contentType === ContentType.TEXT ? "Text" : "Content"}
                  </FormLabel>
                  {renderMediaPicker()}
                </div>
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Points earned when this content is shared
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {content ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
