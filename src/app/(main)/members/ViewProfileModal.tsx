'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  User,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Quote,
  ExternalLink,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  Copy,
  Check,
  ZoomIn,
  Edit3,
  Phone,
  MessageCircle,
  Lock,
  EyeOff,
} from 'lucide-react'
import EditProfileModal, { Profile } from './EditProfileModal'

export interface ViewProfileModalProps {
  member: Profile & {
    email?: string | null
    is_approved?: boolean
    created_at?: string
  } | null
  currentUserId: string | null
  isAdmin?: boolean
  isOpen: boolean
  onClose: () => void
}

export default function ViewProfileModal({
  member,
  currentUserId,
  isAdmin = false,
  isOpen,
  onClose,
}: ViewProfileModalProps) {
  const [mounted, setMounted] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [zoomedAvatar, setZoomedAvatar] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (zoomedAvatar) {
            setZoomedAvatar(false)
          } else {
            onClose()
          }
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, zoomedAvatar, onClose])

  if (!mounted || !isOpen || !member) return null

  const isCurrentUser = member.id === currentUserId
  const displayName = member.full_name || 'Thành viên Lớp 9A'
  const createdDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

  // Privacy evaluations:
  // Email: show if isCurrentUser, or isAdmin, or show_email !== false
  const canSeeEmail = isCurrentUser || isAdmin || member.show_email !== false
  const isEmailHiddenFromClass = member.show_email === false

  // Phone: show if isCurrentUser, or isAdmin, or show_phone === true
  const canSeePhone = isCurrentUser || isAdmin || member.show_phone === true
  const isPhoneHiddenFromClass = member.show_phone !== true

  const cleanPhone = member.phone_number?.replace(/\D/g, '') || ''

  const copyEmail = () => {
    if (!member.email) return
    navigator.clipboard.writeText(member.email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const copyPhone = () => {
    if (!member.phone_number) return
    navigator.clipboard.writeText(member.phone_number)
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-member-name"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 relative">
        {/* Decorative Top Cover Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-primary/30 via-amber-200/40 to-primary/20 dark:from-primary/40 dark:via-zinc-800 dark:to-primary/30 relative flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 hover:bg-background text-foreground/70 hover:text-foreground flex items-center justify-center shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95 z-20 cursor-pointer"
            title="Đóng hồ sơ"
            aria-label="Đóng hồ sơ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar Overlap */}
        <div className="px-5 sm:px-6 relative flex flex-col items-center -mt-16 sm:-mt-20 z-10 flex-shrink-0">
          <div className="relative group">
            <div
              onClick={() => member.avatar_url && setZoomedAvatar(true)}
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-card shadow-xl bg-secondary/50 flex items-center justify-center transition-transform duration-300 ${
                member.avatar_url ? 'cursor-pointer hover:scale-105' : ''
              }`}
              title={member.avatar_url ? 'Bấm để phóng to ảnh đại diện' : displayName}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl sm:text-5xl font-serif font-bold text-primary/60">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {member.avatar_url && (
              <div
                onClick={() => setZoomedAvatar(true)}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                title="Phóng to ảnh"
              >
                <ZoomIn className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Name & Nickname */}
          <h2
            id="modal-member-name"
            className="text-xl sm:text-2xl font-serif font-bold text-foreground text-center mt-3 leading-snug break-words max-w-full px-2"
          >
            {displayName}
          </h2>

          {member.nickname && (
            <p className="text-xs sm:text-sm text-foreground/75 font-medium mt-1 bg-secondary/50 px-3 py-0.5 rounded-full border border-border/80">
              "{member.nickname}"
            </p>
          )}

          {/* Badges Row */}
          <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
            {member.school_role ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{member.school_role}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/60 text-foreground/70 border border-border">
                <GraduationCap className="w-3.5 h-3.5 text-foreground/50" />
                <span>Học sinh 9A (1997 - 2001)</span>
              </span>
            )}

            {member.role === 'admin' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800">
                <Shield className="w-3 h-3 text-amber-600" />
                <span>Ban Quản Trị</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/60 text-foreground/70 border border-border">
                <User className="w-3 h-3 text-foreground/50" />
                <span>Thành viên</span>
              </span>
            )}

            {isCurrentUser && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-2xs">
                <span>Bạn</span>
              </span>
            )}

            {member.is_approved === false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <Clock className="w-3 h-3 text-rose-600" />
                <span>Chờ phê duyệt</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* Quote / Châm ngôn / Kỷ niệm khó quên */}
          {member.quote ? (
            <div className="bg-amber-50/80 dark:bg-zinc-900/80 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 relative shadow-2xs">
              <Quote className="w-5 h-5 text-amber-500/50 absolute top-3 left-3 rotate-180 pointer-events-none" />
              <div className="pl-6 pt-0.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-800/80 dark:text-amber-300/80 mb-1">
                  Châm ngôn & Kỷ niệm nhớ nhất
                </p>
                <p className="font-handwriting text-base sm:text-lg text-foreground/90 leading-relaxed italic whitespace-pre-line">
                  "{member.quote}"
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/20 border border-dashed border-border rounded-2xl p-3.5 text-center">
              <p className="text-xs text-foreground/50 italic">
                {isCurrentUser
                  ? 'Bạn chưa thêm châm ngôn hoặc kỷ niệm xưa. Hãy bấm "Chỉnh sửa hồ sơ" để viết thêm nhé!'
                  : 'Thành viên chưa thêm châm ngôn hoặc kỷ niệm xưa.'}
              </p>
            </div>
          )}

          {/* Details Information Card */}
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5 border-b border-border pb-2">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Thông tin chi tiết</span>
            </h3>

            {/* Current Job */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-foreground/50 font-medium">Nghề nghiệp hiện tại</p>
                <p className="font-medium text-foreground text-xs sm:text-sm break-words">
                  {member.current_job || (
                    <span className="text-foreground/40 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-foreground/50 font-medium">Nơi ở / Làm việc hiện tại</p>
                <p className="font-medium text-foreground text-xs sm:text-sm break-words">
                  {member.location || (
                    <span className="text-foreground/40 italic">Chưa cập nhật</span>
                  )}
                </p>
              </div>
            </div>

            {/* Phone Number (if available & permitted) */}
            {member.phone_number ? (
              canSeePhone ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] text-foreground/50 font-medium">Số điện thoại liên lạc</p>
                      {isPhoneHiddenFromClass && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1 font-semibold">
                          <EyeOff className="w-2.5 h-2.5" />
                          <span>Ẩn với lớp ({isCurrentUser ? 'Chỉ bạn & Admin thấy' : 'Bạn thấy vì là Admin'})</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-semibold text-foreground text-xs sm:text-sm tracking-wide">
                        {member.phone_number}
                      </span>
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-white bg-emerald-100 hover:bg-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-600 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-800 hover:border-transparent"
                          title="Bấm để gọi điện"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Gọi</span>
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`https://zalo.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:text-white bg-blue-100 hover:bg-blue-600 dark:bg-blue-950/60 dark:hover:bg-blue-600 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer border border-blue-300 dark:border-blue-800 hover:border-transparent"
                          title="Mở trò chuyện Zalo"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Zalo</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={copyPhone}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        title="Sao chép số điện thoại"
                      >
                        {copiedPhone ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/60 text-foreground/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-foreground/50 font-medium">Số điện thoại liên lạc</p>
                    <p className="text-xs text-foreground/50 italic flex items-center gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3 text-foreground/40 shrink-0" />
                      <span>Thành viên đã ẩn số điện thoại theo cài đặt riêng tư</span>
                    </p>
                  </div>
                </div>
              )
            ) : null}

            {/* Email (if available & permitted) */}
            {member.email ? (
              canSeeEmail ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] text-foreground/50 font-medium">Email liên lạc</p>
                      {isEmailHiddenFromClass && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1 font-semibold">
                          <EyeOff className="w-2.5 h-2.5" />
                          <span>Ẩn với lớp ({isCurrentUser ? 'Chỉ bạn & Admin thấy' : 'Bạn thấy vì là Admin'})</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-medium text-foreground text-xs sm:text-sm break-all">
                        {member.email}
                      </span>
                      <button
                        type="button"
                        onClick={copyEmail}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        title="Sao chép email"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/60 text-foreground/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-foreground/50 font-medium">Email liên lạc</p>
                    <p className="text-xs text-foreground/50 italic flex items-center gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3 text-foreground/40 shrink-0" />
                      <span>Thành viên đã ẩn email theo cài đặt riêng tư</span>
                    </p>
                  </div>
                </div>
              )
            ) : null}

            {/* Facebook Link */}
            {member.facebook_url && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-foreground/50 font-medium">Trang mạng xã hội</p>
                  <a
                    href={member.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline mt-0.5"
                  >
                    <span>Trang Facebook cá nhân</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Created date */}
            {createdDate && (
              <div className="flex items-center gap-3 pt-1 border-t border-border/60 text-xs text-foreground/60">
                <Calendar className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                <span>Tham gia danh bạ lớp vào ngày: {createdDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-secondary/15 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2">
            {isCurrentUser && (
              <EditProfileModal
                profile={member}
                isAdmin={isAdmin}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>
                }
              />
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-border text-foreground/80 hover:bg-secondary font-medium transition-colors text-xs sm:text-sm cursor-pointer ml-auto"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Lightbox Zoom for Avatar */}
      {zoomedAvatar && member.avatar_url && (
        <div
          onClick={() => setZoomedAvatar(false)}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-lg max-h-[90vh] bg-card p-3 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={member.avatar_url}
              alt={displayName}
              className="max-h-[75vh] w-auto rounded-xl object-contain mx-auto"
            />
            <p className="text-center text-xs text-foreground/60 mt-2 font-handwriting">
              Bấm ra ngoài để đóng ảnh
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(modalContent, document.body)
}
