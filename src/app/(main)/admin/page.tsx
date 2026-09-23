import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard, { ProfileItem } from './AdminDashboard'
import { ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Quản Trị Lớp 9A - Ban Quản Trị',
  description: 'Giao diện quản lý và phê duyệt thành viên lớp 9A',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if caller is admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-card border border-border p-8 sm:p-12 rounded-3xl shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-foreground">
            Khu vực Quản trị viên
          </h2>
          <p className="text-xs text-foreground/60 leading-relaxed">
            Bạn không có quyền truy cập vào trang này. Chỉ các bạn trong Ban liên lạc / Quản trị viên Lớp 9A mới có thể vào khu vực duyệt thành viên.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Về Trang chủ
            </a>
          </div>
        </div>
      </main>
    )
  }

  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, email, avatar_url, role, school_role, current_job, location, is_approved, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin profiles:', error)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <AdminDashboard
        initialProfiles={(profiles as ProfileItem[]) || []}
        currentUserId={user.id}
      />
    </main>
  )
}
