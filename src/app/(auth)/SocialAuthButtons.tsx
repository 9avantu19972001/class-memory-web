'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function SocialAuthButtons({
  mode = 'register',
}: {
  mode?: 'login' | 'register'
}) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null)
  const supabase = createClient()

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setLoadingProvider(provider)
      const redirectTo = `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        alert(`Lỗi đăng nhập: ${error.message}`)
        setLoadingProvider(null)
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Có lỗi xảy ra khi kết nối xác thực.')
      setLoadingProvider(null)
    }
  }

  const actionText = mode === 'register' ? 'Đăng ký nhanh' : 'Đăng nhập'

  return (
    <div className="space-y-3">
      {/* Google Button */}
      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuth('google')}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary/40 text-foreground text-sm font-semibold transition-all shadow-xs hover:shadow-sm disabled:opacity-60"
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{actionText} bằng Google (Gmail)</span>
      </button>

      {/* Facebook Button */}
      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuth('facebook')}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-semibold transition-all shadow-xs hover:shadow-sm disabled:opacity-60"
      >
        {loadingProvider === 'facebook' ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        <span>{actionText} bằng Facebook</span>
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-card px-2.5 text-foreground/50 font-medium">
            {mode === 'register' ? 'Hoặc tạo tài khoản bằng email' : 'Hoặc đăng nhập bằng email'}
          </span>
        </div>
      </div>
    </div>
  )
}
