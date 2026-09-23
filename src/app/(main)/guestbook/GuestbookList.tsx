'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Pin,
  Trash2,
  Lock,
  Users,
  Globe,
  Search,
  ExternalLink,
  MessageCircle,
  Calendar,
  Send,
  Loader2,
  Edit3,
} from 'lucide-react'
import {
  deleteGuestbookEntry,
  togglePinGuestbookEntry,
  toggleGuestbookReaction,
  addGuestbookComment,
  deleteGuestbookComment,
} from './actions'
import { PAPER_COLORS, getFontClass } from './guestbook-constants'
import EditGuestbookModal from './EditGuestbookModal'

interface Author {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  school_role?: string | null
}

interface Reaction {
  id: string
  user_id: string
  type: string
}

export interface GuestbookComment {
  id: string
  content: string
  created_at: string
  user_id: string
  user: {
    id: string
    full_name: string | null
    nickname: string | null
    avatar_url: string | null
  } | null
}

export interface GuestbookEntry {
  id: string
  user_id: string
  title: string | null
  content: string
  color: string
  sticker: string
  font_family?: string | null
  image_url: string | null
  visibility: 'public' | 'selected' | 'private'
  allowed_user_ids: string[]
  is_pinned: boolean
  created_at: string
  author: Author | null
  reactions: Reaction[]
  comments?: GuestbookComment[]
}

interface Classmate {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; tape: string }> = {
  yellow: { bg: 'bg-[#fef9c3]', border: 'border-[#fde047]', text: 'text-amber-950', tape: 'bg-amber-100/70 border-amber-200/80' },
  pink: { bg: 'bg-[#fce7f3]', border: 'border-[#fbcfe8]', text: 'text-pink-950', tape: 'bg-pink-100/70 border-pink-200/80' },
  blue: { bg: 'bg-[#e0f2fe]', border: 'border-[#bae6fd]', text: 'text-sky-950', tape: 'bg-sky-100/70 border-sky-200/80' },
  green: { bg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', text: 'text-emerald-950', tape: 'bg-emerald-100/70 border-emerald-200/80' },
  orange: { bg: 'bg-[#ffedd5]', border: 'border-[#fed7aa]', text: 'text-orange-950', tape: 'bg-orange-100/70 border-orange-200/80' },
  purple: { bg: 'bg-[#f3e8ff]', border: 'border-[#e9d5ff]', text: 'text-purple-950', tape: 'bg-purple-100/70 border-purple-200/80' },
}

export default function GuestbookList({
  entries,
  classmates,
  classmatesMap,
  currentUserId,
  isAdmin = false,
}: {
  entries: GuestbookEntry[]
  classmates: Classmate[]
  classmatesMap: Record<string, { full_name: string | null; nickname: string | null }>
  currentUserId: string | null
  isAdmin?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'received' | 'mine' | 'pinned'>('all')
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { hasLiked: boolean; count: number }>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
  const [localComments, setLocalComments] = useState<Record<string, GuestbookComment[]>>({})
  const [editingEntry, setEditingEntry] = useState<GuestbookEntry | null>(null)
  const router = useRouter()


  // Filter entries according to active tab & search keyword
  const filteredEntries = entries.filter((entry) => {
    // 1. Tab filter
    if (activeTab === 'public' && entry.visibility !== 'public') return false
    if (activeTab === 'received') {
      const isReceived =
        entry.visibility === 'selected' &&
        entry.allowed_user_ids?.includes(currentUserId || '') &&
        entry.user_id !== currentUserId
      if (!isReceived) return false
    }
    if (activeTab === 'mine' && entry.user_id !== currentUserId) return false
    if (activeTab === 'pinned' && !entry.is_pinned) return false

    // 2. Search keyword
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const titleMatch = entry.title?.toLowerCase().includes(term)
    const contentMatch = entry.content.toLowerCase().includes(term)
    const authorMatch =
      entry.author?.full_name?.toLowerCase().includes(term) ||
      entry.author?.nickname?.toLowerCase().includes(term)
    return titleMatch || contentMatch || authorMatch
  })

  // Optimistic like toggle
  const handleToggleLike = async (entryId: string, currentReactions: Reaction[]) => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    const currentState = optimisticLikes[entryId] ?? {
      hasLiked: currentReactions.some((r) => r.user_id === currentUserId),
      count: currentReactions.length,
    }

    const nextHasLiked = !currentState.hasLiked
    const nextCount = nextHasLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1)

    // Update UI immediately (0ms latency)
    setOptimisticLikes((prev) => ({
      ...prev,
      [entryId]: { hasLiked: nextHasLiked, count: nextCount },
    }))

    try {
      await toggleGuestbookReaction(entryId, 'heart')
    } catch (err) {
      // Revert if error
      setOptimisticLikes((prev) => ({
        ...prev,
        [entryId]: currentState,
      }))
      console.error(err)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẩu lưu bút này?')) return
    try {
      await deleteGuestbookEntry(entryId)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa lưu bút.')
    }
  }

  const handleTogglePin = async (entryId: string, currentPinStatus: boolean) => {
    try {
      await togglePinGuestbookEntry(entryId, !currentPinStatus)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi ghim bài.')
    }
  }

  const toggleCommentsSection = (entryId: string) => {
    setOpenComments((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }))
  }

