export type SocialPlatform = 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN';

export interface ShareOptions {
  platform: SocialPlatform;
  content: {
    title: string;
    description?: string;
    url: string;
    imageUrl?: string;
  };
  userId: string;
  contentId: string;
}

export interface ShareResult {
  success: boolean;
  url?: string;
  error?: string;
  platformPostId?: string;
}
