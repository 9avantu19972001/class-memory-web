import { createClient } from '@/lib/supabase/server'
import MembersList from './MembersList'
import EditProfileModal from './EditProfileModal'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const supabase = await createClient()

  // Fetch approved members
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: true })

  // Check current user
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserProfile = members?.find((m) => m.id === user?.id)

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Thành viên Lớp 9A
            </h1>
          </div>
          <p className="text-foreground/70 text-sm">
            Danh bạ các thành viên cùng lưu giữ thanh xuân ({members?.length || 0} bạn)
          </p>
        </div>

        {currentUserProfile && (
          <EditProfileModal profile={currentUserProfile} />
        )}
      </div>

      {/* Members Directory */}
      <MembersList members={members || []} currentUserId={user?.id || null} />
    </main>
  )
}
