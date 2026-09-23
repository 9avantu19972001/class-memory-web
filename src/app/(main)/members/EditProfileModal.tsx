'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, X, Loader2, Upload, Camera } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from './actions'

interface Profile {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  school_role?: string | null
  current_job?: string | null
  location?: string | null
  quote?: string | null
  facebook_url?: string | null
}

export default function EditProfileModal({ profile }: { profile: Profile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      }
      const compressed = await imageCompression(file, options)
      const fileExt = compressed.name.split('.').pop()
      const fileName = `avatars/${profile.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, compressed, { upsert: true })

      if (uploadError) throw uploadError

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${fileName}`
      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      alert('Không thể tải ảnh đại diện lên. Vui lòng thử lại.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('avatar_url', avatarUrl)

    try {
      await updateProfile(formData)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Đã xảy ra lỗi khi cập nhật hồ sơ.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-sm text-sm"
      >
        <Edit3 className="w-4 h-4" />
        <span>Chỉnh sửa hồ sơ kỷ yếu</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-bold font-serif text-foreground">
                Hồ sơ thành viên lớp 9A
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-foreground/50 hover:text-foreground p-1.5 rounded-full hover:bg-secondary/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2 pb-4 border-b border-border">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-primary bg-secondary/30 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold font-serif text-foreground/40">
                      {(profile.full_name || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs">
                    <Camera className="w-5 h-5 mb-1" />
                    <span>Đổi ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                {isUploadingAvatar && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Đang tải ảnh lên...
                  </span>
                )}
                <span className="text-xs text-foreground/60">Bấm vào ảnh để tải ảnh thẻ hoặc avatar mới</span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                  Họ và tên thật *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  defaultValue={profile.full_name || ''}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Ví dụ: Nguyễn Văn Tuấn"
                />
              </div>

              {/* Nickname & School Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                    Biệt danh thời đi học
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    defaultValue={profile.nickname || ''}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Ví dụ: Tuấn Cò, Cây hài..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                    Chức vụ / Vai trò xưa
                  </label>
                  <input
                    type="text"
                    name="school_role"
                    defaultValue={profile.school_role || ''}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Ví dụ: Lớp trưởng, Tổ trưởng..."
                  />
                </div>
              </div>

              {/* Current Job & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                    Nghề nghiệp hiện tại
                  </label>
                  <input
                    type="text"
                    name="current_job"
                    defaultValue={profile.current_job || ''}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Ví dụ: Bác sĩ, Kinh doanh..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                    Nơi ở hiện tại
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={profile.location || ''}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Ví dụ: Hà Nội, TP.HCM..."
                  />
                </div>
              </div>

              {/* Quote / Memory */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                  Châm ngôn / Kỷ niệm nhớ nhất
                </label>
                <textarea
                  name="quote"
                  rows={2}
                  defaultValue={profile.quote || ''}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none font-handwriting text-lg"
                  placeholder="Một câu nói bạn tâm đắc hoặc một kỷ niệm khó quên thời cấp 2..."
                />
              </div>

              {/* Facebook Link */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                  Link Facebook / Trang cá nhân
                </label>
                <input
                  type="url"
                  name="facebook_url"
                  defaultValue={profile.facebook_url || ''}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="https://facebook.com/..."
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-foreground hover:bg-secondary/40 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isUploadingAvatar}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu hồ sơ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
