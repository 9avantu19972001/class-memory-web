'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Heart,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  Clock,
  User,
} from 'lucide-react'
import {
  ACADEMIC_YEARS,
  AcademicYearConfig,
  getYearConfig,
  getCategoryConfig,
} from './timeline-constants'
import { toggleTimelineLike, deleteTimelineEvent } from './actions'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'

export interface TimelineAuthor {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  school_role?: string | null
}

export interface TimelineEventItem {
  id: string
  title: string
  description: string
  academic_year: string
  event_date: string | null
  category: string
  image_url: string | null
  author_id: string | null
  author?: TimelineAuthor | null
  likes_count: number
  created_at: string
  has_liked?: boolean
}

export default function TimelineList({
  initialEvents,
  currentUserId,
  isApproved,
  isAdmin,
}: {
  initialEvents: TimelineEventItem[]
  currentUserId: string | null
  isApproved: boolean
  isAdmin: boolean
}) {
  const [events, setEvents] = useState<TimelineEventItem[]>(initialEvents)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEventItem | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [optimisticLikes, setOptimisticLikes] = useState<
    Record<string, { hasLiked: boolean; count: number }>
  >({})
  const router = useRouter()

  // Filter events
  const filteredEvents = events.filter((ev) => {
    // 1. Year filter
    if (selectedYear !== 'all' && ev.academic_year !== selectedYear) return false

    // 2. Search filter
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true

    const titleMatch = ev.title.toLowerCase().includes(term)
    const descMatch = ev.description.toLowerCase().includes(term)
    const authorMatch =
      ev.author?.full_name?.toLowerCase().includes(term) ||
      ev.author?.nickname?.toLowerCase().includes(term)
    return titleMatch || descMatch || authorMatch
  })

  // Group events by academic year in chronological order
  const groupedEvents: { yearConfig: AcademicYearConfig; list: TimelineEventItem[] }[] = []
  for (const year of ACADEMIC_YEARS) {
    const list = filteredEvents.filter((e) => e.academic_year === year.id)
    if (list.length > 0 || (selectedYear === year.id && filteredEvents.length === 0)) {
      groupedEvents.push({ yearConfig: year, list })
    }
  }

  // Handle like toggle (Optimistic 0ms)
  const handleToggleLike = async (eventId: string, currentCount: number, initialLiked: boolean) => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    if (!isApproved && !isAdmin) {
      alert('Tài khoản của bạn cần được Admin duyệt trước khi tương tác.')
      return
    }

    const currentState = optimisticLikes[eventId] ?? {
      hasLiked: initialLiked,
      count: currentCount,
    }

    const nextLiked = !currentState.hasLiked
    const nextCount = nextLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1)

    // Optimistic update
    setOptimisticLikes((prev) => ({
      ...prev,
      [eventId]: { hasLiked: nextLiked, count: nextCount },
    }))

    try {
      const res = await toggleTimelineLike(eventId)
      if (!res.success) {
        // Rollback
        setOptimisticLikes((prev) => ({
          ...prev,
          [eventId]: currentState,
        }))
        alert(res.error)
      } else {
        router.refresh()
      }
    } catch {
      setOptimisticLikes((prev) => ({
        ...prev,
        [eventId]: currentState,
      }))
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẩu ký ức này khỏi dòng thời gian?')) return
    try {
      const res = await deleteTimelineEvent(eventId)
      if (!res.success) {
        alert(res.error)
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== eventId))
        router.refresh()
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa sự kiện.')
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Biên niên sử Kỷ niệm Lớp 9A</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
              Dòng Thời Gian Niên Khóa (1997 - 2001)
            </h1>
            <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
              Từng cột mốc 4 năm học cấp 2 thân thương: từ ngày đầu bỡ ngỡ bước chân vào trường lớp 6, những trò nghịch tuổi thơ lớp 7, nhịp xe đạp rong ruổi lớp 8, tiếng ve chia tay cuối mùa hè lớp 9, và những ngày hội ngộ sau nhiều năm xa cách.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!currentUserId) {
                router.push('/login')
              } else if (!isApproved && !isAdmin) {
                alert('Tài khoản của bạn đang chờ Admin duyệt.')
              } else {
                setIsAddModalOpen(true)
              }
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Kể lại một kỷ niệm xưa</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-2xl overflow-x-auto border border-border">
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedYear === 'all'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Tất cả cột mốc ({events.length})
          </button>

          {ACADEMIC_YEARS.map((y) => {
            const count = events.filter((e) => e.academic_year === y.id).length
            return (
              <button
                key={y.id}
                type="button"
                onClick={() => setSelectedYear(y.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedYear === y.id
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                <span>{y.icon}</span>
                <span>{y.shortTitle}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo sự kiện, kỷ niệm, bạn bè..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-foreground/40"
          />
        </div>
      </div>

      {/* Main Timeline Section */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
          <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-2xl">
            🌿
          </div>
          <h3 className="font-serif font-bold text-foreground text-lg mb-1">
            Chưa có cột mốc kỷ niệm nào trong mục này
          </h3>
          <p className="text-xs text-foreground/60 max-w-md mx-auto mb-4">
            Hãy là người đầu tiên chia sẻ mẩu chuyện, bức ảnh hay kỷ niệm đáng nhớ của niên khóa này!
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm cột mốc đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedEvents.map(({ yearConfig, list }) => {
            if (list.length === 0) return null

            return (
              <div key={yearConfig.id} className="relative">
                {/* Year Header Banner */}
                <div className="flex items-center gap-3 mb-10">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-serif font-bold text-sm sm:text-base shadow-xs ${yearConfig.badgeColor}`}
                  >
                    <span className="text-xl">{yearConfig.icon}</span>
                    <span>{yearConfig.title}</span>
                    <span className="text-xs opacity-75 font-sans font-normal ml-1">
                      ({yearConfig.timeRange})
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border/80" />
                </div>

                {/* Vertical Timeline Nodes */}
                <div className="relative">
                  {/* Central Timeline Line (Desktop: centered, Mobile: left aligned) */}
                  <div className="absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-border/90 border-l border-dashed border-primary/30 pointer-events-none" />

                  <div className="space-y-12">
                    {list.map((item, idx) => {
                      const isEven = idx % 2 === 0
                      const categoryConfig = getCategoryConfig(item.category)
                      const isAuthor = item.author_id === currentUserId
                      const canEdit = isAuthor || isAdmin
                      const canDelete = isAuthor || isAdmin

                      const likeState = optimisticLikes[item.id] ?? {
                        hasLiked: item.has_liked ?? false,
                        count: item.likes_count,
                      }

                      // Format date
                      const formattedDate = item.event_date
                        ? new Date(item.event_date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : null

                      return (
                        <div
                          key={item.id}
                          className={`relative flex flex-col md:flex-row items-start ${
                            isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                          } gap-6 md:gap-12`}
                        >
                          {/* Timeline Dot with Year Icon */}
                          <div className="absolute left-4 -translate-x-1/2 md:left-1/2 md:-translate-x-1/2 top-4 w-7 h-7 rounded-full bg-card border-2 border-primary shadow-sm flex items-center justify-center text-xs z-10">
                            <span>{yearConfig.icon}</span>
                          </div>

                          {/* Content Card (Left or Right on desktop, indented on mobile) */}
                          <div
                            className={`w-full md:w-[calc(50%-2rem)] pl-10 md:pl-0 ${
                              isEven ? 'md:pr-4' : 'md:pl-4'
                            }`}
                          >
                            <div className="bg-card rounded-3xl p-6 border border-border shadow-md hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                              {/* Top Bar: Category badge & Date */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary/40 text-foreground/80 border border-border">
                                  <span>{categoryConfig.icon}</span>
                                  <span>{categoryConfig.label}</span>
                                </span>

                                {formattedDate && (
                                  <span className="text-[11px] text-foreground/60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-primary/70" />
                                    <span>{formattedDate}</span>
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="text-lg sm:text-xl font-bold font-serif text-foreground mb-2.5 leading-snug">
                                {item.title}
                              </h3>

                              {/* Description */}
                              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line mb-4 font-sans">
                                {item.description}
                              </p>

                              {/* Polaroid Image Preview (if attached) */}
                              {item.image_url && (
                                <div className="mb-4">
                                  <div
                                    onClick={() => setZoomedImage(item.image_url)}
                                    className="cursor-pointer group/img relative rounded-2xl overflow-hidden border border-border bg-black/5 p-2 bg-white/70 dark:bg-card shadow-xs hover:shadow-md transition-shadow"
                                  >
                                    <img
                                      src={item.image_url}
                                      alt={item.title}
                                      className="w-full max-h-72 object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white rounded-xl">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-xs font-semibold">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        <span>Phóng to ảnh</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Card Footer: Author & Actions */}
                              <div className="pt-3 border-t border-border flex items-center justify-between gap-3 text-xs">
                                {/* Contributor info */}
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-border overflow-hidden flex items-center justify-center font-bold text-xs flex-shrink-0 text-primary">
                                    {item.author?.avatar_url ? (
                                      <img
                                        src={item.author.avatar_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      (item.author?.full_name || 'A').charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-foreground truncate block text-xs">
                                      {item.author?.full_name || 'Thành viên'}
                                    </span>
                                  </div>
                                </div>

                                {/* Right Actions: Like, Edit, Delete */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {/* Like Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleLike(item.id, item.likes_count, item.has_liked ?? false)
                                    }
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                      likeState.hasLiked
                                        ? 'bg-rose-500 text-white shadow-xs scale-105'
                                        : 'bg-secondary/50 hover:bg-secondary text-foreground/70'
                                    }`}
                                    title="Thả tim cột mốc kỷ niệm"
                                  >
                                    <Heart
                                      className={`w-3.5 h-3.5 ${
                                        likeState.hasLiked ? 'fill-white text-white' : ''
                                      }`}
                                    />
                                    <span>{likeState.count}</span>
                                  </button>

                                  {/* Edit Button */}
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingEvent(item)}
                                      className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground/60 hover:text-foreground transition-colors"
                                      title="Chỉnh sửa sự kiện"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete Button */}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item.id)}
                                      className="p-1.5 rounded-lg border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-foreground/60 transition-colors"
                                      title="Xóa sự kiện này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Empty spacer for alignment on desktop */}
                          <div className="hidden md:block w-[calc(50%-2rem)]" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <AddEventModal
          defaultYear={selectedYear === 'all' ? 'lop_6' : selectedYear}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {/* Lightbox Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-card p-3 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={zoomedImage}
              alt="Ảnh phóng to"
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
            <p className="text-center text-xs text-foreground/50 mt-2 font-handwriting">
              Bấm ra ngoài để đóng
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
