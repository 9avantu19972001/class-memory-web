'use client'

import { useState } from 'react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { Play } from 'lucide-react'
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'

// Convert storage path to public URL
const getPublicUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`
}

export default function Gallery({ photos }: { photos: any[] }) {
  const [index, setIndex] = useState(-1)

  const slides = photos.map(photo => {
    if (photo.is_video) {
      const ytId = getYouTubeId(photo.video_url)
      return {
        type: "custom-youtube" as const,
        youtubeId: ytId,
        videoUrl: photo.video_url,
        description: photo.caption
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
        {photos.map((photo, i) => {
          const ytThumbnail = photo.is_video ? getYouTubeThumbnail(photo.video_url) : null

          return (
            <div 
              key={photo.id} 
              className="break-inside-avoid relative group cursor-pointer bg-secondary/20 rounded-xl overflow-hidden border border-border"
              onClick={() => setIndex(i)}
            >
              {photo.is_video ? (
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {ytThumbnail ? (
                    <img 
                      src={ytThumbnail}
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                      alt={photo.caption || "Video kỷ niệm"}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-sm">
                      Video YouTube
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 text-white rounded-full p-3.5 bg-opacity-90 group-hover:bg-opacity-100 transition-all group-hover:scale-110 shadow-lg">
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
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
          )
        })}
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides as any}
        render={{
          slide: ({ slide }: { slide: any }) => {
            if (slide.type === "custom-youtube") {
              const ytId = slide.youtubeId
              if (!ytId) {
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                    <p className="mb-3 text-lg">Đường link video không hợp lệ.</p>
                    {slide.videoUrl && (
                      <a 
                        href={slide.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline font-medium"
                      >
                        Bấm vào đây để mở trên YouTube
                      </a>
                    )}
                  </div>
                )
              }

              return (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto">
                  <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/20">
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`} 
                      title="YouTube video player" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                    />
                  </div>
                  {slide.description && (
                    <p className="text-white text-center mt-4 text-base font-medium bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10">
                      {slide.description}
                    </p>
                  )}
                </div>
              )
            }
            return undefined // Use default render for regular photos
          }
        }}
      />
    </>
  )
}
