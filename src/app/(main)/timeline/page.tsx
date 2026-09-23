import { createClient } from '@/lib/supabase/server'
import TimelineList, { TimelineEventItem } from './TimelineList'

export const metadata = {
  title: 'Dòng Thời Gian Niên Khóa 1997 - 2001 - Lớp 9A',
  description: 'Hành trình 4 năm thanh xuân Lớp 9A và các cột mốc họp lớp đáng nhớ',
}

export default async function TimelinePage() {
  const supabase = await createClient()

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

    isApproved = !!profile?.is_approved || profile?.role === 'admin'
    isAdmin = profile?.role === 'admin'
  }

  // Fetch timeline events with author info
  const { data: rawEvents, error } = await supabase
    .from('timeline_events')
    .select(`
      id,
      title,
      description,
      academic_year,
      event_date,
      category,
      image_url,
      author_id,
      likes_count,
      created_at,
      author:author_id (
        id,
        full_name,
        nickname,
        avatar_url,
        school_role
      )
    `)
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching timeline events:', error)
  }

  // Check which events the current user has liked
  let likedEventIds = new Set<string>()
  if (user) {
    const { data: userLikes } = await supabase
      .from('timeline_likes')
      .select('event_id')
      .eq('user_id', user.id)

    if (userLikes) {
      likedEventIds = new Set(userLikes.map((l) => l.event_id))
    }
  }

  const events: TimelineEventItem[] = (rawEvents || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    academic_year: e.academic_year,
    event_date: e.event_date,
    category: e.category,
    image_url: e.image_url,
    author_id: e.author_id,
    author: Array.isArray(e.author) ? e.author[0] : e.author,
    likes_count: e.likes_count || 0,
    created_at: e.created_at,
    has_liked: likedEventIds.has(e.id),
  }))

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-10 w-full min-w-0">
      <TimelineList
        initialEvents={events}
        currentUserId={user?.id || null}
        isApproved={isApproved}
        isAdmin={isAdmin}
      />
    </main>
  )
}
