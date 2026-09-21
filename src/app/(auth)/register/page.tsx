import { signup } from '../actions'

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-primary/10">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground font-serif">
            Đăng ký tham gia
          </h2>
          <p className="mt-2 text-center text-sm text-foreground/60">
            Tài khoản cần được Ban quản trị phê duyệt trước khi sử dụng.
          </p>
        </div>
        <form className="mt-8 space-y-6" action={signup}>
          <div className="-space-y-px rounded-md shadow-sm gap-4 flex flex-col">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Họ và tên
              </label>
              <input
                id="full-name"
                name="full_name"
                type="text"
                required
                className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-foreground/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                placeholder="Họ và tên thật của bạn"
              />
            </div>
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
                placeholder="Email"
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
                required
                className="relative block w-full rounded-lg border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-foreground/40 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                placeholder="Mật khẩu (ít nhất 6 ký tự)"
              />
            </div>
          </div>

          {searchParams?.error && (
            <div className="text-red-500 text-sm text-center">
              {searchParams.error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary transition-colors"
            >
              Gửi yêu cầu đăng ký
            </button>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-foreground/60">Đã có tài khoản? </span>
            <a href="/login" className="font-semibold text-primary hover:text-primary/80">
              Đăng nhập
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
