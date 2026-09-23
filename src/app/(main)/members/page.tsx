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

  // Fetch members: Admins see all, normal visitors see approved members
  let query = supabase.from('profiles').select('*')
  if (!isAdmin) {
    query = query.eq('is_approved', true)
  }
  const { data: members } = await query.order('created_at', { ascending: true })

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
      />
    </main>
  )
}
