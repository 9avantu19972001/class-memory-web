'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Vui lòng đăng nhập với tài khoản Admin.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Bạn không có quyền quản trị.')
  }

  return { supabase, currentUserId: user.id }
}

export async function approveMember(userId: string) {
  try {
    const { supabase } = await checkAdmin()

    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/members')
    revalidatePath('/guestbook')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('approveMember error:', err)
    return { success: false, error: err?.message || 'Không thể phê duyệt thành viên.' }
  }
}

export async function revokeMember(userId: string) {
  try {
    const { supabase, currentUserId } = await checkAdmin()

    if (userId === currentUserId) {
      return { success: false, error: 'Bạn không thể tự thu hồi quyền của chính mình.' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: false })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/members')
    revalidatePath('/guestbook')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('revokeMember error:', err)
    return { success: false, error: err?.message || 'Không thể thu hồi quyền thành viên.' }
  }
}

export async function toggleAdminRole(userId: string, newRole: 'admin' | 'member') {
  try {
    const { supabase, currentUserId } = await checkAdmin()

    if (userId === currentUserId && newRole !== 'admin') {
      return { success: false, error: 'Bạn không thể tự gỡ quyền Admin của chính mình.' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/members')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('toggleAdminRole error:', err)
    return { success: false, error: err?.message || 'Không thể thay đổi vai trò.' }
  }
}

export async function deleteMember(userId: string) {
  try {
    const { supabase, currentUserId } = await checkAdmin()

    if (userId === currentUserId) {
      return { success: false, error: 'Bạn không thể xóa tài khoản của chính mình.' }
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/members')
    revalidatePath('/guestbook')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('deleteMember error:', err)
    return { success: false, error: err?.message || 'Không thể xóa thành viên.' }
  }
}

export async function updateMemberDetails(
  userId: string,
  data: {
    full_name?: string
    nickname?: string
    school_role?: string
    current_job?: string
    location?: string
  }
) {
  try {
    const { supabase } = await checkAdmin()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name?.trim() || null,
        nickname: data.nickname?.trim() || null,
        school_role: data.school_role?.trim() || null,
        current_job: data.current_job?.trim() || null,
        location: data.location?.trim() || null,
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/members')
    return { success: true }
  } catch (err: any) {
    console.error('updateMemberDetails error:', err)
    return { success: false, error: err?.message || 'Không thể cập nhật thông tin thành viên.' }
  }
}
