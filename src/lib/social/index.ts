import { ShareOptions, ShareResult, SocialPlatform } from './types';
import { shareToFacebook } from './facebook';
import { shareToTwitter } from './twitter';
import { prisma } from '../prisma';

export async function shareContent(options: ShareOptions): Promise<ShareResult> {
  try {
    // Add UTM parameters for tracking
    const trackingUrl = addUtmParameters(options.content.url, options.platform);
    const shareOptions = {
      ...options,
      content: {
        ...options.content,
        url: trackingUrl,
      },
    };

    // Share to the selected platform
    const result = await shareToPlatform(shareOptions);

    if (result.success) {
      // Record the share in the database
      await prisma.share.create({
        data: {
          platform: options.platform,
          url: result.url,
          platformPostId: result.platformPostId,
          userId: options.userId,
          contentId: options.contentId,
          status: 'SUCCESS',
        },
      });
    }

    return result;
  } catch (error) {
    console.error('Sharing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share content',
    };
  }
}

async function shareToPlatform(options: ShareOptions): Promise<ShareResult> {
  switch (options.platform) {
    case 'FACEBOOK':
      return shareToFacebook(options);
    case 'TWITTER':
      return shareToTwitter(options);
    case 'LINKEDIN':
      // TODO: Implement LinkedIn sharing
      return { success: false, error: 'LinkedIn sharing not implemented yet' };
    case 'INSTAGRAM':
      // TODO: Implement Instagram sharing
      return { success: false, error: 'Instagram sharing not implemented yet' };
    default:
      return { success: false, error: 'Unsupported platform' };
  }
}

function addUtmParameters(url: string, platform: SocialPlatform): string {
  const baseUrl = new URL(url);
  
  // Add UTM parameters
  baseUrl.searchParams.set('utm_source', platform.toLowerCase());
  baseUrl.searchParams.set('utm_medium', 'social');
  baseUrl.searchParams.set('utm_campaign', 'referral_program');
  
  return baseUrl.toString();
}
