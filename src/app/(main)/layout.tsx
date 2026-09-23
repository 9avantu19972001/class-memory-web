import { createClient } from '@/lib/supabase/server'
import { logout } from '../(auth)/actions'
import { Shield } from 'lucide-react'
import BottomNav from './BottomNav'
import MusicPlayer from '@/components/MusicPlayer'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let pendingCount = 0

  if (user) {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('is_approved, full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }
    profile = data

    // If admin, check number of pending registration requests
    if (profile?.role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false)
      pendingCount = count || 0
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 w-full overflow-x-hidden">
      {user && profile && !profile.is_approved && (
        <div className="bg-amber-100 text-amber-900 px-3 sm:px-4 py-2 text-center text-xs sm:text-sm font-medium border-b border-amber-200">
          Tài khoản của bạn ({profile.full_name}) đang chờ Admin duyệt. Bạn có thể xem ảnh nhưng chưa thể tải ảnh lên.
        </div>
      )}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <a href="/" className="font-serif font-bold text-lg sm:text-xl text-primary hover:opacity-80 transition-opacity flex items-center gap-2">
            <span>9A Memories</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/" className="font-medium hover:text-primary transition-colors">Trang chủ</a>
            <a href="/timeline" className="font-medium hover:text-primary transition-colors">Niên khóa</a>
            <a href="/albums" className="font-medium hover:text-primary transition-colors">Albums</a>
            <a href="/members" className="font-medium hover:text-primary transition-colors">Thành viên</a>
            <a href="/guestbook" className="font-medium hover:text-primary transition-colors">Lưu bút</a>
            {isAdmin && (
              <a
                href="/admin"
                className="font-medium hover:text-primary transition-colors flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-semibold"
              >
                <Shield className="w-4 h-4" />
                <span>Quản trị</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </a>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs sm:text-sm text-foreground/70 hidden sm:inline-block truncate max-w-[150px]">
                  {profile?.full_name || 'Thành viên'}
                </span>
                <form action={logout}>
                  <button className="text-xs sm:text-sm font-medium bg-secondary/50 hover:bg-secondary px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors">
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <a
                href="/login"
                className="text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full transition-colors shadow-sm"
              >
                Đăng nhập
              </a>
            )}
          </div>
        </div>
      </header>

      {children}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav isAdmin={isAdmin} pendingCount={pendingCount} />

      {/* Floating Nostalgic Music Player */}
      <MusicPlayer />
    </div>
  )
}
