'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Play,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Film,
  Sparkles,
  ArrowUpDown,
  Filter,
  Folder,
  Layers,
} from 'lucide-react'
import { getYouTubeThumbnail } from '@/lib/youtube'
import PhotoModal from '@/app/(main)/albums/[id]/PhotoModal'

export interface PhotoTimelineItem {
  id: string
  album_id: string
  storage_path: string
  caption?: string | null
  is_video?: boolean
  video_url?: string | null
  taken_year?: number | null
  taken_month?: number | null
  created_at: string
  uploaded_by?: string
  albums?: {
    id: string
    title: string
    is_public?: boolean
  } | null
  uploader?: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
  comments?: any[]
  reactions?: any[]
}

interface PhotoTimelineViewProps {
  photos: PhotoTimelineItem[]
  currentUserId?: string | null
  isApproved?: boolean
  isAdmin?: boolean
  showAlbumBadge?: boolean
}

// Cột mốc lớp 9A niên khóa 1997 - 2001 và các năm hội ngộ
const YEAR_MILESTONES: Record<
  number,
  { title: string; subtitle: string; icon: string; badgeColor: string }
> = {
  1997: {
    title: 'Tựu trường Lớp 6A (1997 - 1998)',
    subtitle: 'Khởi đầu 4 năm rực rỡ dưới mái trường cấp 2',
    icon: '🎒',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  1998: {
    title: 'Năm học Lớp 7A (1998 - 1999)',
    subtitle: 'Tuổi học trò hồn nhiên, tình bạn bè chớm nở',
    icon: '🌱',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  1999: {
    title: 'Năm học Lớp 8A (1999 - 2000)',
    subtitle: 'Nhiều kỷ niệm sinh hoạt, phong trào thi đua sôi nổi',
    icon: '🌿',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  2000: {
    title: 'Năm học Lớp 9A - Năm cuối cấp (2000 - 2001)',
    subtitle: 'Bước ngoặt thi chuyển cấp và những ngày tháng sát cánh',
    icon: '📚',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  },
  2001: {
    title: 'Tốt nghiệp Niên khóa 1997 - 2001',
    subtitle: 'Lưu bút ngày bế giảng, chia tay mái trường và thầy cô',
    icon: '🎓',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  2011: {
    title: 'Kỷ niệm 10 năm Ra trường (2001 - 2011)',
    subtitle: 'Tròn một thập kỷ hội ngộ, bạn cũ sum vầy',
    icon: '🎉',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  2021: {
    title: 'Kỷ niệm 20 năm Ra trường (2001 - 2021)',
    subtitle: 'Hai thập kỷ trưởng thành, ký ức tuổi thơ vẫn vẹn nguyên',
    icon: '⭐',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  2026: {
    title: 'Đại lễ 25 năm Hội ngộ (2001 - 2026)',
    subtitle: 'Tứ hải quy tụ - Kỷ niệm 25 năm ngày ra trường',
    icon: '🔥',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
}

const getPublicUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`
}

export default function PhotoTimelineView({
  photos,
  currentUserId = null,
  isApproved = false,
  isAdmin = false,
  showAlbumBadge = true,
}: PhotoTimelineViewProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [mediaType, setMediaType] = useState<'all' | 'photo' | 'video'>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [modalIndex, setModalIndex] = useState<number>(-1)

  // 1. Gán năm và tháng tính toán cho từng ảnh
  const processedPhotos = useMemo(() => {
    return photos.map((p) => {
      let calcYear: number = p.taken_year ?? 2001
      if (!p.taken_year && p.created_at) {
        const d = new Date(p.created_at)
        if (!isNaN(d.getTime())) {
          calcYear = d.getFullYear()
        }
      }
      return {
        ...p,
        _year: calcYear,
        _month: p.taken_month ?? null,
      }
    })
  }, [photos])

  // 2. Lấy danh sách các năm xuất hiện và số lượng ảnh
  const yearStats = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of processedPhotos) {
      counts[p._year] = (counts[p._year] || 0) + 1
    }
    const years = Object.keys(counts)
      .map(Number)
      .sort((a, b) => (sortOrder === 'desc' ? b - a : a - b))
    return { counts, years }
  }, [processedPhotos, sortOrder])

  // 3. Lọc theo mediaType và selectedYear
  const filteredPhotos = useMemo(() => {
    return processedPhotos
      .filter((p) => {
        if (mediaType === 'photo' && p.is_video) return false
        if (mediaType === 'video' && !p.is_video) return false
        if (selectedYear !== 'all' && p._year !== Number(selectedYear)) return false
        return true
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          // Năm mới nhất trước
          if (a._year !== b._year) return b._year - a._year
          // Tháng mới nhất trước (tháng null xếp sau)
          const mA = a._month ?? 0
          const mB = b._month ?? 0
          if (mA !== mB) return mB - mA
          // Created at mới nhất trước
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        } else {
          // Cũ nhất trước
          if (a._year !== b._year) return a._year - b._year
          const mA = a._month ?? 13
          const mB = b._month ?? 13
          if (mA !== mB) return mA - mB
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
      })
  }, [processedPhotos, mediaType, selectedYear, sortOrder])

  // 4. Nhóm ảnh theo từng năm để render trên giao diện dòng thời gian
  const groupedByYear = useMemo(() => {
    const groups: { year: number; items: typeof filteredPhotos }[] = []
    const map = new Map<number, typeof filteredPhotos>()

    for (const item of filteredPhotos) {
      const list = map.get(item._year) || []
      list.push(item)
      map.set(item._year, list)
    }

    const sortedYears = Array.from(map.keys()).sort((a, b) =>
      sortOrder === 'desc' ? b - a : a - b
    )

    for (const year of sortedYears) {
      groups.push({
        year,
        items: map.get(year) || [],
      })
    }

    return groups
  }, [filteredPhotos, sortOrder])

  const photoCount = useMemo(() => photos.filter((p) => !p.is_video).length, [photos])
  const videoCount = useMemo(() => photos.filter((p) => p.is_video).length, [photos])

  return (
    <div className="w-full">
      {/* Thanh điều khiển trên cùng: Lọc dạng media, sắp xếp, tổng quan */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Bộ lọc loại Kỷ niệm */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-secondary/50 rounded-xl border border-border text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMediaType('all')
                setModalIndex(-1)
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mediaType === 'all'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tất cả ({photos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('photo')
                setModalIndex(-1)
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mediaType === 'photo'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Ảnh ({photoCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('video')
                setModalIndex(-1)
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mediaType === 'video'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span>Video ({videoCount})</span>
            </button>
          </div>
        </div>

        {/* Nút đảo thứ tự thời gian: Mới nhất -> Cũ nhất hoặc ngược lại */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-border bg-background hover:bg-secondary/40 text-foreground transition-colors font-medium shadow-sm"
            title="Đổi thứ tự sắp xếp"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
            <span>
              {sortOrder === 'desc' ? 'Mới nhất trước (Mặc định)' : 'Cũ nhất trước'}
            </span>
          </button>
        </div>
      </div>

      {/* Thanh chọn nhanh Năm (Year Pills Carousel/Filter) */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Lọc nhanh theo năm kỷ niệm:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedYear === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-foreground hover:bg-secondary/50 border-border'
            }`}
          >
            Tất cả các năm ({photos.length})
          </button>

          {yearStats.years.map((year) => {
            const count = yearStats.counts[year]
            const milestone = YEAR_MILESTONES[year]
            const isSelected = selectedYear === year.toString()

            return (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year.toString())}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground hover:bg-secondary/50 border-border'
                }`}
              >
                {milestone?.icon && <span className="text-xs">{milestone.icon}</span>}
                <span>{year}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Danh sách Dòng thời gian từng năm */}
      {groupedByYear.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-dashed border-border p-6">
          <div className="p-4 bg-primary/10 rounded-full mb-3 text-primary">
            <ImageIcon className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-serif font-bold text-foreground">Không tìm thấy ảnh hoặc video</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Chưa có kỷ niệm nào phù hợp với bộ lọc đã chọn. Hãy chọn năm khác hoặc tải thêm kỷ niệm vào các Album nhé!
          </p>
        </div>
      ) : (
        <div className="relative space-y-12 before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-border/70 before:hidden md:before:block">
          {groupedByYear.map((group) => {
            const milestone = YEAR_MILESTONES[group.year]

            return (
              <section key={group.year} className="relative md:pl-14">
                {/* Node biểu tượng trên thanh dòng thời gian (Desktop) */}
                <div className="hidden md:flex absolute -left-[3px] top-3 w-8 h-8 rounded-full bg-background border-2 border-primary items-center justify-center text-sm shadow-sm z-10">
                  {milestone?.icon || '📅'}
                </div>

                {/* Banner Tiêu đề Năm & Cột Mốc */}
                <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm mb-5 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary font-serif font-bold text-xl shrink-0">
                        {group.year}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                            {milestone?.title || `Năm kỷ niệm ${group.year}`}
                          </h2>
                          {milestone && (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${milestone.badgeColor}`}
                            >
                              Mốc son 9A
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {milestone?.subtitle || `Lưu giữ ${group.items.length} khoảnh khắc`}
                        </p>
                      </div>
                    </div>
                    <div className="self-start sm:self-auto px-3 py-1 bg-secondary/60 rounded-full text-xs font-semibold text-foreground border border-border/50">
                      {group.items.length} kỷ niệm
                    </div>
                  </div>
                </div>

                {/* Grid Ảnh & Video của năm */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {group.items.map((item) => {
                    // Tìm index toàn cục trong filteredPhotos để hỗ trợ PhotoModal prev/next
                    const globalIdx = filteredPhotos.findIndex((p) => p.id === item.id)

                    const isVideo = item.is_video
                    const thumbUrl =
                      (isVideo
                        ? getYouTubeThumbnail(item.video_url || '')
                        : getPublicUrl(item.storage_path)) || ''

                    const reactionsCount = (item.reactions || []).length
                    const commentsCount = (item.comments || []).length

                    return (
                      <div
                        key={item.id}
                        onClick={() => setModalIndex(globalIdx)}
                        className="group relative aspect-square bg-secondary/30 rounded-xl overflow-hidden border border-border cursor-pointer shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
                      >
                        <img
                          src={thumbUrl}
                          alt={item.caption || `Kỷ niệm năm ${group.year}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Video Indicator */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                            <div className="bg-red-600 text-white rounded-full p-2.5 shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}

                        {/* Top Left Badges: Month or Video tag */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {item._month && (
                            <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-semibold">
                              <Calendar className="w-2.5 h-2.5 text-primary" />
                              <span>Tháng {item._month}</span>
                            </span>
                          )}
                        </div>

                        {/* Top Right Badges: Reactions & Comments */}
                        {(reactionsCount > 0 || commentsCount > 0) && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                            {reactionsCount > 0 && (
                              <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                                <Heart className="w-2.5 h-2.5 text-red-500 fill-current" />
                                <span>{reactionsCount}</span>
                              </span>
                            )}
                            {commentsCount > 0 && (
                              <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                                <MessageCircle className="w-2.5 h-2.5 text-blue-400" />
                                <span>{commentsCount}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom Overlay: Album Badge & Caption */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 flex flex-col justify-end">
                          {item.caption && (
                            <p className="text-white text-[11px] line-clamp-1 font-medium mb-1 drop-shadow-sm">
                              {item.caption}
                            </p>
                          )}
                          {showAlbumBadge && item.albums?.title && (
                            <div className="flex items-center gap-1 text-[10px] text-white/80 line-clamp-1">
                              <Folder className="w-3 h-3 shrink-0 text-amber-400" />
                              <span className="truncate">{item.albums.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Modal xem chi tiết ảnh / video & tương tác */}
      {modalIndex >= 0 && filteredPhotos[modalIndex] && (
        <PhotoModal
          photo={filteredPhotos[modalIndex]}
          albumId={filteredPhotos[modalIndex].album_id}
          currentUserId={currentUserId}
          isApproved={isApproved}
          isAdmin={isAdmin}
          onClose={() => setModalIndex(-1)}
          onPrev={() => setModalIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setModalIndex((prev) => Math.min(filteredPhotos.length - 1, prev + 1))}
          hasPrev={modalIndex > 0}
          hasNext={modalIndex < filteredPhotos.length - 1}
          currentIndex={modalIndex}
          totalCount={filteredPhotos.length}
        />
      )}
    </div>
  )
}
