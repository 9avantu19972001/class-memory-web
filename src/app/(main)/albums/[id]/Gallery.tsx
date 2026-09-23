'use client'

import { useState } from 'react'
import { Play, Heart, MessageCircle, Trash2, Loader2, Image as ImageIcon, Film } from 'lucide-react'
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
  const [mediaTab, setMediaTab] = useState<'all' | 'photo' | 'video'>('all')
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const photoItems = photos.filter((p) => !p.is_video)
  const videoItems = photos.filter((p) => p.is_video)

  const displayedItems =
    mediaTab === 'photo'
      ? photoItems
      : mediaTab === 'video'
      ? videoItems
      : photos

  const handleQuickDelete = async (e: React.MouseEvent, photoId: string, photoAlbumId: string) => {
    e.stopPropagation() // Don't open the modal
    if (!confirm('Bạn có chắc chắn muốn xóa mục này khỏi album?')) return

    setDeletingId(photoId)
    try {
      await deletePhoto(photoId, photoAlbumId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể xóa. Vui lòng thử lại.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Media Type Filter Tabs */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="inline-flex p-1 bg-secondary/50 rounded-xl border border-border text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMediaTab('all')
              setSelectedIndex(-1)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mediaTab === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[11px] opacity-70 bg-secondary px-1.5 py-0.2 rounded-full">
              {photos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMediaTab('photo')
              setSelectedIndex(-1)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mediaTab === 'photo'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>Ảnh</span>
            <span className="text-[11px] opacity-70 bg-secondary px-1.5 py-0.2 rounded-full">
              {photoItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMediaTab('video')
              setSelectedIndex(-1)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mediaTab === 'video'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-red-500" />
            <span>Video</span>
            <span className="text-[11px] opacity-70 bg-secondary px-1.5 py-0.2 rounded-full">
              {videoItems.length}
            </span>
          </button>
        </div>

        {mediaTab === 'video' && videoItems.length > 0 && (
          <span className="text-xs text-foreground/60 hidden sm:inline-block">
            🎬 Bấm vào video để xem toàn màn hình và bình luận
          </span>
        )}
      </div>

      {/* Video-Only Dedicated Grid */}
      {mediaTab === 'video' ? (
        videoItems.length === 0 ? (
          <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border p-6">
            <Film className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
            <h4 className="font-serif font-bold text-foreground text-base">Album này chưa có Video nào</h4>
            <p className="text-xs text-foreground/60 mt-1 max-w-md mx-auto">
              Bạn có thể bấm nút "Tải ảnh/video" ở góc trên để thêm liên kết YouTube cho album này nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videoItems.map((photo, i) => {
              const ytThumbnail = getYouTubeThumbnail(photo.video_url)
              const reactionsCount = photo.reactions?.length || 0
              const commentsCount = photo.comments?.length || 0
              const canDelete = currentUserId && (currentUserId === photo.uploaded_by || isAdmin)
              const targetAlbumId = albumId || photo.album_id

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedIndex(i)}
                  className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  {/* 16:9 Video Thumbnail */}
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {ytThumbnail ? (
                      <img
                        src={ytThumbnail}
                        alt={photo.caption || 'Video kỷ niệm'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-sm">
                        Video YouTube
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-red-600 transition-all">
                        <Play className="w-7 h-7 ml-1 fill-current" />
                      </div>
                    </div>

                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                      YouTube
                    </span>

                    {canDelete && (
                      <button
                        onClick={(e) => handleQuickDelete(e, photo.id, targetAlbumId)}
                        disabled={deletingId === photo.id}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-md"
                        title="Xóa video này"
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Video Info Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {photo.caption || 'Thước phim kỷ niệm 9A'}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-foreground/60 mt-3 pt-2.5 border-t border-border/60">
                      <span className="truncate max-w-[150px]">
                        {photo.uploader?.full_name || 'Thành viên lớp'}
                      </span>
                      <div className="flex items-center gap-2">
                        {reactionsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{reactionsCount}</span>
                          </span>
                        )}
                        {commentsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-blue-500 font-semibold">
                            <MessageCircle className="w-3 h-3" />
                            <span>{commentsCount}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Masonry Grid for All / Photos */
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {displayedItems.map((photo, i) => {
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
                    title="Xóa mục này"
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
      )}

      {/* Interactive Photo/Video Viewer Modal */}
      {selectedIndex >= 0 && displayedItems[selectedIndex] && (
        <PhotoModal
          photo={displayedItems[selectedIndex]}
          albumId={albumId || displayedItems[selectedIndex].album_id}
          currentUserId={currentUserId || null}
          isApproved={isApproved}
          isAdmin={isAdmin}
          onClose={() => setSelectedIndex(-1)}
          onPrev={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setSelectedIndex((prev) => Math.min(displayedItems.length - 1, prev + 1))}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < displayedItems.length - 1}
          currentIndex={selectedIndex}
          totalCount={displayedItems.length}
        />
      )}
    </>
  )
}

