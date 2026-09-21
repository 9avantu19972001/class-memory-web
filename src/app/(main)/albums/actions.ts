'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAlbum(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const is_public = formData.get('is_public') === 'on'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('albums')
    .insert({
      title,
      description,
      is_public,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating album', error)
    throw new Error('Failed to create album')
  }

  revalidatePath('/albums')
  redirect(`/albums/${data.id}`)
}

export async function savePhotoRecords(albumId: string, photos: { path: string; caption?: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const records = photos.map(photo => ({
    album_id: albumId,
    uploaded_by: user.id,
    storage_path: photo.path,
    caption: photo.caption || null,
    is_video: false
  }))

  const { error } = await supabase.from('photos').insert(records)
  if (error) {
    console.error('Error saving photos', error)
    throw new Error('Failed to save photos')
  }

  revalidatePath(`/albums/${albumId}`)
}

export async function addYoutubeVideo(albumId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const video_url = formData.get('video_url') as string
  const caption = formData.get('caption') as string

  if (!video_url) return

  const { error } = await supabase.from('photos').insert({
    album_id: albumId,
    uploaded_by: user.id,
    storage_path: 'youtube', // placeholder
    is_video: true,
    video_url: video_url,
    caption: caption || null
  })

  if (error) {
    console.error('Error saving youtube video', error)
    throw new Error('Failed to save video')
  }

  revalidatePath(`/albums/${albumId}`)
}
