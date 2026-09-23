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

export async function deleteAlbum(albumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch photos to delete storage files
  const { data: photos } = await supabase
    .from('photos')
    .select('storage_path, is_video')
    .eq('album_id', albumId)

  if (photos && photos.length > 0) {
    const filePaths = photos
      .filter(p => !p.is_video && p.storage_path && p.storage_path !== 'youtube')
      .map(p => p.storage_path)

    if (filePaths.length > 0) {
      await supabase.storage.from('memories').remove(filePaths)
    }
  }

  // 2. Delete album record (cascade deletes photos in DB)
  const { error } = await supabase
    .from('albums')
    .delete()
    .eq('id', albumId)

  if (error) {
    console.error('Error deleting album:', error)
    throw new Error('Failed to delete album')
  }

  revalidatePath('/albums')
  revalidatePath('/')
  redirect('/albums')
}

export async function addAlbumComment(albumId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (!content || !content.trim()) return

  const { error } = await supabase.from('comments').insert({
    album_id: albumId,
    user_id: user.id,
    content: content.trim()
  })

  if (error) {
    console.error('Error adding comment:', error)
    throw new Error('Failed to add comment')
  }

  revalidatePath(`/albums/${albumId}`)
}

export async function deleteAlbumComment(commentId: string, albumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw new Error('Failed to delete comment')
  }

  revalidatePath(`/albums/${albumId}`)
}

export async function toggleAlbumReaction(albumId: string, reactionType: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .eq('type', reactionType)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({
      album_id: albumId,
      user_id: user.id,
      type: reactionType
    })
  }

  revalidatePath(`/albums/${albumId}`)
}

export async function deletePhoto(photoId: string, albumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get photo to delete from Storage if it's an image file
  const { data: photo } = await supabase
    .from('photos')
    .select('storage_path, is_video')
    .eq('id', photoId)
    .single()

  if (photo && !photo.is_video && photo.storage_path && photo.storage_path !== 'youtube') {
    await supabase.storage.from('memories').remove([photo.storage_path])
  }

  // 2. Delete photo record from DB (comments & reactions cascade delete)
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (error) {
    console.error('Error deleting photo:', error)
    throw new Error('Failed to delete photo')
  }

  revalidatePath(`/albums/${albumId}`)
  revalidatePath('/albums')
  revalidatePath('/')
}

export async function togglePhotoReaction(photoId: string, albumId: string, reactionType: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', user.id)
    .eq('type', reactionType)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({
      photo_id: photoId,
      album_id: albumId,
      user_id: user.id,
      type: reactionType
    })
  }

  revalidatePath(`/albums/${albumId}`)
}

export async function addPhotoComment(photoId: string, albumId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (!content || !content.trim()) return

  const { error } = await supabase.from('comments').insert({
    photo_id: photoId,
    album_id: albumId,
    user_id: user.id,
    content: content.trim()
  })

  if (error) {
    console.error('Error adding photo comment:', error)
    throw new Error('Failed to add photo comment')
  }

  revalidatePath(`/albums/${albumId}`)
}

export async function deletePhotoComment(commentId: string, albumId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting photo comment:', error)
    throw new Error('Failed to delete photo comment')
  }

  revalidatePath(`/albums/${albumId}`)
}
