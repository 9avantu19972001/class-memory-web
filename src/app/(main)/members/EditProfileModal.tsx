'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Edit3, X, Loader2, Upload, Camera, Trash2, Link as LinkIcon, Phone, Shield, Lock, Eye, EyeOff } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from './actions'

export interface Profile {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  school_role?: string | null
  current_job?: string | null
  location?: string | null
  quote?: string | null
  facebook_url?: string | null
  role?: string | null
  email?: string | null
  phone_number?: string | null
  show_email?: boolean | null
  show_phone?: boolean | null
}

export default function EditProfileModal({
  profile,
  trigger,
  isAdmin = false,
}: {
  profile: Profile
  trigger?: React.ReactNode
  isAdmin?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '')
  const [showEmail, setShowEmail] = useState(profile.show_email !== false)
  const [showPhone, setShowPhone] = useState(profile.show_phone === true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setAvatarUrl(profile.avatar_url || '')
      setPhoneNumber(profile.phone_number || '')
      setShowEmail(profile.show_email !== false)
      setShowPhone(profile.show_phone === true)
      setUploadError(null)
    }
  }, [isOpen, profile])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    setUploadError(null)

    try {
      // 1. Client compression (with graceful fallback)
      let fileToUpload: File | Blob = file
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        }
        fileToUpload = await imageCompression(file, options)
      } catch (compressionErr) {
        console.warn('Image compression skipped, using original file:', compressionErr)
        fileToUpload = file
      }

      // 2. Safe file extension and unique name
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `avatars/${profile.id}-${Date.now()}.${fileExt}`

      // 3. Upload to Supabase Storage (upsert: false to use standard INSERT policy)
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // 4. Retrieve canonical public URL
      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      const msg = err?.message || 'Không thể tải ảnh lên'
      setUploadError(msg)
      alert(`Không thể tải ảnh đại diện lên: ${msg}\n\nBạn cũng có thể dán liên kết ảnh trực tiếp vào ô bên dưới.`)
    } finally {
      setIsUploadingAvatar(false)
      // Reset input value so user can select same file again if wanted
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('target_user_id', profile.id)
    formData.set('avatar_url', avatarUrl)
    formData.set('phone_number', phoneNumber.trim())
    formData.set('show_email', showEmail ? 'true' : 'false')
    formData.set('show_phone', showPhone ? 'true' : 'false')

    try {
      await updateProfile(formData)
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(`Đã xảy ra lỗi khi cập nhật hồ sơ: ${err?.message || 'Vui lòng thử lại.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false)
      }}
    >
      <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 border border-border max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border bg-secondary/15 flex-shrink-0">
          <div>
            <h2 id="edit-profile-title" className="text-lg font-bold font-serif text-foreground">
              Chỉnh sửa hồ sơ kỷ yếu
            </h2>
            <p className="text-xs text-foreground/60">
              {profile.full_name ? `Thành viên: ${profile.full_name}` : 'Cập nhật thông tin thành viên'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-foreground/50 hover:text-foreground p-1.5 rounded-full hover:bg-secondary/40 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <input type="hidden" name="target_user_id" value={profile.id} />

              {/* Avatar Upload & URL */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-primary bg-secondary/30 flex items-center justify-center shadow-md">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => {
                        // In case image URL fails to load
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold font-serif text-foreground/40">
                      {(profile.full_name || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}

                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs">
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
                  <span className="text-xs text-primary flex items-center gap-1.5 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải ảnh lên...
                  </span>
                )}

                {uploadError && (
                  <span className="text-xs text-red-500 text-center px-2">
                    {uploadError}
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium rounded-lg cursor-pointer transition-colors border border-border">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Chọn ảnh từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Gỡ ảnh</span>
                    </button>
                  )}
                </div>

                {/* Direct Image URL input */}
                <div className="w-full mt-1">
                  <label className="block text-[11px] font-medium text-foreground/60 mb-1">
                    Hoặc dán liên kết ảnh (URL):
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://... (dán link ảnh trực tiếp)"
                      className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-xs bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
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

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Số điện thoại liên lạc</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Ví dụ: 0912 345 678"
                />
                <p className="text-[11px] text-foreground/50 mt-1">
                  Dùng để bạn bè trong lớp gọi điện hoặc kết nối Zalo hỏi thăm, họp lớp.
                </p>
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

              {/* Privacy & Display Settings */}
              <div className="bg-secondary/25 border border-border rounded-2xl p-4 space-y-3.5 mt-2">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Cài đặt quyền riêng tư & hiển thị
                  </span>
                </div>

                <p className="text-[11px] text-foreground/60 leading-relaxed">
                  Chủ động lựa chọn những thông tin bạn đồng ý chia sẻ với các bạn học trong lớp:
                </p>

                <div className="space-y-3 pt-1">
                  {/* Toggle show_email */}
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={showEmail}
                      onChange={(e) => setShowEmail(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <div className="text-xs flex-1">
                      <div className="font-semibold text-foreground flex items-center justify-between gap-2">
                        <span>Hiển thị Email với các bạn trong lớp</span>
                        {showEmail ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" /> Hiển thị
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" /> Đang ẩn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground/50 mt-0.5">
                        {showEmail
                          ? 'Các bạn trong lớp có thể xem và sao chép địa chỉ email của bạn.'
                          : 'Chỉ riêng bạn và Ban Quản Trị lớp mới nhìn thấy email này.'}
                      </p>
                    </div>
                  </label>

                  {/* Toggle show_phone */}
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={showPhone}
                      onChange={(e) => setShowPhone(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <div className="text-xs flex-1">
                      <div className="font-semibold text-foreground flex items-center justify-between gap-2">
                        <span>Hiển thị Số điện thoại với các bạn trong lớp</span>
                        {showPhone ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" /> Hiển thị
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" /> Đang ẩn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground/50 mt-0.5">
                        {showPhone
                          ? 'Các bạn trong lớp có thể gọi điện, kết nối Zalo trực tiếp từ hồ sơ kỷ yếu.'
                          : 'Chỉ riêng bạn và Ban Quản Trị lớp mới nhìn thấy số điện thoại này.'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center gap-1.5 text-[11px] text-foreground/50">
                  <Lock className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                  <span>Người ngoài lớp hoặc khách chưa đăng nhập hoàn toàn KHÔNG xem được hồ sơ chi tiết của bạn.</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isUploadingAvatar}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Lưu hồ sơ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  )

  return (
    <>
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-sm text-sm cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>Chỉnh sửa hồ sơ kỷ yếu</span>
        </button>
      )}

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
