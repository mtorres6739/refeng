"use client";

import * as React from "react";
import { Copy, Facebook, Link, Linkedin, Twitter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentUrl: string;
  title: string;
  onShare: (platform: string) => Promise<void>;
}

export function ShareDialog({ isOpen, onClose, contentUrl, title, onShare }: ShareDialogProps) {
  const shareUrl = contentUrl;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        description: "Link copied to clipboard!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy link",
      });
    }
  };

  const handleShare = async (platform: string) => {
    await onShare(platform);
    
    let shareLink = "";
    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share content</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            value={shareUrl}
            readOnly
            className="flex-1"
          />
          <Button size="icon" variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare("twitter")}
            className="hover:bg-[#1DA1F2] hover:text-white"
          >
            <Twitter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare("facebook")}
            className="hover:bg-[#4267B2] hover:text-white"
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare("linkedin")}
            className="hover:bg-[#0077B5] hover:text-white"
          >
            <Linkedin className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="hover:bg-gray-100"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