  const handleAddComment = async (e: React.FormEvent, entryId: string) => {
    e.preventDefault()
    const content = (commentInputs[entryId] || '').trim()
    if (!content) return

    setSubmittingComment((prev) => ({ ...prev, [entryId]: true }))

    // Optimistic addition
    const tempId = `temp-${Date.now()}`
    const newComment: GuestbookComment = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      user_id: currentUserId || '',
      user: {
        id: currentUserId || '',
        full_name: classmatesMap[currentUserId || '']?.full_name || 'Bạn',
        nickname: classmatesMap[currentUserId || '']?.nickname || null,
        avatar_url: null,
      },
    }

    const prevList = localComments[entryId] || entries.find((e) => e.id === entryId)?.comments || []
    setLocalComments((prev) => ({
      ...prev,
      [entryId]: [...prevList, newComment],
    }))
    setCommentInputs((prev) => ({ ...prev, [entryId]: '' }))

    try {
      const res = await addGuestbookComment(entryId, content)
      if (!res.success) {
        alert(res.error || 'Không thể gửi bình luận.')
        setLocalComments((prev) => ({
          ...prev,
          [entryId]: prevList,
        }))
      } else if (res.comment) {
        // Safely extract user whether returned as object or array
        const rawUser = (res.comment as any).user
        const commentUser = Array.isArray(rawUser) ? rawUser[0] : rawUser
        const mappedComment: GuestbookComment = {
          id: res.comment.id,
          content: res.comment.content,
          created_at: res.comment.created_at,
          user_id: res.comment.user_id,
          user: commentUser || null,
        }

        setLocalComments((prev) => ({
          ...prev,
          [entryId]: (prev[entryId] || []).map((c) =>
            c.id === tempId ? mappedComment : c
          ),
        }))
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Không thể gửi bình luận.')
      setLocalComments((prev) => ({
        ...prev,
        [entryId]: prevList,
      }))
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [entryId]: false }))
    }
  }

  const handleDeleteComment = async (commentId: string, entryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return

    const currentList = localComments[entryId] || entries.find((e) => e.id === entryId)?.comments || []
    setLocalComments((prev) => ({
      ...prev,
      [entryId]: currentList.filter((c) => c.id !== commentId),
    }))

    try {
      const res = await deleteGuestbookComment(commentId)
      if (!res.success) {
        alert(res.error || 'Không thể xóa bình luận.')
        setLocalComments((prev) => ({
          ...prev,
          [entryId]: currentList,
        }))
      } else {
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Không thể xóa bình luận.')
      setLocalComments((prev) => ({
        ...prev,
        [entryId]: currentList,
      }))
    }
  }

  return (
    <div>
      {/* Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-medium no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-card border border-border text-foreground/70 hover:bg-secondary/40'
            }`}
          >
            Tất cả ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'public'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-card border border-border text-foreground/70 hover:bg-secondary/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cả lớp</span>
          </button>
          {currentUserId && (
            <>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'received'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-card border border-border text-foreground/70 hover:bg-secondary/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gửi riêng cho tôi</span>
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'mine'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-card border border-border text-foreground/70 hover:bg-secondary/40'
                }`}
              >
                <span>Của tôi</span>
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('pinned')}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pinned'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-card border border-border text-foreground/70 hover:bg-secondary/40'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Được ghim</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung, tác giả..."
            className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-full text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Grid of Nostalgic Sticky Notes - Cleanly separated from empty state */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-3xl border border-dashed border-border p-8 my-6 max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-3xl">
            📝
          </div>
          <h4 className="font-serif font-bold text-foreground text-lg mb-1">
            Chưa có mẩu lưu bút nào trong mục này
          </h4>
          <p className="text-xs text-foreground/60 max-w-md mx-auto leading-relaxed">
            {activeTab === 'received'
              ? 'Hiện tại chưa có mẩu lưu bút nào được gửi riêng cho bạn. Hãy chuyển sang mục "Cả lớp" để cùng ôn lại kỷ niệm nhé!'
              : activeTab === 'mine'
              ? 'Bạn chưa viết mẩu lưu bút nào. Hãy bấm nút "Viết trang lưu bút mới" phía trên để lưu giữ kỷ niệm nhé!'
              : activeTab === 'pinned'
              ? 'Chưa có mẩu lưu bút nào được ghim lên đầu sổ.'
              : 'Hãy là người đầu tiên viết những dòng tâm sự, câu thơ hoặc kỷ niệm ngọt ngào thời cắp sách đến trường!'}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredEntries.map((entry, idx) => {
            const colorConfig = COLOR_MAP[entry.color] || COLOR_MAP.yellow
            const isAuthor = entry.user_id === currentUserId
            const canEdit = isAuthor || isAdmin
            const canDelete = isAuthor || isAdmin
            const entryFontClass = getFontClass(entry.font_family)

            // Comments
            const commentsList = localComments[entry.id] ?? entry.comments ?? []
            const isCommentsOpen = openComments[entry.id] ?? false
            const isSubmitting = submittingComment[entry.id] ?? false

            // Like state
            const likeState = optimisticLikes[entry.id] ?? {
              hasLiked: entry.reactions.some((r) => r.user_id === currentUserId),
              count: entry.reactions.length,
            }

            // Subtle organic rotation
            const rotClass =
              idx % 4 === 0
                ? 'sm:-rotate-1'
                : idx % 4 === 1
                ? 'sm:rotate-1'
                : idx % 4 === 2
                ? 'sm:-rotate-[1.5deg]'
                : 'sm:rotate-[1.5deg]'

            // Format Date
            const createdDate = new Date(entry.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })

            return (
              <div
                key={entry.id}
                className={`break-inside-avoid relative rounded-2xl p-6 border shadow-md hover:shadow-xl transition-all duration-300 hover:rotate-0 hover:scale-[1.01] flex flex-col group ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} ${rotClass}`}
              >
                {/* Realistic washi tape on top-center */}
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-xs backdrop-blur-xs border shadow-xs rotate-[-1deg] pointer-events-none opacity-80 ${colorConfig.tape}`}
                />

                {/* Note Header: Sticker, Visibility badge & Pin */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl filter drop-shadow-xs">{entry.sticker}</span>
                    {entry.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100/90 text-red-700 border border-red-200 shadow-2xs">
                        <Pin className="w-3 h-3 fill-red-600 text-red-600" />
                        <span>Được ghim</span>
                      </span>
                    )}
                  </div>

                  {/* Visibility Badge */}
                  <div className="flex items-center gap-1.5">
                    {entry.visibility === 'private' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/10 text-current border border-black/10">
                        <Lock className="w-3 h-3" />
                        <span>Chỉ mình tôi</span>
                      </span>
                    )}
                    {entry.visibility === 'selected' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        <Users className="w-3 h-3" />
                        <span>Gửi riêng</span>
                      </span>
                    )}
                    {entry.visibility === 'public' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-current/50">
                        <Globe className="w-3 h-3" />
                        <span>Cả lớp</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected Recipients Names (if applicable) */}
                {entry.visibility === 'selected' && entry.allowed_user_ids?.length > 0 && (
                  <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-black/5 text-[11px] text-current/80 flex items-center gap-1.5">
                    <span className="font-semibold flex-shrink-0">Gửi tới:</span>
                    <span className="truncate">
                      {entry.allowed_user_ids
                        .map((id) => classmatesMap[id]?.nickname || classmatesMap[id]?.full_name || 'Bạn cùng lớp')
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Title (if present) */}
                {entry.title && (
                  <h3 className="font-serif font-bold text-lg text-current mb-2 leading-snug">
                    {entry.title}
                  </h3>
                )}

                {/* Content with user-chosen Font */}
                <div className={`text-xl text-current leading-relaxed whitespace-pre-line my-1 ${entryFontClass}`}>
                  "{entry.content}"
                </div>

                {/* Attached Photo / Polaroid (if present) */}
                {entry.image_url && (
                  <div
                    onClick={() => setZoomedImage(entry.image_url)}
                    className="mt-3 bg-white p-2 rounded-xl shadow-md border border-black/10 cursor-pointer group/photo transform rotate-[-1deg] hover:rotate-0 transition-transform"
                  >
                    <img
                      src={entry.image_url}
                      alt="Lưu bút đính kèm"
                      className="w-full h-44 object-cover rounded-lg"
                    />
                    <p className="text-[10px] text-center text-gray-500 font-handwriting mt-1">
                      Bấm để phóng to ảnh
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="my-4 border-t border-black/10" />

                {/* Note Footer: Author Info, Date, Likes & Comments */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  {/* Author Info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-black/15 bg-white/50 flex-shrink-0 flex items-center justify-center font-bold text-xs">
                      {entry.author?.avatar_url ? (
                        <img
                          src={entry.author.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (entry.author?.full_name || 'A').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-current truncate leading-tight">
                        {entry.author?.full_name || 'Thành viên'}
                      </p>
                      <p className="text-[10px] opacity-70 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{createdDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Likes, Comments, Edit, Admin Pin & Delete */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Heart Reaction */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(entry.id, entry.reactions)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-semibold ${
                        likeState.hasLiked
                          ? 'bg-red-500 text-white shadow-xs scale-105'
                          : 'bg-black/5 hover:bg-black/10 text-current'
                      }`}
                      title="Thả tim lưu bút"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          likeState.hasLiked ? 'fill-white text-white' : 'text-current/70'
                        }`}
                      />
                      <span>{likeState.count}</span>
                    </button>

                    {/* Comment Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleCommentsSection(entry.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-xs font-semibold ${
                        isCommentsOpen
                          ? 'bg-black/15 text-current'
                          : 'bg-black/5 hover:bg-black/10 text-current'
                      }`}
                      title="Bình luận lưu bút"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{commentsList.length}</span>
                    </button>

                    {/* Edit Button (Author or Admin) */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingEntry(entry)}
                        className="p-1.5 rounded-full hover:bg-black/10 text-current/70 hover:text-current transition-colors"
                        title="Chỉnh sửa mẩu lưu bút"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}


                    {/* Admin Pin Toggle */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(entry.id, entry.is_pinned)}
                        className={`p-1.5 rounded-full transition-colors ${
                          entry.is_pinned
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'hover:bg-black/10 text-current/60 hover:text-current'
                        }`}
                        title={entry.is_pinned ? 'Bỏ ghim' : 'Ghim mẩu lưu bút này'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${entry.is_pinned ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    {/* Delete Button */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 text-current/60 transition-colors"
                        title="Xóa mẩu lưu bút này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Comments Section */}
                {isCommentsOpen && (
                  <div className="mt-3.5 pt-3 border-t border-black/10 space-y-2.5 animate-in fade-in duration-200">
                    <div className="text-[11px] font-bold text-current/80 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Phản hồi lưu bút ({commentsList.length})</span>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {commentsList.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-xl bg-black/5 text-xs text-current flex items-start justify-between gap-2 group/c"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white/70 flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 border border-black/10">
                              {c.user?.avatar_url ? (
                                <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (c.user?.full_name || 'A').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-[11px] mr-1.5 text-current">
                                {c.user?.full_name || 'Thành viên'}
                              </span>
                              <span className="break-words leading-relaxed text-sm font-handwriting">
                                {c.content}
                              </span>
                            </div>
                          </div>
                          {(c.user_id === currentUserId || entry.user_id === currentUserId || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(c.id, entry.id)}
                              className="opacity-0 group-hover/c:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0"
                              title="Xóa bình luận"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {commentsList.length === 0 && (
                        <p className="text-[11px] text-current/60 italic py-1">
                          Chưa có phản hồi nào. Hãy viết những dòng chia sẻ đầu tiên!
                        </p>
                      )}
                    </div>

                    {/* Add Comment Input Form */}
                    {currentUserId ? (
                      <form onSubmit={(e) => handleAddComment(e, entry.id)} className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={commentInputs[entry.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [entry.id]: e.target.value })
                          }
                          placeholder="Viết phản hồi lưu bút..."
                          className="flex-1 bg-white/70 focus:bg-white border border-black/15 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-gray-900 placeholder:text-gray-500"
                        />
                        <button
                          type="submit"
                          disabled={!commentInputs[entry.id]?.trim() || isSubmitting}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs flex-shrink-0"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                        </button>
                      </form>
                    ) : (
                      <p className="text-[11px] text-current/70 pt-1">
                        <a href="/login" className="font-semibold underline hover:text-primary">
                          Đăng nhập
                        </a>{' '}
                        để gửi phản hồi lưu bút.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Zoom for Attached Photo */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white p-3 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={zoomedImage}
              alt="Ảnh lưu bút phóng to"
              className="max-h-[75vh] w-auto rounded-lg object-contain mx-auto"
            />
            <p className="text-center text-xs text-gray-500 font-handwriting mt-2">
              Bấm ra ngoài để đóng
            </p>
          </div>
        </div>
      )}

      {/* Edit Guestbook Entry Modal (Portaled to body) */}
      {editingEntry && (
        <EditGuestbookModal
          entry={editingEntry}
          classmates={classmates}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  )
}
