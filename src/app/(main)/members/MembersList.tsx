'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Briefcase,
  ExternalLink,
  Quote,
  GraduationCap,
  Edit3,
  UserCheck,
  Trash2,
  Loader2,
  Eye,
  Lock,
  ShieldAlert,
  Clock,
  X,
} from 'lucide-react'
import EditProfileModal from './EditProfileModal'
import ViewProfileModal from './ViewProfileModal'
import { approveMember, deleteMember } from '../admin/actions'

interface Member {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  role: string | null
  school_role?: string | null
  current_job?: string | null
  location?: string | null
  quote?: string | null
  facebook_url?: string | null
  is_approved?: boolean
  email?: string | null
  phone_number?: string | null
  show_email?: boolean | null
  show_phone?: boolean | null
  created_at?: string
}

export default function MembersList({
  members,
  currentUserId,
  isAdmin = false,
  isApprovedMember = false,
  currentUserProfile = null,
}: {
  members: Member[]
  currentUserId: string | null
  isAdmin?: boolean
  isApprovedMember?: boolean
  currentUserProfile?: Member | null
}) {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [membersList, setMembersList] = useState<Member[]>(members)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingMember, setViewingMember] = useState<Member | null>(null)
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false)
  const [deniedTargetName, setDeniedTargetName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMembersList(members)
  }, [members])

  const activeViewingMember = viewingMember
    ? membersList.find((m) => m.id === viewingMember.id) || viewingMember
    : null

  const handleCardClick = (member: Member) => {
    const isCurrentUser = member.id === currentUserId
    if (isApprovedMember || isCurrentUser) {
      setViewingMember(member)
    } else {
      setDeniedTargetName(member.full_name || 'bạn học')
      setShowAccessDeniedModal(true)
    }
  }

  const handleApprove = async (memberId: string, name: string) => {
    if (!confirm(`Phê duyệt cho "${name}" chính thức tham gia lớp 9A?`)) return

    setApprovingId(memberId)
    // Optimistic UI
    setMembersList((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, is_approved: true } : m))
    )

    const res = await approveMember(memberId)
    setApprovingId(null)

    if (!res.success) {
      alert(res.error)
      setMembersList(members)
    } else {
      router.refresh()
    }
  }

  const handleDelete = async (memberId: string, name: string) => {
    if (
      !confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn XÓA vĩnh viễn hồ sơ chờ duyệt của "${name}" khỏi lớp? Hành động này không thể hoàn tác!`
      )
    )
      return

    setDeletingId(memberId)
    // Optimistic UI
    setMembersList((prev) => prev.filter((m) => m.id !== memberId))

    const res = await deleteMember(memberId)
    setDeletingId(null)

    if (!res.success) {
      alert(res.error)
      setMembersList(members)
    } else {
      router.refresh()
    }
  }

  const filteredMembers = membersList.filter((member) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const nameMatch = member.full_name?.toLowerCase().includes(term)
    const nickMatch = member.nickname?.toLowerCase().includes(term)
    const roleMatch = member.school_role?.toLowerCase().includes(term)
    const jobMatch = member.current_job?.toLowerCase().includes(term)
    const locMatch = member.location?.toLowerCase().includes(term)
    return nameMatch || nickMatch || roleMatch || jobMatch || locMatch
  })

  return (
    <div>
      {/* Search Input & Info Bar */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full min-w-0">
        <div className="relative max-w-md w-full min-w-0">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, biệt danh, nơi ở, vai trò..."
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground shadow-sm min-h-[40px]"
          />
        </div>

        {isAdmin && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-300 dark:border-amber-800/50 self-stretch sm:self-auto justify-center sm:justify-start">
            <span>🛡️ Quyền Admin: Có thể bấm duyệt ngay hoặc vào</span>
            <a href="/admin" className="font-bold underline hover:text-amber-950">
              Trang Quản Trị
            </a>
          </div>
        )}
      </div>

      {/* Grid of Member Cards (Yearbook / Student card style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
        {filteredMembers.map((member) => {
          const isCurrentUser = member.id === currentUserId
          const displayName = member.full_name || 'Thành viên lớp 9A'

          return (
            <div
              key={member.id}
              onClick={() => handleCardClick(member)}
              className={`bg-card rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col overflow-hidden group cursor-pointer ${
                isCurrentUser ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Card Header with Avatar */}
              <div className="p-6 flex flex-col items-center text-center bg-secondary/10 relative">
                {isCurrentUser && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Bạn
                  </span>
                )}
                {member.role === 'admin' && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
                {member.is_approved === false && (
                  isAdmin ? (
                    <div className="absolute bottom-2 left-3 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={approvingId === member.id || deletingId === member.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApprove(member.id, displayName)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 hover:bg-emerald-600 text-amber-900 hover:text-white border border-amber-300 hover:border-emerald-600 px-2.5 py-0.5 rounded-full shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Bấm để phê duyệt ngay thành viên này"
                      >
                        {approvingId === member.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        <span>Chờ duyệt</span>
                      </button>
                      <button
                        type="button"
                        disabled={approvingId === member.id || deletingId === member.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(member.id, displayName)
                        }}
                        className="inline-flex items-center justify-center p-1 rounded-full bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-300 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                        title={`Xóa vĩnh viễn hồ sơ chờ duyệt của ${displayName}`}
                      >
                        {deletingId === member.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="absolute bottom-2 left-3 text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                      Chờ duyệt
                    </span>
                  )
                )}

                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-secondary/30 mb-3 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-serif font-bold text-foreground/40">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-h-[2.75rem] flex items-center justify-center w-full px-1">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors text-center leading-snug break-words">
                    {displayName}
                  </h3>
                </div>

                {member.nickname && (
                  <p className="text-xs text-foreground/70 font-medium mt-0.5 bg-background px-2.5 py-0.5 rounded-full border border-border/60">
                    "{member.nickname}"
                  </p>
                )}

                {member.school_role && (
                  <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{member.school_role}</span>
                  </p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between text-xs text-foreground/80 space-y-3">
                {/* Nếu người xem không phải thành viên chính thức và không phải hồ sơ của chính họ: ẩn chi tiết cá nhân */}
                {!isApprovedMember && !isCurrentUser ? (
                  <div className="py-5 px-3 rounded-2xl bg-secondary/20 border border-dashed border-border/80 text-center flex flex-col items-center justify-center gap-2 my-auto">
                    <div className="w-8 h-8 rounded-full bg-secondary/60 flex items-center justify-center text-foreground/50">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-foreground/60 font-medium leading-relaxed px-1">
                      Hồ sơ cá nhân chỉ mở cho thành viên lớp
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {member.current_job && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
                          <span className="break-words line-clamp-2">{member.current_job}</span>
                        </div>
                      )}

                      {member.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
                          <span className="break-words line-clamp-2">{member.location}</span>
                        </div>
                      )}
                    </div>

                    {member.quote && (
                      <div className="pt-2 border-t border-border/60">
                        <div className="flex gap-1.5 items-start">
                          <Quote className="w-3 h-3 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                          <p className="font-handwriting text-base text-foreground/85 line-clamp-2 leading-snug">
                            "{member.quote}"
                          </p>
                        </div>
                      </div>
                    )}

                    {member.facebook_url && (
                      <div className="pt-2">
                        <a
                          href={member.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium hover:underline text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Trang cá nhân</span>
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* Actions footer: All members can view profile, current user can edit, Admin can approve/delete */}
                {isCurrentUser ? (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingMember(member)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-foreground/80 transition-all duration-200 border border-border shadow-2xs cursor-pointer group-hover:border-primary/40"
                      title={`Xem chi tiết hồ sơ của ${displayName}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem hồ sơ</span>
                    </button>
                    <div onClick={(e) => e.stopPropagation()}>
                      <EditProfileModal
                        profile={member}
                        isAdmin={false}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-200 border border-primary/20 shadow-xs cursor-pointer"
                            title="Chỉnh sửa hồ sơ của bạn"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                          </button>
                        }
                      />
                    </div>
                  </div>
                ) : isAdmin && member.is_approved === false ? (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingMember(member)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-foreground/80 transition-all duration-200 border border-border shadow-2xs cursor-pointer"
                      title={`Xem chi tiết hồ sơ của ${displayName}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={approvingId === member.id || deletingId === member.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApprove(member.id, displayName)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        title={`Phê duyệt ${displayName} vào lớp`}
                      >
                        {approvingId === member.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        <span>Duyệt</span>
                      </button>
                      <button
                        type="button"
                        disabled={approvingId === member.id || deletingId === member.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(member.id, displayName)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        title={`Xóa vĩnh viễn hồ sơ chờ duyệt của ${displayName}`}
                      >
                        {deletingId === member.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-rose-600" />
                        )}
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCardClick(member)
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-primary hover:text-primary-foreground text-foreground/80 transition-all duration-200 border border-border shadow-2xs cursor-pointer group-hover:bg-primary group-hover:text-primary-foreground"
                      title={isApprovedMember ? `Bấm để xem đầy đủ hồ sơ của ${displayName}` : 'Hồ sơ chỉ dành cho thành viên lớp'}
                    >
                      {isApprovedMember ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Xem hồ sơ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {filteredMembers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-dashed border-border">
            <p className="text-foreground/60 text-sm">
              Không tìm thấy thành viên nào phù hợp với từ khóa "{searchTerm}".
            </p>
          </div>
        )}
      </div>

      {/* Profile Detail View Modal */}
      <ViewProfileModal
        member={activeViewingMember}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        isOpen={!!activeViewingMember}
        onClose={() => setViewingMember(null)}
      />

      {/* Access Denied Modal for Non-members */}
      {showAccessDeniedModal && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAccessDeniedModal(false)}
        >
          <div
            className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAccessDeniedModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                Quyền Riêng Tư Lớp 9A
              </h3>
              <p className="text-xs text-foreground/60 mt-1">
                Hồ sơ thành viên: <strong className="text-foreground">{deniedTargetName}</strong>
              </p>
            </div>

            <div className="bg-secondary/25 border border-border/80 rounded-2xl p-4 text-xs text-foreground/75 space-y-2.5 leading-relaxed">
              <p>
                🔒 Để bảo vệ quyền riêng tư và thông tin cá nhân (số điện thoại, email, nơi ở, công việc...) của các thành viên trong tập thể lớp 9A (1997 - 2001), hồ sơ chi tiết chỉ mở cho các thành viên chính thức.
              </p>
              {!currentUserId ? (
                <p className="text-foreground font-medium pt-1 border-t border-border/50">
                  Nếu bạn là bạn học cùng lớp hoặc thầy cô, vui lòng đăng nhập hoặc gửi yêu cầu đăng ký để Ban Quản Trị phê duyệt tham gia nhé!
                </p>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-amber-800 dark:text-amber-300 mt-2">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tài khoản của bạn đang chờ phê duyệt</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Ban Quản Trị sẽ sớm xác nhận bạn vào danh bạ lớp. Sau khi được duyệt, bạn sẽ có quyền xem đầy đủ hồ sơ của tất cả các bạn học!
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {!currentUserId ? (
                <>
                  <a
                    href="/login"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm text-center shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Đăng nhập ngay</span>
                  </a>
                  <a
                    href="/register"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-secondary border border-border text-foreground font-semibold text-xs sm:text-sm text-center hover:bg-secondary/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Đăng ký thành viên</span>
                  </a>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAccessDeniedModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-secondary border border-border text-foreground font-semibold text-xs sm:text-sm text-center hover:bg-secondary/80 transition-all cursor-pointer"
                >
                  Đã hiểu, quay lại
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
