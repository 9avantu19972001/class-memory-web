'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Calendar,
  Sparkles,
  Loader2,
  Mail,
  MapPin,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import {
  approveMember,
  revokeMember,
  toggleAdminRole,
  deleteMember,
  updateMemberDetails,
} from './actions'

export interface ProfileItem {
  id: string
  full_name: string | null
  nickname: string | null
  email?: string | null
  avatar_url: string | null
  role: string | null
  school_role: string | null
  current_job: string | null
  location: string | null
  is_approved: boolean
  created_at: string
}

export default function AdminDashboard({
  initialProfiles,
  currentUserId,
}: {
  initialProfiles: ProfileItem[]
  currentUserId: string
}) {
  const [profiles, setProfiles] = useState<ProfileItem[]>(initialProfiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'admin' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<ProfileItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    nickname: '',
    school_role: '',
    current_job: '',
    location: '',
  })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Stats calculation
  const totalCount = profiles.length
  const pendingCount = profiles.filter((p) => !p.is_approved).length
  const approvedCount = profiles.filter((p) => p.is_approved).length
  const adminCount = profiles.filter((p) => p.role === 'admin').length

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    // 1. Tab filter
    if (activeTab === 'pending' && p.is_approved) return false
    if (activeTab === 'approved' && !p.is_approved) return false
    if (activeTab === 'admin' && p.role !== 'admin') return false

    // 2. Search filter
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true

    const nameMatch = p.full_name?.toLowerCase().includes(term)
    const nickMatch = p.nickname?.toLowerCase().includes(term)
    const emailMatch = p.email?.toLowerCase().includes(term)
    const roleMatch = p.school_role?.toLowerCase().includes(term)
    const jobMatch = p.current_job?.toLowerCase().includes(term)
    const locMatch = p.location?.toLowerCase().includes(term)

    return nameMatch || nickMatch || emailMatch || roleMatch || jobMatch || locMatch
  })

  // Handlers
  const handleApprove = async (memberId: string) => {
    setProcessingId(memberId)
    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) => (p.id === memberId ? { ...p, is_approved: true } : p))
    )

    const res = await approveMember(memberId)
    setProcessingId(null)

    if (!res.success) {
      alert(res.error)
      // Rollback
      setProfiles((prev) =>
        prev.map((p) => (p.id === memberId ? { ...p, is_approved: false } : p))
      )
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const handleRevoke = async (memberId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi quyền truy cập của thành viên này?')) return

    setProcessingId(memberId)
    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) => (p.id === memberId ? { ...p, is_approved: false } : p))
    )

    const res = await revokeMember(memberId)
    setProcessingId(null)

    if (!res.success) {
      alert(res.error)
      // Rollback
      setProfiles((prev) =>
        prev.map((p) => (p.id === memberId ? { ...p, is_approved: true } : p))
      )
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const handleToggleRole = async (memberId: string, currentRole: string | null) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const confirmMsg =
      newRole === 'admin'
        ? 'Nâng cấp thành viên này thành Quản trị viên (Admin)?'
        : 'Hạ quyền Quản trị viên của thành viên này về Thành viên thường?'

    if (!confirm(confirmMsg)) return

    setProcessingId(memberId)
    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) => (p.id === memberId ? { ...p, role: newRole } : p))
    )

    const res = await toggleAdminRole(memberId, newRole)
    setProcessingId(null)

    if (!res.success) {
      alert(res.error)
      // Rollback
      setProfiles((prev) =>
        prev.map((p) => (p.id === memberId ? { ...p, role: currentRole } : p))
      )
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const handleDelete = async (memberId: string, name: string | null) => {
    if (
      !confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn XÓA vĩnh viễn hồ sơ của "${name || 'thành viên này'}" khỏi lớp? Hành động này không thể hoàn tác!`
      )
    ) {
      return
    }

    setProcessingId(memberId)
    const prevProfiles = [...profiles]
    setProfiles((prev) => prev.filter((p) => p.id !== memberId))

    const res = await deleteMember(memberId)
    setProcessingId(null)

    if (!res.success) {
      alert(res.error)
      setProfiles(prevProfiles)
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  const openEditModal = (member: ProfileItem) => {
    setEditingMember(member)
    setEditFormData({
      full_name: member.full_name || '',
      nickname: member.nickname || '',
      school_role: member.school_role || '',
      current_job: member.current_job || '',
      location: member.location || '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    setProcessingId(editingMember.id)
    const res = await updateMemberDetails(editingMember.id, editFormData)
    setProcessingId(null)

    if (!res.success) {
      alert(res.error)
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === editingMember.id ? { ...p, ...editFormData } : p
        )
      )
      setEditingMember(null)
      startTransition(() => {
        router.refresh()
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Quản Trị Lớp 9A
              </h1>
              <p className="text-xs sm:text-sm text-foreground/60 mt-0.5">
                Phê duyệt thành viên đăng ký mới và quản lý phân quyền lớp học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/members"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Xem danh bạ thành viên</span>
            </a>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* 1. Pending Approvals */}
          <div
            onClick={() => setActiveTab('pending')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                : 'bg-background hover:bg-secondary/20 border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/70">Chờ phê duyệt</span>
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  pendingCount > 0
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-600 mt-2">
              {pendingCount}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">
              {pendingCount > 0 ? 'Cần xem xét và duyệt ngay' : 'Không có yêu cầu nào chờ'}
            </p>
          </div>

          {/* 2. Approved Members */}
          <div
            onClick={() => setActiveTab('approved')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'approved'
                ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                : 'bg-background hover:bg-secondary/20 border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/70">Đã phê duyệt</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-600 mt-2">
              {approvedCount}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Thành viên chính thức lớp 9A</p>
          </div>

          {/* 3. Admins */}
          <div
            onClick={() => setActiveTab('admin')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'admin'
                ? 'bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20'
                : 'bg-background hover:bg-secondary/20 border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/70">Quản trị viên</span>
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-purple-600 mt-2">
              {adminCount}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Ban liên lạc & điều hành</p>
          </div>

          {/* 4. Total Accounts */}
          <div
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'all'
                ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/20'
                : 'bg-background hover:bg-secondary/20 border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/70">Tổng tài khoản</span>
              <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-primary mt-2">
              {totalCount}
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">Toàn bộ hồ sơ trên hệ thống</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-2xl overflow-x-auto border border-border w-full min-w-0 max-w-full no-scrollbar scroll-touch">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            <span>Chờ duyệt</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
              activeTab === 'approved'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Đã duyệt ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
              activeTab === 'admin'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Admin ({adminCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 min-h-[36px] flex items-center justify-center ${
              activeTab === 'all'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Tất cả ({totalCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-foreground/40 min-h-[38px]"
          />
        </div>
      </div>

      {/* Member List Table / Cards */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
          <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-2xl">
            {activeTab === 'pending' ? '🎉' : '🔍'}
          </div>
          <h3 className="font-serif font-bold text-foreground text-lg mb-1">
            {activeTab === 'pending'
              ? 'Tuyệt vời! Không có yêu cầu đăng ký nào đang chờ duyệt'
              : 'Không tìm thấy thành viên phù hợp'}
          </h3>
          <p className="text-xs text-foreground/60 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'Tất cả bạn bè đăng ký tham gia lớp 9A đều đã được phê duyệt đầy đủ.'
              : 'Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang tab khác.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/25 border-b border-border text-foreground/70 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Thành viên</th>
                  <th className="py-3.5 px-4">Niên khóa xưa</th>
                  <th className="py-3.5 px-4">Ngày đăng ký</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProfiles.map((member) => {
                  const isProcessing = processingId === member.id
                  const isCurrent = member.id === currentUserId
                  const createdDate = new Date(member.created_at).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-secondary/15 transition-colors ${
                        !member.is_approved ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 border border-border flex items-center justify-center font-bold text-primary flex-shrink-0">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (member.full_name || 'A').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground truncate text-sm">
                                {member.full_name || 'Chưa đặt tên'}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-foreground/60 mt-0.5">
                              {member.nickname && <span>({member.nickname})</span>}
                              {member.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-foreground/40" />
                                  <span>{member.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* School Role */}
                      <td className="py-3.5 px-4">
                        {member.school_role ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            <Sparkles className="w-3 h-3" />
                            <span>{member.school_role}</span>
                          </span>
                        ) : (
                          <span className="text-foreground/40 italic">Học sinh 9A</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-foreground/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-foreground/40" />
                          <span>{createdDate}</span>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4">
                        {member.is_approved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã duyệt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Chờ duyệt</span>
                          </span>
                        )}
                      </td>

                      {/* Role (Admin / Member) */}
                      <td className="py-3.5 px-4">
                        {member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Quản trị viên</span>
                          </span>
                        ) : (
                          <span className="text-foreground/60">Thành viên</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Approve & Delete Buttons for Pending Profiles */}
                          {!member.is_approved ? (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApprove(member.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                title="Duyệt thành viên này tham gia lớp 9A"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                                <span>Phê duyệt</span>
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleDelete(member.id, member.full_name)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                title="Xóa vĩnh viễn hồ sơ chờ duyệt này"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Xóa</span>
                              </button>
                            </>
                          ) : (
                            /* Revoke Button */
                            !isCurrent && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRevoke(member.id)}
                                className="p-1.5 rounded-lg border border-border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-foreground/60 transition-colors"
                                title="Thu hồi quyền / Tạm khóa"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )
                          )}

                          {/* Quick Edit Details */}
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground/60 hover:text-foreground transition-colors"
                            title="Sửa thông tin nhanh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Admin Role */}
                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleToggleRole(member.id, member.role)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                member.role === 'admin'
                                  ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                                  : 'border-border hover:bg-secondary text-foreground/60 hover:text-foreground'
                              }`}
                              title={
                                member.role === 'admin'
                                  ? 'Hạ quyền xuống thành viên thường'
                                  : 'Nâng cấp lên Quản trị viên'
                              }
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Profile */}
                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleDelete(member.id, member.full_name)}
                              className="p-1.5 rounded-lg border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-foreground/60 transition-colors"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {filteredProfiles.map((member) => {
              const isProcessing = processingId === member.id
              const isCurrent = member.id === currentUserId
              const createdDate = new Date(member.created_at).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })

              return (
                <div
                  key={member.id}
                  className={`p-4 space-y-3 ${!member.is_approved ? 'bg-amber-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 border border-border flex items-center justify-center font-bold text-primary flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (member.full_name || 'A').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground text-sm">
                            {member.full_name || 'Chưa đặt tên'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {member.nickname && <span>({member.nickname}) • </span>}
                          <span>{createdDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {member.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Đã duyệt</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Chờ duyệt</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/70">
                    {member.school_role && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        {member.school_role}
                      </span>
                    )}
                    {member.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px]">
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                    {member.location && (
                      <span className="flex items-center gap-1 text-[11px] text-foreground/60">
                        <MapPin className="w-3 h-3" />
                        {member.location}
                      </span>
                    )}
                  </div>

                  {/* Action buttons on mobile */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    {!member.is_approved ? (
                      <div className="flex-1 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(member.id)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Phê duyệt ngay</span>
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDelete(member.id, member.full_name)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                          title="Xóa vĩnh viễn hồ sơ chờ duyệt này"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    ) : (
                      !isCurrent && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRevoke(member.id)}
                          className="px-3 py-1.5 rounded-xl border border-border text-xs text-foreground/70 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Thu hồi</span>
                        </button>
                      )
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="p-2 rounded-xl border border-border text-foreground/60 hover:bg-secondary"
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isCurrent && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleToggleRole(member.id, member.role)}
                          className={`p-2 rounded-xl border ${
                            member.role === 'admin'
                              ? 'border-purple-200 bg-purple-50 text-purple-700'
                              : 'border-border text-foreground/60'
                          }`}
                          title="Đổi quyền Admin"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}

                      {!isCurrent && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDelete(member.id, member.full_name)}
                          className="p-2 rounded-xl border border-border text-red-600 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border bg-secondary/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm font-serif">
                    Chỉnh sửa thông tin hồ sơ
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Cập nhật chức vụ lớp xưa hoặc thông tin liên lạc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-foreground/50 hover:text-foreground p-1.5 rounded-full hover:bg-secondary/40 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground/80 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.full_name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground/80 mb-1">
                  Biệt danh thời đi học
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tùng Béo, Mai Cận, Tuấn Còi..."
                  value={editFormData.nickname}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, nickname: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground/80 mb-1">
                  Chức vụ / Vai trò niên khóa xưa
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lớp trưởng, Bí thư chi đoàn, Lớp phó học tập, Tổ trưởng tổ 1..."
                  value={editFormData.school_role}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, school_role: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground/80 mb-1">
                    Nơi ở hiện tại
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP.HCM..."
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground/80 mb-1">
                    Công việc hiện tại
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kỹ sư, Bác sĩ, Kinh doanh..."
                    value={editFormData.current_job}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, current_job: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground/70 hover:bg-secondary font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={processingId === editingMember.id}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {processingId === editingMember.id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
