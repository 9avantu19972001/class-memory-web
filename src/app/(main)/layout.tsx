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

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check approval status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Tài khoản đang chờ duyệt</h2>
        <p className="text-foreground/70 mb-8 max-w-md">
          Xin chào {profile?.full_name || 'bạn'}, yêu cầu tham gia của bạn đang được Ban quản trị xem xét. 
          Vui lòng quay lại sau nhé!
        </p>
        <form action={logout}>
          <button type="submit" className="text-primary hover:underline">
            Đăng xuất
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-xl text-primary">9A1 Memories</div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="font-medium hover:text-primary transition-colors">Trang chủ</a>
            <a href="/albums" className="font-medium hover:text-primary transition-colors">Albums</a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/70 hidden sm:inline-block">
              {profile.full_name}
            </span>
            <form action={logout}>
              <button className="text-sm font-medium bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-full transition-colors">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
