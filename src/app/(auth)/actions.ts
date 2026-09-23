'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const full_name = (formData.get('full_name') as string)?.trim()
  const phone_number = (formData.get('phone_number') as string)?.trim() || null
  const show_email = formData.get('show_email') === 'true'
  const show_phone = formData.get('show_phone') === 'true'

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name,
        phone_number,
        show_email,
        show_phone,
      }
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  // Cố gắng cập nhật bảng profiles nếu user đã được khởi tạo
  if (authData?.user) {
    try {
      await supabase
        .from('profiles')
        .update({
          phone_number,
          show_email,
          show_phone,
        })
        .eq('id', authData.user.id)
    } catch (e) {
      // Bỏ qua nếu cột chưa tồn tại
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
