import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '../(auth)/actions'

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
    <div className="min-h-screen flex flex-col">
      {user && profile && !profile.is_approved && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-center text-sm font-medium border-b border-amber-200">
          Tài khoản của bạn ({profile.full_name}) đang chờ Admin duyệt. Bạn có thể xem ảnh nhưng chưa thể tải ảnh lên.
        </div>
      )}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-serif font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            9A Memories
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="font-medium hover:text-primary transition-colors">Trang chủ</a>
            <a href="/albums" className="font-medium hover:text-primary transition-colors">Albums</a>
            <a href="/members" className="font-medium hover:text-primary transition-colors">Thành viên</a>
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
    </div>
  )
}
