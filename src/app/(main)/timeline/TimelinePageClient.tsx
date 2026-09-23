'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, Camera } from 'lucide-react'
import TimelineList, { TimelineEventItem } from './TimelineList'
import PhotoTimelineView, { PhotoTimelineItem } from '@/components/PhotoTimelineView'

interface TimelinePageClientProps {
  events: TimelineEventItem[]
  photos: PhotoTimelineItem[]
  currentUserId: string | null
  isApproved: boolean
  isAdmin: boolean
}

export default function TimelinePageClient({
  events,
  photos,
  currentUserId,
  isApproved,
  isAdmin,
}: TimelinePageClientProps) {
  const [activeMainTab, setActiveMainTab] = useState<'events' | 'photos'>('events')

  return (
    <div className="w-full space-y-6">
      {/* Tab Switcher: Sự kiện & Mốc son vs Ảnh kỷ niệm theo dòng thời gian */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveMainTab('events')}
          className={`flex items-center gap-2 px-4 py-3 font-serif font-semibold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'events'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Biên niên sử & Mốc son ({events.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('photos')}
          className={`flex items-center gap-2 px-4 py-3 font-serif font-semibold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'photos'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Ảnh kỷ niệm theo năm ({photos.length})</span>
        </button>
      </div>

      {/* Nội dung Tab 1: Biên niên sử Sự kiện */}
      {activeMainTab === 'events' && (
        <TimelineList
          initialEvents={events}
          currentUserId={currentUserId}
          isApproved={isApproved}
          isAdmin={isAdmin}
        />
      )}

      {/* Nội dung Tab 2: Dòng thời gian Ảnh & Video */}
      {activeMainTab === 'photos' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden text-center sm:text-left w-full">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 max-w-2xl w-full relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kho Ảnh & Video Theo Năm (1997 - Hiện tại)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground break-words tracking-tight">
                Ảnh Kỷ Niệm Theo Dòng Thời Gian
              </h1>
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-sans">
                Toàn bộ ảnh và video kỷ niệm của lớp 9A được xếp theo dòng thời gian từ mới nhất đến cũ nhất. Nhấp vào ảnh để xem chi tiết, bình luận và thả tim.
              </p>
            </div>
          </div>

          <PhotoTimelineView
            photos={photos}
            currentUserId={currentUserId}
            isApproved={isApproved}
            isAdmin={isAdmin}
            showAlbumBadge={true}
          />
        </div>
      )}
    </div>
  )
}
