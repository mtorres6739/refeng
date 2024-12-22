import { ShareOptions, ShareResult } from './types';
import { TwitterApi } from 'twitter-api-v2';

export async function shareToTwitter(options: ShareOptions): Promise<ShareResult> {
  try {
    // Get user's Twitter access token from your database
    const tokens = await getTwitterTokens(options.userId);
    
    if (!tokens) {
      return {
        success: false,
        error: 'User not connected to Twitter',
      };
    }

    const client = new TwitterApi({
      appKey: process.env.TWITTER_CLIENT_ID!,
      appSecret: process.env.TWITTER_CLIENT_SECRET!,
      accessToken: tokens.accessToken,
      accessSecret: tokens.accessTokenSecret,
    });

    // Format the content for Twitter (280 characters max)
    const title = options.content.title.substring(0, 100);
    const description = options.content.description?.substring(0, 100) || '';
    const tweetText = `${title}\n\n${description}\n\n${options.content.url}`;

    // Post tweet
    const tweet = await client.v2.tweet(tweetText);

    return {
      success: true,
      platformPostId: tweet.data.id,
      url: `https://twitter.com/user/status/${tweet.data.id}`,
    };
  } catch (error) {
    console.error('Twitter sharing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share to Twitter',
    };
  }
}

interface TwitterTokens {
  accessToken: string;
  accessTokenSecret: string;
}

async function getTwitterTokens(userId: string): Promise<TwitterTokens | null> {
  // TODO: Implement this function to retrieve the user's Twitter tokens
  // This would typically involve:
  // 1. Checking your database for stored tokens
  // 2. Refreshing the token if needed
  // 3. Returning the valid tokens
  return null;
}
