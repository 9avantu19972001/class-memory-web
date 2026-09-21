import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Image as ImageIcon } from 'lucide-react'
import CreateAlbumModal from './CreateAlbumModal'

export default async function AlbumsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let isApproved = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', user.id)
      .single()
    isApproved = !!profile?.is_approved
  }

  // Fetch albums along with photos for cover and count
  const { data: albums } = await supabase
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Album kỷ niệm</h1>
          <p className="text-foreground/70 mt-1">Những khoảnh khắc được lưu giữ theo thời gian</p>
        </div>
        <CreateAlbumModal isLoggedIn={!!user} isApproved={isApproved} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {albums?.map((album) => {
          const photoList = album.photos || []
          const photoCount = photoList.length
          const firstPhoto = photoList[0]

          let coverUrl = album.cover_photo_url
          if (!coverUrl && firstPhoto) {
            if (firstPhoto.is_video && firstPhoto.video_url) {
              const vId = new URL(firstPhoto.video_url).searchParams.get('v')
              coverUrl = vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null
            } else if (firstPhoto.storage_path) {
              coverUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${firstPhoto.storage_path}`
            }
          }
          
          return (
            <Link key={album.id} href={`/albums/${album.id}`} className="group block">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/50 flex flex-col h-full">
                <div className="aspect-[4/3] bg-secondary/30 relative flex items-center justify-center overflow-hidden">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={album.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-primary/40" />
                  )}
                  <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-foreground">
                    {photoCount} mục
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-foreground font-serif text-lg line-clamp-1">{album.title}</h3>
                  <p className="text-sm text-foreground/70 line-clamp-2 mt-1 flex-1">
                    {album.description || "Không có mô tả"}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}

        {albums?.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-dashed border-border">
            <ImageIcon className="w-16 h-16 text-primary/30 mb-4" />
            <h3 className="text-xl font-serif font-bold text-foreground">Chưa có album nào</h3>
            <p className="text-foreground/70 mt-2 mb-6">Hãy là người đầu tiên tạo album chia sẻ kỷ niệm nhé!</p>
          </div>
        )}
      </div>
    </main>
  )
}
