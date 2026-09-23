'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Smile, Sparkles, MessageCircle, Send, Trash2, Loader2, User } from 'lucide-react'
import { addAlbumComment, deleteAlbumComment, toggleAlbumReaction } from '../actions'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: any
}

interface Reaction {
  id: string
  type: string
  user_id: string
}

interface AlbumInteractionsProps {
  albumId: string
  comments: Comment[]
  reactions: Reaction[]
  currentUserId: string | null
  isApproved: boolean
}

const REACTION_CONFIG: Record<string, { label: string; icon: string; activeColor: string }> = {
  heart: { label: 'Thả tim', icon: '❤️', activeColor: 'bg-red-50 border-red-300 text-red-600' },
  haha: { label: 'Haha', icon: '😂', activeColor: 'bg-amber-50 border-amber-300 text-amber-600' },
  cry: { label: 'Xúc động', icon: '🥺', activeColor: 'bg-blue-50 border-blue-300 text-blue-600' },
  clap: { label: 'Tuyệt vời', icon: '👏', activeColor: 'bg-green-50 border-green-300 text-green-600' },
}

export default function AlbumInteractions({
  albumId,
  comments,
  reactions,
  currentUserId,
  isApproved,
}: AlbumInteractionsProps) {
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleReaction = async (type: string) => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    if (!isApproved) {
      alert('Tài khoản của bạn đang chờ Admin duyệt trước khi tương tác.')
      return
    }

    try {
      await toggleAlbumReaction(albumId, type)
      router.refresh()
    } catch (err) {
      console.error(err)
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
      await addAlbumComment(albumId, commentText)
      setCommentText('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể gửi bình luận. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return
    setDeletingId(commentId)
    try {
      await deleteAlbumComment(commentId, albumId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Không thể xóa bình luận.')
    } finally {
      setDeletingId(null)
    }
  }

  // Calculate reaction counts
  const reactionCounts = Object.keys(REACTION_CONFIG).map((type) => {
    const matching = reactions.filter((r) => r.type === type)
    const hasReacted = currentUserId ? matching.some((r) => r.user_id === currentUserId) : false
    return {
      type,
      config: REACTION_CONFIG[type],
      count: matching.length,
      hasReacted,
    }
  })

  return (
    <div className="mt-12 bg-card rounded-2xl border border-border p-6 shadow-sm">
      {/* Reactions Bar */}
      <div className="pb-6 border-b border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/60 mb-3 font-sans">
          Cảm xúc về album này
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {reactionCounts.map(({ type, config, count, hasReacted }) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                hasReacted
                  ? `${config.activeColor} shadow-sm scale-105`
                  : 'bg-background hover:bg-secondary/20 border-border text-foreground/80'
              }`}
              title={config.label}
            >
              <span className="text-base leading-none">{config.icon}</span>
              <span className="text-xs font-semibold">{count > 0 ? count : ''}</span>
              <span className="hidden sm:inline text-xs text-foreground/70">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="pt-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-serif font-bold text-foreground">
            Kỷ niệm & Trò chuyện ({comments.length})
          </h3>
        </div>

        {/* Comment Input */}
        {currentUserId ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold font-serif flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Để lại lời nhắn, câu chuyện hoặc trêu đùa bạn bè..."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Gửi</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-foreground/80 text-center sm:text-left">
              Đăng nhập để cùng ôn lại kỷ niệm và trò chuyện cùng các bạn trong lớp nhé!
            </p>
            <a
              href="/login"
              className="px-5 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-full hover:bg-primary/90 transition-colors flex-shrink-0 shadow-sm"
            >
              Đăng nhập ngay
            </a>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => {
            const profileData = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
            const authorName = profileData?.full_name || 'Bạn cùng lớp'
            const authorRole = profileData?.role
            const isAuthor = currentUserId === comment.user_id
            const dateStr = new Date(comment.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={comment.id}
                className="group flex gap-3 p-4 rounded-xl bg-background border border-border/80 hover:border-border transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-secondary/40 text-secondary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground font-serif">
                        {authorName}
                      </span>
                      {authorRole === 'admin' && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-foreground/50">{dateStr}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed break-words font-sans">
                    {comment.content}
                  </p>
                </div>
                {isAuthor && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-foreground/40 hover:text-red-500 rounded flex-shrink-0"
                    title="Xóa bình luận"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )
          })}

          {comments.length === 0 && (
            <p className="text-center text-foreground/50 py-8 text-sm italic font-serif">
              Chưa có bình luận nào. Hãy là người đầu tiên để lại dòng kỷ niệm nhé!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
