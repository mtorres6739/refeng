interface VideoEmbedProps {
  url: string;
}

export function VideoEmbed({ url }: VideoEmbedProps) {
  const getVideoId = (url: string) => {
    let videoId = null;
    let platform = null;

    // YouTube
    const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[2].length === 11) {
      videoId = youtubeMatch[2];
      platform = 'youtube';
      return { videoId, platform };
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      videoId = vimeoMatch[1];
      platform = 'vimeo';
      return { videoId, platform };
    }

    // Wistia
    const wistiaRegex = /(?:wistia\.com|wi\.st)\/(?:medias|embed)\/([a-zA-Z0-9]+)/;
    const wistiaMatch = url.match(wistiaRegex);
    if (wistiaMatch) {
      videoId = wistiaMatch[1];
      platform = 'wistia';
      return { videoId, platform };
    }

    // Loom
    const loomRegex = /(?:loom\.com\/share|loom\.com\/embed)\/([a-zA-Z0-9]+)/;
    const loomMatch = url.match(loomRegex);
    if (loomMatch) {
      videoId = loomMatch[1];
      platform = 'loom';
      return { videoId, platform };
    }

    return { videoId: null, platform: null };
  };

  const getEmbedUrl = (videoId: string, platform: string) => {
    switch (platform) {
      case 'youtube':
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${videoId}?dnt=1`;
      case 'wistia':
        return `https://fast.wistia.net/embed/iframe/${videoId}`;
      case 'loom':
        return `https://www.loom.com/embed/${videoId}`;
      default:
        return null;
    }
  };

  const { videoId, platform } = getVideoId(url);

  if (!videoId || !platform) {
    // Fallback for direct embed URLs or unsupported platforms
    try {
      const urlObj = new URL(url);
      if (urlObj.pathname.includes('embed') || urlObj.pathname.includes('player')) {
        return (
          <div className="aspect-video w-full">
            <iframe
              src={url}
              title="Video player"
              frameBorder="0"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        );
      }
    } catch (e) {
      return (
        <div className="aspect-video w-full flex items-center justify-center bg-gray-100 text-gray-500">
          Unsupported video URL
        </div>
      );
    }
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-gray-100 text-gray-500">
        Unsupported video URL
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoId, platform);

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-gray-100 text-gray-500">
        Unsupported video platform
      </div>
    );
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        title="Video player"
        frameBorder="0"
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="w-full h-full"
      />
    </div>
  );
}
