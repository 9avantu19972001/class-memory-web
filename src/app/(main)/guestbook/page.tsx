import { createClient } from '@/lib/supabase/server'
import GuestbookList, { GuestbookEntry } from './GuestbookList'
import CreateGuestbookModal from './CreateGuestbookModal'
import { BookOpen, Sparkles, Heart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GuestbookPage() {
  const supabase = await createClient()

  // 1. Current user session
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentUserProfile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const isAdmin = currentUserProfile?.role === 'admin'
  const isApproved = !!currentUserProfile?.is_approved || isAdmin

  // 2. Fetch approved classmates for the recipient selector & name mappings
  const { data: classmates } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, avatar_url')
    .eq('is_approved', true)
    .order('full_name', { ascending: true })

  const classmatesMap: Record<string, { full_name: string | null; nickname: string | null }> = {}
  classmates?.forEach((c) => {
    classmatesMap[c.id] = { full_name: c.full_name, nickname: c.nickname }
  })

  // 3. Fetch guestbook entries
  let query = supabase
    .from('guestbook_entries')
    .select(`
      *,
      author:profiles!user_id(id, full_name, nickname, avatar_url, school_role),
      reactions:guestbook_reactions(id, user_id, type)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: rawEntries, error } = await query

  if (error) {
    console.error('Error fetching guestbook entries:', error)
  }

  // 4. In-memory fallback filter for 3 visibility modes (ensures strict privacy even before SQL RLS is run)
  const entries: GuestbookEntry[] = (rawEntries || []).filter((entry: any) => {
    if (isAdmin) return true
    if (entry.visibility === 'public') return true
    if (user && entry.user_id === user.id) return true
    if (user && entry.visibility === 'selected') {
      const allowed = Array.isArray(entry.allowed_user_ids) ? entry.allowed_user_ids : []
      if (allowed.includes(user.id)) return true
    }
    return false
  })

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
      {/* Header Banner - Retro Notebook Aesthetic */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm relative overflow-hidden">
        {/* Decorative background watermark */}
        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-9xl font-serif select-none">
          9A
        </div>

        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">
              Sổ Lưu Bút Tuổi Học Trò
            </h1>
          </div>
          <p className="text-foreground/75 text-sm leading-relaxed">
            "Có những năm tháng trôi qua như một cái chớp mắt, nhưng kỷ niệm tuổi học trò sẽ ở lại mãi mãi..."
          </p>
          <div className="flex items-center gap-3 pt-1 text-xs text-foreground/60 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{entries.length} trang lưu bút</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>Góc kỷ niệm Lớp 9A</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="self-stretch sm:self-auto flex items-center justify-end">
          <CreateGuestbookModal
            classmates={classmates || []}
            currentUserId={user?.id || null}
            isApproved={isApproved}
          />
        </div>
      </div>

      {/* Guestbook List with Sticky Notes */}
      <GuestbookList
        entries={entries}
        classmatesMap={classmatesMap}
        currentUserId={user?.id || null}
        isAdmin={isAdmin}
      />
    </main>
  )
}
