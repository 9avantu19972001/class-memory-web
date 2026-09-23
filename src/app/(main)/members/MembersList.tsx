'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Briefcase, ExternalLink, Quote, GraduationCap, Edit3, UserCheck, Loader2 } from 'lucide-react'
import EditProfileModal from './EditProfileModal'
import { approveMember } from '../admin/actions'

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
}

export default function MembersList({
  members,
  currentUserId,
  isAdmin = false,
}: {
  members: Member[]
  currentUserId: string | null
  isAdmin?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [membersList, setMembersList] = useState<Member[]>(members)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const router = useRouter()

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
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, biệt danh, nơi ở, vai trò..."
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground shadow-sm"
          />
        </div>

        {isAdmin && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-300 dark:border-amber-800/50 self-start sm:self-auto">
            <span>🛡️ Quyền Admin: Có thể bấm duyệt ngay hoặc vào</span>
            <a href="/admin" className="font-bold underline hover:text-amber-950">
              Trang Quản Trị
            </a>
          </div>
        )}
      </div>

      {/* Grid of Member Cards (Yearbook / Student card style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => {
          const isCurrentUser = member.id === currentUserId
          const displayName = member.full_name || 'Thành viên lớp 9A'

          return (
            <div
              key={member.id}
              className={`bg-card rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col overflow-hidden group ${
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
                    <button
                      type="button"
                      disabled={approvingId === member.id}
                      onClick={() => handleApprove(member.id, displayName)}
                      className="absolute bottom-2 left-3 inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 hover:bg-emerald-600 text-amber-900 hover:text-white border border-amber-300 hover:border-emerald-600 px-2.5 py-0.5 rounded-full shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                      title="Bấm để phê duyệt ngay thành viên này"
                    >
                      {approvingId === member.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserCheck className="w-3 h-3" />
                      )}
                      <span>Chờ duyệt (Bấm duyệt)</span>
                    </button>
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

                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {displayName}
                </h3>

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
                <div className="space-y-2">
                  {member.current_job && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
                      <span className="line-clamp-1">{member.current_job}</span>
                    </div>
                  )}

                  {member.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
                      <span className="line-clamp-1">{member.location}</span>
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
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium hover:underline text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Trang cá nhân</span>
                    </a>
                  </div>
                )}

                {/* Edit Button directly on each member card */}
                {(isCurrentUser || isAdmin) && (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-foreground/50 font-medium">
                        {isCurrentUser ? 'Hồ sơ của bạn' : 'Quản trị viên'}
                      </span>
                      {isAdmin && member.is_approved === false && (
                        <button
                          type="button"
                          disabled={approvingId === member.id}
                          onClick={() => handleApprove(member.id, displayName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                          title={`Phê duyệt ${displayName} vào lớp`}
                        >
                          {approvingId === member.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          <span>Duyệt</span>
                        </button>
                      )}
                    </div>
                    <EditProfileModal
                      profile={member}
                      isAdmin={isAdmin}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-200 border border-primary/20 shadow-xs"
                          title={isCurrentUser ? 'Chỉnh sửa hồ sơ của bạn' : `Chỉnh sửa hồ sơ của ${displayName}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                      }
                    />
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
    </div>
  )
}
