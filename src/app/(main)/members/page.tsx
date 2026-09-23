import { createClient } from '@/lib/supabase/server'
import MembersList from './MembersList'
import EditProfileModal from './EditProfileModal'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const supabase = await createClient()

  // Check current user
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentUserProfile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const isAdmin = currentUserProfile?.role === 'admin'
  const isApprovedMember = isAdmin || currentUserProfile?.is_approved === true

  // Fetch members: Admins see all, visitors see approved members (plus own profile if logged in)
  let query = supabase.from('profiles').select('*')
  if (!isAdmin) {
    if (user) {
      query = query.or(`is_approved.eq.true,id.eq.${user.id}`)
    } else {
      query = query.eq('is_approved', true)
    }
  }
  const { data: rawMembers } = await query.order('created_at', { ascending: true })

  // Bảo mật phía máy chủ (Server-side Sanitization):
  // Nếu người xem KHÔNG PHẢI là thành viên chính thức của lớp:
  // - Chỉ giữ lại thông tin danh bạ chung (tên, ảnh, biệt danh, vai trò xưa).
  // - Toàn bộ thông tin cá nhân (SĐT, email, nơi ở, nghề nghiệp, facebook, kỷ niệm) của các thành viên khác được loại bỏ trước khi truyền về Client.
  // - Nếu là hồ sơ của chính người xem: giữ nguyên để người đó tự xem và chỉnh sửa.
  const members = rawMembers?.map((m) => {
    if (isApprovedMember || (user && m.id === user.id)) {
      return m
    }
    return {
      id: m.id,
      full_name: m.full_name,
      nickname: m.nickname,
      avatar_url: m.avatar_url,
      school_role: m.school_role,
      role: m.role,
      is_approved: m.is_approved,
      created_at: m.created_at,
      current_job: null,
      location: null,
      quote: null,
      facebook_url: null,
      email: null,
      phone_number: null,
      show_email: null,
      show_phone: null,
    }
  })

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full flex-1 min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm w-full">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground break-words">
              Thành viên Lớp 9A
            </h1>
          </div>
          <p className="text-foreground/70 text-xs sm:text-sm">
            Danh bạ các thành viên cùng lưu giữ thanh xuân ({members?.length || 0} bạn)
          </p>
        </div>

        {currentUserProfile && (
          <EditProfileModal
            profile={currentUserProfile}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Members Directory with Edit button on each card */}
      <MembersList
        members={members || []}
        currentUserId={user?.id || null}
        isAdmin={isAdmin}
        isApprovedMember={isApprovedMember}
        currentUserProfile={currentUserProfile}
      />
    </main>
  )
}
