import { createClient } from '@/lib/supabase/server'
import AlbumsClient from './AlbumsClient'

export const metadata = {
  title: 'Kho Kỷ Niệm Lớp 9A - Album & Dòng Thời Gian',
  description: 'Kho lưu giữ hình ảnh và video kỷ niệm niên khóa 1997 - 2001 Lớp 9A',
}

export default async function AlbumsPage() {
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

  // 1. Lấy danh sách albums
  const { data: rawAlbums } = await supabase
    .from('albums')
    .select(`
      id, 
      title, 
      description, 
      cover_photo_url, 
      created_at,
      photos ( storage_path, is_video, video_url )
    `)
    .order('created_at', { ascending: false })

  const albums = rawAlbums || []

  // 2. Lấy toàn bộ ảnh và video để phục vụ Dòng thời gian ảnh
  let allPhotos: any[] = []
  const { data: photosData, error: photosError } = await supabase
    .from('photos')
    .select(`
      id,
      album_id,
      storage_path,
      caption,
      is_video,
      video_url,
      taken_year,
      taken_month,
      created_at,
      uploaded_by,
      albums ( id, title, is_public ),
      uploader:uploaded_by ( full_name, avatar_url ),
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
    .order('created_at', { ascending: false })

  if (photosError) {
    // Fallback an toàn nếu chưa chạy migration thêm taken_year/taken_month
    const { data: fallbackPhotos } = await supabase
      .from('photos')
      .select(`
        id,
        album_id,
        storage_path,
        caption,
        is_video,
        video_url,
        created_at,
        uploaded_by,
        albums ( id, title, is_public ),
        uploader:uploaded_by ( full_name, avatar_url ),
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
      .order('created_at', { ascending: false })
    allPhotos = fallbackPhotos || []
  } else {
    allPhotos = photosData || []
  }

  return (
    <AlbumsClient
      albums={albums}
      photos={allPhotos}
      isLoggedIn={!!user}
      isApproved={isApproved}
      isAdmin={isAdmin}
      currentUserId={user?.id || null}
    />
  )
}
