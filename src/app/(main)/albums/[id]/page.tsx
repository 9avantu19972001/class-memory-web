import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import UploadPhotos from './UploadPhotos'
import Gallery from './Gallery'
import DeleteAlbumButton from './DeleteAlbumButton'

export default async function AlbumDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch album details
  const { data: album } = await supabase
    .from('albums')
    .select(`
      *,
      profiles:created_by ( full_name )
    `)
    .eq('id', id)
    .single()

  if (!album) {
    notFound()
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: false })

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

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
      <Link href="/albums" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Quay lại Albums
      </Link>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{album.title}</h1>
            {album.description && (
              <p className="text-foreground/80 mt-2 font-handwriting text-xl">{album.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-foreground/60">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Bởi {album.profiles?.full_name || 'Khách'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{new Date(album.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-3">
            <UploadPhotos albumId={album.id} isLoggedIn={!!user} isApproved={isApproved} />
            {user && (
              <DeleteAlbumButton albumId={album.id} />
            )}
          </div>
        </div>
      </div>

      {photos && photos.length > 0 ? (
        <Gallery photos={photos} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-background/50 rounded-2xl border border-dashed border-border">
          <h3 className="text-xl font-serif font-bold text-foreground">Album đang trống</h3>
          <p className="text-foreground/70 mt-2">Hãy bắt đầu thêm ảnh vào album này nhé!</p>
        </div>
      )}
    </main>
  )
}
