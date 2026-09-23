import { createClient } from '@/lib/supabase/server'
import { logout } from '../(auth)/actions'
import { Home, Image as ImageIcon, Users, BookOpen } from 'lucide-react'

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
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      {user && profile && !profile.is_approved && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-center text-sm font-medium border-b border-amber-200">
          Tài khoản của bạn ({profile.full_name}) đang chờ Admin duyệt. Bạn có thể xem ảnh nhưng chưa thể tải ảnh lên.
        </div>
      )}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-serif font-bold text-xl text-primary hover:opacity-80 transition-opacity flex items-center gap-2">
            <span>9A Memories</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/" className="font-medium hover:text-primary transition-colors">Trang chủ</a>
            <a href="/albums" className="font-medium hover:text-primary transition-colors">Albums</a>
            <a href="/members" className="font-medium hover:text-primary transition-colors">Thành viên</a>
            <a href="/guestbook" className="font-medium hover:text-primary transition-colors">Lưu bút</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-foreground/70 hidden sm:inline-block">
                  {profile?.full_name || 'Thành viên'}
                </span>
                <form action={logout}>
                  <button className="text-sm font-medium bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-full transition-colors">
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <a
                href="/login"
                className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-full transition-colors shadow-sm"
              >
                Đăng nhập
              </a>
            )}
          </div>
        </div>
      </header>

      {children}

      {/* Mobile Bottom Navigation Bar (Modern Web Guidance) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around py-2 px-2 shadow-lg">
        <a href="/" className="flex flex-col items-center gap-0.5 text-foreground/70 hover:text-primary p-1.5 transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Trang chủ</span>
        </a>
        <a href="/albums" className="flex flex-col items-center gap-0.5 text-foreground/70 hover:text-primary p-1.5 transition-colors">
          <ImageIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Albums</span>
        </a>
        <a href="/members" className="flex flex-col items-center gap-0.5 text-foreground/70 hover:text-primary p-1.5 transition-colors">
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Thành viên</span>
        </a>
        <a href="/guestbook" className="flex flex-col items-center gap-0.5 text-foreground/70 hover:text-primary p-1.5 transition-colors">
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Lưu bút</span>
        </a>
      </nav>
    </div>
  )
}
