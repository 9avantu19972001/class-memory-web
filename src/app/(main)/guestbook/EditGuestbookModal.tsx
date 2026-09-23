'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Loader2, Upload, Globe, Users, Lock, Check, Search, Type } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { updateGuestbookEntry } from './actions'
import { PAPER_COLORS, STICKERS, FONT_OPTIONS, getFontClass } from './guestbook-constants'
import { GuestbookEntry } from './GuestbookList'

interface Classmate {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
}

export default function EditGuestbookModal({
  entry,
  classmates,
  onClose,
}: {
  entry: GuestbookEntry
  classmates: Classmate[]
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [title, setTitle] = useState(entry.title || '')
  const [content, setContent] = useState(entry.content)
  const [color, setColor] = useState(entry.color || 'yellow')
  const [sticker, setSticker] = useState(entry.sticker || '🌸')
  const [fontFamily, setFontFamily] = useState(entry.font_family || 'caveat')
  const [imageUrl, setImageUrl] = useState(entry.image_url || '')
  const [visibility, setVisibility] = useState<'public' | 'selected' | 'private'>(entry.visibility || 'public')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(entry.allowed_user_ids || [])
  const [searchClassmate, setSearchClassmate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    // Prevent body scrolling while modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Sync state if entry prop changes
  useEffect(() => {
    setTitle(entry.title || '')
    setContent(entry.content)
    setColor(entry.color || 'yellow')
    setSticker(entry.sticker || '🌸')
    setFontFamily(entry.font_family || 'caveat')
    setImageUrl(entry.image_url || '')
    setVisibility(entry.visibility || 'public')
    setSelectedUserIds(entry.allowed_user_ids || [])
  }, [entry])

  // Filter classmates for recipient picker
  const filteredClassmates = classmates
    .filter((c) => c.id !== entry.user_id)
    .filter((c) => {
      const term = searchClassmate.toLowerCase().trim()
      if (!term) return true
      return (
        c.full_name?.toLowerCase().includes(term) ||
        c.nickname?.toLowerCase().includes(term)
      )
    })

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

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
      const fileName = `guestbook/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName)

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

    if (!content.trim()) {
      alert('Vui lòng viết nội dung lưu bút.')
      return
    }

    if (visibility === 'selected' && selectedUserIds.length === 0) {
      alert('Bạn đã chọn chế độ "Chỉ một số người". Vui lòng chọn ít nhất 1 bạn cùng lớp.')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.set('entry_id', entry.id)
      formData.set('title', title)
      formData.set('content', content)
      formData.set('color', color)
      formData.set('sticker', sticker)
      formData.set('font_family', fontFamily)
      formData.set('image_url', imageUrl)
      formData.set('visibility', visibility)
      formData.set('allowed_user_ids', JSON.stringify(selectedUserIds))

      await updateGuestbookEntry(formData)

      onClose()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(`Đã xảy ra lỗi: ${err?.message || 'Vui lòng thử lại.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const currentColorConfig = PAPER_COLORS.find((c) => c.id === color) || PAPER_COLORS[0]
  const currentFontClass = getFontClass(fontFamily)

  if (!mounted) return null

  // Use React Portal to attach to document.body, escaping any parent CSS transforms
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-secondary/15">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-xs">{sticker}</span>
            <div>
              <h2 className="text-lg font-bold font-serif text-foreground">
                Chỉnh Sửa Mẩu Lưu Bút
              </h2>
              <p className="text-xs text-foreground/60">
                Cập nhật nội dung, font chữ, màu giấy hoặc quyền riêng tư
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Privacy Selector - 3 Modes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">
              Quyền riêng tư / Ai có thể xem? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  visibility === 'public'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-background hover:bg-secondary/20'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 flex-shrink-0 ${visibility === 'public' ? 'text-primary' : 'text-foreground/50'}`} />
                <div>
                  <div className="text-xs font-semibold text-foreground">Cả lớp 9A</div>
                  <div className="text-[11px] text-foreground/60 mt-0.5">Tất cả bạn bè đều đọc được</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('selected')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  visibility === 'selected'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-background hover:bg-secondary/20'
                }`}
              >
                <Users className={`w-4 h-4 mt-0.5 flex-shrink-0 ${visibility === 'selected' ? 'text-primary' : 'text-foreground/50'}`} />
                <div>
                  <div className="text-xs font-semibold text-foreground">Chỉ một số người</div>
                  <div className="text-[11px] text-foreground/60 mt-0.5">Chọn bạn bè nhận riêng ({selectedUserIds.length})</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  visibility === 'private'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-background hover:bg-secondary/20'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${visibility === 'private' ? 'text-primary' : 'text-foreground/50'}`} />
                <div>
                  <div className="text-xs font-semibold text-foreground">Chỉ mình tôi</div>
                  <div className="text-[11px] text-foreground/60 mt-0.5">Trang nhật ký bí mật riêng</div>
                </div>
              </button>
            </div>

            {/* Recipient Picker when 'selected' */}
            {visibility === 'selected' && (
              <div className="mt-3 p-3.5 bg-secondary/15 rounded-xl border border-border space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-medium text-foreground/80">
                  <span>Chọn bạn bè nhận lưu bút:</span>
                  <span className="text-primary font-bold">Đã chọn: {selectedUserIds.length} bạn</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="text"
                    value={searchClassmate}
                    onChange={(e) => setSearchClassmate(e.target.value)}
                    placeholder="Tìm bạn cùng lớp..."
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                  {filteredClassmates.map((mate) => {
                    const isSelected = selectedUserIds.includes(mate.id)
                    return (
                      <div
                        key={mate.id}
                        onClick={() => toggleUserSelection(mate.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary/15 border-primary text-primary font-medium'
                            : 'bg-background border-border hover:bg-secondary/30 text-foreground/80'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-secondary/40 flex-shrink-0 flex items-center justify-center text-[10px]">
                          {mate.avatar_url ? (
                            <img src={mate.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (mate.full_name || 'A').charAt(0)
                          )}
                        </div>
                        <span className="truncate flex-1">{mate.full_name || 'Thành viên'}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Font Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-primary" />
              <span>Chọn phông chữ lưu bút *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontFamily(f.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    fontFamily === f.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-background hover:bg-secondary/20'
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">{f.name}</div>
                  <div className={`text-base leading-tight mt-1 text-primary truncate ${f.fontClass}`}>
                    {f.sample}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
              Chủ đề / Tiêu đề (Tùy chọn)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Gửi cả lớp 9A thân yêu..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium"
            />
          </div>

          {/* Content with selected Font */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
              Nội dung lưu bút *
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết những dòng tâm sự, câu thơ hoặc kỷ niệm..."
              className={`w-full border rounded-xl p-4 text-xl leading-relaxed outline-none shadow-inner transition-colors resize-none ${currentColorConfig.bg} ${currentColorConfig.border} ${currentColorConfig.text} ${currentFontClass}`}
            />
          </div>

          {/* Color & Sticker Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">
                Màu giấy lưu bút
              </label>
              <div className="flex items-center gap-2">
                {PAPER_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-8 h-8 rounded-full ${c.bg} ${c.border} border-2 transition-transform ${
                      color === c.id ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1.5">
                Sticker kỷ niệm
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSticker(s)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-lg transition-transform ${
                      sticker === s ? 'bg-secondary scale-110 ring-2 ring-primary/40' : 'hover:scale-110'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Attachment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
              Đính kèm ảnh kỷ niệm (Tùy chọn)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (dán link ảnh hoặc tải từ máy)"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-xs bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium rounded-lg cursor-pointer transition-colors border border-border flex-shrink-0">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>{isUploadingImage ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
            </div>

            {imageUrl && (
              <div className="mt-2 relative inline-block">
                <img
                  src={imageUrl}
                  alt="Attached preview"
                  className="h-20 w-auto rounded-lg object-cover border border-border shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-foreground hover:bg-secondary/40 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
