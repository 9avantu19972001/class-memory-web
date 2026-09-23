'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Image as ImageIcon, Users, BookOpen, Shield } from 'lucide-react'

interface BottomNavProps {
  isAdmin?: boolean
  pendingCount?: number
}

export default function BottomNav({ isAdmin = false, pendingCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/timeline', label: 'Niên khóa', icon: History },
    { href: '/albums', label: 'Albums', icon: ImageIcon },
    { href: '/members', label: 'Thành viên', icon: Users },
    { href: '/guestbook', label: 'Lưu bút', icon: BookOpen },
  ]

  return (
    <nav 
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around py-1 px-1 shadow-lg pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))]"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 min-h-[44px] transition-all rounded-xl ${
              isActive
                ? 'text-primary font-bold scale-105'
                : 'text-foreground/60 hover:text-foreground active:scale-95'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
          </Link>
        )
      })}

      {isAdmin && (
        <Link
          href="/admin"
          className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 min-h-[44px] transition-all rounded-xl ${
            pathname.startsWith('/admin')
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-purple-700/70 hover:text-purple-700 active:scale-95'
          }`}
        >
          <div className="relative">
            <Shield className={`w-5 h-5 ${pathname.startsWith('/admin') ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white leading-none animate-pulse shadow-xs">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-bold leading-tight">Quản trị</span>
        </Link>
      )}
    </nav>
  )
}
