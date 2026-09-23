'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Film,
  Play,
  Heart,
  MessageCircle,
  Search,
  Folder,
  User,
  Calendar,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { getYouTubeThumbnail } from '@/lib/youtube'
import PhotoModal from '../albums/[id]/PhotoModal'
import { deletePhoto } from '../albums/actions'
import AddVideoModal from './AddVideoModal'

export interface VideoItem {
  id: string
  album_id: string
  uploaded_by: string
  is_video: boolean
  video_url: string
  caption: string | null
  created_at: string
  storage_path: string
  uploader?: {
    full_name: string | null
    avatar_url: string | null
  } | null
  albums?: {
    id: string
    title: string
  } | null
  comments?: any[]
  reactions?: any[]
}

interface VideosListProps {
  videos: VideoItem[]
  albums: { id: string; title: string }[]
  currentUserId: string | null
  isLoggedIn: boolean
  isApproved: boolean
  isAdmin: boolean
}

export default function VideosList({
  videos,
  albums,
  currentUserId,
  isLoggedIn,
  isApproved,
  isAdmin,
}: VideosListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('all')
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleQuickDelete = async (e: React.MouseEvent, videoId: string, albumId: string) => {
    e.stopPropagation()
    if (!confirm('Bạn có chắc chắn muốn xóa video này?')) return

    setDeletingId(videoId)
    try {
      await deletePhoto(videoId, albumId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể xóa video. Vui lòng thử lại.')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter videos by search keyword and selected album
  const filteredVideos = videos.filter((video) => {
    const term = searchTerm.toLowerCase().trim()
    const matchTerm =
      !term ||
      video.caption?.toLowerCase().includes(term) ||
      video.uploader?.full_name?.toLowerCase().includes(term) ||
      video.albums?.title?.toLowerCase().includes(term)

    const matchAlbum =
      selectedAlbumFilter === 'all' || video.album_id === selectedAlbumFilter

    return matchTerm && matchAlbum
  })

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Album Chips */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3.5 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên video, album, người đăng..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground shadow-2xs"
          />
        </div>

        {/* Album Filter Chips */}
        {albums.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedAlbumFilter('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedAlbumFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                  : 'bg-secondary/60 text-foreground/70 hover:bg-secondary border border-border'
              }`}
            >
              Tất cả ({videos.length})
            </button>
            {albums.map((album) => {
              const albumVideoCount = videos.filter((v) => v.album_id === album.id).length
              if (albumVideoCount === 0) return null
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => setSelectedAlbumFilter(album.id)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedAlbumFilter === album.id
                      ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                      : 'bg-secondary/60 text-foreground/70 hover:bg-secondary border border-border'
                  }`}
                >
                  {album.title} ({albumVideoCount})
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredVideos.map((video, index) => {
            const ytThumbnail = getYouTubeThumbnail(video.video_url)
            const reactionsCount = video.reactions?.length || 0
            const commentsCount = video.comments?.length || 0
            const canDelete =
              currentUserId && (currentUserId === video.uploaded_by || isAdmin)
            const createdDate = video.created_at
              ? new Date(video.created_at).toLocaleDateString('vi-VN')
              : null

            return (
              <div
                key={video.id}
                onClick={() => setSelectedIndex(index)}
                className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* 16:9 Video Player Card Thumbnail */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {ytThumbnail ? (
                    <img
                      src={ytThumbnail}
                      alt={video.caption || 'Video kỷ niệm'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-sm">
                      Video YouTube
                    </div>
                  )}

                  {/* Red Play Button with Glow */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-115 group-hover:bg-red-500 transition-all duration-300">
                      <Play className="w-7 h-7 ml-1 fill-current" />
                    </div>
                  </div>

                  {/* YouTube Tag Top Left */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                    YouTube
                  </span>

                  {/* Quick Delete for owner / admin */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickDelete(e, video.id, video.album_id)}
                      disabled={deletingId === video.id}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-md cursor-pointer"
                      title="Xóa video này"
                    >
                      {deletingId === video.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Stats overlay bottom */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                    {reactionsCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <Heart className="w-3 h-3 text-red-500 fill-current" />
                        <span>{reactionsCount}</span>
                      </span>
                    )}
                    {commentsCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <MessageCircle className="w-3 h-3 text-blue-400" />
                        <span>{commentsCount}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Album Badge */}
                    {video.albums && (
                      <div className="mb-2">
                        <Link
                          href={`/albums/${video.albums.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground px-2.5 py-0.5 rounded-md transition-colors"
                        >
                          <Folder className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{video.albums.title}</span>
                        </Link>
                      </div>
                    )}

                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {video.caption || 'Thước phim kỷ niệm Lớp 9A'}
                    </h3>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-xs text-foreground/60 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      {video.uploader?.avatar_url ? (
                        <img
                          src={video.uploader.avatar_url}
                          alt={video.uploader.full_name || ''}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                      )}
                      <span className="truncate font-medium">
                        {video.uploader?.full_name || 'Thành viên'}
                      </span>
                    </div>

                    {createdDate && (
                      <div className="flex items-center gap-1 text-[11px] text-foreground/50 shrink-0">
                        <Calendar className="w-3 h-3" />
                        <span>{createdDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border p-6 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-foreground">
            {searchTerm || selectedAlbumFilter !== 'all'
              ? 'Không tìm thấy video nào phù hợp'
              : 'Chưa có thước phim kỷ niệm nào'}
          </h3>
          <p className="text-foreground/60 text-xs sm:text-sm mt-2 max-w-md">
            {searchTerm || selectedAlbumFilter !== 'all'
              ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lọc tất cả album.'
              : 'Những đoạn clip họp lớp, văn nghệ hay video tư liệu tuổi học trò sẽ làm sống dậy những khoảnh khắc quý giá nhất. Hãy là người đầu tiên chia sẻ nhé!'}
          </p>
          <div className="mt-6">
            <AddVideoModal
              albums={albums}
              isLoggedIn={isLoggedIn}
              isApproved={isApproved}
            />
          </div>
        </div>
      )}

      {/* Fullscreen Video Modal with Player, Comments & Reactions */}
      {selectedIndex >= 0 && filteredVideos[selectedIndex] && (
        <PhotoModal
          photo={filteredVideos[selectedIndex]}
          albumId={filteredVideos[selectedIndex].album_id}
          currentUserId={currentUserId}
          isApproved={isApproved}
          isAdmin={isAdmin}
          onClose={() => setSelectedIndex(-1)}
          onPrev={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setSelectedIndex((prev) => Math.min(filteredVideos.length - 1, prev + 1))}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filteredVideos.length - 1}
          currentIndex={selectedIndex}
          totalCount={filteredVideos.length}
        />
      )}
    </div>
  )
}
