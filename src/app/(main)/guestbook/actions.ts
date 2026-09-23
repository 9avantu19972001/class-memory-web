'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGuestbookEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập để viết lưu bút.')

  // Check if approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved, role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved && profile?.role !== 'admin') {
    throw new Error('Tài khoản của bạn cần được Admin duyệt trước khi viết lưu bút.')
  }

  const title = (formData.get('title') as string)?.trim() || null
  const content = (formData.get('content') as string)?.trim()
  const color = (formData.get('color') as string) || 'yellow'
  const sticker = (formData.get('sticker') as string) || '🌸'
  const font_family = (formData.get('font_family') as string) || 'caveat'
  const image_url = (formData.get('image_url') as string)?.trim() || null
  const visibility = (formData.get('visibility') as string) || 'public'
  const rawAllowedUsers = formData.get('allowed_user_ids') as string

  if (!content) {
    throw new Error('Nội dung lưu bút không được để trống.')
  }

  let allowed_user_ids: string[] = []
  if (visibility === 'selected' && rawAllowedUsers) {
    try {
      allowed_user_ids = JSON.parse(rawAllowedUsers)
    } catch {
      allowed_user_ids = rawAllowedUsers.split(',').filter(Boolean)
    }
  }

  const { error } = await supabase.from('guestbook_entries').insert({
    user_id: user.id,
    title,
    content,
    color,
    sticker,
    font_family,
    image_url,
    visibility,
    allowed_user_ids,
  })

  if (error) {
    console.error('Error inserting guestbook entry:', error)
    throw new Error('Không thể lưu mẩu lưu bút: ' + error.message)
  }

  revalidatePath('/guestbook')
}

export async function updateGuestbookEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập.')

  const entryId = formData.get('entry_id') as string
  if (!entryId) throw new Error('Thiếu mã mẩu lưu bút.')

  // Check ownership or admin
  const { data: entry } = await supabase
    .from('guestbook_entries')
    .select('user_id')
    .eq('id', entryId)
    .single()

  if (!entry) throw new Error('Không tìm thấy mẩu lưu bút.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isAuthor = entry.user_id === user.id

  if (!isAuthor && !isAdmin) {
    throw new Error('Bạn không có quyền chỉnh sửa mẩu lưu bút này.')
  }

  const title = (formData.get('title') as string)?.trim() || null
  const content = (formData.get('content') as string)?.trim()
  const color = (formData.get('color') as string) || 'yellow'
  const sticker = (formData.get('sticker') as string) || '🌸'
  const font_family = (formData.get('font_family') as string) || 'caveat'
  const image_url = (formData.get('image_url') as string)?.trim() || null
  const visibility = (formData.get('visibility') as string) || 'public'
  const rawAllowedUsers = formData.get('allowed_user_ids') as string

  if (!content) {
    throw new Error('Nội dung lưu bút không được để trống.')
  }

  let allowed_user_ids: string[] = []
  if (visibility === 'selected' && rawAllowedUsers) {
    try {
      allowed_user_ids = JSON.parse(rawAllowedUsers)
    } catch {
      allowed_user_ids = rawAllowedUsers.split(',').filter(Boolean)
    }
  }

  const { error } = await supabase
    .from('guestbook_entries')
    .update({
      title,
      content,
      color,
      sticker,
      font_family,
      image_url,
      visibility,
      allowed_user_ids,
    })
    .eq('id', entryId)

  if (error) {
    console.error('Error updating guestbook entry:', error)
    throw new Error('Không thể cập nhật mẩu lưu bút: ' + error.message)
  }

  revalidatePath('/guestbook')
}

export async function deleteGuestbookEntry(entryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập.')

  // Fetch entry to check ownership or admin
  const { data: entry } = await supabase
    .from('guestbook_entries')
    .select('user_id')
    .eq('id', entryId)
    .single()

  if (!entry) throw new Error('Không tìm thấy mẩu lưu bút.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isAuthor = entry.user_id === user.id

  if (!isAuthor && !isAdmin) {
    throw new Error('Bạn không có quyền xóa mẩu lưu bút này.')
  }

  const { error } = await supabase
    .from('guestbook_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    console.error('Error deleting entry:', error)
    throw new Error('Không thể xóa mẩu lưu bút.')
  }

  revalidatePath('/guestbook')
}

export async function togglePinGuestbookEntry(entryId: string, isPinned: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Chỉ Admin mới có quyền ghim mẩu lưu bút.')
  }

  const { error } = await supabase
    .from('guestbook_entries')
    .update({ is_pinned: isPinned })
    .eq('id', entryId)

  if (error) {
    console.error('Error pinning entry:', error)
    throw new Error('Không thể cập nhật trạng thái ghim.')
  }

  revalidatePath('/guestbook')
}

export async function toggleGuestbookReaction(entryId: string, type: string = 'heart') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập để thả cảm xúc.')

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('guestbook_reactions')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .eq('type', type)
    .single()

  if (existing) {
    await supabase.from('guestbook_reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('guestbook_reactions').insert({
      entry_id: entryId,
      user_id: user.id,
      type,
    })
  }

  revalidatePath('/guestbook')
}

export async function addGuestbookComment(entryId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập để bình luận.')

  // Check if approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved, role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved && profile?.role !== 'admin') {
    throw new Error('Tài khoản của bạn cần được Admin duyệt trước khi bình luận.')
  }

  const trimmed = content.trim()
  if (!trimmed) throw new Error('Nội dung bình luận không được để trống.')

  const { error } = await supabase.from('guestbook_comments').insert({
    entry_id: entryId,
    user_id: user.id,
    content: trimmed,
  })

  if (error) {
    console.error('Error adding guestbook comment:', error)
    throw new Error('Không thể gửi bình luận: ' + error.message)
  }

  revalidatePath('/guestbook')
}

export async function deleteGuestbookComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập.')

  const { data: comment } = await supabase
    .from('guestbook_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment) throw new Error('Không tìm thấy bình luận.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isAuthor = comment.user_id === user.id

  if (!isAuthor && !isAdmin) {
    throw new Error('Bạn không có quyền xóa bình luận này.')
  }

  const { error } = await supabase
    .from('guestbook_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw new Error('Không thể xóa bình luận.')
  }

  revalidatePath('/guestbook')
}

