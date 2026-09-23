'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Calendar, PartyPopper } from 'lucide-react'

export default function CountdownTimer() {
  const [mounted, setMounted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  })
  const [showFinishedMessage, setShowFinishedMessage] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Đích đến: 08:00:00 ngày 01/05/2027 theo giờ Việt Nam (UTC+7)
    const targetDate = new Date('2027-05-01T08:00:00+07:00').getTime()

    const calculateTime = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance <= 0) {
        setIsFinished(true)
        setTimeout(() => {
          setShowFinishedMessage(true)
        }, 150)
        return true
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24))
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      })

      return false
    }

    const finished = calculateTime()
    if (finished) return

    const intervalId = setInterval(() => {
      const isDone = calculateTime()
      if (isDone) {
        clearInterval(intervalId)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full max-w-xl mx-auto bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md min-h-[160px] animate-pulse" />
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-card text-foreground border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-md sm:shadow-xl relative overflow-hidden backdrop-blur-md transition-all">
      {/* Ánh sáng mờ trang trí phía sau */}
      <div className="absolute -top-20 -left-20 w-44 h-44 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Tiêu đề */}
      <div className="text-center mb-3.5 sm:mb-6 relative z-10">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Đếm ngược ngày hội ngộ</span>
        </span>
        <h3 className="text-base sm:text-xl md:text-2xl font-serif font-bold tracking-tight text-foreground">
          Hội Ngộ Niên Khóa 1997 – 2001
        </h3>
        <p className="text-[11px] sm:text-xs text-foreground/70 mt-0.5 sm:mt-1 flex items-center justify-center gap-1 font-medium">
          <Calendar className="w-3 h-3 text-foreground/50" />
          <span>Thời khắc hội ngộ: 08:00 – Ngày 01/05/2027</span>
        </p>
      </div>

      {/* 4 Ô vuông bo góc hiển thị Ngày - Giờ - Phút - Giây */}
      {!isFinished ? (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 relative z-10 transition-all duration-700 ease-out">
          {/* Ô Ngày */}
          <div className="flex flex-col items-center justify-center py-2 px-1 sm:p-4 rounded-xl sm:rounded-2xl bg-background border border-border shadow-xs hover:border-primary/50 transition-all group">
            <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-primary group-hover:scale-105 transition-transform duration-300">
              {timeLeft.days}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-foreground/60 uppercase tracking-wider mt-0.5 sm:mt-1">
              Ngày
            </span>
          </div>

          {/* Ô Giờ */}
          <div className="flex flex-col items-center justify-center py-2 px-1 sm:p-4 rounded-xl sm:rounded-2xl bg-background border border-border shadow-xs hover:border-primary/50 transition-all group">
            <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-primary group-hover:scale-105 transition-transform duration-300">
              {timeLeft.hours}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-foreground/60 uppercase tracking-wider mt-0.5 sm:mt-1">
              Giờ
            </span>
          </div>

          {/* Ô Phút */}
          <div className="flex flex-col items-center justify-center py-2 px-1 sm:p-4 rounded-xl sm:rounded-2xl bg-background border border-border shadow-xs hover:border-primary/50 transition-all group">
            <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-primary group-hover:scale-105 transition-transform duration-300">
              {timeLeft.minutes}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-foreground/60 uppercase tracking-wider mt-0.5 sm:mt-1">
              Phút
            </span>
          </div>

          {/* Ô Giây */}
          <div className="flex flex-col items-center justify-center py-2 px-1 sm:p-4 rounded-xl sm:rounded-2xl bg-background border border-border shadow-xs hover:border-amber-400 transition-all group">
            <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-amber-500 group-hover:scale-105 transition-transform duration-300">
              {timeLeft.seconds}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-foreground/60 uppercase tracking-wider mt-0.5 sm:mt-1">
              Giây
            </span>
          </div>
        </div>
      ) : (
        /* Thông báo Fade-in khi hết giờ */
        <div
          className={`py-8 text-center relative z-10 transition-all duration-1000 ease-out ${
            showFinishedMessage
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce shadow-md">
            <PartyPopper className="w-8 h-8" />
          </div>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            Chào mừng ngày hội ngộ!
          </h3>
          <p className="text-sm sm:text-base text-foreground/80 mt-2 font-medium">
            🎉 Thời khắc thiêng liêng sau bao năm xa cách đã chính thức bắt đầu!
          </p>
        </div>
      )}
    </div>
  )
}
