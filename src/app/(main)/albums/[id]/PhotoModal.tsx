'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Send,
  Loader2,
  User,
  MessageCircle,
  Calendar,
} from 'lucide-react'
import { getYouTubeId } from '@/lib/youtube'
import {
  deletePhoto,
  togglePhotoReaction,
  addPhotoComment,
  deletePhotoComment,
} from '../actions'

const REACTION_CONFIG: Record<string, { label: string; icon: string; activeColor: string }> = {
  heart: { label: 'Thả tim', icon: '❤️', activeColor: 'bg-red-50 border-red-300 text-red-600' },
  haha: { label: 'Haha', icon: '😂', activeColor: 'bg-amber-50 border-amber-300 text-amber-600' },
  cry: { label: 'Xúc động', icon: '🥺', activeColor: 'bg-blue-50 border-blue-300 text-blue-600' },
  clap: { label: 'Tuyệt vời', icon: '👏', activeColor: 'bg-green-50 border-green-300 text-green-600' },
}

const getPublicUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`
}

export default function PhotoModal({
  photo,
  albumId,
  currentUserId,
  isApproved,
  isAdmin,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
}: {
  photo: any
  albumId: string
  currentUserId: string | null
  isApproved: boolean
  isAdmin: boolean
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev: boolean
  hasNext: boolean
  currentIndex?: number
  totalCount?: number
}) {
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [optimisticReactions, setOptimisticReactions] = useState<any[]>(photo.reactions || [])

  // Touch swipe states
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartTimeRef = useRef<number>(0)
  const isHorizontalSwipeRef = useRef<boolean | null>(null)

  const router = useRouter()

  useEffect(() => {
    setOptimisticReactions(photo.reactions || [])
  }, [photo.reactions])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (photo.is_video) return
    const touch = e.touches[0]
    setTouchStartX(touch.clientX)
    setTouchStartY(touch.clientY)
    setTouchDeltaX(0)
    setIsSwiping(true)
    touchStartTimeRef.current = Date.now()
    isHorizontalSwipeRef.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || touchStartX === null || touchStartY === null) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    if (isHorizontalSwipeRef.current) {
      // Elastic resistance at boundaries
      if ((!hasPrev && deltaX > 0) || (!hasNext && deltaX < 0)) {
        setTouchDeltaX(deltaX * 0.25)
      } else {
        setTouchDeltaX(deltaX)
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isSwiping || touchStartX === null) {
      setIsSwiping(false)
      setTouchDeltaX(0)
      return
    }

    const elapsed = Date.now() - touchStartTimeRef.current
    const minDistance = 45
    const isQuickFlick = elapsed < 350 && Math.abs(touchDeltaX) > 25

    if (touchDeltaX < -minDistance || (isQuickFlick && touchDeltaX < -25)) {
      if (hasNext && onNext) {
        onNext()
      }
    } else if (touchDeltaX > minDistance || (isQuickFlick && touchDeltaX > 25)) {
      if (hasPrev && onPrev) {
        onPrev()
      }
    }

    setIsSwiping(false)
    setTouchDeltaX(0)
    setTouchStartX(null)
    setTouchStartY(null)
    isHorizontalSwipeRef.current = null
  }

  const canDelete = currentUserId && (currentUserId === photo.uploaded_by || isAdmin)

  const handleDeletePhoto = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi album?')) return
    setIsDeletingPhoto(true)
    try {
      await deletePhoto(photo.id, albumId)
      onClose()
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể xóa ảnh. Vui lòng thử lại.')
      setIsDeletingPhoto(false)
    }
  }

  const handleReaction = async (type: string) => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    if (!isApproved) {
      alert('Tài khoản của bạn đang chờ Admin duyệt trước khi tương tác.')
      return
    }

    // Instant optimistic UI
    const exists = optimisticReactions.some((r) => r.type === type && r.user_id === currentUserId)
    const next = exists
      ? optimisticReactions.filter((r) => !(r.type === type && r.user_id === currentUserId))
      : [...optimisticReactions, { id: 'temp-' + Date.now(), type, user_id: currentUserId }]
    setOptimisticReactions(next)

    try {
      await togglePhotoReaction(photo.id, albumId, type)
    } catch (err) {
      console.error('Reaction toggle error:', err)
      setOptimisticReactions(photo.reactions || [])
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    if (!currentUserId) {
      router.push('/login')
      return
    }
    if (!isApproved) {
      alert('Tài khoản của bạn đang chờ Admin duyệt trước khi bình luận.')
      return
    }

    setIsSubmitting(true)
    try {
      await addPhotoComment(photo.id, albumId, commentText)
      setCommentText('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể gửi bình luận.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return
    setDeletingCommentId(commentId)
    try {
      await deletePhotoComment(commentId, albumId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể xóa bình luận.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const reactionCounts = Object.keys(REACTION_CONFIG).map((type) => {
    const matching = optimisticReactions.filter((r) => r.type === type)
    const hasReacted = currentUserId ? matching.some((r) => r.user_id === currentUserId) : false
    return {
      type,
      config: REACTION_CONFIG[type],
      count: matching.length,
      hasReacted,
    }
  })

  const uploaderProfile = Array.isArray(photo.uploader) ? photo.uploader[0] : photo.uploader
  const uploaderName = uploaderProfile?.full_name || 'Thành viên lớp 9A'
  const photoDate = new Date(photo.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const commentsList: any[] = photo.comments || []
  const ytId = photo.is_video ? getYouTubeId(photo.video_url) : null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-1 sm:p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[96dvh] sm:h-[92vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-border">
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors shadow-lg"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Media Viewer with Touch Swipe Support */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            setIsSwiping(false)
            setTouchDeltaX(0)
            setTouchStartX(null)
            setTouchStartY(null)
          }}
          className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[200px] sm:min-h-[350px] lg:min-h-0 select-none touch-pan-y"
        >
          {/* Index Counter Badge Top Left */}
          {totalCount !== undefined && totalCount > 0 && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 pointer-events-none">
              <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
                {(currentIndex ?? 0) + 1} / {totalCount}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                Phím ⬅ ➡
              </span>
            </div>
          )}

          {photo.is_video ? (
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
              {ytId ? (
                <iframe
                  className="w-full aspect-video max-h-full rounded-xl"
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <p className="text-white">Không tải được video.</p>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center transition-transform ${
                isSwiping ? 'duration-0' : 'duration-300 ease-out'
              }`}
              style={{
                transform: `translateX(${touchDeltaX}px)`,
              }}
            >
              <img
                src={getPublicUrl(photo.storage_path)}
                alt={photo.caption || 'Kỷ niệm lớp 9A'}
                className="max-w-full max-h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>
          )}

          {/* Swipe indicator hint for mobile users */}
          {!photo.is_video && totalCount !== undefined && totalCount > 1 && (
            <div className="sm:hidden absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-20">
              <span className="text-[10px] bg-black/50 backdrop-blur-xs text-white/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span>👈 Vuốt để chuyển ảnh 👉</span>
              </span>
            </div>
          )}

          {/* Prev Button */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all hover:scale-110 shadow-lg z-20"
              title="Ảnh trước (Mũi tên trái hoặc vuốt sang phải)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Next Button */}
          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all hover:scale-110 shadow-lg z-20"
              title="Ảnh sau (Mũi tên phải hoặc vuốt sang trái)"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Info, Reactions & Comments */}
        <div className="w-full lg:w-[420px] flex flex-col bg-card border-t lg:border-t-0 lg:border-l border-border flex-1 lg:h-full min-h-0">
          {/* Header: Uploader Info & Delete Photo */}
          <div className="p-4 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-secondary/40 text-secondary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                {uploaderName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-sm text-foreground truncate">
                  {uploaderName}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-foreground/50">
                  <Calendar className="w-3 h-3" />
                  <span>{photoDate}</span>
                </div>
              </div>
            </div>

            {canDelete && (
              <button
                onClick={handleDeletePhoto}
                disabled={isDeletingPhoto}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors flex-shrink-0"
                title="Xóa ảnh này"
              >
                {isDeletingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Caption */}
          {photo.caption && (
            <div className="px-4 py-3 bg-secondary/10 border-b border-border/60">
              <p className="text-sm font-handwriting text-lg text-foreground/90 leading-snug">
                "{photo.caption}"
              </p>
            </div>
          )}

          {/* Reactions Bar */}
          <div className="p-3 border-b border-border flex items-center justify-around gap-1">
            {reactionCounts.map(({ type, config, count, hasReacted }) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  hasReacted
                    ? `${config.activeColor} shadow-sm scale-105 font-bold`
                    : 'bg-background hover:bg-secondary/20 border-border text-foreground/70'
                }`}
                title={config.label}
              >
                <span className="text-sm">{config.icon}</span>
                <span>{count > 0 ? count : ''}</span>
              </button>
            ))}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
              <span>Bình luận ({commentsList.length})</span>
            </div>

            {commentsList.map((c) => {
              const cProfile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
              const author = cProfile?.full_name || 'Bạn cùng lớp'
              const isOwn = currentUserId === c.user_id

              return (
                <div
                  key={c.id}
                  className="group flex gap-2.5 p-2.5 rounded-xl bg-background border border-border/70 text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    {author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-foreground font-serif">{author}</span>
                      <span className="text-[10px] text-foreground/40">
                        {new Date(c.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-foreground/80 break-words leading-relaxed">{c.content}</p>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={deletingCommentId === c.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground/40 hover:text-red-500 p-1"
                      title="Xóa bình luận"
                    >
                      {deletingCommentId === c.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              )
            })}

            {commentsList.length === 0 && (
              <p className="text-center text-foreground/40 py-6 text-xs italic">
                Chưa có bình luận nào cho bức ảnh này.
              </p>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-3 border-t border-border bg-card">
            {currentUserId ? (
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận về ảnh này..."
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0 shadow-sm"
                  title="Gửi"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            ) : (
              <a
                href="/login"
                className="block text-center py-2 text-xs font-medium text-primary hover:underline"
              >
                Đăng nhập để bình luận ảnh này
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
