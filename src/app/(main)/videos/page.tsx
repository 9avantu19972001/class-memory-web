import { createClient } from '@/lib/supabase/server'
import { Film, Clapperboard, Sparkles } from 'lucide-react'
import VideosList, { VideoItem } from './VideosList'
import AddVideoModal from './AddVideoModal'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Thước Phim Kỷ Niệm 9A | Video Họp Lớp & Kỷ Yếu',
  description: 'Tổng hợp những thước phim sống động, video họp lớp và văn nghệ tuổi học trò Lớp 9A (1997 - 2001)',
}

export default async function VideosPage() {
  const supabase = await createClient()

  // 1. Fetch current user info
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isApproved = false
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved, role')
      .eq('id', user.id)
      .single()

    isApproved = !!profile?.is_approved
    isAdmin = profile?.role === 'admin'
  }

  // 2. Fetch all public/approved albums for video association
  const { data: albumsData } = await supabase
    .from('albums')
    .select('id, title')
    .order('created_at', { ascending: false })

  const albums = albumsData || []

  // 3. Fetch all videos with uploader, album, reactions, and comments
  const { data: videosData } = await supabase
    .from('photos')
    .select(`
      *,
      uploader:uploaded_by ( full_name, avatar_url ),
      albums ( id, title ),
      comments (
        id,
        content,
        created_at,
        user_id,
        profiles:user_id ( full_name, avatar_url, role )
      ),
      reactions (
        id,
        type,
        user_id
      )
    `)
    .eq('is_video', true)
    .order('created_at', { ascending: false })

  const videos: VideoItem[] = (videosData as any[]) || []

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full flex-1 flex flex-col min-w-0">
      {/* Hero Banner with Cinema Aesthetic */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 sm:p-8 mb-6 sm:mb-8 shadow-md">
        {/* Subtle decorative background film pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold">
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span>Rạp Chiếu Phim 9A (1997 - 2001)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
              Thước Phim Kỷ Niệm
            </h1>

            <p className="text-zinc-300 text-xs sm:text-sm font-handwriting text-lg sm:text-xl leading-relaxed">
              "Những thước phim chuyển động lưu giữ tiếng cười, ánh mắt và những ngày tháng rực rỡ nhất dưới mái trường xưa..."
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400 font-medium">
              <span>🎬 {videos.length} thước phim đã chia sẻ</span>
              <span>•</span>
              <span>📁 {albums.length} album kỷ niệm</span>
            </div>
          </div>

          <div className="shrink-0 self-stretch md:self-auto flex items-center justify-end">
            <AddVideoModal
              albums={albums}
              isLoggedIn={!!user}
              isApproved={isApproved}
            />
          </div>
        </div>
      </div>

      {/* Videos List with Search, Filter & Player */}
      <VideosList
        videos={videos}
        albums={albums}
        currentUserId={user?.id || null}
        isLoggedIn={!!user}
        isApproved={isApproved}
        isAdmin={isAdmin}
      />
    </main>
  )
}
