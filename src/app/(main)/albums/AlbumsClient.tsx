'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Folder, Clock, Image as ImageIcon } from 'lucide-react'
import CreateAlbumModal from './CreateAlbumModal'
import { getYouTubeThumbnail } from '@/lib/youtube'
import PhotoTimelineView, { PhotoTimelineItem } from '@/components/PhotoTimelineView'

interface AlbumsClientProps {
  albums: any[]
  photos: PhotoTimelineItem[]
  isLoggedIn: boolean
  isApproved: boolean
  isAdmin: boolean
  currentUserId: string | null
}

export default function AlbumsClient({
  albums,
  photos,
  isLoggedIn,
  isApproved,
  isAdmin,
  currentUserId,
}: AlbumsClientProps) {
  const [activeTab, setActiveTab] = useState<'albums' | 'timeline'>('albums')

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Kho Kỷ Niệm Lớp 9A
          </h1>
          <p className="text-foreground/70 text-xs sm:text-sm mt-1">
            Lưu giữ và ngắm nhìn những khoảnh khắc thanh xuân vô giá
          </p>
        </div>
        <div className="self-stretch sm:self-auto flex items-center justify-end">
          <CreateAlbumModal isLoggedIn={isLoggedIn} isApproved={isApproved} />
        </div>
      </div>

      {/* Chuyển đổi Tab: Theo Bộ Sưu Tập vs Theo Dòng Thời Gian */}
      <div className="flex border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('albums')}
          className={`flex items-center gap-2 px-4 py-3 font-serif font-semibold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
            activeTab === 'albums'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Bộ sưu tập Album ({albums.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-3 font-serif font-semibold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dòng thời gian ảnh ({photos.length})</span>
        </button>
      </div>

      {/* Tab 1: Danh sách Albums */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          {albums.map((album, idx) => {
            const photoList = album.photos || []
            const photoCount = photoList.length
            const firstPhoto = photoList[0]

            let coverUrl = album.cover_photo_url
            if (!coverUrl && firstPhoto) {
              if (firstPhoto.is_video && firstPhoto.video_url) {
                coverUrl = getYouTubeThumbnail(firstPhoto.video_url)
              } else if (firstPhoto.storage_path) {
                coverUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${firstPhoto.storage_path}`
              }
            }

            return (
              <Link key={album.id} href={`/albums/${album.id}`} className="group block">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/50 flex flex-col h-full">
                  <div className="aspect-[4/3] bg-secondary/30 relative flex items-center justify-center overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`Ảnh bìa album ${album.title}`}
                        {...(idx === 0
                          ? { fetchPriority: 'high' }
                          : { loading: 'lazy', decoding: 'async' })}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-primary/40" />
                    )}
                    <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-foreground">
                      {photoCount} mục
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-foreground font-serif text-lg line-clamp-1">
                      {album.title}
                    </h3>
                    <p className="text-sm text-foreground/70 line-clamp-2 mt-1 flex-1">
                      {album.description || 'Không có mô tả'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}

          {albums.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-dashed border-border">
              <ImageIcon className="w-16 h-16 text-primary/30 mb-4" />
              <h3 className="text-xl font-serif font-bold text-foreground">Chưa có album nào</h3>
              <p className="text-foreground/70 mt-2 mb-6">
                Hãy là người đầu tiên tạo album chia sẻ kỷ niệm nhé!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dòng thời gian ảnh từ mới đến cũ */}
      {activeTab === 'timeline' && (
        <PhotoTimelineView
          photos={photos}
          currentUserId={currentUserId}
          isApproved={isApproved}
          isAdmin={isAdmin}
          showAlbumBadge={true}
        />
      )}
    </main>
  )
}
