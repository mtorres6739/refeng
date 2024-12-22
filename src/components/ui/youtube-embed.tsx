interface YouTubeEmbedProps {
  url: string;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  // Build the embed URL with privacy-enhanced mode and minimal required features
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="w-full h-full"
      />
    </div>
  );
}
