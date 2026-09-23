'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vui lòng đăng nhập để thực hiện chức năng này.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved, role')
    .eq('id', user.id)
    .single()

  const isApproved = !!profile?.is_approved || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'

  return { supabase, user, isApproved, isAdmin }
}

export async function createTimelineEvent(formData: FormData) {
  try {
    const { supabase, user, isApproved } = await getAuthUser()

    if (!isApproved) {
      throw new Error('Tài khoản của bạn đang chờ Admin duyệt.')
    }

    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const academic_year = (formData.get('academic_year') as string) || 'reunion'
    const event_date = (formData.get('event_date') as string)?.trim() || null
    const category = (formData.get('category') as string) || 'memory'
    const image_url = (formData.get('image_url') as string)?.trim() || null

    if (!title || !description) {
      throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung kỷ niệm.')
    }

    const { error } = await supabase.from('timeline_events').insert({
      title,
      description,
      academic_year,
      event_date,
      category,
      image_url,
      author_id: user.id,
      likes_count: 0,
    })

    if (error) {
      console.error('Error creating timeline event:', error)
      throw new Error('Không thể lưu sự kiện: ' + error.message)
    }

    revalidatePath('/timeline')
    return { success: true }
  } catch (err: any) {
    console.error('createTimelineEvent error:', err)
    return { success: false, error: err?.message || 'Có lỗi xảy ra.' }
  }
}

export async function updateTimelineEvent(formData: FormData) {
  try {
    const { supabase, user, isAdmin } = await getAuthUser()

    const eventId = formData.get('event_id') as string
    if (!eventId) throw new Error('Không tìm thấy sự kiện cần sửa.')

    // Check ownership
    const { data: event } = await supabase
      .from('timeline_events')
      .select('author_id')
      .eq('id', eventId)
      .single()

    if (!event) throw new Error('Sự kiện không tồn tại.')

    const isAuthor = event.author_id === user.id
    if (!isAuthor) {
      throw new Error('Chỉ người tạo bài viết mới có quyền chỉnh sửa bài viết của mình.')
    }

    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const academic_year = (formData.get('academic_year') as string) || 'reunion'
    const event_date = (formData.get('event_date') as string)?.trim() || null
    const category = (formData.get('category') as string) || 'memory'
    const image_url = (formData.get('image_url') as string)?.trim() || null

    if (!title || !description) {
      throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung kỷ niệm.')
    }

    const { error } = await supabase
      .from('timeline_events')
      .update({
        title,
        description,
        academic_year,
        event_date,
        category,
        image_url,
      })
      .eq('id', eventId)

    if (error) {
      console.error('Error updating timeline event:', error)
      throw new Error('Không thể cập nhật sự kiện: ' + error.message)
    }

    revalidatePath('/timeline')
    return { success: true }
  } catch (err: any) {
    console.error('updateTimelineEvent error:', err)
    return { success: false, error: err?.message || 'Có lỗi xảy ra.' }
  }
}

export async function deleteTimelineEvent(eventId: string) {
  try {
    const { supabase, user } = await getAuthUser()

    const { data: event } = await supabase
      .from('timeline_events')
      .select('author_id')
      .eq('id', eventId)
      .single()

    if (!event) throw new Error('Sự kiện không tồn tại.')

    const isAuthor = event.author_id === user.id
    if (!isAuthor) {
      throw new Error('Chỉ người tạo bài viết mới có quyền xóa bài viết của mình.')
    }

    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting timeline event:', error)
      throw new Error('Không thể xóa sự kiện: ' + error.message)
    }

    revalidatePath('/timeline')
    return { success: true }
  } catch (err: any) {
    console.error('deleteTimelineEvent error:', err)
    return { success: false, error: err?.message || 'Có lỗi xảy ra.' }
  }
}

export async function toggleTimelineLike(eventId: string) {
  try {
    const { supabase, user, isApproved } = await getAuthUser()

    if (!isApproved) {
      throw new Error('Tài khoản cần được duyệt trước khi thả cảm xúc.')
    }

    // Check existing like
    const { data: existingLike } = await supabase
      .from('timeline_likes')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    let hasLiked = false

    if (existingLike) {
      // Remove like
      await supabase.from('timeline_likes').delete().eq('id', existingLike.id)
      hasLiked = false
    } else {
      // Add like
      await supabase.from('timeline_likes').insert({
        event_id: eventId,
        user_id: user.id,
      })
      hasLiked = true
    }

    // Recalculate count
    const { count } = await supabase
      .from('timeline_likes')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    const finalCount = count || 0

    // Update count cache on event
    await supabase
      .from('timeline_events')
      .update({ likes_count: finalCount })
      .eq('id', eventId)

    revalidatePath('/timeline')
    return { success: true, hasLiked, count: finalCount }
  } catch (err: any) {
    console.error('toggleTimelineLike error:', err)
    return { success: false, error: err?.message || 'Lỗi khi thả cảm xúc.' }
  }
}
