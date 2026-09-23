'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Vui lòng đăng nhập để thực hiện thao tác này.')

  const targetUserId = (formData.get('target_user_id') as string) || user.id

  // Chỉ cho phép thành viên tự cập nhật hồ sơ của chính mình.
  // Quản trị viên chỉ có quyền xem hồ sơ, không có quyền chỉnh sửa hồ sơ của thành viên khác.
  if (targetUserId !== user.id) {
    throw new Error('Bạn chỉ có quyền chỉnh sửa hồ sơ của chính mình. Quản trị viên chỉ có quyền xem, không có quyền chỉnh sửa hồ sơ của thành viên.')
  }

  const full_name = formData.get('full_name') as string
  const nickname = formData.get('nickname') as string
  const school_role = formData.get('school_role') as string
  const current_job = formData.get('current_job') as string
  const location = formData.get('location') as string
  const quote = formData.get('quote') as string
  const facebook_url = formData.get('facebook_url') as string
  const avatar_url = formData.get('avatar_url') as string

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: full_name?.trim() || null,
      nickname: nickname?.trim() || null,
      school_role: school_role?.trim() || null,
      current_job: current_job?.trim() || null,
      location: location?.trim() || null,
      quote: quote?.trim() || null,
      facebook_url: facebook_url?.trim() || null,
      avatar_url: avatar_url?.trim() || null,
    })
    .eq('id', targetUserId)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Không thể cập nhật hồ sơ: ' + error.message)
  }

  revalidatePath('/members')
  revalidatePath('/')
}
