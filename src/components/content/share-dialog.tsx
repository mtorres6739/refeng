import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Facebook, Linkedin, Twitter } from "lucide-react";
import { SharePlatform } from "@prisma/client";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (platform: SharePlatform) => void;
}

export function ShareDialog({ open, onOpenChange, onShare }: ShareDialogProps) {
  const shareButtons = [
    {
      platform: SharePlatform.FACEBOOK,
      icon: Facebook,
      label: "Facebook",
      className: "bg-blue-600 hover:bg-blue-700",
    },
    {
      platform: SharePlatform.TWITTER,
      icon: Twitter,
      label: "Twitter",
      className: "bg-sky-500 hover:bg-sky-600",
    },
    {
      platform: SharePlatform.LINKEDIN,
      icon: Linkedin,
      label: "LinkedIn",
      className: "bg-blue-500 hover:bg-blue-600",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Content</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          {shareButtons.map(({ platform, icon: Icon, label, className }) => (
            <Button
              key={platform}
              onClick={() => onShare(platform)}
              className={className}
            >
              <Icon className="mr-2 h-4 w-4" />
              Share on {label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
