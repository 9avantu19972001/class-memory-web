'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, X, Loader2, Play, ExternalLink } from 'lucide-react'
import { addYoutubeVideo } from '../albums/actions'
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'

interface AddVideoModalProps {
  albums: { id: string; title: string }[]
  isLoggedIn: boolean
  isApproved: boolean
}

export default function AddVideoModal({
  albums,
  isLoggedIn,
  isApproved,
}: AddVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id || '')
  const router = useRouter()

  const handleOpen = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isApproved) {
      alert('Tài khoản của bạn đang chờ Admin duyệt trước khi chia sẻ video.')
      return
    }
    if (albums.length === 0) {
      alert('Chưa có album nào trong hệ thống. Hãy tạo một Album trước khi thêm video!')
      return
    }
    setIsOpen(true)
  }

  const ytId = getYouTubeId(videoUrl)
  const ytThumb = getYouTubeThumbnail(videoUrl)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!videoUrl.trim() || !selectedAlbumId) return
    if (!ytId) {
      alert('Đường dẫn YouTube không hợp lệ. Vui lòng dán link video YouTube dạng https://www.youtube.com/watch?v=... hoặc https://youtu.be/...')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('video_url', videoUrl.trim())
      formData.set('caption', caption.trim())

      await addYoutubeVideo(selectedAlbumId, formData)

      setIsOpen(false)
      setVideoUrl('')
      setCaption('')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(`Đã xảy ra lỗi khi thêm video: ${err?.message || 'Vui lòng thử lại.'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Film className="w-4 h-4" />
        <span>Thêm Video Kỷ Niệm</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsOpen(false)
          }}
        >
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-foreground">
                    Chia sẻ Video Kỷ Niệm
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Nhúng clip họp lớp, văn nghệ hoặc kỷ yếu từ YouTube
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="p-1.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-secondary transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Select Target Album */}
              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Lưu vào Album <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      📁 {album.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-foreground/50 mt-1">
                  Video sẽ xuất hiện đồng thời tại trang Video này và trong Album bạn chọn.
                </p>
              </div>

              {/* YouTube URL input */}
              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Đường dẫn YouTube (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Preview Thumbnail if valid YouTube ID */}
              {ytId && (
                <div className="rounded-xl overflow-hidden border border-border bg-black/5 relative group">
                  <div className="relative aspect-video bg-black flex items-center justify-center">
                    {ytThumb ? (
                      <img
                        src={ytThumb}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-secondary/30 text-[11px] text-foreground/70 flex items-center justify-between">
                    <span>Đã nhận diện video YouTube ID: <strong className="font-mono text-foreground">{ytId}</strong></span>
                    <span className="text-emerald-600 font-semibold">✓ Hợp lệ</span>
                  </div>
                </div>
              )}

              {/* Video Caption / Description */}
              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  Tiêu đề hoặc lời giới thiệu clip
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ví dụ: Clip văn nghệ 20/11/1999 - Tiết mục đơn ca của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground/70 hover:bg-secondary transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!videoUrl.trim() || isSubmitting || !ytId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      <span>Đăng video</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
