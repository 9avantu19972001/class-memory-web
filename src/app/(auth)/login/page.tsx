import { login } from '../actions'
import SocialAuthButtons from '../SocialAuthButtons'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params?.error
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 bg-primary/10 w-full overflow-x-hidden">
      <div className="w-full max-w-md space-y-6 bg-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-border">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-foreground font-serif">
            Đăng nhập
          </h2>
          <p className="mt-2 text-center text-xs text-foreground/60">
            Chào mừng trở lại không gian kỷ niệm Lớp 9A
          </p>
        </div>

        {/* Social Quick Login */}
        <SocialAuthButtons mode="login" />

        <form className="space-y-5" action={login}>
          <div className="-space-y-px rounded-md shadow-sm gap-4 flex flex-col">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-foreground/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                placeholder="Email của bạn"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-foreground/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
            >
              Đăng nhập
            </button>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-foreground/60">Chưa có tài khoản? </span>
            <a href="/register" className="font-semibold text-primary hover:text-primary/80">
              Đăng ký ngay
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
