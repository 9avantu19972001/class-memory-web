'use client'

import { useState } from 'react'
import { Play, Heart, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import { getYouTubeThumbnail } from '@/lib/youtube'
import PhotoModal from './PhotoModal'
import { deletePhoto } from '../actions'
import { useRouter } from 'next/navigation'

const getPublicUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`
}

export default function Gallery({
  photos,
  albumId,
  currentUserId,
  isApproved = false,
  isAdmin = false,
}: {
  photos: any[]
  albumId?: string
  currentUserId?: string | null
  isApproved?: boolean
  isAdmin?: boolean
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleQuickDelete = async (e: React.MouseEvent, photoId: string, photoAlbumId: string) => {
    e.stopPropagation() // Don't open the modal
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi album?')) return

    setDeletingId(photoId)
    try {
      await deletePhoto(photoId, photoAlbumId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể xóa ảnh. Vui lòng thử lại.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {photos.map((photo, i) => {
          const ytThumbnail = photo.is_video ? getYouTubeThumbnail(photo.video_url) : null
          const reactionsCount = photo.reactions?.length || 0
          const commentsCount = photo.comments?.length || 0
          const canDelete = currentUserId && (currentUserId === photo.uploaded_by || isAdmin)
          const targetAlbumId = albumId || photo.album_id

          return (
            <div
              key={photo.id}
              className="break-inside-avoid relative group cursor-pointer bg-secondary/20 rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => setSelectedIndex(i)}
            >
              {photo.is_video ? (
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {ytThumbnail ? (
                    <img
                      src={ytThumbnail}
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                      alt={photo.caption || 'Video kỷ niệm'}
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
                  alt={photo.caption || 'Kỷ niệm lớp 9A'}
                  {...(i === 0 ? { fetchPriority: 'high' } : { loading: 'lazy', decoding: 'async' })}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Quick Delete Button on Hover */}
              {canDelete && (
                <button
                  onClick={(e) => handleQuickDelete(e, photo.id, targetAlbumId)}
                  disabled={deletingId === photo.id}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-md"
                  title="Xóa ảnh này"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Badges Overlay (Reactions & Comments count) */}
              {(reactionsCount > 0 || commentsCount > 0) && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  {reactionsCount > 0 && (
                    <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <Heart className="w-3 h-3 text-red-500 fill-current" />
                      <span>{reactionsCount}</span>
                    </span>
                  )}
                  {commentsCount > 0 && (
                    <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                      <MessageCircle className="w-3 h-3 text-blue-400" />
                      <span>{commentsCount}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Caption Overlay */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs line-clamp-2 font-medium">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Interactive Photo Viewer Modal */}
      {selectedIndex >= 0 && photos[selectedIndex] && (
        <PhotoModal
          photo={photos[selectedIndex]}
          albumId={albumId || photos[selectedIndex].album_id}
          currentUserId={currentUserId || null}
          isApproved={isApproved}
          isAdmin={isAdmin}
          onClose={() => setSelectedIndex(-1)}
          onPrev={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setSelectedIndex((prev) => Math.min(photos.length - 1, prev + 1))}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
          currentIndex={selectedIndex}
          totalCount={photos.length}
        />
      )}
    </>
  )
}
