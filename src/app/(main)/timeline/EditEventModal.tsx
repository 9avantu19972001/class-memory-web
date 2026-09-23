'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Loader2, Upload, Sparkles } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { updateTimelineEvent } from './actions'
import { ACADEMIC_YEARS, EVENT_CATEGORIES } from './timeline-constants'
import { TimelineEventItem } from './TimelineList'

export default function EditEventModal({
  event,
  onClose,
}: {
  event: TimelineEventItem
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [academicYear, setAcademicYear] = useState(event.academic_year)
  const [category, setCategory] = useState(event.category || 'memory')
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [eventDate, setEventDate] = useState(event.event_date || '')
  const [imageUrl, setImageUrl] = useState(event.image_url || '')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      let fileToUpload: File | Blob = file
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        }
        fileToUpload = await imageCompression(file, options)
      } catch (err) {
        console.warn('Compression skipped:', err)
        fileToUpload = file
      }

      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `timeline/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('memories').getPublicUrl(fileName)

      setImageUrl(publicUrl)
    } catch (err: any) {
      console.error('Image upload failed:', err)
      alert(`Không thể tải ảnh lên: ${err?.message || 'Vui lòng thử lại.'}`)
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung sự kiện.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.set('event_id', event.id)
      formData.set('title', title)
      formData.set('description', description)
      formData.set('academic_year', academicYear)
      formData.set('category', category)
      formData.set('event_date', eventDate)
      formData.set('image_url', imageUrl)

      const res = await updateTimelineEvent(formData)
      if (!res.success) {
        alert(res.error)
      } else {
        onClose()
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      alert(`Lỗi: ${err?.message || 'Vui lòng thử lại.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-secondary/15">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✏️</span>
            <div>
              <h2 className="text-lg font-bold font-serif text-foreground">
                Chỉnh Sửa Cột Mốc Kỷ Niệm
              </h2>
              <p className="text-xs text-foreground/60">
                Cập nhật thông tin, hình ảnh hoặc câu chuyện của sự kiện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground p-2 rounded-full hover:bg-secondary/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Chọn Niên khóa / Cấp lớp */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">
              Niên khóa / Giai đoạn *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACADEMIC_YEARS.map((y) => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => setAcademicYear(y.id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                    academicYear === y.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-background hover:bg-secondary/20'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{y.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-xs truncate">
                      {y.shortTitle}
                    </div>
                    <div className="text-[10px] text-foreground/60 truncate">
                      {y.timeRange}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Phân loại */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">
              Chủ đề sự kiện
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    category === cat.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background hover:bg-secondary/20 text-foreground/70'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tiêu đề & Ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Tiêu đề sự kiện *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Ngày đầu nhận lớp 6A..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Thời gian (ước tính hoặc chính xác)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground text-xs"
              />
            </div>
          </div>

          {/* Nội dung kể lại */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1">
              Câu chuyện / Ký ức về sự kiện này *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Chia sẻ cảm xúc, những chi tiết thú vị..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Ảnh kỷ niệm đính kèm */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">
              Ảnh tư liệu / Kỷ niệm xưa
            </label>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5 p-2 inline-block">
                <img
                  src={imageUrl}
                  alt="Ảnh kỷ niệm"
                  className="max-h-48 w-auto rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                  title="Xóa ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <label className="flex-1 w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/20 cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-4 h-4 text-foreground/60" />
                  )}
                  <span className="text-foreground/70 font-medium">
                    {isUploadingImage ? 'Đang nén và tải ảnh lên...' : 'Tải ảnh từ máy / điện thoại'}
                  </span>
                </label>
                <span className="text-foreground/40 text-xs">hoặc</span>
                <input
                  type="url"
                  placeholder="Dán link ảnh (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 w-full px-3 py-2.5 rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-foreground/70 hover:bg-secondary font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
