function getEmbedUrl(url: string): { type: 'youtube' | 'vimeo' | null; embedUrl: string | null } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:event\/)?(\d+)/)
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    }
  }

  return { type: null, embedUrl: null }
}

export default function VideoPlayer({ url }: { url: string }) {
  const { embedUrl } = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-slate-800 flex items-center justify-center rounded-xl">
        <p className="text-slate-400 text-sm">지원하지 않는 영상 URL입니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
