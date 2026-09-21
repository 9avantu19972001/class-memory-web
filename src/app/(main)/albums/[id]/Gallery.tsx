'use client'

import { useState } from 'react'
import Lightbox from "yet-another-react-lightbox"
import Video from "yet-another-react-lightbox/plugins/video"
import "yet-another-react-lightbox/styles.css"
import { Play } from 'lucide-react'

// Convert storage path to public URL
const getPublicUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`
}

export default function Gallery({ photos }: { photos: any[] }) {
  const [index, setIndex] = useState(-1)

  const slides = photos.map(photo => {
    if (photo.is_video) {
      // For youtube
      return {
        type: "video" as const,
        sources: [
          {
            src: photo.video_url,
            type: "video/mp4", // This might need custom handling for youtube in lightbox, but let's stick to basic for now or use iframe
          }
        ],
        // fallback iframe rendering for custom slide
        isYoutube: true,
        youtubeId: new URL(photo.video_url).searchParams.get('v')
      }
    }
    return {
      src: getPublicUrl(photo.storage_path),
      description: photo.caption
    }
  })

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {photos.map((photo, i) => (
          <div 
            key={photo.id} 
            className="break-inside-avoid relative group cursor-pointer bg-secondary/20 rounded-xl overflow-hidden border border-border"
            onClick={() => setIndex(i)}
          >
            {photo.is_video ? (
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <img 
                  src={`https://img.youtube.com/vi/${new URL(photo.video_url).searchParams.get('v')}/hqdefault.jpg`}
                  className="w-full h-full object-cover opacity-70"
                  alt="Video thumbnail"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 text-white rounded-full p-3 bg-opacity-80 group-hover:bg-opacity-100 transition-all group-hover:scale-110">
                    <Play className="w-6 h-6 ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={getPublicUrl(photo.storage_path)} 
                alt={photo.caption || "Kỷ niệm lớp 9A"}
                {...(i === 0 ? { fetchPriority: 'high' } : { loading: 'lazy', decoding: 'async' })}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm line-clamp-2 font-medium">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Video]}
        render={{
          slide: ({ slide }) => {
            // @ts-ignore
            if (slide.isYoutube) {
              return (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <iframe 
                    className="w-full max-w-4xl aspect-video rounded-xl"
                    // @ts-ignore
                    src={`https://www.youtube.com/embed/${slide.youtubeId}?autoplay=1`} 
                    allow="autoplay; encrypted-media" 
                    allowFullScreen
                  />
                </div>
              )
            }
            return undefined // Use default render for images
          }
        }}
      />
    </>
  )
}
